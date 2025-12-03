package com.ambe.supervisor.database;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import java.util.List;

@Dao
public interface EmployeeDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(EmployeeEntity employee);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<EmployeeEntity> employees);

    @Query("SELECT * FROM employees WHERE siteId = :siteId")
    List<EmployeeEntity> getEmployeesBySite(String siteId);

    @Query("SELECT * FROM employees")
    List<EmployeeEntity> getAllEmployees();
    
    @Query("DELETE FROM employees")
    void deleteAll();
}
