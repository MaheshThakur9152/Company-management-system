package com.boss.app;

import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;
import android.content.Intent;
import android.net.Uri;
import androidx.annotation.NonNull;
import androidx.cardview.widget.CardView;
import androidx.recyclerview.widget.RecyclerView;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;

public class BillsAdapter extends RecyclerView.Adapter<BillsAdapter.ViewHolder> {

    private List<Bill> bills;

    public BillsAdapter(List<Bill> bills) {
        this.bills = bills;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_bill, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Bill bill = bills.get(position);
        holder.vendorText.setText(bill.vendor);
        holder.dateText.setText(bill.date);
        holder.amountText.setText("₹ " + NumberFormat.getInstance(Locale.getDefault()).format(bill.amount));
        holder.statusText.setText(bill.status);

        // Set status colors
        // Set status colors and icons
        if (bill.isPaid) {
            holder.statusText.setBackgroundColor(Color.parseColor("#D1FAE5"));
            holder.statusText.setTextColor(Color.parseColor("#059669"));

            holder.iconBg.setBackgroundResource(R.drawable.circle_green_light_bg); // Assuming this resource exists,
                                                                                   // check name
            holder.iconImage.setImageResource(R.drawable.ic_check);
            holder.iconImage.setColorFilter(Color.parseColor("#059669"));
        } else if (bill.status.equals("Overdue")) {
            holder.statusText.setBackgroundColor(Color.parseColor("#FEE2E2"));
            holder.statusText.setTextColor(Color.parseColor("#DC2626"));

            holder.iconBg.setBackgroundResource(R.drawable.circle_orange_light_bg);
            holder.iconImage.setImageResource(R.drawable.ic_file_text);
            holder.iconImage.setColorFilter(Color.parseColor("#EA580C"));
        } else {
            holder.statusText.setBackgroundColor(Color.parseColor("#FED7AA"));
            holder.statusText.setTextColor(Color.parseColor("#EA580C"));

            holder.iconBg.setBackgroundResource(R.drawable.circle_orange_light_bg);
            holder.iconImage.setImageResource(R.drawable.ic_file_text);
            holder.iconImage.setColorFilter(Color.parseColor("#EA580C"));
        }

        holder.downloadContainer.setOnClickListener(v -> {
            String url = ApiService.getDownloadUrl(bill.id != null ? bill.id : bill.vendor); // Fallback
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            v.getContext().startActivity(intent);
        });
    }

    @Override
    public int getItemCount() {
        return bills.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView vendorText;
        TextView dateText;
        TextView amountText;
        TextView statusText;
        View downloadContainer;
        View iconBg;
        ImageView iconImage;

        ViewHolder(View itemView) {
            super(itemView);
            vendorText = itemView.findViewById(R.id.vendor_text);
            dateText = itemView.findViewById(R.id.date_text);
            amountText = itemView.findViewById(R.id.amount_text);
            statusText = itemView.findViewById(R.id.status_text);
            downloadContainer = itemView.findViewById(R.id.download_container);
            iconBg = itemView.findViewById(R.id.icon_bg);
            iconImage = itemView.findViewById(R.id.icon_image);
        }
    }
}
