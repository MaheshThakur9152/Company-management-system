package com.ambe.supervisor.activities;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.location.Location;
import android.os.Bundle;
import android.provider.MediaStore;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Base64;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.ambe.supervisor.R;
import com.ambe.supervisor.adapters.EmployeeAdapter;
import com.ambe.supervisor.api.ApiService;
import com.ambe.supervisor.models.AttendanceRecord;
import com.ambe.supervisor.models.Employee;
import com.ambe.supervisor.models.Site;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class SupervisorActivity extends AppCompatActivity implements EmployeeAdapter.OnAttendanceActionListener {

    private static final int REQUEST_IMAGE_CAPTURE = 1;
    private static final int PERMISSION_REQUEST_CODE = 100;

    private TextView tvSiteName, tvGeoStatus, tvDate, tvWorkerCount, tvSyncStatus;
    private EditText etSearch;
    private RecyclerView rvEmployees;
    private Button btnFooterSync;
    private LinearLayout btnSync;

    private EmployeeAdapter adapter;
    private List<Employee> allEmployees = new ArrayList<>();
    private List<Employee> filteredEmployees = new ArrayList<>();
    private Map<String, AttendanceRecord> attendanceMap = new HashMap<>();
    
    private String assignedSiteId;
    private Site currentSite;
    private Employee activeEmployee;
    private FusedLocationProviderClient fusedLocationClient;
    private Location currentLocation;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_supervisor);

        assignedSiteId = getIntent().getStringExtra("ASSIGNED_SITE_ID");
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);

        initViews();
        setupRecyclerView();
        checkPermissions();
        loadData();
        
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
            startActivity(new Intent(this, LoginActivity.class));
            finish();
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
                Manifest.permission.CAMERA
            }, PERMISSION_REQUEST_CODE);
        } else {
            getCurrentLocation();
        }
    }

    private void getCurrentLocation() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            fusedLocationClient.getLastLocation().addOnSuccessListener(this, location -> {
                if (location != null) {
                    currentLocation = location;
                    checkGeofence();
                }
            });
        }
    }

    private void checkGeofence() {
        if (currentLocation != null && currentSite != null) {
            float[] results = new float[1];
            Location.distanceBetween(currentLocation.getLatitude(), currentLocation.getLongitude(),
                    currentSite.getLatitude(), currentSite.getLongitude(), results);
            float distanceInMeters = results[0];

            if (distanceInMeters <= currentSite.getGeofenceRadius()) {
                tvGeoStatus.setText("In Range");
                tvGeoStatus.setTextColor(getResources().getColor(R.color.green));
            } else {
                tvGeoStatus.setText("Out of Range");
                tvGeoStatus.setTextColor(getResources().getColor(R.color.red));
            }
        }
    }

    private void loadData() {
        ApiService.getSites(new ApiService.ApiCallback() {
            @Override
            public void onSuccess(String response) {
                try {
                    JSONArray sites = new JSONArray(response);
                    for (int i = 0; i < sites.length(); i++) {
                        JSONObject s = sites.getJSONObject(i);
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
                            break;
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            @Override
            public void onError(String error) {}
        });

        ApiService.getEmployees(new ApiService.ApiCallback() {
            @Override
            public void onSuccess(String response) {
                try {
                    JSONArray emps = new JSONArray(response);
                    allEmployees.clear();
                    for (int i = 0; i < emps.length(); i++) {
                        JSONObject e = emps.getJSONObject(i);
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
                } catch (Exception e) {
                    e.printStackTrace();
                }
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
        long pendingCount = attendanceMap.values().stream().filter(r -> !r.isSynced()).count();
        tvSyncStatus.setText(pendingCount + " Pending");
        
        if (pendingCount > 0) {
            btnFooterSync.setText("SYNC " + pendingCount + " RECORDS");
            btnFooterSync.setBackgroundColor(getResources().getColor(R.color.colorAccent));
        } else {
            btnFooterSync.setText("ALL SYNCED");
            btnFooterSync.setBackgroundColor(0xFF333333);
        }
    }

    @Override
    public void onMarkPresent(Employee employee) {
        activeEmployee = employee;
        Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (takePictureIntent.resolveActivity(getPackageManager()) != null) {
            startActivityForResult(takePictureIntent, REQUEST_IMAGE_CAPTURE);
        } else {
            Toast.makeText(this, "Camera not available", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onUndo(Employee employee) {
        AttendanceRecord record = attendanceMap.get(employee.getId());
        if (record != null && !record.isLocked()) {
            attendanceMap.remove(employee.getId());
            adapter.notifyDataSetChanged();
            updateCounts();
        } else {
            Toast.makeText(this, "Cannot undo locked record", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_IMAGE_CAPTURE && resultCode == RESULT_OK && data != null) {
            Bundle extras = data.getExtras();
            Bitmap imageBitmap = (Bitmap) extras.get("data");
            
            if (activeEmployee != null && imageBitmap != null) {
                String photoBase64 = encodeImage(imageBitmap);
                String time = new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date());
                String date = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
                
                AttendanceRecord record = new AttendanceRecord(
                    String.valueOf(System.currentTimeMillis()),
                    activeEmployee.getId(),
                    date,
                    "P",
                    time,
                    photoBase64,
                    false,
                    false
                );
                
                attendanceMap.put(activeEmployee.getId(), record);
                adapter.notifyDataSetChanged();
                updateCounts();
                activeEmployee = null;
            }
        }
    }

    private String encodeImage(Bitmap bm) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        bm.compress(Bitmap.CompressFormat.JPEG, 70, baos);
        byte[] b = baos.toByteArray();
        return Base64.encodeToString(b, Base64.DEFAULT);
    }

    private void syncData() {
        List<AttendanceRecord> unsynced = new ArrayList<>();
        for (AttendanceRecord r : attendanceMap.values()) {
            if (!r.isSynced()) unsynced.add(r);
        }

        if (unsynced.isEmpty()) {
            Toast.makeText(this, "No records to sync", Toast.LENGTH_SHORT).show();
            return;
        }

        try {
            JSONArray jsonArray = new JSONArray();
            for (AttendanceRecord r : unsynced) {
                JSONObject obj = new JSONObject();
                obj.put("employeeId", r.getEmployeeId());
                obj.put("date", r.getDate());
                obj.put("status", r.getStatus());
                obj.put("checkInTime", r.getCheckInTime());
                obj.put("photoUrl", r.getPhotoUrl());
                jsonArray.put(obj);
            }

            btnFooterSync.setText("Syncing...");
            
            ApiService.syncAttendance(jsonArray.toString(), new ApiService.ApiCallback() {
                @Override
                public void onSuccess(String response) {
                    runOnUiThread(() -> {
                        for (AttendanceRecord r : unsynced) {
                            r.setSynced(true);
                            r.setLocked(true);
                        }
                        adapter.notifyDataSetChanged();
                        updateCounts();
                        Toast.makeText(SupervisorActivity.this, "Sync Successful!", Toast.LENGTH_SHORT).show();
                    });
                }

                @Override
                public void onError(String error) {
                    runOnUiThread(() -> {
                        updateCounts();
                        Toast.makeText(SupervisorActivity.this, "Sync Failed: " + error, Toast.LENGTH_SHORT).show();
                    });
                }
            });

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
