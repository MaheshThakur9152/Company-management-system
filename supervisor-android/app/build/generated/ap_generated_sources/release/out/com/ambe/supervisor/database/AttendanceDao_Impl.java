package com.ambe.supervisor.database;

import android.database.Cursor;
import androidx.annotation.NonNull;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.SharedSQLiteStatement;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import java.lang.Class;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@SuppressWarnings({"unchecked", "deprecation"})
public final class AttendanceDao_Impl implements AttendanceDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<AttendanceEntity> __insertionAdapterOfAttendanceEntity;

  private final EntityInsertionAdapter<LocationLogEntity> __insertionAdapterOfLocationLogEntity;

  private final SharedSQLiteStatement __preparedStmtOfMarkAsSynced;

  private final SharedSQLiteStatement __preparedStmtOfDeleteLocationLog;

  public AttendanceDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfAttendanceEntity = new EntityInsertionAdapter<AttendanceEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR ABORT INTO `attendance` (`id`,`employeeId`,`siteId`,`date`,`timestamp`,`status`,`type`,`latitude`,`longitude`,`photoPath`,`deviceId`,`isSynced`,`supervisorName`) VALUES (nullif(?, 0),?,?,?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final AttendanceEntity entity) {
        statement.bindLong(1, entity.id);
        if (entity.employeeId == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.employeeId);
        }
        if (entity.siteId == null) {
          statement.bindNull(3);
        } else {
          statement.bindString(3, entity.siteId);
        }
        if (entity.date == null) {
          statement.bindNull(4);
        } else {
          statement.bindString(4, entity.date);
        }
        if (entity.timestamp == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.timestamp);
        }
        if (entity.status == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.status);
        }
        if (entity.type == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.type);
        }
        statement.bindDouble(8, entity.latitude);
        statement.bindDouble(9, entity.longitude);
        if (entity.photoPath == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.photoPath);
        }
        if (entity.deviceId == null) {
          statement.bindNull(11);
        } else {
          statement.bindString(11, entity.deviceId);
        }
        final int _tmp = entity.isSynced ? 1 : 0;
        statement.bindLong(12, _tmp);
        if (entity.supervisorName == null) {
          statement.bindNull(13);
        } else {
          statement.bindString(13, entity.supervisorName);
        }
      }
    };
    this.__insertionAdapterOfLocationLogEntity = new EntityInsertionAdapter<LocationLogEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR ABORT INTO `location_logs` (`id`,`supervisorId`,`supervisorName`,`siteId`,`latitude`,`longitude`,`status`,`timestamp`) VALUES (nullif(?, 0),?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final LocationLogEntity entity) {
        statement.bindLong(1, entity.id);
        if (entity.supervisorId == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.supervisorId);
        }
        if (entity.supervisorName == null) {
          statement.bindNull(3);
        } else {
          statement.bindString(3, entity.supervisorName);
        }
        if (entity.siteId == null) {
          statement.bindNull(4);
        } else {
          statement.bindString(4, entity.siteId);
        }
        statement.bindDouble(5, entity.latitude);
        statement.bindDouble(6, entity.longitude);
        if (entity.status == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.status);
        }
        if (entity.timestamp == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.timestamp);
        }
      }
    };
    this.__preparedStmtOfMarkAsSynced = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "UPDATE attendance SET isSynced = 1 WHERE id = ?";
        return _query;
      }
    };
    this.__preparedStmtOfDeleteLocationLog = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM location_logs WHERE id = ?";
        return _query;
      }
    };
  }

  @Override
  public void insert(final AttendanceEntity attendance) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfAttendanceEntity.insert(attendance);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void insertLocationLog(final LocationLogEntity log) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfLocationLogEntity.insert(log);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void markAsSynced(final int id) {
    __db.assertNotSuspendingTransaction();
    final SupportSQLiteStatement _stmt = __preparedStmtOfMarkAsSynced.acquire();
    int _argIndex = 1;
    _stmt.bindLong(_argIndex, id);
    try {
      __db.beginTransaction();
      try {
        _stmt.executeUpdateDelete();
        __db.setTransactionSuccessful();
      } finally {
        __db.endTransaction();
      }
    } finally {
      __preparedStmtOfMarkAsSynced.release(_stmt);
    }
  }

  @Override
  public void deleteLocationLog(final int id) {
    __db.assertNotSuspendingTransaction();
    final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteLocationLog.acquire();
    int _argIndex = 1;
    _stmt.bindLong(_argIndex, id);
    try {
      __db.beginTransaction();
      try {
        _stmt.executeUpdateDelete();
        __db.setTransactionSuccessful();
      } finally {
        __db.endTransaction();
      }
    } finally {
      __preparedStmtOfDeleteLocationLog.release(_stmt);
    }
  }

  @Override
  public List<AttendanceEntity> getUnsyncedAttendance() {
    final String _sql = "SELECT * FROM attendance WHERE isSynced = 0";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    __db.assertNotSuspendingTransaction();
    final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
    try {
      final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
      final int _cursorIndexOfEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeId");
      final int _cursorIndexOfSiteId = CursorUtil.getColumnIndexOrThrow(_cursor, "siteId");
      final int _cursorIndexOfDate = CursorUtil.getColumnIndexOrThrow(_cursor, "date");
      final int _cursorIndexOfTimestamp = CursorUtil.getColumnIndexOrThrow(_cursor, "timestamp");
      final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
      final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
      final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
      final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
      final int _cursorIndexOfPhotoPath = CursorUtil.getColumnIndexOrThrow(_cursor, "photoPath");
      final int _cursorIndexOfDeviceId = CursorUtil.getColumnIndexOrThrow(_cursor, "deviceId");
      final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
      final int _cursorIndexOfSupervisorName = CursorUtil.getColumnIndexOrThrow(_cursor, "supervisorName");
      final List<AttendanceEntity> _result = new ArrayList<AttendanceEntity>(_cursor.getCount());
      while (_cursor.moveToNext()) {
        final AttendanceEntity _item;
        final String _tmpEmployeeId;
        if (_cursor.isNull(_cursorIndexOfEmployeeId)) {
          _tmpEmployeeId = null;
        } else {
          _tmpEmployeeId = _cursor.getString(_cursorIndexOfEmployeeId);
        }
        final String _tmpSiteId;
        if (_cursor.isNull(_cursorIndexOfSiteId)) {
          _tmpSiteId = null;
        } else {
          _tmpSiteId = _cursor.getString(_cursorIndexOfSiteId);
        }
        final String _tmpDate;
        if (_cursor.isNull(_cursorIndexOfDate)) {
          _tmpDate = null;
        } else {
          _tmpDate = _cursor.getString(_cursorIndexOfDate);
        }
        final String _tmpTimestamp;
        if (_cursor.isNull(_cursorIndexOfTimestamp)) {
          _tmpTimestamp = null;
        } else {
          _tmpTimestamp = _cursor.getString(_cursorIndexOfTimestamp);
        }
        final String _tmpStatus;
        if (_cursor.isNull(_cursorIndexOfStatus)) {
          _tmpStatus = null;
        } else {
          _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
        }
        final String _tmpType;
        if (_cursor.isNull(_cursorIndexOfType)) {
          _tmpType = null;
        } else {
          _tmpType = _cursor.getString(_cursorIndexOfType);
        }
        final double _tmpLatitude;
        _tmpLatitude = _cursor.getDouble(_cursorIndexOfLatitude);
        final double _tmpLongitude;
        _tmpLongitude = _cursor.getDouble(_cursorIndexOfLongitude);
        final String _tmpPhotoPath;
        if (_cursor.isNull(_cursorIndexOfPhotoPath)) {
          _tmpPhotoPath = null;
        } else {
          _tmpPhotoPath = _cursor.getString(_cursorIndexOfPhotoPath);
        }
        final String _tmpDeviceId;
        if (_cursor.isNull(_cursorIndexOfDeviceId)) {
          _tmpDeviceId = null;
        } else {
          _tmpDeviceId = _cursor.getString(_cursorIndexOfDeviceId);
        }
        _item = new AttendanceEntity(_tmpEmployeeId,_tmpSiteId,_tmpDate,_tmpTimestamp,_tmpStatus,_tmpType,_tmpLatitude,_tmpLongitude,_tmpPhotoPath,_tmpDeviceId);
        _item.id = _cursor.getInt(_cursorIndexOfId);
        final int _tmp;
        _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
        _item.isSynced = _tmp != 0;
        if (_cursor.isNull(_cursorIndexOfSupervisorName)) {
          _item.supervisorName = null;
        } else {
          _item.supervisorName = _cursor.getString(_cursorIndexOfSupervisorName);
        }
        _result.add(_item);
      }
      return _result;
    } finally {
      _cursor.close();
      _statement.release();
    }
  }

  @Override
  public List<AttendanceEntity> getAttendanceByDate(final String date) {
    final String _sql = "SELECT * FROM attendance WHERE date = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (date == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, date);
    }
    __db.assertNotSuspendingTransaction();
    final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
    try {
      final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
      final int _cursorIndexOfEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeId");
      final int _cursorIndexOfSiteId = CursorUtil.getColumnIndexOrThrow(_cursor, "siteId");
      final int _cursorIndexOfDate = CursorUtil.getColumnIndexOrThrow(_cursor, "date");
      final int _cursorIndexOfTimestamp = CursorUtil.getColumnIndexOrThrow(_cursor, "timestamp");
      final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
      final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
      final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
      final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
      final int _cursorIndexOfPhotoPath = CursorUtil.getColumnIndexOrThrow(_cursor, "photoPath");
      final int _cursorIndexOfDeviceId = CursorUtil.getColumnIndexOrThrow(_cursor, "deviceId");
      final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
      final int _cursorIndexOfSupervisorName = CursorUtil.getColumnIndexOrThrow(_cursor, "supervisorName");
      final List<AttendanceEntity> _result = new ArrayList<AttendanceEntity>(_cursor.getCount());
      while (_cursor.moveToNext()) {
        final AttendanceEntity _item;
        final String _tmpEmployeeId;
        if (_cursor.isNull(_cursorIndexOfEmployeeId)) {
          _tmpEmployeeId = null;
        } else {
          _tmpEmployeeId = _cursor.getString(_cursorIndexOfEmployeeId);
        }
        final String _tmpSiteId;
        if (_cursor.isNull(_cursorIndexOfSiteId)) {
          _tmpSiteId = null;
        } else {
          _tmpSiteId = _cursor.getString(_cursorIndexOfSiteId);
        }
        final String _tmpDate;
        if (_cursor.isNull(_cursorIndexOfDate)) {
          _tmpDate = null;
        } else {
          _tmpDate = _cursor.getString(_cursorIndexOfDate);
        }
        final String _tmpTimestamp;
        if (_cursor.isNull(_cursorIndexOfTimestamp)) {
          _tmpTimestamp = null;
        } else {
          _tmpTimestamp = _cursor.getString(_cursorIndexOfTimestamp);
        }
        final String _tmpStatus;
        if (_cursor.isNull(_cursorIndexOfStatus)) {
          _tmpStatus = null;
        } else {
          _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
        }
        final String _tmpType;
        if (_cursor.isNull(_cursorIndexOfType)) {
          _tmpType = null;
        } else {
          _tmpType = _cursor.getString(_cursorIndexOfType);
        }
        final double _tmpLatitude;
        _tmpLatitude = _cursor.getDouble(_cursorIndexOfLatitude);
        final double _tmpLongitude;
        _tmpLongitude = _cursor.getDouble(_cursorIndexOfLongitude);
        final String _tmpPhotoPath;
        if (_cursor.isNull(_cursorIndexOfPhotoPath)) {
          _tmpPhotoPath = null;
        } else {
          _tmpPhotoPath = _cursor.getString(_cursorIndexOfPhotoPath);
        }
        final String _tmpDeviceId;
        if (_cursor.isNull(_cursorIndexOfDeviceId)) {
          _tmpDeviceId = null;
        } else {
          _tmpDeviceId = _cursor.getString(_cursorIndexOfDeviceId);
        }
        _item = new AttendanceEntity(_tmpEmployeeId,_tmpSiteId,_tmpDate,_tmpTimestamp,_tmpStatus,_tmpType,_tmpLatitude,_tmpLongitude,_tmpPhotoPath,_tmpDeviceId);
        _item.id = _cursor.getInt(_cursorIndexOfId);
        final int _tmp;
        _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
        _item.isSynced = _tmp != 0;
        if (_cursor.isNull(_cursorIndexOfSupervisorName)) {
          _item.supervisorName = null;
        } else {
          _item.supervisorName = _cursor.getString(_cursorIndexOfSupervisorName);
        }
        _result.add(_item);
      }
      return _result;
    } finally {
      _cursor.close();
      _statement.release();
    }
  }

  @Override
  public List<AttendanceEntity> getAttendanceForEmployee(final String employeeId,
      final String date) {
    final String _sql = "SELECT * FROM attendance WHERE employeeId = ? AND date = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 2);
    int _argIndex = 1;
    if (employeeId == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, employeeId);
    }
    _argIndex = 2;
    if (date == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, date);
    }
    __db.assertNotSuspendingTransaction();
    final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
    try {
      final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
      final int _cursorIndexOfEmployeeId = CursorUtil.getColumnIndexOrThrow(_cursor, "employeeId");
      final int _cursorIndexOfSiteId = CursorUtil.getColumnIndexOrThrow(_cursor, "siteId");
      final int _cursorIndexOfDate = CursorUtil.getColumnIndexOrThrow(_cursor, "date");
      final int _cursorIndexOfTimestamp = CursorUtil.getColumnIndexOrThrow(_cursor, "timestamp");
      final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
      final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
      final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
      final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
      final int _cursorIndexOfPhotoPath = CursorUtil.getColumnIndexOrThrow(_cursor, "photoPath");
      final int _cursorIndexOfDeviceId = CursorUtil.getColumnIndexOrThrow(_cursor, "deviceId");
      final int _cursorIndexOfIsSynced = CursorUtil.getColumnIndexOrThrow(_cursor, "isSynced");
      final int _cursorIndexOfSupervisorName = CursorUtil.getColumnIndexOrThrow(_cursor, "supervisorName");
      final List<AttendanceEntity> _result = new ArrayList<AttendanceEntity>(_cursor.getCount());
      while (_cursor.moveToNext()) {
        final AttendanceEntity _item;
        final String _tmpEmployeeId;
        if (_cursor.isNull(_cursorIndexOfEmployeeId)) {
          _tmpEmployeeId = null;
        } else {
          _tmpEmployeeId = _cursor.getString(_cursorIndexOfEmployeeId);
        }
        final String _tmpSiteId;
        if (_cursor.isNull(_cursorIndexOfSiteId)) {
          _tmpSiteId = null;
        } else {
          _tmpSiteId = _cursor.getString(_cursorIndexOfSiteId);
        }
        final String _tmpDate;
        if (_cursor.isNull(_cursorIndexOfDate)) {
          _tmpDate = null;
        } else {
          _tmpDate = _cursor.getString(_cursorIndexOfDate);
        }
        final String _tmpTimestamp;
        if (_cursor.isNull(_cursorIndexOfTimestamp)) {
          _tmpTimestamp = null;
        } else {
          _tmpTimestamp = _cursor.getString(_cursorIndexOfTimestamp);
        }
        final String _tmpStatus;
        if (_cursor.isNull(_cursorIndexOfStatus)) {
          _tmpStatus = null;
        } else {
          _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
        }
        final String _tmpType;
        if (_cursor.isNull(_cursorIndexOfType)) {
          _tmpType = null;
        } else {
          _tmpType = _cursor.getString(_cursorIndexOfType);
        }
        final double _tmpLatitude;
        _tmpLatitude = _cursor.getDouble(_cursorIndexOfLatitude);
        final double _tmpLongitude;
        _tmpLongitude = _cursor.getDouble(_cursorIndexOfLongitude);
        final String _tmpPhotoPath;
        if (_cursor.isNull(_cursorIndexOfPhotoPath)) {
          _tmpPhotoPath = null;
        } else {
          _tmpPhotoPath = _cursor.getString(_cursorIndexOfPhotoPath);
        }
        final String _tmpDeviceId;
        if (_cursor.isNull(_cursorIndexOfDeviceId)) {
          _tmpDeviceId = null;
        } else {
          _tmpDeviceId = _cursor.getString(_cursorIndexOfDeviceId);
        }
        _item = new AttendanceEntity(_tmpEmployeeId,_tmpSiteId,_tmpDate,_tmpTimestamp,_tmpStatus,_tmpType,_tmpLatitude,_tmpLongitude,_tmpPhotoPath,_tmpDeviceId);
        _item.id = _cursor.getInt(_cursorIndexOfId);
        final int _tmp;
        _tmp = _cursor.getInt(_cursorIndexOfIsSynced);
        _item.isSynced = _tmp != 0;
        if (_cursor.isNull(_cursorIndexOfSupervisorName)) {
          _item.supervisorName = null;
        } else {
          _item.supervisorName = _cursor.getString(_cursorIndexOfSupervisorName);
        }
        _result.add(_item);
      }
      return _result;
    } finally {
      _cursor.close();
      _statement.release();
    }
  }

  @Override
  public List<LocationLogEntity> getAllLocationLogs() {
    final String _sql = "SELECT * FROM location_logs";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    __db.assertNotSuspendingTransaction();
    final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
    try {
      final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
      final int _cursorIndexOfSupervisorId = CursorUtil.getColumnIndexOrThrow(_cursor, "supervisorId");
      final int _cursorIndexOfSupervisorName = CursorUtil.getColumnIndexOrThrow(_cursor, "supervisorName");
      final int _cursorIndexOfSiteId = CursorUtil.getColumnIndexOrThrow(_cursor, "siteId");
      final int _cursorIndexOfLatitude = CursorUtil.getColumnIndexOrThrow(_cursor, "latitude");
      final int _cursorIndexOfLongitude = CursorUtil.getColumnIndexOrThrow(_cursor, "longitude");
      final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
      final int _cursorIndexOfTimestamp = CursorUtil.getColumnIndexOrThrow(_cursor, "timestamp");
      final List<LocationLogEntity> _result = new ArrayList<LocationLogEntity>(_cursor.getCount());
      while (_cursor.moveToNext()) {
        final LocationLogEntity _item;
        final String _tmpSupervisorId;
        if (_cursor.isNull(_cursorIndexOfSupervisorId)) {
          _tmpSupervisorId = null;
        } else {
          _tmpSupervisorId = _cursor.getString(_cursorIndexOfSupervisorId);
        }
        final String _tmpSupervisorName;
        if (_cursor.isNull(_cursorIndexOfSupervisorName)) {
          _tmpSupervisorName = null;
        } else {
          _tmpSupervisorName = _cursor.getString(_cursorIndexOfSupervisorName);
        }
        final String _tmpSiteId;
        if (_cursor.isNull(_cursorIndexOfSiteId)) {
          _tmpSiteId = null;
        } else {
          _tmpSiteId = _cursor.getString(_cursorIndexOfSiteId);
        }
        final double _tmpLatitude;
        _tmpLatitude = _cursor.getDouble(_cursorIndexOfLatitude);
        final double _tmpLongitude;
        _tmpLongitude = _cursor.getDouble(_cursorIndexOfLongitude);
        final String _tmpStatus;
        if (_cursor.isNull(_cursorIndexOfStatus)) {
          _tmpStatus = null;
        } else {
          _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
        }
        final String _tmpTimestamp;
        if (_cursor.isNull(_cursorIndexOfTimestamp)) {
          _tmpTimestamp = null;
        } else {
          _tmpTimestamp = _cursor.getString(_cursorIndexOfTimestamp);
        }
        _item = new LocationLogEntity(_tmpSupervisorId,_tmpSupervisorName,_tmpSiteId,_tmpLatitude,_tmpLongitude,_tmpStatus,_tmpTimestamp);
        _item.id = _cursor.getInt(_cursorIndexOfId);
        _result.add(_item);
      }
      return _result;
    } finally {
      _cursor.close();
      _statement.release();
    }
  }

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
