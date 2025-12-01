package com.ambe.supervisor.models;

public class Site {
    private String id;
    private String name;
    private String location;
    private double latitude;
    private double longitude;
    private int geofenceRadius;

    public Site(String id, String name, String location, double latitude, double longitude, int geofenceRadius) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.latitude = latitude;
        this.longitude = longitude;
        this.geofenceRadius = geofenceRadius;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getLocation() { return location; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public int getGeofenceRadius() { return geofenceRadius; }
}
