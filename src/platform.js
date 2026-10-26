import { Capacitor, registerPlugin, SystemBars, SystemBarsStyle } from '@capacitor/core';
export const isNativeAndroid=Capacitor.isNativePlatform()&&Capacitor.getPlatform()==='android';
export const AndroidSensors=registerPlugin('CalonsSensors');

export function setSystemBarTheme(theme) {
 if(isNativeAndroid) return SystemBars.setStyle({style:theme==='night'?SystemBarsStyle.Dark:SystemBarsStyle.Light}).catch(()=>{});
}
