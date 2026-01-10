package com.boss.app;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;

public class AdvanceAdapter extends RecyclerView.Adapter<AdvanceAdapter.ViewHolder> {

    private List<AdvanceRecord> records;

    public AdvanceAdapter(List<AdvanceRecord> records) {
        this.records = records;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_advance, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        AdvanceRecord record = records.get(position);

        holder.avatarText.setText(record.name.substring(0, Math.min(2, record.name.length())).toUpperCase());
        holder.nameText.setText(record.name);
        holder.siteText.setText(record.site);
        holder.pendingText.setText("₹ " + NumberFormat.getInstance(Locale.getDefault()).format(record.pending));
        holder.recoveredText.setText("Recovered: ₹" + record.recovered);
        holder.totalText.setText("Total: ₹" + record.totalAdvance);

        holder.progressBar.setProgress(record.getRecoveryPercentage());
    }

    @Override
    public int getItemCount() {
        return records.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView avatarText;
        TextView nameText;
        TextView siteText;
        TextView pendingText;
        TextView recoveredText;
        TextView totalText;
        ProgressBar progressBar;

        ViewHolder(View itemView) {
            super(itemView);
            avatarText = itemView.findViewById(R.id.avatar_text);
            nameText = itemView.findViewById(R.id.name_text);
            siteText = itemView.findViewById(R.id.site_text);
            pendingText = itemView.findViewById(R.id.pending_text);
            recoveredText = itemView.findViewById(R.id.recovered_text);
            totalText = itemView.findViewById(R.id.total_text);
            progressBar = itemView.findViewById(R.id.progress_bar);
        }
    }
}
