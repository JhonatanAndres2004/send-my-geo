package com.example.sendmygeo;

import android.Manifest;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.net.DatagramSocket;
import java.net.DatagramPacket;
import java.net.InetAddress;
import java.net.Socket;
import java.io.PrintWriter;

public class MainActivity extends AppCompatActivity {
    private static final int PERMISSION_REQUEST_LOCATION = 124;
    private Button updateAndSendButton;
    private TextView latitudeTextView;
    private TextView longitudeTextView;
    private TextView altitudeTextView;
    private TextView timeTextView;
    private FusedLocationProviderClient fusedLocationClient;
    private String locationMessage;
    private LocationCallback locationCallback;
    private LocationRequest locationRequest;
    private Location lastLocation;

    private static final String HOST_NAME_1 = "jhrouter.ddns.net";
    private static final String HOST_NAME_2 = "routereduardo.ddns.net";
    private static final String HOST_NAME_3 = "kevinrouter.ddns.net";
    private static final int UDP_PORT = 5000;
    private static final int TCP_PORT = 5001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        updateAndSendButton = findViewById(R.id.updateAndSendButton);
        latitudeTextView = findViewById(R.id.latitudeTextView);
        longitudeTextView = findViewById(R.id.longitudeTextView);
        altitudeTextView = findViewById(R.id.altitudeTextView);
        timeTextView = findViewById(R.id.timeTextView);

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
        createLocationRequest();
        createLocationCallback();

        updateAndSendButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                updateLocationAndSend();
            }
        });

        startLocationUpdates();
    }

    private void createLocationRequest() {
        locationRequest = LocationRequest.create();
        locationRequest.setInterval(1000);
        locationRequest.setFastestInterval(500);
        locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
    }

    private void createLocationCallback() {
        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                if (locationResult == null) {
                    return;
                }
                for (Location location : locationResult.getLocations()) {
                    lastLocation = location;
                }
            }
        };
    }

    private void startLocationUpdates() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.ACCESS_FINE_LOCATION},
                    PERMISSION_REQUEST_LOCATION);
        } else {
            fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, null);
        }
    }

    private void updateLocationAndSend() {
        if (lastLocation != null) {
            updateLocationUI();
            sendUDP(HOST_NAME_1);
            sendUDP(HOST_NAME_2);
            sendUDP(HOST_NAME_3);
            sendTCP(HOST_NAME_1);
            sendTCP(HOST_NAME_2);
            sendTCP(HOST_NAME_3);
        } else {
            Toast.makeText(MainActivity.this, "It was impossible to obtain the location", Toast.LENGTH_SHORT).show();
        }
    }

    private void updateLocationUI() {
        String latitude = String.format(Locale.getDefault(), "%.6f", lastLocation.getLatitude());
        String longitude = String.format(Locale.getDefault(), "%.6f", lastLocation.getLongitude());
        String altitude = String.format(Locale.getDefault(), "%.2f", lastLocation.getAltitude());
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
        String formattedTime = sdf.format(new Date(lastLocation.getTime()));

        latitudeTextView.setText("Latitude: " + latitude);
        longitudeTextView.setText("Longitude: " + longitude);
        altitudeTextView.setText("Altitude: " + altitude + " meters");
        timeTextView.setText("Time: " + formattedTime);

        locationMessage = "The latitude is " + latitude + ". The longitude is " + longitude +
                ". The altitude is " + altitude + " meters. The time was " + formattedTime + ".";
    }

    private String resolveDomainName(String hostName) {
        try {
            InetAddress inetAddress = InetAddress.getByName(hostName);
            return inetAddress.getHostAddress();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private void sendUDP(final String hostName) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                String ipAddress = resolveDomainName(hostName);
                if (ipAddress == null) {
                    showToast("Failed to resolve DNS for UDP: " + hostName);
                    return;
                }
                try {
                    DatagramSocket socket = new DatagramSocket();
                    InetAddress address = InetAddress.getByName(ipAddress);
                    byte[] buf = locationMessage.getBytes();
                    DatagramPacket packet = new DatagramPacket(buf, buf.length, address, UDP_PORT);
                    socket.send(packet);
                    socket.close();
                    showToast("Data sent via UDP to " + hostName + " (" + ipAddress + ")");
                } catch (Exception e) {
                    e.printStackTrace();
                    showToast("Error sending data via UDP to " + hostName);
                }
            }
        }).start();
    }

    private void sendTCP(final String hostName) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                String ipAddress = resolveDomainName(hostName);
                if (ipAddress == null) {
                    showToast("Failed to resolve DNS for TCP: " + hostName);
                    return;
                }
                try {
                    Socket socket = new Socket(ipAddress, TCP_PORT);
                    PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
                    out.println(locationMessage);
                    out.close();
                    socket.close();
                    showToast("Data sent via TCP to " + hostName + " (" + ipAddress + ")");
                } catch (Exception e) {
                    e.printStackTrace();
                    showToast("Error sending data via TCP to " + hostName);
                }
            }
        }).start();
    }

    private void showToast(final String message) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_LOCATION) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startLocationUpdates();
            } else {
                Toast.makeText(this, "No permission to access location", Toast.LENGTH_SHORT).show();
            }
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        fusedLocationClient.removeLocationUpdates(locationCallback);
    }

    @Override
    protected void onResume() {
        super.onResume();
        startLocationUpdates();
    }
}