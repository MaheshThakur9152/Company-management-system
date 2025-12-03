package com.ambe.supervisor.database;

import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "location_logs")
public class LocationLogEntity {
    @PrimaryKey(autoGenerate = true)
    public int id;

    public String supervisorId;
    public String supervisorName;
    public String siteId;
    public double latitude;
    public double longitude;
    public String status;
    public String timestamp;

    public LocationLogEntity(String supervisorId, String supervisorName, String siteId, double latitude, double longitude, String status, String timestamp) {
        this.supervisorId = supervisorId;
        this.supervisorName = supervisorName;
        this.siteId = siteId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.status = status;
        this.timestamp = timestamp;
    }
}
