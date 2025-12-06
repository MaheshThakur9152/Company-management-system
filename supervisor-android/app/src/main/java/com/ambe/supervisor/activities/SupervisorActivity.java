package com.ambe.supervisor.activities;

import android.Manifest;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.BroadcastReceiver;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.location.Location;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.text.Editable;
import android.text.InputType;
import android.text.TextWatcher;
import android.util.Base64;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;

import com.ambe.supervisor.R;
import com.ambe.supervisor.adapters.EmployeeAdapter;
import com.ambe.supervisor.api.ApiService;
import com.ambe.supervisor.models.AttendanceRecord;
import com.ambe.supervisor.models.Employee;
import com.ambe.supervisor.models.Site;
import com.ambe.supervisor.database.AppDatabase;
import com.ambe.supervisor.database.AttendanceEntity;
import com.ambe.supervisor.database.LocationLogEntity;
import com.ambe.supervisor.services.LocationService;
import com.ambe.supervisor.utils.GeofenceHelper;
import com.ambe.supervisor.utils.NetworkUtils;
import com.ambe.supervisor.workers.SyncWorker;

import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import androidx.work.WorkInfo;

import android.provider.Settings;
import android.os.Environment;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.IOException;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Date;
import java.util.Locale;
import java.text.SimpleDateFormat;

import org.json.JSONArray;
import org.json.JSONObject;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationResult;

import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import java.net.URISyntaxException;

import com.ambe.supervisor.services.LocationService;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.IntentFilter;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.RecyclerView;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import com.ambe.supervisor.utils.SocketManager;
import com.google.android.gms.common.api.ResolvableApiException;
import com.google.android.gms.location.LocationSettingsRequest;
import com.google.android.gms.location.LocationSettingsResponse;
import com.google.android.gms.location.SettingsClient;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;

public class SupervisorActivity extends AppCompatActivity implements EmployeeAdapter.OnAttendanceActionListener {

    private static final int PERMISSION_REQUEST_CODE = 100;
    private static final int REQUEST_CHECK_SETTINGS = 101;

    private TextView tvSiteName, tvGeoStatus, tvDate, tvWorkerCount, tvSyncStatus;
    private EditText etSearch;
    private RecyclerView rvEmployees;
    private Button btnFooterSync;
    private LinearLayout btnSync;

    private EmployeeAdapter adapter;
    private List<Employee> allEmployees = new ArrayList<>();
    private List<Employee> filteredEmployees = new ArrayList<>();
    private Map<String, AttendanceRecord> attendanceMap = new ConcurrentHashMap<>();
    
    private String assignedSiteId;
    private String userId;
    private String supervisorName;
    private Site currentSite;
    private Employee activeEmployee;
    // private FusedLocationProviderClient fusedLocationClient; // Moved to Service
    private Location currentLocation;
    private Handler handler = new Handler(Looper.getMainLooper());
    private Runnable refreshRunnable;
    private boolean lastInRange = false;
    private boolean isFirstCheck = true;
    private AppDatabase db; // Replaced DatabaseHelper
    // private LocationCallback locationCallback; // Moved to Service
    private String currentPhotoPath;
    private String lastSyncTime = null; // For efficient polling
    private boolean initialSyncDone = false;

    private SharedPreferences prefs;
    private Socket mSocket;

    private final BroadcastReceiver locationReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (LocationService.ACTION_LOCATION_UPDATE.equals(intent.getAction())) {
                boolean inRange = intent.getBooleanExtra(LocationService.EXTRA_IN_RANGE, false);
                double lat = intent.getDoubleExtra(LocationService.EXTRA_LAT, 0);
                double lng = intent.getDoubleExtra(LocationService.EXTRA_LNG, 0);
                
                currentLocation = new Location("service");
                currentLocation.setLatitude(lat);
                currentLocation.setLongitude(lng);
                
                lastInRange = inRange;
                updateGeoStatus(inRange);
            }
        }
    };

    private final BroadcastReceiver gpsReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (android.location.LocationManager.PROVIDERS_CHANGED_ACTION.equals(intent.getAction())) {
                checkLocationEnabled();
            }
        }
    };

    private final ActivityResultLauncher<Intent> cameraLauncher = registerForActivityResult(
        new ActivityResultContracts.StartActivityForResult(),
        result -> {
            if (result.getResultCode() == RESULT_OK) {
                try {
                    // 1. Calculate optimal inSampleSize to prevent OOM
                    // Target: Max 800px dimension (Safer for low-end devices)
                    android.graphics.BitmapFactory.Options options = new android.graphics.BitmapFactory.Options();
                    options.inJustDecodeBounds = true;
                    android.graphics.BitmapFactory.decodeFile(currentPhotoPath, options);
                    
                    int photoW = options.outWidth;
                    int photoH = options.outHeight;
                    int scaleFactor = 1;
                    
                    // Aggressive Downscaling: Target ~800px
                    while (photoW / 2 >= 800 || photoH / 2 >= 800) {
                        photoW /= 2;
                        photoH /= 2;
                        scaleFactor *= 2;
                    }

                    // 2. Decode with inSampleSize and Mutable
                    options.inJustDecodeBounds = false;
                    options.inSampleSize = scaleFactor;
                    options.inMutable = true; 
                    // Try RGB_565 first for memory saving (no transparency needed for photos)
                    options.inPreferredConfig = Bitmap.Config.RGB_565;

                    Bitmap imageBitmap = null;
                    boolean decoded = false;
                    int attempts = 0;
                    
                    while (!decoded && attempts < 3) {
                        try {
                            imageBitmap = android.graphics.BitmapFactory.decodeFile(currentPhotoPath, options);
                            if (imageBitmap != null) decoded = true;
                        } catch (OutOfMemoryError e) {
                            // Emergency Fallback: Try 2x smaller
                            scaleFactor *= 2;
                            options.inSampleSize = scaleFactor;
                            attempts++;
                        }
                    }

                    if (activeEmployee != null && imageBitmap != null) {
                        try {
                            // 3. Watermark directly
                            String locText = "Loc: " + (currentLocation != null ? 
                                String.format(Locale.US, "%.5f, %.5f", currentLocation.getLatitude(), currentLocation.getLongitude()) : "Unknown");
                            String dateTimeText = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(new Date());
                            
                            watermarkImageInPlace(imageBitmap, locText, dateTimeText);

                            // 4. Save BACK to file (Overwrite with smaller, watermarked version)
                            // This prevents OOM and DB bloat
                            try (java.io.FileOutputStream out = new java.io.FileOutputStream(currentPhotoPath)) {
                                imageBitmap.compress(Bitmap.CompressFormat.JPEG, 60, out); // Quality 60 is sufficient
                            }
                            
                            String time = new SimpleDateFormat("hh:mm a", Locale.US).format(new Date());
                            String date = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
                            
                            // Determine IN/OUT based on Geofence
                            String type = "IN";
                            if (currentSite != null && currentLocation != null) {
                                if (!GeofenceHelper.isWithinRange(currentLocation.getLatitude(), currentLocation.getLongitude(), 
                                        currentSite.getLatitude(), currentSite.getLongitude(), currentSite.getGeofenceRadius())) {
                                    // REJECT ATTENDANCE
                                    Toast.makeText(SupervisorActivity.this, "Attendance Rejected: You are Out of Range", Toast.LENGTH_LONG).show();
                                    return;
                                }
                            }
        
                            String deviceId = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
        
                            // 5. Save PATH to DB (Not Base64)
                            final String finalType = type;
                            final String finalPhotoPath = currentPhotoPath; // Store Path
                            
                            new Thread(() -> {
                                AttendanceEntity entity = new AttendanceEntity(
                                    activeEmployee.getId(),
                                    assignedSiteId,
                                    date,
                                    time,
                                    "P",
                                    finalType,
                                    currentLocation != null ? currentLocation.getLatitude() : 0,
                                    currentLocation != null ? currentLocation.getLongitude() : 0,
                                    finalPhotoPath, // Path
                                    deviceId
                                );
                                // Add Supervisor Name
                                entity.supervisorName = supervisorName;
                                
                                db.attendanceDao().insert(entity);
                                
                                runOnUiThread(() -> {
                                    AttendanceRecord record = new AttendanceRecord(
                                        String.valueOf(System.currentTimeMillis()),
                                        activeEmployee.getId(),
                                        date,
                                        "P",
                                        time,
                                        finalPhotoPath, // Path
                                        false,
                                        false
                                    );
                                    attendanceMap.put(activeEmployee.getId(), record);
                                    adapter.notifyDataSetChanged();
                                    updateCounts();
                                    activeEmployee = null;
                                    
                                    // Trigger Sync Immediately
                                    syncData();
                                });
                            }).start();
                        } finally {
                            // Recycle immediately
                            if (imageBitmap != null && !imageBitmap.isRecycled()) {
                                imageBitmap.recycle();
                            }
                        }
                    } else {
                         Toast.makeText(this, "Failed to process image (Low Memory)", Toast.LENGTH_SHORT).show();
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    Toast.makeText(this, "Error processing image: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                }
            }
        }
    );

    // Replaces scaleBitmapDown
    private void watermarkImageInPlace(Bitmap src, String loc, String date) {
        Canvas canvas = new Canvas(src);
        // No need to drawBitmap, we are drawing ON the bitmap
        
        int w = src.getWidth();
        int h = src.getHeight();
        
        Paint paint = new Paint();
        paint.setColor(Color.WHITE);
        paint.setTextSize(w * 0.04f); // 4% of width
        paint.setAntiAlias(true);
        paint.setShadowLayer(5.0f, 2.0f, 2.0f, Color.BLACK);
        
        // Draw Location
        float x = 20;
        float y = h - (w * 0.12f);
        canvas.drawText(loc, x, y, paint);
        
        // Draw Date
        y += (w * 0.05f);
        canvas.drawText(date, x, y, paint);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_supervisor);

        prefs = getSharedPreferences("AmbeSupervisorPrefs", MODE_PRIVATE);

        db = AppDatabase.getDatabase(this);

        assignedSiteId = getIntent().getStringExtra("ASSIGNED_SITE_ID");
        userId = getIntent().getStringExtra("USER_ID");
        supervisorName = getIntent().getStringExtra("USER_NAME");

        // Save siteId to prefs for LocationService
        prefs.edit().putString("assignedSiteId", assignedSiteId).apply();

        if (assignedSiteId == null || assignedSiteId.isEmpty()) {
            Toast.makeText(this, "Warning: No Site Assigned to this Supervisor!", Toast.LENGTH_LONG).show();
        }
        
        // Register Receiver
        LocalBroadcastManager.getInstance(this).registerReceiver(locationReceiver, 
            new IntentFilter(LocationService.ACTION_LOCATION_UPDATE));
        
        // Register GPS Receiver
        registerReceiver(gpsReceiver, new IntentFilter(android.location.LocationManager.PROVIDERS_CHANGED_ACTION));

        initViews();
        setupRecyclerView();
        checkPermissions(); // This will start service if permissions granted
        loadData();
        checkName();
        startAutoRefresh();
        
        tvDate.setText(new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date()));

        etSearch.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                filterEmployees(s.toString());
            }
            @Override
            public void afterTextChanged(Editable s) {}
        });

        btnSync.setOnClickListener(v -> syncData());
        btnFooterSync.setOnClickListener(v -> syncData());
        findViewById(R.id.btnLogout).setOnClickListener(v -> {
            prefs.edit().clear().apply();
            startActivity(new Intent(this, LoginActivity.class));
            finish();
        });

        // Initialize Socket.IO using Singleton
        new Thread(() -> {
            try {
                mSocket = SocketManager.getInstance().getSocket();
                
                if (mSocket != null) {
                    // Remove previous listeners to avoid duplicates if any
                    mSocket.off(Socket.EVENT_CONNECT);
                    mSocket.off("attendance_update");

                    // Listen for connection to join room (handles reconnections)
                    mSocket.on(Socket.EVENT_CONNECT, args -> {
                        if (assignedSiteId != null) {
                            mSocket.emit("join_site", assignedSiteId);
                        }
                    });
                    
                    mSocket.on("attendance_update", onAttendanceUpdate);
                    
                    if (!mSocket.connected()) {
                        mSocket.connect();
                    } else {
                        // If already connected, join immediately
                        if (assignedSiteId != null) {
                            mSocket.emit("join_site", assignedSiteId);
                        }
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }).start();
    }

    @Override
    protected void onResume() {
        super.onResume();
        checkLocationEnabled();
    }

    private void checkLocationEnabled() {
        LocationRequest locationRequest = new LocationRequest.Builder(com.google.android.gms.location.Priority.PRIORITY_HIGH_ACCURACY, 10000)
                .setMinUpdateIntervalMillis(5000)
                .build();

        LocationSettingsRequest.Builder builder = new LocationSettingsRequest.Builder()
                .addLocationRequest(locationRequest);
        builder.setAlwaysShow(true); // This makes the dialog non-cancelable in some versions

        SettingsClient client = LocationServices.getSettingsClient(this);
        Task<LocationSettingsResponse> task = client.checkLocationSettings(builder.build());

        task.addOnSuccessListener(this, new OnSuccessListener<LocationSettingsResponse>() {
            @Override
            public void onSuccess(LocationSettingsResponse locationSettingsResponse) {
                // All location settings are satisfied. The client can initialize
                // location requests here.
            }
        });

        task.addOnFailureListener(this, new OnFailureListener() {
            @Override
            public void onFailure(@androidx.annotation.NonNull Exception e) {
                if (e instanceof ResolvableApiException) {
                    // Location settings are not satisfied, but this can be fixed
                    // by showing the user a dialog.
                    try {
                        // Show the dialog by calling startResolutionForResult(),
                        // and check the result in onActivityResult().
                        ResolvableApiException resolvable = (ResolvableApiException) e;
                        resolvable.startResolutionForResult(SupervisorActivity.this, REQUEST_CHECK_SETTINGS);
                    } catch (android.content.IntentSender.SendIntentException sendEx) {
                        // Ignore the error.
                    }
                } else {
                    // Fallback to manual dialog if not resolvable
                    showManualLocationDialog();
                }
            }
        });
    }

    private void showManualLocationDialog() {
        new AlertDialog.Builder(this)
            .setMessage("Location is disabled. Please enable it to continue.")
            .setPositiveButton("Settings", (paramDialogInterface, paramInt) -> {
                startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS));
            })
            .setCancelable(false)
            .show();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_CHECK_SETTINGS) {
            if (resultCode == RESULT_OK) {
                // User enabled location
                startLocationService();
            } else {
                // User cancelled, ask again
                checkLocationEnabled();
            }
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        LocalBroadcastManager.getInstance(this).unregisterReceiver(locationReceiver);
        unregisterReceiver(gpsReceiver);
        if (mSocket != null) {
            mSocket.off("attendance_update", onAttendanceUpdate);
            mSocket.off(Socket.EVENT_CONNECT);
            // Do NOT disconnect here to keep connection alive across rotations
            // SocketManager.getInstance().disconnect(); 
        }
    }

    private void checkName() {
        if (supervisorName == null || supervisorName.isEmpty() || supervisorName.contains("Supervisor")) {
            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            android.view.View view = getLayoutInflater().inflate(R.layout.dialog_enter_name, null);
            builder.setView(view);
            AlertDialog dialog = builder.create();
            dialog.getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT));
            dialog.setCancelable(false);

            EditText etName = view.findViewById(R.id.etSupervisorName);
            Button btnStart = view.findViewById(R.id.btnStartShift);

            btnStart.setOnClickListener(v -> {
                String name = etName.getText().toString().trim();
                if (!name.isEmpty()) {
                    supervisorName = name;
                    prefs.edit().putString("name", supervisorName).apply();
                    
                    dialog.dismiss();
                    
                    // Toast removed as per request
                } else {
                    Toast.makeText(this, "Name is required!", Toast.LENGTH_SHORT).show();
                }
            });

            dialog.show();
        }
    }

    private void startAutoRefresh() {
        refreshRunnable = new Runnable() {
            @Override
            public void run() {
                refreshAttendance();
                // Auto-sync if online
                if (NetworkUtils.isNetworkAvailable(SupervisorActivity.this)) {
                    new Thread(() -> {
                        if (!db.attendanceDao().getUnsyncedAttendance().isEmpty()) {
                            runOnUiThread(() -> syncData());
                        }
                    }).start();
                }
                handler.postDelayed(this, 60000); // Refresh every 60 seconds (Long Polling)
            }
        };
        handler.post(refreshRunnable);
    }

    private void refreshAttendance() {
        if (assignedSiteId == null) return;
        String date = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        
        // 1. Load from API (Force Full Refresh - No updatedAfter)
        ApiService.getAttendanceSince(assignedSiteId, date, null, new ApiService.ApiCallback() {
            @Override
            public void onSuccess(String response) {
                try {
                    // Update lastSyncTime to now (ISO format)
                    lastSyncTime = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(new Date());

                    JSONArray records = new JSONArray(response);
                    if (records.length() > 0) {
                        for (int i = 0; i < records.length(); i++) {
                            JSONObject r = records.getJSONObject(i);
                            
                            // FILTER: Only show attendance for TODAY
                            String recordDate = r.getString("date");
                            if (!recordDate.equals(date)) {
                                continue;
                            }

                            String empId = r.getString("employeeId");
                            boolean isLocked = r.optBoolean("isLocked", true); // Default to true for synced records

                            AttendanceRecord record = new AttendanceRecord(
                                r.optString("id", ""),
                                empId,
                                r.getString("date"),
                                r.getString("status"),
                                r.optString("checkInTime", ""),
                                r.optString("photoUrl", null),
                                true, // isSynced
                                isLocked  // isLocked
                            );
                            attendanceMap.put(empId, record);
                        }
                    }
                    
                    // 2. Overlay Local Data (ALL records for date, to ensure synced ones persist offline)
                    new Thread(() -> {
                        List<AttendanceEntity> localRecords = db.attendanceDao().getAttendanceByDate(date);
                        boolean changed = false;
                        for (AttendanceEntity r : localRecords) {
                            // If we already have a locked record from API, don't overwrite with local unless necessary
                            // But actually, local might be the source of truth if API failed previously but sync worker succeeded?
                            // If local isSynced=true, we treat it as locked.
                            
                            // If map already has it (from API), and it's locked, we keep API version (it might have URL instead of path)
                            if (attendanceMap.containsKey(r.employeeId) && attendanceMap.get(r.employeeId).isLocked()) {
                                continue;
                            }

                            AttendanceRecord record = new AttendanceRecord(
                                String.valueOf(r.id),
                                r.employeeId,
                                r.date,
                                r.status,
                                r.timestamp,
                                r.photoPath,
                                r.isSynced, // isSynced
                                r.isSynced  // isLocked (If synced, it is locked)
                            );
                            attendanceMap.put(r.employeeId, record);
                            changed = true;
                        }

                        runOnUiThread(() -> {
                            initialSyncDone = true;
                            adapter.notifyDataSetChanged();
                            updateCounts();
                        });
                    }).start();

                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            @Override
            public void onError(String error) {
                // If API fails (Offline), load ALL local data for today
                new Thread(() -> {
                    List<AttendanceEntity> localRecords = db.attendanceDao().getAttendanceByDate(date);
                    for (AttendanceEntity r : localRecords) {
                        AttendanceRecord record = new AttendanceRecord(
                            String.valueOf(r.id),
                            r.employeeId,
                            r.date,
                            r.status,
                            r.timestamp,
                            r.photoPath,
                            r.isSynced, // isSynced
                            r.isSynced  // isLocked
                        );
                        attendanceMap.put(r.employeeId, record);
                    }
                    runOnUiThread(() -> {
                        initialSyncDone = true;
                        adapter.notifyDataSetChanged();
                        updateCounts();
                    });
                }).start();
            }
        });
    }

    private void initViews() {
        tvSiteName = findViewById(R.id.tvSiteName);
        tvGeoStatus = findViewById(R.id.tvGeoStatus);
        tvDate = findViewById(R.id.tvDate);
        tvWorkerCount = findViewById(R.id.tvWorkerCount);
        tvSyncStatus = findViewById(R.id.tvSyncStatus);
        etSearch = findViewById(R.id.etSearch);
        rvEmployees = findViewById(R.id.rvEmployees);
        btnFooterSync = findViewById(R.id.btnFooterSync);
        btnSync = findViewById(R.id.btnSync);
    }

    private void setupRecyclerView() {
        adapter = new EmployeeAdapter(filteredEmployees, attendanceMap, this);
        rvEmployees.setLayoutManager(new LinearLayoutManager(this));
        rvEmployees.setAdapter(adapter);
    }

    private void checkPermissions() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED ||
            ActivityCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION,
                Manifest.permission.CAMERA
            }, PERMISSION_REQUEST_CODE);
        } else {
            startLocationService();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @androidx.annotation.NonNull String[] permissions, @androidx.annotation.NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startLocationService();
            } else {
                Toast.makeText(this, "Permissions Denied. App cannot function properly.", Toast.LENGTH_LONG).show();
            }
        }
    }

    private void startLocationService() {
        Intent serviceIntent = new Intent(this, LocationService.class);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
    }

    // private void getCurrentLocation() { ... } // Removed, handled by Service

    private void startLocationUpdates() {
        // Handled by LocationService
    }

    private void updateGeoStatus(boolean inRange) {
        if (currentSite == null) return;
        
        String statusText = inRange ? "IN RANGE (View Map)" : "OUT OF RANGE (View Map)";
        tvGeoStatus.setText(statusText);
        
        if (inRange) {
            tvGeoStatus.setTextColor(ContextCompat.getColor(this, R.color.green));
        } else {
            tvGeoStatus.setTextColor(ContextCompat.getColor(this, R.color.red));
        }
        
        // Update Google Maps Link
        if (currentLocation != null) {
            String googleMapsLink = "https://www.google.com/maps?q=" + currentLocation.getLatitude() + "," + currentLocation.getLongitude();
            tvGeoStatus.setOnClickListener(v -> {
                Intent intent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse(googleMapsLink));
                startActivity(intent);
            });
        }
    }

    private void checkGeofence() {
        if (currentLocation != null && currentSite != null) {
            float[] results = new float[1];
            Location.distanceBetween(currentLocation.getLatitude(), currentLocation.getLongitude(),
                    currentSite.getLatitude(), currentSite.getLongitude(), results);
            float distanceInMeters = results[0];
            boolean inRange = distanceInMeters <= currentSite.getGeofenceRadius();
            updateGeoStatus(inRange);
        }
    }

    private void loadData() {
        // 1. Load Local Data First (Fast)
        new Thread(() -> {
            // Load Site
            if (assignedSiteId != null) {
                com.ambe.supervisor.database.SiteEntity localSite = db.siteDao().getSiteById(assignedSiteId);
                if (localSite != null) {
                    currentSite = new Site(localSite.id, localSite.name, localSite.location, localSite.latitude, localSite.longitude, localSite.geofenceRadius);
                    runOnUiThread(() -> {
                        if (tvSiteName != null) {
                            tvSiteName.setText(currentSite.getName());
                            checkGeofence();
                        }
                    });
                }
            }

            // Load Employees
            if (assignedSiteId != null) {
                List<com.ambe.supervisor.database.EmployeeEntity> localEmps = db.employeeDao().getEmployeesBySite(assignedSiteId);
                if (!localEmps.isEmpty()) {
                    allEmployees.clear();
                    for (com.ambe.supervisor.database.EmployeeEntity e : localEmps) {
                        allEmployees.add(new Employee(e.id, e.biometricCode, e.name, e.role, e.siteId, e.photoUrl, e.status));
                    }
                    runOnUiThread(() -> {
                        filterEmployees("");
                        updateCounts();
                    });
                }
            }
        }).start();

        // 2. Fetch from API (Background)
        if (NetworkUtils.isNetworkAvailable(this)) {
            fetchSitesFromApi();
            fetchEmployeesFromApi();
        }
    }

    private void fetchSitesFromApi() {
        ApiService.getSites(new ApiService.ApiCallback() {
            @Override
            public void onSuccess(String response) {
                try {
                    JSONArray sites = new JSONArray(response);
                    List<com.ambe.supervisor.database.SiteEntity> entities = new ArrayList<>();
                    for (int i = 0; i < sites.length(); i++) {
                        JSONObject s = sites.getJSONObject(i);
                        entities.add(new com.ambe.supervisor.database.SiteEntity(
                            s.getString("id"),
                            s.getString("name"),
                            s.getString("location"),
                            s.getDouble("latitude"),
                            s.getDouble("longitude"),
                            s.getInt("geofenceRadius")
                        ));
                        
                        if (s.getString("id").equals(assignedSiteId)) {
                            currentSite = new Site(
                                s.getString("id"),
                                s.getString("name"),
                                s.getString("location"),
                                s.getDouble("latitude"),
                                s.getDouble("longitude"),
                                s.getInt("geofenceRadius")
                            );
                            runOnUiThread(() -> {
                                tvSiteName.setText(currentSite.getName());
                                checkGeofence();
                            });
                        }
                    }
                    // Save to DB
                    new Thread(() -> db.siteDao().insertAll(entities)).start();
                } catch (Exception e) { e.printStackTrace(); }
            }
            @Override
            public void onError(String error) {}
        });
    }

    private void fetchEmployeesFromApi() {
        ApiService.getEmployees(new ApiService.ApiCallback() {
            @Override
            public void onSuccess(String response) {
                try {
                    JSONArray emps = new JSONArray(response);
                    List<com.ambe.supervisor.database.EmployeeEntity> entities = new ArrayList<>();
                    allEmployees.clear();
                    
                    for (int i = 0; i < emps.length(); i++) {
                        JSONObject e = emps.getJSONObject(i);
                        entities.add(new com.ambe.supervisor.database.EmployeeEntity(
                            e.getString("id"),
                            e.getString("biometricCode"),
                            e.getString("name"),
                            e.getString("role"),
                            e.getString("siteId"),
                            e.optString("photoUrl"),
                            e.getString("status")
                        ));

                        if (e.getString("siteId").equals(assignedSiteId)) {
                            allEmployees.add(new Employee(
                                e.getString("id"),
                                e.getString("biometricCode"),
                                e.getString("name"),
                                e.getString("role"),
                                e.getString("siteId"),
                                e.optString("photoUrl"),
                                e.getString("status")
                            ));
                        }
                    }
                    
                    runOnUiThread(() -> {
                        filterEmployees("");
                        updateCounts();
                    });

                    // Save to DB
                    new Thread(() -> db.employeeDao().insertAll(entities)).start();
                } catch (Exception e) { e.printStackTrace(); }
            }
            @Override
            public void onError(String error) {}
        });
    }

    private void filterEmployees(String query) {
        filteredEmployees.clear();
        if (query.isEmpty()) {
            filteredEmployees.addAll(allEmployees);
        } else {
            for (Employee e : allEmployees) {
                if (e.getName().toLowerCase().contains(query.toLowerCase()) ||
                    e.getBiometricCode().contains(query)) {
                    filteredEmployees.add(e);
                }
            }
        }
        adapter.updateData(filteredEmployees, attendanceMap);
    }

    private void updateCounts() {
        tvWorkerCount.setText(allEmployees.size() + " Workers");
        
        // Count unsynced from Room
        new Thread(() -> {
            long pendingCount = db.attendanceDao().getUnsyncedAttendance().size();
            runOnUiThread(() -> {
                tvSyncStatus.setText(pendingCount + " Pending");
                
                if (pendingCount > 0) {
                    btnFooterSync.setText("SYNC " + pendingCount + " RECORDS");
                    btnFooterSync.setBackgroundColor(ContextCompat.getColor(SupervisorActivity.this, R.color.colorAccent));
                } else {
                    btnFooterSync.setText("ALL SYNCED");
                    btnFooterSync.setBackgroundColor(0xFF333333);
                }
            });
        }).start();
    }

    private void proceedToCamera(Employee employee) {
        activeEmployee = employee;
        Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (takePictureIntent.resolveActivity(getPackageManager()) != null) {
            File photoFile = null;
            try {
                photoFile = createImageFile();
            } catch (IOException ex) {
                Toast.makeText(this, "Error creating image file", Toast.LENGTH_SHORT).show();
            }
            
            if (photoFile != null) {
                Uri photoURI = FileProvider.getUriForFile(this,
                        "com.ambe.supervisor.fileprovider",
                        photoFile);
                takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI);
                cameraLauncher.launch(takePictureIntent);
            }
        } else {
            Toast.makeText(this, "Camera not available", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onMarkPresent(Employee employee) {
        // STRICT GEOFENCE CHECK
        if (currentSite != null && currentLocation != null) {
             if (!GeofenceHelper.isWithinRange(currentLocation.getLatitude(), currentLocation.getLongitude(), 
                    currentSite.getLatitude(), currentSite.getLongitude(), currentSite.getGeofenceRadius())) {
                 
                 new AlertDialog.Builder(this)
                    .setTitle("Out of Range")
                    .setMessage("You cannot mark attendance while out of the site location.")
                    .setPositiveButton("OK", null)
                    .show();
                 return;
             }
        } else if (currentLocation == null) {
             Toast.makeText(this, "Waiting for GPS location...", Toast.LENGTH_SHORT).show();
             return;
        }

        if (NetworkUtils.isNetworkAvailable(this)) {
            // Live Check for Duplicate Attendance
            android.app.ProgressDialog progress = new android.app.ProgressDialog(this);
            progress.setMessage("Verifying status...");
            progress.setCancelable(false);
            progress.show();

            String[] dateParts = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date()).split("-");
            String year = dateParts[0];
            String month = dateParts[1];
            String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());

            ApiService.checkEmployeeAttendance(employee.getId(), month, year, new ApiService.ApiCallback() {
                @Override
                public void onSuccess(String response) {
                    progress.dismiss();
                    try {
                        JSONArray records = new JSONArray(response);
                        boolean alreadyMarked = false;
                        for (int i = 0; i < records.length(); i++) {
                            JSONObject r = records.getJSONObject(i);
                            if (r.getString("date").equals(today)) {
                                alreadyMarked = true;
                                break;
                            }
                        }

                        if (alreadyMarked) {
                            SupervisorActivity.this.runOnUiThread(() -> {
                                // CHANGED: Don't show error toast, just refresh UI to show "Synced" state
                                // Toast.makeText(SupervisorActivity.this, "Attendance already marked for this employee!", Toast.LENGTH_LONG).show();
                                refreshAttendance(); // Refresh to lock UI
                            });
                        } else {
                            SupervisorActivity.this.runOnUiThread(() -> proceedToCamera(employee));
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                        SupervisorActivity.this.runOnUiThread(() -> proceedToCamera(employee));
                    }
                }

                @Override
                public void onError(String error) {
                    progress.dismiss();
                    SupervisorActivity.this.runOnUiThread(() -> proceedToCamera(employee));
                }
            });
        } else {
            proceedToCamera(employee);
        }
    }

    private File createImageFile() throws IOException {
        // Create an image file name
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date());
        String imageFileName = "JPEG_" + timeStamp + "_";
        File storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES);
        if (storageDir == null) {
            storageDir = getFilesDir(); // Fallback to internal storage
        }
        File image = File.createTempFile(
            imageFileName,  /* prefix */
            ".jpg",         /* suffix */
            storageDir      /* directory */
        );
    
        // Save a file: path for use with ACTION_VIEW intents
        currentPhotoPath = image.getAbsolutePath();
        return image;
    }

    @Override
    public void onUndo(Employee employee) {
        AttendanceRecord record = attendanceMap.get(employee.getId());
        if (record != null) {
            attendanceMap.remove(employee.getId());
            adapter.notifyDataSetChanged();
            updateCounts();
        }
    }

    private String encodeImage(Bitmap bm) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        // Use 100% quality for original image
        bm.compress(Bitmap.CompressFormat.JPEG, 100, baos);
        byte[] b = baos.toByteArray();
        return Base64.encodeToString(b, Base64.DEFAULT);
    }

    private void syncData() {
        if (!NetworkUtils.isNetworkAvailable(this)) {
            Toast.makeText(this, "No Internet Connection. Data saved locally.", Toast.LENGTH_SHORT).show();
            return;
        }

        btnFooterSync.setText("Syncing...");

        // Trigger WorkManager (Removed Expedited to avoid crash on older Android versions without getForegroundInfo)
        OneTimeWorkRequest syncRequest = new OneTimeWorkRequest.Builder(SyncWorker.class)
            .build();
            
        WorkManager.getInstance(this).enqueue(syncRequest);

        WorkManager.getInstance(this).getWorkInfoByIdLiveData(syncRequest.getId())
            .observe(this, workInfo -> {
                if (workInfo != null) {
                    if (workInfo.getState() == WorkInfo.State.SUCCEEDED) {
                        refreshAttendance();
                        Toast.makeText(SupervisorActivity.this, "Sync Successful!", Toast.LENGTH_SHORT).show();
                    } else if (workInfo.getState() == WorkInfo.State.FAILED) {
                        updateCounts();
                        String error = workInfo.getOutputData().getString("error");
                        String errorMsg = (error != null && !error.isEmpty()) ? error : "Unknown Error (State: " + workInfo.getState() + ", Attempt: " + workInfo.getRunAttemptCount() + ")";
                        Toast.makeText(SupervisorActivity.this, "Sync Failed: " + errorMsg, Toast.LENGTH_LONG).show();
                        
                        // Also show dialog for better visibility
                        new AlertDialog.Builder(SupervisorActivity.this)
                            .setTitle("Sync Failed")
                            .setMessage(errorMsg)
                            .setPositiveButton("OK", null)
                            .show();
                    }
                }
            });
    }

    @SuppressWarnings("deprecation")
    private Bitmap getBitmapFromIntent(Intent data) {
        Bundle extras = data.getExtras();
        if (extras != null) {
            return (Bitmap) extras.get("data");
        }
        return null;
    }

    private Emitter.Listener onAttendanceUpdate = new Emitter.Listener() {
        @Override
        public void call(final Object... args) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    // Refresh data when update received
                    refreshAttendance();
                    Toast.makeText(SupervisorActivity.this, "New attendance data received", Toast.LENGTH_SHORT).show();
                }
            });
        }
    };
}
