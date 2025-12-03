package com.ambe.supervisor.database;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "employees")
public class EmployeeEntity {
    @PrimaryKey
    @NonNull
    public String id;
    public String biometricCode;
    public String name;
    public String role;
    public String siteId;
    public String photoUrl;
    public String status;

    public EmployeeEntity(@NonNull String id, String biometricCode, String name, String role, String siteId, String photoUrl, String status) {
        this.id = id;
        this.biometricCode = biometricCode;
        this.name = name;
        this.role = role;
        this.siteId = siteId;
        this.photoUrl = photoUrl;
        this.status = status;
    }
}
