package com.ambe.supervisor.models;

public class Employee {
    private String id;
    private String biometricCode;
    private String name;
    private String role;
    private String siteId;
    private String photoUrl;
    private String status;

    public Employee(String id, String biometricCode, String name, String role, String siteId, String photoUrl, String status) {
        this.id = id;
        this.biometricCode = biometricCode;
        this.name = name;
        this.role = role;
        this.siteId = siteId;
        this.photoUrl = photoUrl;
        this.status = status;
    }

    public String getId() { return id; }
    public String getBiometricCode() { return biometricCode; }
    public String getName() { return name; }
    public String getRole() { return role; }
    public String getSiteId() { return siteId; }
    public String getPhotoUrl() { return photoUrl; }
    public String getStatus() { return status; }
}
