package com.boss.app;

import android.app.Dialog;
import android.content.Context;
import android.graphics.drawable.GradientDrawable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.resource.bitmap.CircleCrop;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AttendanceGridAdapter extends RecyclerView.Adapter<AttendanceGridAdapter.ViewHolder> {

    private List<EmployeeData> employees;
    private Map<String, Map<Integer, AttendanceData>> attendanceMap; // employeeId -> {day -> AttendanceData}
    private int daysInMonth = 31;
    private Context context;
    private String selectedMonth;
    private String selectedSite;

    public AttendanceGridAdapter(Context context, List<EmployeeData> employees,
            List<AttendanceData> attendanceList,
            String selectedMonth, String selectedSite) {
        this.context = context;
        this.employees = employees;
        this.selectedMonth = selectedMonth;
        this.selectedSite = selectedSite;
        this.attendanceMap = buildAttendanceMap(attendanceList);
    }

    private Map<String, Map<Integer, AttendanceData>> buildAttendanceMap(List<AttendanceData> attendanceList) {
        Map<String, Map<Integer, AttendanceData>> map = new HashMap<>();
        for (AttendanceData att : attendanceList) {
            if (!map.containsKey(att.employeeId)) {
                map.put(att.employeeId, new HashMap<>());
            }
            int day = att.getDayOfMonth();
            if (day > 0) {
                map.get(att.employeeId).put(day, att);
            }
        }
        return map;
    }

    public void updateData(List<EmployeeData> employees, List<AttendanceData> attendanceList) {
        this.employees = employees;
        this.attendanceMap = buildAttendanceMap(attendanceList);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_attendance_row, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        if (position == 0) {
            // Header row
            bindHeaderRow(holder);
        } else {
            // Employee row
            EmployeeData employee = employees.get(position - 1);
            bindEmployeeRow(holder, employee);
        }
    }

    private void bindHeaderRow(ViewHolder holder) {
        holder.avatarText.setVisibility(View.GONE);
        holder.employeeName.setText("EMPLOYEE");
        holder.employeeName.setTextSize(11);
        holder.employeeName.setTextColor(context.getResources().getColor(R.color.slate_500, null));
        holder.employeeName.setAllCaps(true);
        holder.employeeSite.setVisibility(View.GONE);

        holder.daysContainer.removeAllViews();

        // Add day headers
        for (int day = 1; day <= daysInMonth; day++) {
            View dayHeader = createDayHeader(day);
            holder.daysContainer.addView(dayHeader);
        }
    }

    private View createDayHeader(int day) {
        LinearLayout dayLayout = new LinearLayout(context);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                dpToPx(80), ViewGroup.LayoutParams.MATCH_PARENT);
        dayLayout.setLayoutParams(params);
        dayLayout.setOrientation(LinearLayout.VERTICAL);
        dayLayout.setGravity(android.view.Gravity.CENTER);
        dayLayout.setBackgroundColor(context.getResources().getColor(R.color.slate_50, null));

        TextView dayText = new TextView(context);
        dayText.setText(String.valueOf(day));
        dayText.setTextSize(12);
        dayText.setTextColor(context.getResources().getColor(R.color.slate_600, null));
        dayText.setTypeface(null, android.graphics.Typeface.BOLD);
        dayLayout.addView(dayText);

        TextView dowText = new TextView(context);
        dowText.setText("MON");
        dowText.setTextSize(9);
        dowText.setTextColor(context.getResources().getColor(R.color.slate_400, null));
        dayLayout.addView(dowText);

        return dayLayout;
    }

    private void bindEmployeeRow(ViewHolder holder, EmployeeData employee) {
        holder.avatarText.setVisibility(View.VISIBLE);
        holder.avatarText.setText(employee.getAvatarInitials());
        holder.employeeName.setText(employee.name);
        holder.employeeName.setTextSize(14);
        holder.employeeName.setTextColor(context.getResources().getColor(R.color.slate_800, null));
        holder.employeeName.setAllCaps(false);
        holder.employeeSite.setVisibility(View.VISIBLE);
        holder.employeeSite.setText("#" + employee.id + " • " + employee.siteId);

        holder.daysContainer.removeAllViews();

        Map<Integer, AttendanceData> empAttendance = attendanceMap.get(employee.id);
        if (empAttendance == null) {
            empAttendance = new HashMap<>();
        }

        // Add attendance cells for each day
        for (int day = 1; day <= daysInMonth; day++) {
            AttendanceData att = empAttendance.get(day);
            View dayCell = createAttendanceCell(employee, day, att);
            holder.daysContainer.addView(dayCell);
        }
    }

    private View createAttendanceCell(EmployeeData employee, int day, AttendanceData att) {
        FrameLayout cellLayout = new FrameLayout(context);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                dpToPx(80), ViewGroup.LayoutParams.MATCH_PARENT);
        cellLayout.setLayoutParams(params);
        cellLayout.setPadding(dpToPx(6), dpToPx(6), dpToPx(6), dpToPx(6));

        if (att == null) {
            // No attendance data - show empty cell
            TextView emptyText = new TextView(context);
            emptyText.setText("-");
            emptyText.setTextColor(context.getResources().getColor(R.color.slate_200, null));
            emptyText.setGravity(android.view.Gravity.CENTER);
            cellLayout.addView(emptyText);
            return cellLayout;
        }

        String status = att.status;

        if ("P".equals(status) && att.photoUrl != null && !att.photoUrl.isEmpty()) {
            // Present with photo
            ImageView photoView = new ImageView(context);
            FrameLayout.LayoutParams photoParams = new FrameLayout.LayoutParams(
                    dpToPx(60), dpToPx(60));
            photoParams.gravity = android.view.Gravity.CENTER;
            photoView.setLayoutParams(photoParams);
            photoView.setScaleType(ImageView.ScaleType.CENTER_CROP);

            // Rounded corners
            GradientDrawable shape = new GradientDrawable();
            shape.setShape(GradientDrawable.RECTANGLE);
            shape.setCornerRadius(dpToPx(8));
            shape.setColor(context.getResources().getColor(R.color.slate_100, null));
            photoView.setBackground(shape);
            photoView.setClipToOutline(true);

            Glide.with(context)
                    .load(att.photoUrl)
                    .placeholder(R.color.slate_200)
                    .error(R.color.slate_300)
                    .into(photoView);

            photoView.setOnClickListener(v -> showPhotoModal(employee, att, day));

            // Camera icon overlay
            ImageView cameraIcon = new ImageView(context);
            FrameLayout.LayoutParams iconParams = new FrameLayout.LayoutParams(
                    dpToPx(10), dpToPx(10));
            iconParams.gravity = android.view.Gravity.CENTER;
            cameraIcon.setLayoutParams(iconParams);
            cameraIcon.setImageResource(R.drawable.ic_camera);
            cameraIcon.setColorFilter(context.getResources().getColor(R.color.white, null));

            cellLayout.addView(photoView);
            cellLayout.addView(cameraIcon);

        } else if ("P".equals(status)) {
            // Present without photo - green checkmark
            ImageView checkView = new ImageView(context);
            FrameLayout.LayoutParams checkParams = new FrameLayout.LayoutParams(
                    dpToPx(24), dpToPx(24));
            checkParams.gravity = android.view.Gravity.CENTER;
            checkView.setLayoutParams(checkParams);
            checkView.setImageResource(R.drawable.ic_check);
            checkView.setColorFilter(context.getResources().getColor(R.color.green_500, null));
            cellLayout.addView(checkView);

        } else if ("A".equals(status) || "Ab".equals(status)) {
            // Absent
            TextView absentText = new TextView(context);
            absentText.setText("Ab");
            absentText.setTextSize(10);
            absentText.setTextColor(context.getResources().getColor(R.color.red_500, null));
            absentText.setTypeface(null, android.graphics.Typeface.BOLD);
            absentText.setGravity(android.view.Gravity.CENTER);
            absentText.setBackgroundResource(R.drawable.rounded_red_bg);
            absentText.setPadding(dpToPx(8), dpToPx(4), dpToPx(8), dpToPx(4));

            FrameLayout.LayoutParams textParams = new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            textParams.gravity = android.view.Gravity.CENTER;
            absentText.setLayoutParams(textParams);
            cellLayout.addView(absentText);

        } else if ("WO".equals(status)) {
            // Week off
            TextView woText = new TextView(context);
            woText.setText("WO");
            woText.setTextSize(10);
            woText.setTextColor(context.getResources().getColor(R.color.slate_300, null));
            woText.setTypeface(null, android.graphics.Typeface.BOLD);
            woText.setGravity(android.view.Gravity.CENTER);

            FrameLayout.LayoutParams textParams = new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            textParams.gravity = android.view.Gravity.CENTER;
            woText.setLayoutParams(textParams);
            cellLayout.addView(woText);

        } else if ("H".equals(status) || "HD".equals(status) || "HL".equals(status)) {
            // Half day / Holiday
            TextView hlText = new TextView(context);
            hlText.setText("HL");
            hlText.setTextSize(10);
            hlText.setTextColor(context.getResources().getColor(R.color.blue_500, null));
            hlText.setTypeface(null, android.graphics.Typeface.BOLD);
            hlText.setGravity(android.view.Gravity.CENTER);
            hlText.setBackgroundResource(R.drawable.rounded_blue_bg);
            hlText.setPadding(dpToPx(8), dpToPx(4), dpToPx(8), dpToPx(4));

            FrameLayout.LayoutParams textParams = new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            textParams.gravity = android.view.Gravity.CENTER;
            hlText.setLayoutParams(textParams);
            cellLayout.addView(hlText);
        }

        return cellLayout;
    }

    private void showPhotoModal(EmployeeData employee, AttendanceData att, int day) {
        Dialog dialog = new Dialog(context, android.R.style.Theme_Black_NoTitleBar_Fullscreen);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setContentView(R.layout.dialog_attendance_photo);

        TextView modalName = dialog.findViewById(R.id.modal_employee_name);
        TextView modalDateSite = dialog.findViewById(R.id.modal_date_site);
        ImageView modalPhoto = dialog.findViewById(R.id.modal_photo);
        ImageButton closeButton = dialog.findViewById(R.id.close_modal);
        LinearLayout gpsVerifiedBadge = dialog.findViewById(R.id.gps_badge); // Updated ID

        modalName.setText(employee.name);
        // Updated text logic if needed, or keep generic
        modalDateSite.setText(day + " " + selectedMonth + " • " + (selectedSite != null ? selectedSite : "All Sites"));

        Glide.with(context)
                .load(att.photoUrl)
                .placeholder(R.color.slate_900)
                .error(R.color.slate_900)
                .into(modalPhoto);

        if (att.latitude != 0 && att.longitude != 0) {
            if (gpsVerifiedBadge != null)
                gpsVerifiedBadge.setVisibility(View.VISIBLE);
        } else {
            if (gpsVerifiedBadge != null)
                gpsVerifiedBadge.setVisibility(View.GONE);
        }

        if (closeButton != null) {
            closeButton.setOnClickListener(v -> dialog.dismiss());
        }

        dialog.show();
    }

    @Override
    public int getItemCount() {
        return employees.size() + 1; // +1 for header row
    }

    private int dpToPx(int dp) {
        float density = context.getResources().getDisplayMetrics().density;
        return Math.round(dp * density);
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView avatarText;
        TextView employeeName;
        TextView employeeSite;
        LinearLayout daysContainer;

        ViewHolder(View itemView) {
            super(itemView);
            avatarText = itemView.findViewById(R.id.avatar_text);
            employeeName = itemView.findViewById(R.id.employee_name);
            employeeSite = itemView.findViewById(R.id.employee_site);
            daysContainer = itemView.findViewById(R.id.attendance_days_container);
        }
    }
}
