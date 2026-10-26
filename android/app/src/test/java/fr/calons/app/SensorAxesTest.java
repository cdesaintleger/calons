package fr.calons.app;
import org.junit.Test;
import static org.junit.Assert.*;
public class SensorAxesTest {
    @Test public void remapsEveryDisplayRotationWithoutChangingScreenNormal() {
        assertArrayEquals(new float[]{1,2,9},SensorAxes.toScreen(1,2,9,0),0);
        assertArrayEquals(new float[]{-2,1,9},SensorAxes.toScreen(1,2,9,1),0);
        assertArrayEquals(new float[]{-1,-2,9},SensorAxes.toScreen(1,2,9,2),0);
        assertArrayEquals(new float[]{2,-1,9},SensorAxes.toScreen(1,2,9,3),0);
    }
    @Test public void allRotationsPreserveMagnitude() {
        for(int i=0;i<4;i++) {float[] v=SensorAxes.toScreen(2,-3,8,i);assertEquals(77,v[0]*v[0]+v[1]*v[1]+v[2]*v[2],0);}
    }
}
