package com.ambe.supervisor.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.ambe.supervisor.R;
import com.ambe.supervisor.models.AttendanceRecord;
import com.ambe.supervisor.models.Employee;

import java.util.List;
import java.util.Map;

public class EmployeeAdapter extends RecyclerView.Adapter<EmployeeAdapter.EmployeeViewHolder> {

    private List<Employee> employees;
    private Map<String, AttendanceRecord> attendanceMap;
    private OnAttendanceActionListener listener;

    public interface OnAttendanceActionListener {
        void onMarkPresent(Employee employee);
        void onUndo(Employee employee);
    }

    public EmployeeAdapter(List<Employee> employees, Map<String, AttendanceRecord> attendanceMap, OnAttendanceActionListener listener) {
        this.employees = employees;
        this.attendanceMap = attendanceMap;
        this.listener = listener;
    }

    public void updateData(List<Employee> employees, Map<String, AttendanceRecord> attendanceMap) {
        this.employees = employees;
        this.attendanceMap = attendanceMap;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public EmployeeViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_employee, parent, false);
        return new EmployeeViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull EmployeeViewHolder holder, int position) {
        Employee employee = employees.get(position);
        AttendanceRecord record = attendanceMap.get(employee.getId());

        holder.tvName.setText(employee.getName());
        holder.tvRole.setText(employee.getBiometricCode() + " • " + employee.getRole());

        boolean isPresent = record != null && "P".equals(record.getStatus());
        boolean isLocked = record != null && record.isLocked();

        if (isPresent) {
            holder.ivAvatar.setBackgroundResource(R.drawable.bg_avatar_present);
            holder.layoutCheckTime.setVisibility(View.VISIBLE);
            holder.tvCheckTime.setText(record.getCheckInTime());
            holder.btnMarkPresent.setVisibility(View.GONE);
            holder.btnUndo.setVisibility(View.VISIBLE);
        } else {
            holder.ivAvatar.setBackgroundResource(R.drawable.bg_avatar_default);
            holder.layoutCheckTime.setVisibility(View.GONE);
            holder.btnMarkPresent.setVisibility(View.VISIBLE);
            holder.btnUndo.setVisibility(View.GONE);
        }

        if (isLocked) {
            holder.layoutLocked.setVisibility(View.VISIBLE);
            holder.layoutControls.setVisibility(View.GONE);
            holder.tvLockedMessage.setVisibility(View.VISIBLE);
        } else {
            holder.layoutLocked.setVisibility(View.GONE);
            holder.layoutControls.setVisibility(View.VISIBLE);
            holder.tvLockedMessage.setVisibility(View.GONE);
        }

        holder.btnMarkPresent.setOnClickListener(v -> listener.onMarkPresent(employee));
        holder.btnUndo.setOnClickListener(v -> listener.onUndo(employee));
    }

    @Override
    public int getItemCount() {
        return employees.size();
    }

    static class EmployeeViewHolder extends RecyclerView.ViewHolder {
        TextView tvName, tvRole, tvCheckTime, tvLockedMessage;
        ImageView ivAvatar;
        LinearLayout layoutCheckTime, layoutLocked, layoutControls;
        Button btnMarkPresent, btnUndo;

        public EmployeeViewHolder(@NonNull View itemView) {
            super(itemView);
            tvName = itemView.findViewById(R.id.tvName);
            tvRole = itemView.findViewById(R.id.tvRole);
            tvCheckTime = itemView.findViewById(R.id.tvCheckTime);
            tvLockedMessage = itemView.findViewById(R.id.tvLockedMessage);
            ivAvatar = itemView.findViewById(R.id.ivAvatar);
            layoutCheckTime = itemView.findViewById(R.id.layoutCheckTime);
            layoutLocked = itemView.findViewById(R.id.layoutLocked);
            layoutControls = itemView.findViewById(R.id.layoutControls);
            btnMarkPresent = itemView.findViewById(R.id.btnMarkPresent);
            btnUndo = itemView.findViewById(R.id.btnUndo);
        }
    }
}
