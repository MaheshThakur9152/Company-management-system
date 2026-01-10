package com.boss.app;

import android.content.Context;
import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.resource.bitmap.CenterCrop;
import com.bumptech.glide.load.resource.bitmap.RoundedCorners;
import com.bumptech.glide.request.RequestOptions;

import java.util.List;

public class DailyAttendanceAdapter extends RecyclerView.Adapter<DailyAttendanceAdapter.ViewHolder> {

    private Context context;
    private List<EmployeeAttendancePair> dataList;
    private OnItemClickListener listener;

    public interface OnItemClickListener {
        void onItemClick(EmployeeData employee, AttendanceData attendance);
    }

    public static class EmployeeAttendancePair {
        public EmployeeData employee;
        public AttendanceData attendance;

        public EmployeeAttendancePair(EmployeeData employee, AttendanceData attendance) {
            this.employee = employee;
            this.attendance = attendance;
        }
    }

    public DailyAttendanceAdapter(Context context, List<EmployeeAttendancePair> dataList,
            OnItemClickListener listener) {
        this.context = context;
        this.dataList = dataList;
        this.listener = listener;
    }

    public void updateData(List<EmployeeAttendancePair> newData) {
        this.dataList = newData;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_attendance_card, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        EmployeeAttendancePair item = dataList.get(position);
        EmployeeData emp = item.employee;
        AttendanceData att = item.attendance;

        // Header
        holder.avatarText.setText(emp.getAvatarInitials());
        holder.nameText.setText(emp.name);
        holder.siteText.setText(emp.siteId != null ? emp.siteId : "UNKNOWN");
        holder.roleText.setText(emp.role != null ? emp.role : "STAFF");

        // Logic
        if (att != null && "P".equals(att.status)) {
            // PRESENT
            holder.statusPill.setText("PRESENT");
            holder.statusPill.setTextColor(Color.parseColor("#15803D"));
            holder.statusPill.setBackgroundResource(R.drawable.bg_status_present);

            holder.photoView.setVisibility(View.VISIBLE);
            holder.noLogLayout.setVisibility(View.GONE);
            holder.overlaysLayout.setVisibility(View.VISIBLE);

            if (att.photoUrl != null && !att.photoUrl.isEmpty()) {
                RequestOptions options = new RequestOptions().transform(new CenterCrop(),
                        new RoundedCorners(dpToPx(20)));
                Glide.with(context)
                        .load(att.photoUrl)
                        .apply(options)
                        .into(holder.photoView);
            } else {
                // Marked but no photo?
                // Revert to "Marked without photo" specialized UI?
                // Or just show green pill and NO photo?
                // For now, let's keep it consistent: if present, show photo placeholder if url
                // missing
                holder.photoView.setImageResource(android.R.color.darker_gray);
                // Alternatively, switch to "NO LOG FOUND" style but with Present text?
                // User requirement: "if not data means no absent or present... add no data
                // found".
                // So if data EXISTS ("P"), show it.
            }

            // Overlays
            // holder.timeText.setText(...);

        } else if (att != null && "A".equals(att.status)) {
            // ABSENT
            holder.statusPill.setText("ABSENT");
            holder.statusPill.setTextColor(Color.parseColor("#B91C1C"));
            holder.statusPill.setBackgroundResource(R.drawable.bg_status_absent);

            // Absent usually means "No Log" visually in terms of photo?
            // Or explicitly "Absent" state.
            // Screenshot 1 has "Absent 0".
            // Assuming we show "NO LOG FOUND" image but with ABSENT pill.
            holder.photoView.setVisibility(View.GONE);
            holder.noLogLayout.setVisibility(View.VISIBLE);
            holder.overlaysLayout.setVisibility(View.GONE);

        } else {
            // NO DATA -> PENDING
            holder.statusPill.setText("PENDING");
            holder.statusPill.setTextColor(Color.parseColor("#6B7280"));
            holder.statusPill.setBackgroundResource(R.drawable.bg_pending_pill);

            holder.photoView.setVisibility(View.GONE);
            holder.noLogLayout.setVisibility(View.VISIBLE);
            holder.overlaysLayout.setVisibility(View.GONE);
        }

        holder.itemView.setOnClickListener(v -> {
            if (listener != null)
                listener.onItemClick(emp, att);
        });
    }

    @Override
    public int getItemCount() {
        return dataList.size();
    }

    private int dpToPx(int dp) {
        return (int) (dp * context.getResources().getDisplayMetrics().density);
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView avatarText, nameText, siteText, roleText, statusPill;
        ImageView photoView;
        LinearLayout noLogLayout, overlaysLayout;
        ImageButton addBtn;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            avatarText = itemView.findViewById(R.id.card_avatar_text);
            nameText = itemView.findViewById(R.id.card_employee_name);
            siteText = itemView.findViewById(R.id.card_site_name);
            roleText = itemView.findViewById(R.id.card_role);
            statusPill = itemView.findViewById(R.id.card_status_pill);
            photoView = itemView.findViewById(R.id.card_photo);
            noLogLayout = itemView.findViewById(R.id.card_no_log_layout);
            overlaysLayout = itemView.findViewById(R.id.card_overlays);
            addBtn = itemView.findViewById(R.id.card_add_btn);
        }
    }
}
