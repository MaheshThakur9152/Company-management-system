package com.boss.app;

public class AttendanceData {
    public String id;
    public String employeeId;
    public String date; // YYYY-MM-DD format
    public String status; // P, A, HD, WO, etc.
    public String photoUrl;
    public String checkInTime;
    public String checkOutTime;
    public double latitude;
    public double longitude;
    public String address;

    public int getDayOfMonth() {
        if (date == null || date.length() < 10)
            return 0;
        try {
            String[] parts = date.split("-");
            return Integer.parseInt(parts[2]);
        } catch (Exception e) {
            return 0;
        }
    }
}
