package com.ambe.supervisor.workers;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import androidx.work.ListenableWorker.Result;
import androidx.work.Data;

import com.ambe.supervisor.api.ApiService;
import com.ambe.supervisor.database.AppDatabase;
import com.ambe.supervisor.database.AttendanceEntity;
import com.ambe.supervisor.database.LocationLogEntity;
import com.google.gson.Gson;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.io.File;
import java.io.FileInputStream;
import java.io.ByteArrayOutputStream;
import android.util.Base64;

public class SyncWorker extends Worker {

    private final AppDatabase db;
    private String lastError = "";

    public SyncWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
        db = AppDatabase.getDatabase(context);
    }

    private String getBase64FromPath(String path) {
        if (path == null) return null;
        try {
            File file = new File(path);
            if (!file.exists()) return null;
            
            FileInputStream fis = new FileInputStream(file);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int len;
            while ((len = fis.read(buffer)) != -1) {
                baos.write(buffer, 0, len);
            }
            byte[] fileBytes = baos.toByteArray();
            String base64 = Base64.encodeToString(fileBytes, Base64.NO_WRAP);
            return "data:image/jpeg;base64," + base64;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    @NonNull
    @Override
    public Result doWork() {
        try {
            boolean attendanceSynced = syncAttendance();
            // We don't care if location logs fail, attendance is priority
            syncLocationLogs(); 

            if (attendanceSynced) {
                return Result.success();
            } else {
                // Return failure with error message so user can see it
                Data output = new Data.Builder()
                    .putString("error", lastError != null ? lastError : "Unknown Error")
                    .build();
                return Result.failure(output);
            }
        } catch (Exception e) {
            e.printStackTrace();
            Data output = new Data.Builder()
                .putString("error", e.getMessage())
                .build();
            return Result.failure(output);
        }
    }

    private boolean syncAttendance() {
        try {
            List<AttendanceEntity> unsynced = db.attendanceDao().getUnsyncedAttendance();
            if (unsynced.isEmpty()) return true;

            boolean allSuccess = true;

            // Upload ONE BY ONE to avoid payload issues and ensure partial success
            for (AttendanceEntity entity : unsynced) {
                try {
                    List<Map<String, Object>> syncPayload = new ArrayList<>();
                    Map<String, Object> record = new HashMap<>();
                    // Use a unique string ID for backend (e.g., empId_date_time) or just random
                    record.put("id", entity.employeeId + "_" + System.currentTimeMillis()); 
                    record.put("employeeId", entity.employeeId);
                    record.put("siteId", entity.siteId); // Added siteId
                    record.put("date", entity.date);
                    record.put("status", entity.status);
                    record.put("checkInTime", entity.timestamp); // Map timestamp -> checkInTime
                    record.put("type", entity.type);
                    record.put("deviceId", entity.deviceId);
                    
                    // Convert local path to Base64 for upload
                    String base64Image = getBase64FromPath(entity.photoPath);
                    if (base64Image != null) {
                        record.put("photoUrl", base64Image);
                    } else {
                        record.put("photoUrl", entity.photoPath);
                    }
                    
                    record.put("supervisorName", entity.supervisorName);
                    
                    Map<String, Double> location = new HashMap<>();
                    location.put("lat", entity.latitude);
                    location.put("lng", entity.longitude);
                    record.put("location", location);

                    syncPayload.add(record);

                    String jsonBody = new Gson().toJson(syncPayload);
                    String response = ApiService.syncAttendanceBlocking(jsonBody);

                    if (response != null) {
                        db.attendanceDao().markAsSynced(entity.id);
                    } else {
                        allSuccess = false;
                        lastError = "Empty response from server";
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    String msg = e.getMessage();
                    lastError = msg;
                    
                    // Handle "Already Marked" or "Duplicate" as SUCCESS
                    // Backend returns 200 with errors array usually, but if it throws 409/500:
                    if (msg != null && (msg.contains("already marked") || msg.contains("Duplicate") || msg.contains("locked"))) {
                        db.attendanceDao().markAsSynced(entity.id);
                    } else {
                        allSuccess = false;
                    }
                }
            }

            return allSuccess;
        } catch (Exception e) {
            e.printStackTrace();
            lastError = e.getMessage();
        }
        return false;
    }

    private boolean syncLocationLogs() {
        try {
            List<LocationLogEntity> logs = db.attendanceDao().getAllLocationLogs();
            if (logs.isEmpty()) return true;

            for (LocationLogEntity log : logs) {
                try {
                    String jsonBody = new Gson().toJson(log);
                    String response = ApiService.logLocationBlocking(jsonBody);
                    
                    if (response != null) {
                        db.attendanceDao().deleteLocationLog(log.id);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    // If it's a server error (e.g. 500 due to bad data), we should probably delete it or mark it as failed
                    // For now, just catch so we can proceed to the next log
                    // Ideally: if (e.getMessage().contains("500")) db.attendanceDao().deleteLocationLog(log.id);
                }
            }
            return true; 
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }
}
