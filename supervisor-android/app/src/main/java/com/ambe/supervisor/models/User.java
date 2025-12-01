package com.ambe.supervisor.models;

public class User {
    private String userId;
    private String name;
    private String role;
    private String[] assignedSites;
    private String email;

    public User(String userId, String name, String role, String[] assignedSites, String email) {
        this.userId = userId;
        this.name = name;
        this.role = role;
        this.assignedSites = assignedSites;
        this.email = email;
    }

    public String getUserId() { return userId; }
    public String getName() { return name; }
    public String getRole() { return role; }
    public String[] getAssignedSites() { return assignedSites; }
    public String getEmail() { return email; }
}
