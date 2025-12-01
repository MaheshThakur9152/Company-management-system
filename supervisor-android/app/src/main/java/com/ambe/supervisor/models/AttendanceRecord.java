package com.ambe.supervisor.models;

public class AttendanceRecord {
    private String id;
    private String employeeId;
    private String date;
    private String status;
    private String checkInTime;
    private String photoUrl;
    private boolean isSynced;
    private boolean isLocked;

    public AttendanceRecord(String id, String employeeId, String date, String status, String checkInTime, String photoUrl, boolean isSynced, boolean isLocked) {
        this.id = id;
        this.employeeId = employeeId;
        this.date = date;
        this.status = status;
        this.checkInTime = checkInTime;
        this.photoUrl = photoUrl;
        this.isSynced = isSynced;
        this.isLocked = isLocked;
    }

    public String getId() { return id; }
    public String getEmployeeId() { return employeeId; }
    public String getDate() { return date; }
    public String getStatus() { return status; }
    public String getCheckInTime() { return checkInTime; }
    public String getPhotoUrl() { return photoUrl; }
    public boolean isSynced() { return isSynced; }
    public boolean isLocked() { return isLocked; }

    public void setSynced(boolean synced) { isSynced = synced; }
    public void setLocked(boolean locked) { isLocked = locked; }
    public void setStatus(String status) { this.status = status; }
}
