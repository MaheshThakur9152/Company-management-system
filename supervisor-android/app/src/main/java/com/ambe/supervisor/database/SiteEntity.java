package com.ambe.supervisor.database;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "sites")
public class SiteEntity {
    @PrimaryKey
    @NonNull
    public String id;
    public String name;
    public String location;
    public double latitude;
    public double longitude;
    public int geofenceRadius;

    public SiteEntity(@NonNull String id, String name, String location, double latitude, double longitude, int geofenceRadius) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.latitude = latitude;
        this.longitude = longitude;
        this.geofenceRadius = geofenceRadius;
    }
}
