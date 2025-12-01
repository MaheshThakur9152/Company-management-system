package com.ambe.supervisor.api;

import android.os.AsyncTask;
import android.util.Log;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class ApiService {
    private static final String API_URL = "https://api.ambeservice.com/api";

    public interface ApiCallback {
        void onSuccess(String response);
        void onError(String error);
    }

    public static void login(String username, String password, ApiCallback callback) {
        new Thread(() -> {
            try {
                JSONObject jsonBody = new JSONObject();
                jsonBody.put("username", username);
                jsonBody.put("password", password);

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

    private static String executeRequest(String endpoint, String method, String jsonBody) throws Exception {
        URL url = new URL(API_URL + endpoint);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod(method);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(10000);

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
