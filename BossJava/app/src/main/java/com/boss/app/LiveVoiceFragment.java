package com.boss.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.media.MediaPlayer;
import android.media.MediaRecorder;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.Animation;
import android.view.animation.ScaleAnimation;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;

import com.google.android.material.floatingactionbutton.FloatingActionButton;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class LiveVoiceFragment extends Fragment {

    private static final String TAG = "LiveVoiceFragment";
    private static final int PERMISSION_REQ_CODE = 200;
    // Use central ApiService base URL so the voice endpoint works in production
    private static final String BACKEND_URL = ApiService.getBaseApiUrl() + "/voice/process";

    private NavigationListener navigationListener;
    private FloatingActionButton micButton;
    private TextView statusText;
    private View orbView;

    private boolean isRecording = false;
    private MediaRecorder mediaRecorder;
    private File audioFile;

    // For playback
    private MediaPlayer mediaPlayer;

    private final OkHttpClient client = new OkHttpClient();

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
        View view = inflater.inflate(R.layout.fragment_live_voice, container, false);

        ImageButton closeButton = view.findViewById(R.id.close_button);
        closeButton.setOnClickListener(v -> {
            stopRecording(); // Safety
            stopPlayback();
            if (navigationListener != null) {
                navigationListener.changeView(MainActivity.View.DASHBOARD);
            }
        });

        micButton = view.findViewById(R.id.mic_button);
        statusText = view.findViewById(R.id.status_text);
        orbView = view.findViewById(R.id.orb_view);

        micButton.setOnClickListener(v -> {
            if (isRecording) {
                stopRecordingAndProcess();
            } else {
                if (checkPermission()) {
                    startRecording();
                } else {
                    requestPermissions(new String[] { Manifest.permission.RECORD_AUDIO }, PERMISSION_REQ_CODE);
                }
            }
        });

        return view;
    }

    private boolean checkPermission() {
        return ContextCompat.checkSelfPermission(requireContext(),
                Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
            @NonNull int[] grantResults) {
        if (requestCode == PERMISSION_REQ_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startRecording();
            } else {
                Toast.makeText(getContext(), "Permission denied", Toast.LENGTH_SHORT).show();
            }
        }
    }

    private void startRecording() {
        try {
            audioFile = new File(requireContext().getExternalCacheDir(), "voice_req.m4a");

            mediaRecorder = new MediaRecorder();
            mediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            mediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            mediaRecorder.setOutputFile(audioFile.getAbsolutePath());
            mediaRecorder.prepare();
            mediaRecorder.start();

            isRecording = true;
            statusText.setText("Listening...");
            micButton.setImageResource(R.drawable.ic_check); // Change icon to indicate "Done"
            startOrbAnimation();

            // Stop previous playback if any
            stopPlayback();

        } catch (IOException e) {
            Log.e(TAG, "Recording failed", e);
            Toast.makeText(getContext(), "Recording failed", Toast.LENGTH_SHORT).show();
        }
    }

    private void stopRecording() {
        if (mediaRecorder != null) {
            try {
                mediaRecorder.stop();
            } catch (Exception e) {
                // Handle stop failure (e.g. called immediately after start)
            }
            mediaRecorder.release();
            mediaRecorder = null;
        }
        isRecording = false;
        stopOrbAnimation();
        micButton.setImageResource(R.drawable.ic_mic);
    }

    private void stopRecordingAndProcess() {
        stopRecording();
        statusText.setText("Processing...");
        uploadAudio();
    }

    private void uploadAudio() {
        if (audioFile == null || !audioFile.exists())
            return;

        RequestBody requestBody = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("audio", audioFile.getName(),
                        RequestBody.create(audioFile, MediaType.parse("audio/m4a")))
                .build();

        Request request = new Request.Builder()
                .url(BACKEND_URL)
                .post(requestBody)
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                Log.e(TAG, "Upload failed", e);
                new Handler(Looper.getMainLooper()).post(() -> statusText.setText("Connection failed. Try again."));
            }

            @Override
            public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
                if (response.isSuccessful()) {
                    String respStr = response.body().string();
                    try {
                        JSONObject json = new JSONObject(respStr);
                        String aiText = json.optString("response");
                        String audioBase64 = json.optString("audioBase64");

                        new Handler(Looper.getMainLooper()).post(() -> {
                            statusText.setText(aiText); // Show text
                            if (audioBase64 != null && !audioBase64.isEmpty()) {
                                playAudioResponse(audioBase64);
                            }
                        });
                    } catch (Exception e) {
                        Log.e(TAG, "JSON parse error", e);
                    }
                } else {
                    String errorMsg = "Server error: " + response.code();
                    try {
                        String errBody = response.body().string();
                        JSONObject errJson = new JSONObject(errBody);
                        if (errJson.has("error")) {
                            errorMsg = errJson.getString("error");
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Error parsing error response", e);
                    }
                    String finalMsg = errorMsg;
                    new Handler(Looper.getMainLooper())
                            .post(() -> statusText.setText(finalMsg));
                }
            }
        });
    }

    private void playAudioResponse(String base64Audio) {
        try {
            byte[] audioData = Base64.decode(base64Audio, Base64.DEFAULT);
            File tempMp3 = File.createTempFile("response", ".mp3", requireContext().getCacheDir());
            FileOutputStream fos = new FileOutputStream(tempMp3);
            fos.write(audioData);
            fos.close();

            stopPlayback();

            mediaPlayer = new MediaPlayer();
            mediaPlayer.setDataSource(tempMp3.getAbsolutePath());
            mediaPlayer.prepare();
            mediaPlayer.start();

            statusText.setText("Speaking...");
            startOrbAnimation(); // Animate while speaking

            mediaPlayer.setOnCompletionListener(mp -> {
                stopOrbAnimation();
                statusText.setText("Tap mic to speak");
            });

        } catch (IOException e) {
            Log.e(TAG, "Playback failed", e);
        }
    }

    private void stopPlayback() {
        if (mediaPlayer != null) {
            if (mediaPlayer.isPlaying()) {
                mediaPlayer.stop();
            }
            mediaPlayer.release();
            mediaPlayer = null;
            stopOrbAnimation();
        }
    }

    private void startOrbAnimation() {
        ScaleAnimation scaleAnimation = new ScaleAnimation(
                1.0f, 1.2f, 1.0f, 1.2f,
                Animation.RELATIVE_TO_SELF, 0.5f,
                Animation.RELATIVE_TO_SELF, 0.5f);
        scaleAnimation.setDuration(1200);
        scaleAnimation.setRepeatCount(Animation.INFINITE);
        scaleAnimation.setRepeatMode(Animation.REVERSE);
        orbView.startAnimation(scaleAnimation);
    }

    private void stopOrbAnimation() {
        orbView.clearAnimation();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopPlayback();
        stopRecording();
    }
}
