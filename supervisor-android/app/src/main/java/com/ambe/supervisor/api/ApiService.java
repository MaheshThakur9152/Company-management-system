package com.ambe.supervisor.api;

import org.json.JSONObject;
import com.ambe.supervisor.utils.AppConfig;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class ApiService {

    public interface ApiCallback {
        void onSuccess(String response);
        void onError(String error);
    }

    public static void login(String username, String password, String deviceId, ApiCallback callback) {
        new Thread(() -> {
            try {
                JSONObject jsonBody = new JSONObject();
                jsonBody.put("username", username);
                jsonBody.put("password", password);
                jsonBody.put("deviceId", deviceId);
                jsonBody.put("deviceName", android.os.Build.MANUFACTURER + " " + android.os.Build.MODEL);

                String response = executeRequest("/supervisor/login", "POST", jsonBody.toString());
                if (response != null) {
                    callback.onSuccess(response);
                } else {
                    callback.onError("Login failed");
                }
            } catch (Exception e) {
                callback.onError(e.getMessage());
            }
        }).start();
    }

    public static void getSites(ApiCallback callback) {
        new Thread(() -> {
            try {
                String response = executeRequest("/sites", "GET", null);
                if (response != null) callback.onSuccess(response);
                else callback.onError("Failed to fetch sites");
            } catch (Exception e) {
                callback.onError(e.getMessage());
            }
        }).start();
    }

    public static void getEmployees(ApiCallback callback) {
        new Thread(() -> {
            try {
                String response = executeRequest("/employees", "GET", null);
                if (response != null) callback.onSuccess(response);
                else callback.onError("Failed to fetch employees");
            } catch (Exception e) {
                callback.onError(e.getMessage());
            }
        }).start();
    }

    public static void syncAttendance(String jsonBody, ApiCallback callback) {
        new Thread(() -> {
            try {
                String response = executeRequest("/attendance/sync", "POST", jsonBody);
                if (response != null) callback.onSuccess(response);
                else callback.onError("Sync failed");
            } catch (Exception e) {
                callback.onError(e.getMessage());
            }
        }).start();
    }

    public static String syncAttendanceBlocking(String jsonBody) throws Exception {
        return executeRequest("/attendance/sync", "POST", jsonBody);
    }

    public static String logLocationBlocking(String jsonBody) throws Exception {
        return executeRequest("/supervisor/location", "POST", jsonBody);
    }

    public static void logLocation(String jsonBody, ApiCallback callback) {
        new Thread(() -> {
            try {
                String response = executeRequest("/supervisor/location", "POST", jsonBody);
                if (response != null) callback.onSuccess(response);
                else callback.onError("Log failed");
            } catch (Exception e) {
                callback.onError(e.getMessage());
            }
        }).start();
    }

    public static void getAttendance(String siteId, String date, ApiCallback callback) {
        getAttendanceSince(siteId, date, null, callback);
    }

    public static void checkEmployeeAttendance(String employeeId, String month, String year, ApiCallback callback) {
        new Thread(() -> {
            try {
                String endpoint = "/attendance?employee=" + employeeId + "&month=" + month + "&year=" + year;
                String response = executeRequest(endpoint, "GET", null);
                if (response != null) callback.onSuccess(response);
                else callback.onError("Failed to fetch attendance");
            } catch (Exception e) {
                callback.onError(e.getMessage());
            }
        }).start();
    }

    public static void getAttendanceSince(String siteId, String date, String updatedAfter, ApiCallback callback) {
        new Thread(() -> {
            try {
                // Assuming date is YYYY-MM-DD
                String[] parts = date.split("-");
                String month = parts[1];
                String year = parts[0];
                String endpoint = "/attendance?site=" + siteId + "&month=" + month + "&year=" + year;
                if (updatedAfter != null) {
                    endpoint += "&updatedAfter=" + updatedAfter;
                }
                
                String response = executeRequest(endpoint, "GET", null);
                if (response != null) callback.onSuccess(response);
                else callback.onError("Failed to fetch attendance");
            } catch (Exception e) {
                callback.onError(e.getMessage());
            }
        }).start();
    }

    private static String executeRequest(String endpoint, String method, String jsonBody) throws Exception {
        URL url = new URL(AppConfig.getBaseUrl() + "/api" + endpoint);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod(method);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setConnectTimeout(30000); // Increased to 30 seconds
        conn.setReadTimeout(30000);    // Increased to 30 seconds

        if (jsonBody != null && (method.equals("POST") || method.equals("PUT"))) {
            conn.setDoOutput(true);
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonBody.getBytes("utf-8");
                os.write(input, 0, input.length);
            }
        }

        int responseCode = conn.getResponseCode();
        if (responseCode >= 200 && responseCode < 300) {
            try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), "utf-8"))) {
                StringBuilder response = new StringBuilder();
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    response.append(responseLine.trim());
                }
                return response.toString();
            }
        } else {
            StringBuilder errorResponse = new StringBuilder();
            if (conn.getErrorStream() != null) {
                try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getErrorStream(), "utf-8"))) {
                    String responseLine;
                    while ((responseLine = br.readLine()) != null) {
                        errorResponse.append(responseLine.trim());
                    }
                }
            }
            throw new Exception("Server Error " + responseCode + ": " + errorResponse.toString());
        }
    }
}
