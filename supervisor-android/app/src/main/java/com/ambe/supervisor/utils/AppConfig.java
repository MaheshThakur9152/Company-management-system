package com.ambe.supervisor.utils;

import android.os.Build;

public class AppConfig {
    // Emulator (AVD) uses 10.0.2.2 to access host localhost
    private static final String EMULATOR_HOST = "http://10.0.2.2:3002";
    // Physical Device uses LAN IP
    private static final String DEVICE_HOST = "https://api.ambeservice.com";

    public static String getBaseUrl() {
        if (isEmulator()) {
            return EMULATOR_HOST;
        } else {
            return DEVICE_HOST;
        }
    }

    public static boolean isEmulator() {
        return (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
                || Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.HARDWARE.contains("goldfish")
                || Build.HARDWARE.contains("ranchu")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || (Build.BRAND.startsWith("google") && Build.DEVICE.startsWith("generic"))
                || "google_sdk".equals(Build.PRODUCT);
    }
}
