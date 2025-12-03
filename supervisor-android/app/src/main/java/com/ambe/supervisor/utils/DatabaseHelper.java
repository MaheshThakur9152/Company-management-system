package com.ambe.supervisor.utils;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import org.json.JSONArray;
import org.json.JSONObject;

public class DatabaseHelper extends SQLiteOpenHelper {

    private static final String DATABASE_NAME = "AmbeSupervisor.db";
    private static final int DATABASE_VERSION = 1;

    // Location Logs Table
    public static final String TABLE_LOCATION = "location_logs";
    public static final String COL_ID = "id";
    public static final String COL_SUP_ID = "supervisorId";
    public static final String COL_SUP_NAME = "supervisorName";
    public static final String COL_SITE_ID = "siteId";
    public static final String COL_LAT = "latitude";
    public static final String COL_LNG = "longitude";
    public static final String COL_STATUS = "status";
    public static final String COL_TIMESTAMP = "timestamp";

    // Attendance Queue Table
    public static final String TABLE_ATTENDANCE = "attendance_queue";
    public static final String COL_EMP_ID = "employeeId";
    public static final String COL_DATE = "date";
    public static final String COL_ATT_STATUS = "att_status";
    public static final String COL_CHECK_IN = "checkInTime";
    public static final String COL_PHOTO = "photoUrl";
    public static final String COL_IS_SYNCED = "isSynced";

    public DatabaseHelper(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        String createLocationTable = "CREATE TABLE " + TABLE_LOCATION + " (" +
                COL_ID + " INTEGER PRIMARY KEY AUTOINCREMENT, " +
                COL_SUP_ID + " TEXT, " +
                COL_SUP_NAME + " TEXT, " +
                COL_SITE_ID + " TEXT, " +
                COL_LAT + " REAL, " +
                COL_LNG + " REAL, " +
                COL_STATUS + " TEXT, " +
                COL_TIMESTAMP + " INTEGER)";
        db.execSQL(createLocationTable);

        String createAttendanceTable = "CREATE TABLE " + TABLE_ATTENDANCE + " (" +
                COL_ID + " INTEGER PRIMARY KEY AUTOINCREMENT, " +
                COL_EMP_ID + " TEXT, " +
                COL_DATE + " TEXT, " +
                COL_ATT_STATUS + " TEXT, " +
                COL_CHECK_IN + " TEXT, " +
                COL_PHOTO + " TEXT, " +
                COL_IS_SYNCED + " INTEGER DEFAULT 0, " +
                COL_TIMESTAMP + " INTEGER)";
        db.execSQL(createAttendanceTable);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_LOCATION);
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_ATTENDANCE);
        onCreate(db);
    }

    // --- Location Operations ---
    public void addLocationLog(String supId, String supName, String siteId, double lat, double lng, String status) {
        SQLiteDatabase db = this.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put(COL_SUP_ID, supId);
        values.put(COL_SUP_NAME, supName);
        values.put(COL_SITE_ID, siteId);
        values.put(COL_LAT, lat);
        values.put(COL_LNG, lng);
        values.put(COL_STATUS, status);
        values.put(COL_TIMESTAMP, System.currentTimeMillis());
        db.insert(TABLE_LOCATION, null, values);
    }

    public JSONArray getUnsyncedLocationLogs() {
        SQLiteDatabase db = this.getReadableDatabase();
        JSONArray array = new JSONArray();
        Cursor cursor = db.query(TABLE_LOCATION, null, null, null, null, null, COL_TIMESTAMP + " ASC");
        
        if (cursor.moveToFirst()) {
            do {
                try {
                    JSONObject obj = new JSONObject();
                    obj.put("localId", cursor.getInt(cursor.getColumnIndexOrThrow(COL_ID)));
                    obj.put("supervisorId", cursor.getString(cursor.getColumnIndexOrThrow(COL_SUP_ID)));
                    obj.put("supervisorName", cursor.getString(cursor.getColumnIndexOrThrow(COL_SUP_NAME)));
                    obj.put("siteId", cursor.getString(cursor.getColumnIndexOrThrow(COL_SITE_ID)));
                    obj.put("latitude", cursor.getDouble(cursor.getColumnIndexOrThrow(COL_LAT)));
                    obj.put("longitude", cursor.getDouble(cursor.getColumnIndexOrThrow(COL_LNG)));
                    obj.put("status", cursor.getString(cursor.getColumnIndexOrThrow(COL_STATUS)));
                    obj.put("timestamp", cursor.getLong(cursor.getColumnIndexOrThrow(COL_TIMESTAMP)));
                    array.put(obj);
                } catch (Exception e) { e.printStackTrace(); }
            } while (cursor.moveToNext());
        }
        cursor.close();
        return array;
    }

    public void deleteLocationLog(int id) {
        SQLiteDatabase db = this.getWritableDatabase();
        db.delete(TABLE_LOCATION, COL_ID + " = ?", new String[]{String.valueOf(id)});
    }

    // --- Attendance Operations ---
    public void addAttendance(String empId, String date, String status, String checkIn, String photoUrl) {
        SQLiteDatabase db = this.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put(COL_EMP_ID, empId);
        values.put(COL_DATE, date);
        values.put(COL_ATT_STATUS, status);
        values.put(COL_CHECK_IN, checkIn);
        values.put(COL_PHOTO, photoUrl);
        values.put(COL_IS_SYNCED, 0);
        values.put(COL_TIMESTAMP, System.currentTimeMillis());
        db.insert(TABLE_ATTENDANCE, null, values);
    }

    public JSONArray getUnsyncedAttendance() {
        SQLiteDatabase db = this.getReadableDatabase();
        JSONArray array = new JSONArray();
        Cursor cursor = db.query(TABLE_ATTENDANCE, null, COL_IS_SYNCED + " = 0", null, null, null, COL_TIMESTAMP + " ASC");
        
        if (cursor.moveToFirst()) {
            do {
                try {
                    JSONObject obj = new JSONObject();
                    obj.put("localId", cursor.getInt(cursor.getColumnIndexOrThrow(COL_ID)));
                    obj.put("employeeId", cursor.getString(cursor.getColumnIndexOrThrow(COL_EMP_ID)));
                    obj.put("date", cursor.getString(cursor.getColumnIndexOrThrow(COL_DATE)));
                    obj.put("status", cursor.getString(cursor.getColumnIndexOrThrow(COL_ATT_STATUS)));
                    obj.put("checkInTime", cursor.getString(cursor.getColumnIndexOrThrow(COL_CHECK_IN)));
                    obj.put("photoUrl", cursor.getString(cursor.getColumnIndexOrThrow(COL_PHOTO)));
                    array.put(obj);
                } catch (Exception e) { e.printStackTrace(); }
            } while (cursor.moveToNext());
        }
        cursor.close();
        return array;
    }

    public void markAttendanceSynced(int id) {
        SQLiteDatabase db = this.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put(COL_IS_SYNCED, 1);
        db.update(TABLE_ATTENDANCE, values, COL_ID + " = ?", new String[]{String.valueOf(id)});
    }
    
    public void deleteAttendance(String empId, String date) {
        SQLiteDatabase db = this.getWritableDatabase();
        db.delete(TABLE_ATTENDANCE, COL_EMP_ID + " = ? AND " + COL_DATE + " = ?", new String[]{empId, date});
    }
}
