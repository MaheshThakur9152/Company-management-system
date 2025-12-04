package com.ambe.supervisor.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Build;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.ambe.supervisor.R;
import com.ambe.supervisor.activities.SupervisorActivity;
import com.ambe.supervisor.api.ApiService;
import com.ambe.supervisor.database.AppDatabase;
import com.ambe.supervisor.database.LocationLogEntity;
import com.ambe.supervisor.database.SiteEntity;
import com.ambe.supervisor.utils.NetworkUtils;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class LocationService extends Service {
    private static final String TAG = "LocationService";
    private static final String CHANNEL_ID = "LocationServiceChannel";
    public static final String ACTION_LOCATION_UPDATE = "com.ambe.supervisor.LOCATION_UPDATE";
    public static final String EXTRA_STATUS = "status";
    public static final String EXTRA_LAT = "lat";
    public static final String EXTRA_LNG = "lng";
    public static final String EXTRA_IN_RANGE = "in_range";

    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private AppDatabase db;
    private String assignedSiteId;
    private String supervisorName;
    private String userId;
    private SiteEntity currentSite;
    private boolean lastInRange = false;
    private boolean isFirstCheck = true;
    private long lastLogTime = 0;
    private static final long LOG_INTERVAL = 15 * 60 * 1000; // 15 Minutes

    @Override
    public void onCreate() {
        super.onCreate();
        db = AppDatabase.getDatabase(this);
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
        
        createNotificationChannel();
        
        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                if (locationResult == null) {
                    return;
                }
                for (Location location : locationResult.getLocations()) {
                    processLocation(location);
                }
            }
        };
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        loadUserPrefs();
        
        Intent notificationIntent = new Intent(this, SupervisorActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("")
                .setContentText("")
                .setSmallIcon(R.drawable.app_logo) // Ensure this resource exists, or use a system icon
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .setSilent(true)
                .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(1, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
        } else {
            startForeground(1, notification);
        }

        requestLocationUpdates();

        return START_STICKY;
    }

    private void loadUserPrefs() {
        SharedPreferences prefs = getSharedPreferences("AmbeSupervisorPrefs", MODE_PRIVATE);
        assignedSiteId = prefs.getString("assignedSiteId", null); // Fixed key from "siteId" to "assignedSiteId"
        supervisorName = prefs.getString("name", "Unknown");
        userId = prefs.getString("userId", "Unknown");
        
        if (assignedSiteId != null) {
            // Load asynchronously to avoid Main Thread Exception
            new Thread(() -> {
                currentSite = db.siteDao().getSiteById(assignedSiteId);
                if (currentSite != null) {
                    Log.d(TAG, "Site loaded: " + currentSite.name + " (" + currentSite.latitude + ", " + currentSite.longitude + ")");
                } else {
                    Log.e(TAG, "Site not found in local DB for ID: " + assignedSiteId);
                }
            }).start();
        }
    }

    private void requestLocationUpdates() {
        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }

        LocationRequest locationRequest = new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 10000) // 10 seconds
                .setMinUpdateIntervalMillis(5000) // 5 seconds
                .build();

        fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper());
    }

    private void processLocation(Location location) {
        if (currentSite == null) {
            // Try to reload site if null
            loadUserPrefs();
        }

        String status = "Unknown";
        boolean inRange = false;

        if (currentSite != null) {
            float[] results = new float[1];
            Location.distanceBetween(location.getLatitude(), location.getLongitude(), currentSite.latitude, currentSite.longitude, results);
            float distanceInMeters = results[0];
            inRange = distanceInMeters <= currentSite.geofenceRadius;
            status = inRange ? "In Range" : "Out of Range";
        } else {
            status = "Site Not Loaded";
            Log.w(TAG, "Processing location without site data. Site ID: " + assignedSiteId);
        }

        // Broadcast to Activity
        Intent intent = new Intent(ACTION_LOCATION_UPDATE);
        intent.putExtra(EXTRA_STATUS, status);
        intent.putExtra(EXTRA_LAT, location.getLatitude());
        intent.putExtra(EXTRA_LNG, location.getLongitude());
        intent.putExtra(EXTRA_IN_RANGE, inRange);
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent);

        // Log Logic
        long currentTime = System.currentTimeMillis();
        boolean shouldLog = false;

        if (isFirstCheck || inRange != lastInRange) {
            // Status Changed
            shouldLog = true;
            lastInRange = inRange;
            isFirstCheck = false;
        }
        // Periodic logging removed as per requirement
        // else if (currentTime - lastLogTime > LOG_INTERVAL) {
        //    shouldLog = true;
        // }

        // Force log if site is not loaded, so we can debug
        // if (currentSite == null && currentTime - lastLogTime > 60000) { // Log every minute if site missing
        //      shouldLog = true;
        // }

        if (shouldLog) {
            lastLogTime = currentTime;
            logLocation(status, location);
        }
    }

    private void logLocation(String status, Location location) {
        try {
            // RELOAD NAME to ensure we have the latest (Fix for "Pokemon" name update issue)
            SharedPreferences prefs = getSharedPreferences("AmbeSupervisorPrefs", MODE_PRIVATE);
            supervisorName = prefs.getString("name", supervisorName);

            String deviceId = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
            
            if (NetworkUtils.isNetworkAvailable(this)) {
                JSONObject json = new JSONObject();
                json.put("supervisorId", userId);
                json.put("supervisorName", supervisorName);
                json.put("siteId", (assignedSiteId != null && !assignedSiteId.isEmpty()) ? assignedSiteId : "Unassigned");
                json.put("latitude", location.getLatitude());
                json.put("longitude", location.getLongitude());
                json.put("status", status);
                json.put("deviceId", deviceId);
                
                ApiService.logLocation(json.toString(), new ApiService.ApiCallback() {
                    @Override
                    public void onSuccess(String response) { }
                    @Override
                    public void onError(String error) {
                        saveLocationLocally(status, location, deviceId);
                    }
                });
            } else {
                saveLocationLocally(status, location, deviceId);
            }
        } catch (Exception e) { e.printStackTrace(); }
    }

    private void saveLocationLocally(String status, Location location, String deviceId) {
        new Thread(() -> {
            String timestamp = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(new Date());
            LocationLogEntity log = new LocationLogEntity(
                userId,
                supervisorName,
                assignedSiteId,
                location.getLatitude(),
                location.getLongitude(),
                status,
                timestamp
            );
            db.attendanceDao().insertLocationLog(log);
        }).start();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Location Service Channel",
                    NotificationManager.IMPORTANCE_MIN
            );
            serviceChannel.setShowBadge(false);
            serviceChannel.setLockscreenVisibility(Notification.VISIBILITY_SECRET);
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(serviceChannel);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        fusedLocationClient.removeLocationUpdates(locationCallback);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
