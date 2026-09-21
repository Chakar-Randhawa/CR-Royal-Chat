package com.royalchat.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    // Voice messages (microphone) and WebRTC calling (camera + microphone)
    // are implemented in the web app using the standard getUserMedia()
    // browser API. Capacitor's WebView does NOT automatically turn that
    // into a real Android runtime-permission prompt — without this
    // bridge, every getUserMedia() call inside the app would silently
    // fail on a real device even though the manifest lists the
    // permissions. This requests the actual Android permission the
    // first time it's needed and then answers the WebView's request.
    private static final int MEDIA_PERMISSION_REQUEST_CODE = 2001;
    private PermissionRequest pendingWebRequest;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        this.bridge.getWebView().setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> handleWebPermissionRequest(request));
            }
        });
    }

    private void handleWebPermissionRequest(PermissionRequest request) {
        List<String> androidPermissionsNeeded = new ArrayList<>();
        for (String resource : request.getResources()) {
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) {
                androidPermissionsNeeded.add(Manifest.permission.CAMERA);
            } else if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                androidPermissionsNeeded.add(Manifest.permission.RECORD_AUDIO);
            }
        }

        List<String> notGranted = new ArrayList<>();
        for (String permission : androidPermissionsNeeded) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                notGranted.add(permission);
            }
        }

        if (notGranted.isEmpty()) {
            request.grant(request.getResources());
        } else {
            pendingWebRequest = request;
            ActivityCompat.requestPermissions(this, notGranted.toArray(new String[0]), MEDIA_PERMISSION_REQUEST_CODE);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == MEDIA_PERMISSION_REQUEST_CODE && pendingWebRequest != null) {
            boolean allGranted = grantResults.length > 0;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            if (allGranted) {
                pendingWebRequest.grant(pendingWebRequest.getResources());
            } else {
                pendingWebRequest.deny();
            }
            pendingWebRequest = null;
        }
    }
}
