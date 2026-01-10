package com.boss.app;

import android.app.Dialog;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.app.DownloadManager;
import android.content.Context;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.GridLayout;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.ImageView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.resource.bitmap.CenterCrop;
import com.bumptech.glide.load.resource.bitmap.RoundedCorners;
import com.bumptech.glide.request.RequestOptions;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class AttendanceFragment extends Fragment {

    private RecyclerView recyclerView;
    private DailyAttendanceAdapter adapter;
    private NavigationListener navigationListener;

    private List<EmployeeData> employees = new ArrayList<>();
    private List<AttendanceData> monthlyAttendance = new ArrayList<>();
    private List<SiteData> sites = new ArrayList<>();

    private Calendar selectedDate = Calendar.getInstance();
    private String selectedSiteName = "ALL SITES";
    private boolean isDailyView = true;

    // UI Elements
    private TextView statPresent, statAbsent, statNoData, statTotal;
    private TextView textDateDisplay, headerMonthText;
    private LinearLayout siteChipsContainer, dateStripContainer;
    private LinearLayout btnMonthFilter;
    private TextView btnViewDaily, btnViewMonthly;

    private Handler mainHandler = new Handler(Looper.getMainLooper());
    private SimpleDateFormat monthYearFormat = new SimpleDateFormat("MMM yyyy", Locale.US);
    private SimpleDateFormat fullDateFormat = new SimpleDateFormat("MMMM d, yyyy", Locale.US);
    private SimpleDateFormat dayNameFormat = new SimpleDateFormat("EEE", Locale.US);
    private SimpleDateFormat dayNumFormat = new SimpleDateFormat("d", Locale.US);
    private SimpleDateFormat apiDateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.US);

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
        View view = inflater.inflate(R.layout.fragment_attendance, container, false);

        // Init Views
        ImageButton backButton = view.findViewById(R.id.back_button);
        recyclerView = view.findViewById(R.id.attendance_recycler_view);
        siteChipsContainer = view.findViewById(R.id.site_chips_container);
        dateStripContainer = view.findViewById(R.id.date_strip_container);

        statPresent = view.findViewById(R.id.stat_present);
        statAbsent = view.findViewById(R.id.stat_absent);
        statNoData = view.findViewById(R.id.stat_no_data);
        statTotal = view.findViewById(R.id.stat_total);
        statAbsent = view.findViewById(R.id.stat_absent);
        statNoData = view.findViewById(R.id.stat_no_data);

        textDateDisplay = view.findViewById(R.id.text_date_display);
        headerMonthText = view.findViewById(R.id.header_month_text);
        btnMonthFilter = view.findViewById(R.id.btn_month_filter);

        btnViewDaily = view.findViewById(R.id.btn_view_daily);
        btnViewMonthly = view.findViewById(R.id.btn_view_monthly);

        // Setup Recycler
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));

        // Listeners
        backButton.setOnClickListener(v -> {
            if (navigationListener != null)
                navigationListener.changeView(MainActivity.View.DASHBOARD);
        });

        btnMonthFilter.setOnClickListener(v -> showCalendarModal());

        btnViewDaily.setOnClickListener(v -> setViewMode(true));
        btnViewMonthly.setOnClickListener(v -> setViewMode(false));

        // Initial State
        updateHeaderUI();
        setupDateStrip();
        setViewMode(true);
        loadData();

        return view;
    }

    private void setViewMode(boolean daily) {
        isDailyView = daily;
        if (daily) {
            btnViewDaily.setBackgroundResource(R.drawable.rounded_white);
            btnViewDaily.setTextColor(Color.parseColor("#111827"));
            btnViewDaily.setElevation(dpToPx(4)); // Add shadow

            btnViewMonthly.setBackground(null);
            btnViewMonthly.setTextColor(Color.parseColor("#6B7280"));
            btnViewMonthly.setElevation(0);

            if (adapter != null)
                recyclerView.setVisibility(View.VISIBLE);
        } else {
            btnViewMonthly.setBackgroundResource(R.drawable.rounded_white);
            btnViewMonthly.setTextColor(Color.parseColor("#111827"));
            btnViewMonthly.setElevation(dpToPx(4));

            btnViewDaily.setBackground(null);
            btnViewDaily.setTextColor(Color.parseColor("#6B7280"));
            btnViewDaily.setElevation(0);

            Toast.makeText(getContext(), "Monthly View Coming Soon", Toast.LENGTH_SHORT).show();
        }
    }

    private void updateHeaderUI() {
        headerMonthText.setText(monthYearFormat.format(selectedDate.getTime()));
        textDateDisplay.setText(fullDateFormat.format(selectedDate.getTime()));
    }

    private void setupDateStrip() {
        if (getContext() == null)
            return;
        dateStripContainer.removeAllViews();

        Calendar cal = (Calendar) selectedDate.clone();
        cal.add(Calendar.DAY_OF_YEAR, -2); // Start 2 days back

        for (int i = 0; i < 5; i++) {
            LinearLayout item = new LinearLayout(getContext());
            item.setOrientation(LinearLayout.VERTICAL);
            item.setGravity(Gravity.CENTER);

            // Updated dimensions for squircle card look
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(dpToPx(60), dpToPx(85));
            params.setMargins(dpToPx(6), 0, dpToPx(6), 0);
            item.setLayoutParams(params);

            boolean isSelected = i == 2;
            if (isSelected) {
                item.setBackgroundResource(R.drawable.bg_date_active);
                item.setElevation(dpToPx(4)); // Soften shadow
            } else {
                item.setBackgroundResource(R.drawable.bg_date_inactive);
                item.setElevation(0);
            }

            // Params for text views to ensure they take full width and center text
            LinearLayout.LayoutParams textParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT);

            TextView dayName = new TextView(getContext());
            dayName.setLayoutParams(textParams);
            dayName.setGravity(Gravity.CENTER);
            dayName.setText(dayNameFormat.format(cal.getTime()).toUpperCase());
            dayName.setTextSize(11f);
            dayName.setTextColor(isSelected ? Color.WHITE : Color.parseColor("#9CA3AF"));
            dayName.setTypeface(null, android.graphics.Typeface.BOLD);
            dayName.setPadding(0, dpToPx(8), 0, 0);

            TextView dayNum = new TextView(getContext());
            dayNum.setLayoutParams(textParams);
            dayNum.setGravity(Gravity.CENTER);
            dayNum.setText(dayNumFormat.format(cal.getTime()));
            dayNum.setTextSize(22f);
            dayNum.setTextColor(isSelected ? Color.WHITE : Color.parseColor("#111827"));
            dayNum.setTypeface(null, android.graphics.Typeface.BOLD);
            dayNum.setPadding(0, dpToPx(2), 0, dpToPx(8));

            item.addView(dayName);
            item.addView(dayNum);

            final Calendar itemCal = (Calendar) cal.clone();
            item.setOnClickListener(v -> {
                if (!isSameDay(selectedDate, itemCal)) {
                    selectedDate = itemCal;
                    updateHeaderUI();
                    setupDateStrip();
                    updateDailyData();
                }
            });

            dateStripContainer.addView(item);
            cal.add(Calendar.DAY_OF_YEAR, 1);
        }
    }

    private boolean isSameDay(Calendar c1, Calendar c2) {
        return c1.get(Calendar.YEAR) == c2.get(Calendar.YEAR) &&
                c1.get(Calendar.DAY_OF_YEAR) == c2.get(Calendar.DAY_OF_YEAR);
    }

    private void showCalendarModal() {
        Dialog dialog = new Dialog(getContext());
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setContentView(R.layout.dialog_calendar_filter);
        if (dialog.getWindow() != null)
            dialog.getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
        dialog.show();

        GridLayout grid = dialog.findViewById(R.id.month_grid);
        String[] months = { "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC" };

        if (grid != null) {
            for (int i = 0; i < months.length; i++) {
                TextView monthView = new TextView(getContext());
                monthView.setText(months[i]);
                monthView.setGravity(Gravity.CENTER);
                monthView.setPadding(0, dpToPx(12), 0, dpToPx(12));

                GridLayout.LayoutParams params = new GridLayout.LayoutParams();
                params.width = 0;
                params.height = GridLayout.LayoutParams.WRAP_CONTENT;
                params.columnSpec = GridLayout.spec(GridLayout.UNDEFINED, 1f);
                params.setMargins(dpToPx(4), dpToPx(4), dpToPx(4), dpToPx(4));
                monthView.setLayoutParams(params);

                boolean isSelected = (selectedDate.get(Calendar.MONTH) == i);
                if (isSelected) {
                    monthView.setBackgroundResource(R.drawable.bg_date_active);
                    monthView.setTextColor(Color.WHITE);
                } else {
                    monthView.setBackgroundResource(R.drawable.bg_pending_pill);
                    monthView.setTextColor(Color.parseColor("#9CA3AF"));
                }
                monthView.setTypeface(null, android.graphics.Typeface.BOLD);

                int finalMonthIndex = i;
                monthView.setOnClickListener(v -> {
                    selectedDate.set(Calendar.MONTH, finalMonthIndex);
                    updateHeaderUI();
                    setupDateStrip();
                    loadAttendance();
                    dialog.dismiss();
                });

                grid.addView(monthView);
            }
        }
    }

    private void loadData() {
        ApiService.getSites(getContext(), new ApiService.ApiCallback<List<SiteData>>() {
            @Override
            public void onSuccess(List<SiteData> result) {
                sites = result;
                mainHandler.post(() -> setupSiteChips());
                loadEmployees();
            }

            @Override
            public void onError(String error) {
                loadEmployees();
            }
        });
    }

    private void setupSiteChips() {
        if (getContext() == null || sites == null)
            return;
        siteChipsContainer.removeAllViews();
        addSiteChip("ALL SITES");
        for (SiteData s : sites)
            addSiteChip(s.name);
    }

    private void addSiteChip(String name) {
        TextView chip = (TextView) LayoutInflater.from(getContext()).inflate(R.layout.item_site_chip,
                siteChipsContainer, false);
        chip.setText(name);
        if (name.equalsIgnoreCase(selectedSiteName)) {
            chip.setBackgroundResource(R.drawable.bg_dark_button);
            chip.setTextColor(Color.WHITE);
        } else {
            chip.setBackgroundResource(R.drawable.bg_date_inactive); // White w/ border
            chip.setTextColor(Color.parseColor("#374151"));
        }
        chip.setOnClickListener(v -> {
            selectedSiteName = name;
            setupSiteChips();
            updateDailyData();
        });
        siteChipsContainer.addView(chip);
    }

    private void loadEmployees() {
        ApiService.getEmployees(getContext(), new ApiService.ApiCallback<List<EmployeeData>>() {
            @Override
            public void onSuccess(List<EmployeeData> result) {
                employees = result;
                loadAttendance();
            }

            @Override
            public void onError(String error) {
            }
        });
    }

    private void loadAttendance() {
        int monthNum = selectedDate.get(Calendar.MONTH) + 1;
        int year = selectedDate.get(Calendar.YEAR);
        ApiService.getAttendance(getContext(), String.valueOf(monthNum), String.valueOf(year), null,
                new ApiService.ApiCallback<List<AttendanceData>>() {
                    @Override
                    public void onSuccess(List<AttendanceData> result) {
                        monthlyAttendance = result;
                        mainHandler.post(() -> updateDailyData());
                    }

                    @Override
                    public void onError(String error) {
                        mainHandler.post(() -> updateDailyData());
                    }
                });
    }

    private void updateDailyData() {
        if (getContext() == null)
            return;
        List<DailyAttendanceAdapter.EmployeeAttendancePair> list = new ArrayList<>();
        String target = apiDateFormat.format(selectedDate.getTime());
        Map<String, AttendanceData> map = new HashMap<>();

        if (monthlyAttendance != null) {
            for (AttendanceData a : monthlyAttendance) {
                if (a.date != null && a.date.equals(target))
                    map.put(a.employeeId, a);
            }
        }

        // --- FIXED SITE FILTERING ---
        String targetSiteId = null;
        if (!"ALL SITES".equalsIgnoreCase(selectedSiteName) && sites != null) {
            for (SiteData s : sites) {
                if (s.name != null && s.name.equalsIgnoreCase(selectedSiteName)) {
                    targetSiteId = s.id;
                    break;
                }
            }
        }
        // -----------------------------

        // Identify "Active" employees for this month (those who have at least ONE
        // attendance record)
        java.util.Set<String> activeEmployeeIds = new java.util.HashSet<>();
        if (monthlyAttendance != null) {
            for (AttendanceData a : monthlyAttendance) {
                if (a.employeeId != null)
                    activeEmployeeIds.add(a.employeeId);
            }
        }

        int present = 0, absent = 0;

        for (EmployeeData e : employees) {
            // Filter 1: Must be "Active" in this month
            if (!activeEmployeeIds.contains(e.id))
                continue;

            // Filter 2: Site Filter
            boolean match = false;
            if ("ALL SITES".equalsIgnoreCase(selectedSiteName)) {
                match = true;
            } else {
                if (targetSiteId != null && e.siteId != null && e.siteId.equals(targetSiteId)) {
                    match = true;
                } else if (e.siteId != null && e.siteId.equalsIgnoreCase(selectedSiteName)) {
                    match = true;
                }
            }

            if (match) {
                AttendanceData att = map.get(e.id);
                list.add(new DailyAttendanceAdapter.EmployeeAttendancePair(e, att));

                if (att != null) {
                    if ("P".equals(att.status))
                        present++;
                    else if ("A".equals(att.status))
                        absent++;
                }
            }
        }

        statPresent.setText(String.valueOf(present));
        statAbsent.setText(String.valueOf(absent));

        // Calculate Total Active & No Data
        int totalActive = list.size();
        int noData = totalActive - present - absent;

        statTotal.setText(String.valueOf(totalActive));
        statNoData.setText(String.valueOf(noData));

        if (adapter == null) {
            adapter = new DailyAttendanceAdapter(getContext(), list, this::showPhotoDialog);
            recyclerView.setAdapter(adapter);
        } else {
            adapter.updateData(list);
        }
    }

    private void showPhotoDialog(EmployeeData employee, AttendanceData att) {
        if (getContext() == null)
            return;

        Dialog dialog = new Dialog(getContext());
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setContentView(R.layout.dialog_attendance_photo);

        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT)); // Transparent for rounded
                                                                                            // corners
            dialog.getWindow().setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            dialog.getWindow().setGravity(Gravity.CENTER);
        }

        TextView avatarText = dialog.findViewById(R.id.modal_avatar_text);
        TextView nameText = dialog.findViewById(R.id.modal_employee_name);
        TextView dateSiteText = dialog.findViewById(R.id.modal_date_site);
        ImageView photo = dialog.findViewById(R.id.modal_photo);
        View closeBtn = dialog.findViewById(R.id.close_modal);
        View downloadBtn = dialog.findViewById(R.id.btn_share_download);

        // Populate
        avatarText.setText(employee.getAvatarInitials());
        nameText.setText(employee.name);

        String dateStr = att != null && att.date != null ? att.date : "Unknown Date";
        String siteStr = employee.siteId != null ? employee.siteId : "UNKNOWN";
        // Attempt to display site Name if available?
        // We know the site ID is employee.siteId. If we can map it to name, great.
        // For now, ID is often the name in this mockup data, or numeric.
        // I won't overengineer mapping back to name here unless requested.
        dateSiteText.setText(dateStr + " • " + siteStr);

        if (att != null && att.photoUrl != null && !att.photoUrl.isEmpty()) {
            Glide.with(this)
                    .load(att.photoUrl)
                    .centerCrop()
                    .placeholder(R.color.slate_900)
                    .into(photo);
        } else {
            photo.setImageResource(android.R.color.darker_gray);
        }

        closeBtn.setOnClickListener(v -> dialog.dismiss());
        downloadBtn.setOnClickListener(v -> {
            if (att != null && att.photoUrl != null && !att.photoUrl.isEmpty()) {
                downloadImage(att.photoUrl, employee.name + "_" + att.date + ".jpg");
                dialog.dismiss();
            } else {
                Toast.makeText(getContext(), "No photo to download", Toast.LENGTH_SHORT).show();
            }
        });

        dialog.show();
    }

    private int dpToPx(int dp) {
        return (int) (dp * getResources().getDisplayMetrics().density);
    }

    private void downloadImage(String url, String fileName) {
        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setTitle("Downloading Photo");
            request.setDescription("Saving attendance photo...");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(true);

            DownloadManager downloadManager = (DownloadManager) requireContext()
                    .getSystemService(Context.DOWNLOAD_SERVICE);
            if (downloadManager != null) {
                downloadManager.enqueue(request);
                Toast.makeText(getContext(), "Download started...", Toast.LENGTH_SHORT).show();
            } else {
                Toast.makeText(getContext(), "Download Manager not available", Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {
            Log.e("AttendanceFragment", "Download Error", e);
            Toast.makeText(getContext(), "Download failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        loadData();
    }
}
