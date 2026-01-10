package com.boss.app;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

public class ProfitLossFragment extends Fragment {

    private NavigationListener navigationListener;

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
        View view = inflater.inflate(R.layout.fragment_profit_loss, container, false);

        ImageButton backButton = view.findViewById(R.id.back_button);
        backButton.setOnClickListener(v -> {
            if (navigationListener != null) {
                navigationListener.changeView(MainActivity.View.DASHBOARD);
            }
        });

        // Set mock data
        TextView netProfitText = view.findViewById(R.id.net_profit_text);
        TextView totalIncomeText = view.findViewById(R.id.total_income_text);
        TextView totalExpenseText = view.findViewById(R.id.total_expense_text);

        netProfitText.setText("₹ 1,24,500");
        totalIncomeText.setText("₹ 450.0k");
        totalExpenseText.setText("₹ 325.5k");

        return view;
    }
}
