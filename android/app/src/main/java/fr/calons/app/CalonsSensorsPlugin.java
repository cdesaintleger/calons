package fr.calons.app;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.SystemClock;
import android.view.Surface;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CalonsSensors")
public class CalonsSensorsPlugin extends Plugin implements SensorEventListener {
    private SensorManager manager;
    private Sensor sensor;
    private boolean requested = false, listening = false, paused = false;
    private long lastTimestamp = 0;

    @Override public void load() {
        manager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        if (manager != null) {
            sensor = manager.getDefaultSensor(Sensor.TYPE_GRAVITY);
            if (sensor == null) sensor = manager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        }
    }
    private JSObject info() {
        JSObject data = new JSObject();
        data.put("available", sensor != null);
        data.put("source", sensor == null ? "indisponible" : sensor.getType() == Sensor.TYPE_GRAVITY ? "gravité Android" : "accéléromètre Android");
        data.put("elapsedRealtimeMs", SystemClock.elapsedRealtimeNanos() / 1e6);
        return data;
    }
    @PluginMethod public void availability(PluginCall call) { call.resolve(info()); }
    @PluginMethod public void start(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (sensor == null) { call.reject("Aucun capteur de gravité ou accéléromètre disponible."); return; }
            requested = true;
            if (!paused && !subscribe()) { requested = false; call.reject("Impossible de démarrer le capteur Android."); return; }
            call.resolve(info());
        });
    }
    @PluginMethod public void stop(PluginCall call) {
        getActivity().runOnUiThread(() -> { requested = false; unsubscribe(); call.resolve(); });
    }
    private boolean subscribe() {
        if (listening) return true;
        lastTimestamp = 0;
        // Ask for 50 Hz without batching; actual timestamps remain authoritative.
        listening = manager.registerListener(this, sensor, 20000, 0);
        return listening;
    }
    private void unsubscribe() {
        if (manager != null) manager.unregisterListener(this);
        listening = false; lastTimestamp = 0;
    }
    private void state(boolean active, String error) {
        JSObject data = new JSObject(); data.put("active", active);
        if (error != null) data.put("error", error);
        notifyListeners("sensorState", data);
    }
    @Override protected void handleOnPause() { paused = true; unsubscribe(); state(false, null); }
    @Override protected void handleOnResume() {
        paused = false;
        if (requested) { boolean ok = subscribe(); state(ok, ok ? null : "Reprise du capteur Android impossible."); }
    }
    @Override protected void handleOnDestroy() { requested = false; unsubscribe(); }
    @Override public void onAccuracyChanged(Sensor sensor, int accuracy) { }
    @Override public void onSensorChanged(SensorEvent event) {
        if (!listening || paused || event.timestamp <= lastTimestamp) return;
        // Some devices exceed the requested rate. Drop excess samples, never synthesize them.
        if (lastTimestamp != 0 && event.timestamp - lastTimestamp < 16000000L) return;
        lastTimestamp = event.timestamp;
        if (event.values.length < 3) return;
        float x=event.values[0], y=event.values[1], z=event.values[2];
        if (!Float.isFinite(x) || !Float.isFinite(y) || !Float.isFinite(z)) return;
        int rotation=getActivity().getWindowManager().getDefaultDisplay().getRotation();
        float[] screen=SensorAxes.toScreen(x,y,z,rotation);
        JSObject data=new JSObject();
        data.put("x",screen[0]); data.put("y",screen[1]); data.put("z",screen[2]);
        data.put("timestampMs",event.timestamp/1e6);
        notifyListeners("sample",data);
    }
}
