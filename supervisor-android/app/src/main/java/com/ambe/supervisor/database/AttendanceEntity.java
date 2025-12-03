package com.ambe.supervisor.database;

import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "attendance")
public class AttendanceEntity {
    @PrimaryKey(autoGenerate = true)
    public int id;

    public String employeeId;
    public String siteId;
    public String date; // YYYY-MM-DD
    public String timestamp; // ISO String or Millis
    public String status; // P, A
    public String type; // IN, OUT
    public double latitude;
    public double longitude;
    public String photoPath; // Local path or Base64
    public String deviceId;
    public boolean isSynced;
    public String supervisorName;

    public AttendanceEntity(String employeeId, String siteId, String date, String timestamp, String status, String type, double latitude, double longitude, String photoPath, String deviceId) {
        this.employeeId = employeeId;
        this.siteId = siteId;
        this.date = date;
        this.timestamp = timestamp;
        this.status = status;
        this.type = type;
        this.latitude = latitude;
        this.longitude = longitude;
        this.photoPath = photoPath;
        this.deviceId = deviceId;
        this.isSynced = false;
    }
}
