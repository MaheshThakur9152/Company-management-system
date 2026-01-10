package com.boss.app;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import java.util.ArrayList;
import java.util.List;

public class AdvanceFragment extends Fragment {

    private NavigationListener navigationListener;
    private RecyclerView recyclerView;
    private AdvanceAdapter adapter;

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
        View view = inflater.inflate(R.layout.fragment_advance, container, false);

        ImageButton backButton = view.findViewById(R.id.back_button);
        backButton.setOnClickListener(v -> {
            if (navigationListener != null) {
                navigationListener.changeView(MainActivity.View.DASHBOARD);
            }
        });

        recyclerView = view.findViewById(R.id.advance_recycler_view);
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));

        List<AdvanceRecord> records = loadMockData();
        adapter = new AdvanceAdapter(records);
        recyclerView.setAdapter(adapter);

        return view;
    }

    private List<AdvanceRecord> loadMockData() {
        List<AdvanceRecord> records = new ArrayList<>();
        records.add(new AdvanceRecord("Suman", "Office", 5000, 2000, 3000));
        records.add(new AdvanceRecord("Gajarabai", "Maruti", 10000, 1000, 9000));
        records.add(new AdvanceRecord("Maruti", "Maruti", 2000, 2000, 0));
        records.add(new AdvanceRecord("Vikram", "Office", 15000, 5000, 10000));
        records.add(new AdvanceRecord("Renu", "Aalim", 500, 0, 500));
        return records;
    }
}
