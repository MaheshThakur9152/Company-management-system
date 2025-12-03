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
public final class EmployeeDao_Impl implements EmployeeDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<EmployeeEntity> __insertionAdapterOfEmployeeEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAll;

  public EmployeeDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfEmployeeEntity = new EntityInsertionAdapter<EmployeeEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `employees` (`id`,`biometricCode`,`name`,`role`,`siteId`,`photoUrl`,`status`) VALUES (?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final EmployeeEntity entity) {
        if (entity.id == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.id);
        }
        if (entity.biometricCode == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.biometricCode);
        }
        if (entity.name == null) {
          statement.bindNull(3);
        } else {
          statement.bindString(3, entity.name);
        }
        if (entity.role == null) {
          statement.bindNull(4);
        } else {
          statement.bindString(4, entity.role);
        }
        if (entity.siteId == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.siteId);
        }
        if (entity.photoUrl == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.photoUrl);
        }
        if (entity.status == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.status);
        }
      }
    };
    this.__preparedStmtOfDeleteAll = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM employees";
        return _query;
      }
    };
  }

  @Override
  public void insert(final EmployeeEntity employee) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfEmployeeEntity.insert(employee);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void insertAll(final List<EmployeeEntity> employees) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfEmployeeEntity.insert(employees);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void deleteAll() {
    __db.assertNotSuspendingTransaction();
    final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteAll.acquire();
    try {
      __db.beginTransaction();
      try {
        _stmt.executeUpdateDelete();
        __db.setTransactionSuccessful();
      } finally {
        __db.endTransaction();
      }
    } finally {
      __preparedStmtOfDeleteAll.release(_stmt);
    }
  }

  @Override
  public List<EmployeeEntity> getEmployeesBySite(final String siteId) {
    final String _sql = "SELECT * FROM employees WHERE siteId = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (siteId == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, siteId);
    }
    __db.assertNotSuspendingTransaction();
    final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
    try {
      final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
      final int _cursorIndexOfBiometricCode = CursorUtil.getColumnIndexOrThrow(_cursor, "biometricCode");
      final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
      final int _cursorIndexOfRole = CursorUtil.getColumnIndexOrThrow(_cursor, "role");
      final int _cursorIndexOfSiteId = CursorUtil.getColumnIndexOrThrow(_cursor, "siteId");
      final int _cursorIndexOfPhotoUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "photoUrl");
      final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
      final List<EmployeeEntity> _result = new ArrayList<EmployeeEntity>(_cursor.getCount());
      while (_cursor.moveToNext()) {
        final EmployeeEntity _item;
        final String _tmpId;
        if (_cursor.isNull(_cursorIndexOfId)) {
          _tmpId = null;
        } else {
          _tmpId = _cursor.getString(_cursorIndexOfId);
        }
        final String _tmpBiometricCode;
        if (_cursor.isNull(_cursorIndexOfBiometricCode)) {
          _tmpBiometricCode = null;
        } else {
          _tmpBiometricCode = _cursor.getString(_cursorIndexOfBiometricCode);
        }
        final String _tmpName;
        if (_cursor.isNull(_cursorIndexOfName)) {
          _tmpName = null;
        } else {
          _tmpName = _cursor.getString(_cursorIndexOfName);
        }
        final String _tmpRole;
        if (_cursor.isNull(_cursorIndexOfRole)) {
          _tmpRole = null;
        } else {
          _tmpRole = _cursor.getString(_cursorIndexOfRole);
        }
        final String _tmpSiteId;
        if (_cursor.isNull(_cursorIndexOfSiteId)) {
          _tmpSiteId = null;
        } else {
          _tmpSiteId = _cursor.getString(_cursorIndexOfSiteId);
        }
        final String _tmpPhotoUrl;
        if (_cursor.isNull(_cursorIndexOfPhotoUrl)) {
          _tmpPhotoUrl = null;
        } else {
          _tmpPhotoUrl = _cursor.getString(_cursorIndexOfPhotoUrl);
        }
        final String _tmpStatus;
        if (_cursor.isNull(_cursorIndexOfStatus)) {
          _tmpStatus = null;
        } else {
          _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
        }
        _item = new EmployeeEntity(_tmpId,_tmpBiometricCode,_tmpName,_tmpRole,_tmpSiteId,_tmpPhotoUrl,_tmpStatus);
        _result.add(_item);
      }
      return _result;
    } finally {
      _cursor.close();
      _statement.release();
    }
  }

  @Override
  public List<EmployeeEntity> getAllEmployees() {
    final String _sql = "SELECT * FROM employees";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    __db.assertNotSuspendingTransaction();
    final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
    try {
      final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
      final int _cursorIndexOfBiometricCode = CursorUtil.getColumnIndexOrThrow(_cursor, "biometricCode");
      final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
      final int _cursorIndexOfRole = CursorUtil.getColumnIndexOrThrow(_cursor, "role");
      final int _cursorIndexOfSiteId = CursorUtil.getColumnIndexOrThrow(_cursor, "siteId");
      final int _cursorIndexOfPhotoUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "photoUrl");
      final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
      final List<EmployeeEntity> _result = new ArrayList<EmployeeEntity>(_cursor.getCount());
      while (_cursor.moveToNext()) {
        final EmployeeEntity _item;
        final String _tmpId;
        if (_cursor.isNull(_cursorIndexOfId)) {
          _tmpId = null;
        } else {
          _tmpId = _cursor.getString(_cursorIndexOfId);
        }
        final String _tmpBiometricCode;
        if (_cursor.isNull(_cursorIndexOfBiometricCode)) {
          _tmpBiometricCode = null;
        } else {
          _tmpBiometricCode = _cursor.getString(_cursorIndexOfBiometricCode);
        }
        final String _tmpName;
        if (_cursor.isNull(_cursorIndexOfName)) {
          _tmpName = null;
        } else {
          _tmpName = _cursor.getString(_cursorIndexOfName);
        }
        final String _tmpRole;
        if (_cursor.isNull(_cursorIndexOfRole)) {
          _tmpRole = null;
        } else {
          _tmpRole = _cursor.getString(_cursorIndexOfRole);
        }
        final String _tmpSiteId;
        if (_cursor.isNull(_cursorIndexOfSiteId)) {
          _tmpSiteId = null;
        } else {
          _tmpSiteId = _cursor.getString(_cursorIndexOfSiteId);
        }
        final String _tmpPhotoUrl;
        if (_cursor.isNull(_cursorIndexOfPhotoUrl)) {
          _tmpPhotoUrl = null;
        } else {
          _tmpPhotoUrl = _cursor.getString(_cursorIndexOfPhotoUrl);
        }
        final String _tmpStatus;
        if (_cursor.isNull(_cursorIndexOfStatus)) {
          _tmpStatus = null;
        } else {
          _tmpStatus = _cursor.getString(_cursorIndexOfStatus);
        }
        _item = new EmployeeEntity(_tmpId,_tmpBiometricCode,_tmpName,_tmpRole,_tmpSiteId,_tmpPhotoUrl,_tmpStatus);
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
