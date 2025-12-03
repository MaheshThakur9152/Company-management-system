package com.ambe.supervisor.database;

import android.content.Context;

import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;

@Database(entities = {AttendanceEntity.class, LocationLogEntity.class, SiteEntity.class, EmployeeEntity.class}, version = 3)
public abstract class AppDatabase extends RoomDatabase {
    public abstract AttendanceDao attendanceDao();
    public abstract SiteDao siteDao();
    public abstract EmployeeDao employeeDao();

    private static volatile AppDatabase INSTANCE;

    public static AppDatabase getDatabase(final Context context) {
        if (INSTANCE == null) {
            synchronized (AppDatabase.class) {
                if (INSTANCE == null) {
                    INSTANCE = Room.databaseBuilder(context.getApplicationContext(),
                            AppDatabase.class, "ambe_supervisor_db")
                            .fallbackToDestructiveMigration()
                            .build();
                }
            }
        }
        return INSTANCE;
    }
}
