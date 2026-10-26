import { Capacitor, registerPlugin } from '@capacitor/core';
export const isNativeAndroid=Capacitor.isNativePlatform()&&Capacitor.getPlatform()==='android';
export const AndroidSensors=registerPlugin('CalonsSensors');
