package com.ambe.supervisor.database;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import java.util.List;

@Dao
public interface SiteDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(SiteEntity site);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<SiteEntity> sites);

    @Query("SELECT * FROM sites WHERE id = :id")
    SiteEntity getSiteById(String id);

    @Query("SELECT * FROM sites")
    List<SiteEntity> getAllSites();
    
    @Query("DELETE FROM sites")
    void deleteAll();
}
