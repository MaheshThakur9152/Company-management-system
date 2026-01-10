package com.boss.app;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.util.List;

public class AttendanceAdapter extends RecyclerView.Adapter<AttendanceAdapter.ViewHolder> {

    private List<Employee> employees;

    public AttendanceAdapter(List<Employee> employees) {
        this.employees = employees;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_attendance, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Employee employee = employees.get(position);
        holder.avatarText.setText(employee.avatarInitials);
        holder.nameText.setText(employee.name);
        holder.siteText.setText(employee.site);
    }

    @Override
    public int getItemCount() {
        return employees.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView avatarText;
        TextView nameText;
        TextView siteText;

        ViewHolder(View itemView) {
            super(itemView);
            avatarText = itemView.findViewById(R.id.avatar_text);
            nameText = itemView.findViewById(R.id.name_text);
            siteText = itemView.findViewById(R.id.site_text);
        }
    }
}
