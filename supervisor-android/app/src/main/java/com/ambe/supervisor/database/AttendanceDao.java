package com.ambe.supervisor.database;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Update;

import java.util.List;

@Dao
public interface AttendanceDao {
    @Insert
    void insert(AttendanceEntity attendance);

    @Query("SELECT * FROM attendance WHERE isSynced = 0")
    List<AttendanceEntity> getUnsyncedAttendance();

    @Query("UPDATE attendance SET isSynced = 1 WHERE id = :id")
    void markAsSynced(int id);
    
    @Query("SELECT * FROM attendance WHERE date = :date")
    List<AttendanceEntity> getAttendanceByDate(String date);

    @Query("SELECT * FROM attendance WHERE employeeId = :employeeId AND date = :date")
    List<AttendanceEntity> getAttendanceForEmployee(String employeeId, String date);

    @Insert
    void insertLocationLog(LocationLogEntity log);

    @Query("SELECT * FROM location_logs")
    List<LocationLogEntity> getAllLocationLogs();

    @Query("DELETE FROM location_logs WHERE id = :id")
    void deleteLocationLog(int id);
}
