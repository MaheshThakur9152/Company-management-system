package com.boss.app;

public class EmployeeData {
    public String id;
    public String name;
    public String role;
    public String siteId;
    public String photoUrl;
    public String phone;
    public String biometricCode;

    public String getAvatarInitials() {
        if (name == null || name.isEmpty())
            return "??";
        String trimmedName = name.trim();
        if (trimmedName.isEmpty())
            return "??";
        String[] parts = trimmedName.split("\\s+");
        if (parts.length >= 2 && parts[0].length() > 0 && parts[1].length() > 0) {
            return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
        }
        return trimmedName.substring(0, Math.min(2, trimmedName.length())).toUpperCase();
    }
}
