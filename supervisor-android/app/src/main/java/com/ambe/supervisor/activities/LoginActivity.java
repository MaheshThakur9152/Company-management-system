package com.ambe.supervisor.activities;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.ambe.supervisor.R;
import com.ambe.supervisor.api.ApiService;
import com.ambe.supervisor.models.User;

import org.json.JSONArray;
import org.json.JSONObject;

public class LoginActivity extends AppCompatActivity {

    private EditText etUsername, etPassword;
    private Button btnLogin;
    private ProgressBar progressBar;
    private boolean isPasswordVisible = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        etUsername = findViewById(R.id.etUsername);
        etPassword = findViewById(R.id.etPassword);
        btnLogin = findViewById(R.id.btnLogin);
        progressBar = findViewById(R.id.progressBar);
        ImageView btnTogglePassword = findViewById(R.id.btnTogglePassword);

        btnTogglePassword.setOnClickListener(v -> {
            isPasswordVisible = !isPasswordVisible;
            if (isPasswordVisible) {
                etPassword.setInputType(android.text.InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD);
            } else {
                etPassword.setInputType(android.text.InputType.TYPE_CLASS_TEXT | android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD);
            }
            etPassword.setSelection(etPassword.getText().length());
        });

        btnLogin.setOnClickListener(v -> handleLogin());
    }

    private void handleLogin() {
        String username = etUsername.getText().toString().trim();
        String password = etPassword.getText().toString().trim();

        if (username.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please enter username and password", Toast.LENGTH_SHORT).show();
            return;
        }

        setLoading(true);

        ApiService.login(username, password, new ApiService.ApiCallback() {
            @Override
            public void onSuccess(String response) {
                runOnUiThread(() -> {
                    setLoading(false);
                    try {
                        JSONObject json = new JSONObject(response);
                        String userId = json.optString("userId");
                        String name = json.optString("name");
                        String role = json.optString("role");
                        String email = json.optString("email");
                        
                        JSONArray sitesJson = json.optJSONArray("assignedSites");
                        String[] assignedSites = new String[sitesJson != null ? sitesJson.length() : 0];
                        if (sitesJson != null) {
                            for (int i = 0; i < sitesJson.length(); i++) {
                                assignedSites[i] = sitesJson.getString(i);
                            }
                        }

                        User user = new User(userId, name, role, assignedSites, email);
                        
                        // Navigate to Supervisor Screen
                        Intent intent = new Intent(LoginActivity.this, SupervisorActivity.class);
                        intent.putExtra("USER_ID", user.getUserId());
                        intent.putExtra("ASSIGNED_SITE_ID", assignedSites.length > 0 ? assignedSites[0] : "");
                        startActivity(intent);
                        finish();

                    } catch (Exception e) {
                        Toast.makeText(LoginActivity.this, "Error parsing response", Toast.LENGTH_SHORT).show();
                    }
                });
            }

            @Override
            public void onError(String error) {
                runOnUiThread(() -> {
                    setLoading(false);
                    Toast.makeText(LoginActivity.this, "Login Failed: " + error, Toast.LENGTH_SHORT).show();
                });
            }
        });
    }

    private void setLoading(boolean loading) {
        progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
        btnLogin.setEnabled(!loading);
        btnLogin.setAlpha(loading ? 0.7f : 1.0f);
    }
}
