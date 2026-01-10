package com.boss.app;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import android.view.View;

public class MainActivity extends AppCompatActivity implements NavigationListener {

    private BottomNavigationView bottomNav;
    private View currentView = View.DASHBOARD;

    public enum View {
        DASHBOARD,
        ATTENDANCE,
        LIVE_VOICE,
        PROFIT_LOSS,
        BILLS,
        ADVANCE
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Hide action bar
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }

        setupBottomNavigation();

        // Load initial fragment
        if (savedInstanceState == null) {
            loadFragment(new DashboardFragment());
        }

        // Notification Code removed (Simulated notification stopped)
    }

    private void setupBottomNavigation() {
        bottomNav = findViewById(R.id.bottom_navigation);
        bottomNav.setOnItemSelectedListener(item -> {
            int itemId = item.getItemId();
            if (itemId == R.id.nav_home) {
                changeView(View.DASHBOARD);
                return true;
            } else if (itemId == R.id.nav_voice) {
                changeView(View.LIVE_VOICE);
                return true;
            } else if (itemId == R.id.nav_attendance) {
                changeView(View.ATTENDANCE);
                return true;
            }
            return false;
        });
    }

    private void loadFragment(Fragment fragment) {
        FragmentManager fragmentManager = getSupportFragmentManager();
        FragmentTransaction transaction = fragmentManager.beginTransaction();
        transaction.replace(R.id.fragment_container, fragment);
        transaction.commit();
    }

    private void loadFragmentWithoutBottomNav(Fragment fragment) {
        bottomNav.setVisibility(android.view.View.GONE);
        loadFragment(fragment);
    }

    @Override
    public void changeView(View view) {
        currentView = view;

        switch (view) {
            case DASHBOARD:
                bottomNav.setVisibility(android.view.View.VISIBLE);
                loadFragment(new DashboardFragment());
                break;
            case ATTENDANCE:
                bottomNav.setVisibility(android.view.View.VISIBLE);
                loadFragment(new AttendanceFragment());
                break;
            case LIVE_VOICE:
                bottomNav.setVisibility(android.view.View.VISIBLE);
                loadFragment(new LiveVoiceFragment());
                break;
            case PROFIT_LOSS:
                loadFragmentWithoutBottomNav(new ProfitLossFragment());
                break;
            case BILLS:
                loadFragmentWithoutBottomNav(new BillsFragment());
                break;
            case ADVANCE:
                loadFragmentWithoutBottomNav(new AdvanceFragment());
                break;
        }
    }

    @Override
    public void onBackPressed() {
        // If not on dashboard, go back to dashboard
        if (currentView != View.DASHBOARD) {
            changeView(View.DASHBOARD);
        } else {
            super.onBackPressed();
        }
    }

    private void showNotification(String name, String time, String siteName) {
        android.widget.FrameLayout container = findViewById(R.id.notification_container);
        if (container == null)
            return;

        container.removeAllViews();
        android.view.View notifView = getLayoutInflater().inflate(R.layout.notification_custom, container, false);

        android.widget.TextView msgText = notifView.findViewById(R.id.notification_message);
        msgText.setText(name + " checked in at " + time + " • " + siteName);

        // Load simple avatar or icon if needed
        // ImageView icon = notifView.findViewById(R.id.notification_icon);

        container.addView(notifView);

        // Animate Slide Down
        container.animate()
                .translationY(0)
                .setDuration(500)
                .setInterpolator(new android.view.animation.DecelerateInterpolator())
                .withEndAction(() -> {
                    // Auto hide after 4 seconds
                    new android.os.Handler().postDelayed(() -> {
                        container.animate()
                                .translationY(-500) // Slide up out of view
                                .setDuration(500)
                                .start();
                    }, 4000);
                })
                .start();
    }
}
