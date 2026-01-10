package com.boss.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.core.content.ContextCompat;
import java.util.ArrayList;
import java.util.List;

public class BillsFragment extends Fragment {

    private NavigationListener navigationListener;
    private RecyclerView billsRecyclerView;
    private BillsAdapter billsAdapter;
    private TextView tabUnpaid;
    private TextView tabPaid;
    private TextView totalAmountText;
    private TextView totalLabelText;

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getActivity() instanceof NavigationListener) {
            navigationListener = (NavigationListener) getActivity();
        }
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_bills, container, false);

        ImageButton backButton = view.findViewById(R.id.back_button);
        backButton.setOnClickListener(v -> {
            if (navigationListener != null) {
                navigationListener.changeView(MainActivity.View.DASHBOARD);
            }
        });

        billsRecyclerView = view.findViewById(R.id.bills_recycler_view);
        billsRecyclerView.setLayoutManager(new LinearLayoutManager(getContext()));

        tabUnpaid = view.findViewById(R.id.tab_unpaid);
        tabPaid = view.findViewById(R.id.tab_paid);
        totalAmountText = view.findViewById(R.id.total_amount_text);
        totalLabelText = view.findViewById(R.id.total_label_text);

        setupTabs();
        loadUnpaidBills();

        return view;
    }

    private void setupTabs() {
        tabUnpaid.setOnClickListener(v -> loadUnpaidBills());
        tabPaid.setOnClickListener(v -> loadPaidBills());
    }

    private void updateTabs(boolean isPaidSelected) {
        if (isPaidSelected) {
            tabPaid.setBackgroundResource(R.drawable.rounded_green_bg); // We might need to create this or use existing
                                                                        // color resource
            tabPaid.setTextColor(Color.WHITE);
            // In Android "background: null" isn't exactly clearing, but we can set
            // transparent
            tabUnpaid.setBackgroundResource(0);
            tabUnpaid.setTextColor(ContextCompat.getColor(getContext(), R.color.slate_500));
        } else {
            tabUnpaid.setBackgroundResource(R.drawable.rounded_orange_bg);
            tabUnpaid.setTextColor(Color.WHITE);
            tabPaid.setBackgroundResource(0);
            tabPaid.setTextColor(ContextCompat.getColor(getContext(), R.color.slate_500));
        }
    }

    private void loadUnpaidBills() {
        updateTabs(false); // Update UI immediately
        ApiService.getInvoices(getContext(), new ApiService.ApiCallback<List<InvoiceData>>() {
            @Override
            public void onSuccess(List<InvoiceData> result) {
                List<Bill> bills = new ArrayList<>();
                final double[] totalAmount = { 0 };

                for (InvoiceData invoice : result) {
                    if (!"Paid".equalsIgnoreCase(invoice.status)) {
                        bills.add(new Bill(
                                invoice.id,
                                invoice.invoiceNo,
                                invoice.date,
                                (int) invoice.amount,
                                invoice.status != null ? invoice.status : "Pending",
                                false));
                        totalAmount[0] += invoice.amount;
                    }
                }

                getActivity().runOnUiThread(() -> {
                    billsAdapter = new BillsAdapter(bills);
                    billsRecyclerView.setAdapter(billsAdapter);
                    totalAmountText.setText("₹ " + String.format("%.0f", totalAmount[0]));
                    totalAmountText.setTextColor(ContextCompat.getColor(getContext(), R.color.slate_800)); // Default
                                                                                                           // color
                    totalLabelText.setText("TOTAL OUTSTANDING");
                });
            }

            @Override
            public void onError(String error) {
                getActivity().runOnUiThread(() -> {
                    // Show error or load empty list
                    billsAdapter = new BillsAdapter(new ArrayList<>());
                    billsRecyclerView.setAdapter(billsAdapter);
                    totalAmountText.setText("₹ 0");
                });
            }
        });
    }

    private void loadPaidBills() {
        updateTabs(true);
        ApiService.getInvoices(getContext(), new ApiService.ApiCallback<List<InvoiceData>>() {
            @Override
            public void onSuccess(List<InvoiceData> result) {
                List<Bill> bills = new ArrayList<>();
                final double[] totalAmount = { 0 };

                for (InvoiceData invoice : result) {
                    if ("Paid".equalsIgnoreCase(invoice.status)) {
                        bills.add(new Bill(
                                invoice.id,
                                invoice.invoiceNo,
                                invoice.date,
                                (int) invoice.amount,
                                "Paid",
                                true));
                        totalAmount[0] += invoice.amount;
                    }
                }

                getActivity().runOnUiThread(() -> {
                    billsAdapter = new BillsAdapter(bills);
                    billsRecyclerView.setAdapter(billsAdapter);
                    totalAmountText.setText("₹ " + String.format("%.0f", totalAmount[0]));
                    totalAmountText.setTextColor(Color.parseColor("#059669")); // Green for paid total
                    totalLabelText.setText("TOTAL PAID THIS MONTH");
                });
            }

            @Override
            public void onError(String error) {
                getActivity().runOnUiThread(() -> {
                    // Show error or load empty list
                    billsAdapter = new BillsAdapter(new ArrayList<>());
                    billsRecyclerView.setAdapter(billsAdapter);
                    totalAmountText.setText("₹ 0");
                });
            }
        });
    }
}
