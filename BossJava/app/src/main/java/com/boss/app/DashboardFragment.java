package com.boss.app;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.LinearLayout;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.cardview.widget.CardView;
import java.util.Calendar;

public class DashboardFragment extends Fragment {

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
        View view = inflater.inflate(R.layout.fragment_dashboard, container, false);

        setupGreeting(view);
        setupQuickActions(view);

        return view;
    }

    private void setupGreeting(View view) {
        TextView greetingText = view.findViewById(R.id.greeting_text);
        Calendar calendar = Calendar.getInstance();
        int hour = calendar.get(Calendar.HOUR_OF_DAY);

        String greeting;
        if (hour >= 0 && hour < 12) {
            greeting = "Good Morning";
        } else if (hour >= 12 && hour < 17) {
            greeting = "Good Afternoon";
        } else {
            greeting = "Good Evening";
        }

        greetingText.setText(greeting);
    }

    private void setupQuickActions(View view) {
        // Voice Command Button
        CardView voiceCommandCard = view.findViewById(R.id.voice_command_card);
        voiceCommandCard.setOnClickListener(v -> {
            if (navigationListener != null) {
                navigationListener.changeView(MainActivity.View.LIVE_VOICE);
            }
        });

        // Attendance Card
        CardView attendanceCard = view.findViewById(R.id.attendance_card);
        attendanceCard.setOnClickListener(v -> {
            if (navigationListener != null) {
                navigationListener.changeView(MainActivity.View.ATTENDANCE);
            }
        });

        // Profit/Loss Card
        CardView profitLossCard = view.findViewById(R.id.profit_loss_card);
        profitLossCard.setOnClickListener(v -> {
            if (navigationListener != null) {
                navigationListener.changeView(MainActivity.View.PROFIT_LOSS);
            }
        });

        // Bills Card
        CardView billsCard = view.findViewById(R.id.bills_card);
        billsCard.setOnClickListener(v -> {
            if (navigationListener != null) {
                navigationListener.changeView(MainActivity.View.BILLS);
            }
        });

        // Advance Card
        CardView advanceCard = view.findViewById(R.id.advance_card);
        advanceCard.setOnClickListener(v -> {
            if (navigationListener != null) {
                navigationListener.changeView(MainActivity.View.ADVANCE);
            }
        });
    }
}
