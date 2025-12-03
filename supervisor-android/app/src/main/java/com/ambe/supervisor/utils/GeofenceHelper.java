package com.ambe.supervisor.utils;

import android.location.Location;

public class GeofenceHelper {
    // Distance in meters
    public static float getDistance(double lat1, double lon1, double lat2, double lon2) {
        float[] results = new float[1];
        Location.distanceBetween(lat1, lon1, lat2, lon2, results);
        return results[0];
    }

    public static boolean isWithinRange(double currentLat, double currentLon, double siteLat, double siteLon, float radiusInMeters) {
        return getDistance(currentLat, currentLon, siteLat, siteLon) <= radiusInMeters;
    }
}
