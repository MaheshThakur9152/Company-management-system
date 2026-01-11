package com.boss.app;

import android.content.Context;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ApiService {
    private static final String BASE_URL = "https://api.ambeservice.com/api";

    // Expose base URL for other modules (e.g., Live Voice)
    public static String getBaseApiUrl() {
        return BASE_URL;
    }
    private static final String TAG = "ApiService";

    public interface ApiCallback<T> {
        void onSuccess(T result);

        void onError(String error);
    }

    public static String getDownloadUrl(String invoiceId) {
        return BASE_URL + "/invoices/" + invoiceId + "/download";
    }

    // Fetch all employees
    public static void getEmployees(Context context, final ApiCallback<List<EmployeeData>> callback) {
        new Thread(() -> {
            try {
                String urlString = BASE_URL + "/employees";
                Log.d(TAG, "Fetching employees from: " + urlString);
                URL url = new URL(urlString);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);

                int responseCode = conn.getResponseCode();
                Log.d(TAG, "Employee response code: " + responseCode);
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();

                    Log.d(TAG, "Employees response: "
                            + response.toString().substring(0, Math.min(200, response.length())));
                    List<EmployeeData> employees = parseEmployees(response.toString());
                    Log.d(TAG, "Parsed " + employees.size() + " employees");
                    callback.onSuccess(employees);
                } else {
                    String error = "HTTP Error: " + responseCode;
                    Log.e(TAG, error);
                    callback.onError(error);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error fetching employees", e);
                callback.onError(e.getMessage());
            }
        }).start();
    }

    // Fetch attendance for a specific month and year
    public static void getAttendance(Context context, String month, String year, String siteId,
            final ApiCallback<List<AttendanceData>> callback) {
        new Thread(() -> {
            try {
                StringBuilder urlBuilder = new StringBuilder(BASE_URL + "/attendance?");
                if (month != null && year != null) {
                    urlBuilder.append("month=").append(month).append("&year=").append(year);
                }
                if (siteId != null && !siteId.equals("All Sites")) {
                    urlBuilder.append("&site=").append(siteId);
                }

                URL url = new URL(urlBuilder.toString());
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);

                int responseCode = conn.getResponseCode();
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();

                    List<AttendanceData> attendance = parseAttendance(response.toString());
                    callback.onSuccess(attendance);
                } else {
                    callback.onError("HTTP Error: " + responseCode);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error fetching attendance", e);
                callback.onError(e.getMessage());
            }
        }).start();
    }

    // Fetch all sites
    public static void getSites(Context context, final ApiCallback<List<SiteData>> callback) {
        new Thread(() -> {
            try {
                URL url = new URL(BASE_URL + "/sites");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);

                int responseCode = conn.getResponseCode();
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();

                    List<SiteData> sites = parseSites(response.toString());
                    callback.onSuccess(sites);
                } else {
                    callback.onError("HTTP Error: " + responseCode);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error fetching sites", e);
                callback.onError(e.getMessage());
            }
        }).start();
    }

    // Fetch all invoices
    public static void getInvoices(Context context, final ApiCallback<List<InvoiceData>> callback) {
        new Thread(() -> {
            try {
                URL url = new URL(BASE_URL + "/invoices");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);

                int responseCode = conn.getResponseCode();
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();

                    List<InvoiceData> invoices = parseInvoices(response.toString());
                    callback.onSuccess(invoices);
                } else {
                    callback.onError("HTTP Error: " + responseCode);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error fetching invoices", e);
                callback.onError(e.getMessage());
            }
        }).start();
    }

    // Parse employee JSON
    private static List<EmployeeData> parseEmployees(String jsonStr) throws Exception {
        List<EmployeeData> employees = new ArrayList<>();
        JSONArray jsonArray = new JSONArray(jsonStr);

        for (int i = 0; i < jsonArray.length(); i++) {
            JSONObject obj = jsonArray.getJSONObject(i);
            EmployeeData emp = new EmployeeData();
            emp.id = obj.optString("id", "");
            emp.name = obj.optString("name", "");
            emp.role = obj.optString("role", "");
            emp.siteId = obj.optString("siteId", "");
            emp.photoUrl = obj.optString("photoUrl", "");
            emp.phone = obj.optString("phone", "");
            emp.biometricCode = obj.optString("biometricCode", "");
            employees.add(emp);
        }
        return employees;
    }

    // Parse attendance JSON
    private static List<AttendanceData> parseAttendance(String jsonStr) throws Exception {
        List<AttendanceData> attendanceList = new ArrayList<>();
        JSONArray jsonArray = new JSONArray(jsonStr);

        for (int i = 0; i < jsonArray.length(); i++) {
            JSONObject obj = jsonArray.getJSONObject(i);
            AttendanceData att = new AttendanceData();
            att.id = obj.optString("id", "");
            att.employeeId = obj.optString("employeeId", "");
            att.date = obj.optString("date", "");
            att.status = obj.optString("status", "");
            att.photoUrl = obj.optString("photoUrl", "");
            att.checkInTime = obj.optString("checkInTime", "");
            att.checkOutTime = obj.optString("checkOutTime", "");

            if (obj.has("location")) {
                JSONObject loc = obj.getJSONObject("location");
                att.latitude = loc.optDouble("lat", 0);
                att.longitude = loc.optDouble("lng", 0);
                att.address = loc.optString("address", "");
            }

            attendanceList.add(att);
        }
        return attendanceList;
    }

    // Parse sites JSON
    private static List<SiteData> parseSites(String jsonStr) throws Exception {
        List<SiteData> sites = new ArrayList<>();
        JSONArray jsonArray = new JSONArray(jsonStr);

        for (int i = 0; i < jsonArray.length(); i++) {
            JSONObject obj = jsonArray.getJSONObject(i);
            SiteData site = new SiteData();
            site.id = obj.optString("id", "");
            site.name = obj.optString("name", "");
            site.address = obj.optString("address", "");
            sites.add(site);
        }
        return sites;
    }

    // Parse invoices JSON
    private static List<InvoiceData> parseInvoices(String jsonStr) throws Exception {
        List<InvoiceData> invoices = new ArrayList<>();
        JSONArray jsonArray = new JSONArray(jsonStr);

        for (int i = 0; i < jsonArray.length(); i++) {
            JSONObject obj = jsonArray.getJSONObject(i);
            InvoiceData invoice = new InvoiceData();
            invoice.id = obj.optString("id", "");
            invoice.invoiceNo = obj.optString("invoiceNo", "");
            invoice.siteId = obj.optString("siteId", "");
            invoice.amount = obj.optDouble("amount", 0);
            invoice.status = obj.optString("status", "");
            invoice.date = obj.optString("date", "");
            invoices.add(invoice);
        }
        return invoices;
    }
}
