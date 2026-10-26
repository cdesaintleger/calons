package fr.calons.app;

// Android Surface rotation constants are 0,1,2,3 (0,90,180,270 degrees).
// Remap even in portrait: some Android devices have landscape natural orientation.
public final class SensorAxes {
    public static float[] toScreen(float x, float y, float z, int rotation) {
        switch (rotation) {
            case 1: return new float[]{-y, x, z};
            case 2: return new float[]{-x, -y, z};
            case 3: return new float[]{y, -x, z};
            default: return new float[]{x, y, z};
        }
    }
}
