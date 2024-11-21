package com.example.sendmygeo;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Build;
import android.os.IBinder;
import android.os.Looper;

import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.util.Set;
import java.util.UUID;

public class LocationService extends Service {

    private static final String CHANNEL_ID = "LocationServiceChannel";
    private FusedLocationProviderClient fusedLocationProviderClient;
    private LocationRequest locationRequest;
    private LocationCallback locationCallback;

    private String locationMessage;
    private BluetoothAdapter bluetoothAdapter;
    private BluetoothSocket socket;
    private OutputStream outputStream;
    private InputStream inputStream;

    private static final String OBD2_DEVICE_NAME = "OBDII"; // Replace with your OBD-II device's name
    private static final UUID OBD2_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    private static final String HOST_NAME_1 = "sendmygeo-k.ddns.net";
    private static final String HOST_NAME_2 = "sendmygeo-j.ddns.net";
    private static final String HOST_NAME_3 = "sendmygeo-e.ddns.net";
    private static final int UDP_PORT = 5000;
    private int vehicleID = 1;
    private boolean isSendingPackets = true;

    @Override
    public void onCreate() {
        super.onCreate();

        fusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(this);
        locationRequest = LocationRequest.create();
        locationRequest.setInterval(10000); // 10 seconds
        locationRequest.setFastestInterval(5000);
        locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);

        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                if (locationResult != null) {
                    for (Location location : locationResult.getLocations()) {
                        if (location != null) {
                            handleLocation(location);
                        }
                    }
                }
            }
        };

        startForeground(1, createNotification());
        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            // TODO: Consider calling
            //    ActivityCompat#requestPermissions
            // here to request the missing permissions, and then overriding
            //   public void onRequestPermissionsResult(int requestCode, String[] permissions,
            //                                          int[] grantResults)
            // to handle the case where the user grants the permission. See the documentation
            // for ActivityCompat#requestPermissions for more details.
            return;
        }
        fusedLocationProviderClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper());

        setupBluetooth();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            // Handle packet sending state
            if (intent.hasExtra("SEND_PACKETS")) {
                isSendingPackets = intent.getBooleanExtra("SEND_PACKETS", true);
            }

            // Handle vehicle ID updates (if included in the same intent)
            if (intent.hasExtra("VEHICLE_ID")) {
                vehicleID = intent.getIntExtra("VEHICLE_ID", 1);
            }
        }

        return START_STICKY;
    }

    private Notification createNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Location Service Channel",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(serviceChannel);
        }

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Location Service Running")
                .setContentText("Sending location and car data to the server...")
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .build();
    }

    private void setupBluetooth() {
        bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        if (bluetoothAdapter == null) {
            return; // Bluetooth not supported
        }

        if (!bluetoothAdapter.isEnabled()) {
            // Log or notify the user to enable Bluetooth
            return;
        }

        connectToOBD();
    }

    private void connectToOBD() {
        new Thread(() -> {
            try {
                if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                    // TODO: Consider calling
                    //    ActivityCompat#requestPermissions
                    // here to request the missing permissions, and then overriding
                    //   public void onRequestPermissionsResult(int requestCode, String[] permissions,
                    //                                          int[] grantResults)
                    // to handle the case where the user grants the permission. See the documentation
                    // for ActivityCompat#requestPermissions for more details.
                    return;
                }
                Set<BluetoothDevice> pairedDevices = bluetoothAdapter.getBondedDevices();
                BluetoothDevice obd2Device = null;

                for (BluetoothDevice device : pairedDevices) {
                    if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                        // TODO: Consider calling
                        //    ActivityCompat#requestPermissions
                        // here to request the missing permissions, and then overriding
                        //   public void onRequestPermissionsResult(int requestCode, String[] permissions,
                        //                                          int[] grantResults)
                        // to handle the case where the user grants the permission. See the documentation
                        // for ActivityCompat#requestPermissions for more details.
                        return;
                    }
                    if (device.getName() != null && device.getName().contains(OBD2_DEVICE_NAME)) {
                        obd2Device = device;
                        break;
                    }
                }

                if (obd2Device == null) {
                    return; // OBD-II device not found
                }

                socket = obd2Device.createRfcommSocketToServiceRecord(OBD2_UUID);
                socket.connect();
                outputStream = socket.getOutputStream();
                inputStream = socket.getInputStream();

                // Initialize OBD-II connection
                sendCommand("ATZ"); // Reset
                Thread.sleep(1000);
                sendCommand("ATE0"); // Echo off
                Thread.sleep(500);
                sendCommand("ATSP0"); // Automatic protocol
                Thread.sleep(1000);
            } catch (Exception e) {
                closeBluetoothConnection();
            }
        }).start();
    }

    private void sendCommand(String command) throws IOException {
        if (outputStream != null) {
            outputStream.write((command + "\r").getBytes());
            outputStream.flush();
        }
    }

    private String readResponse() throws IOException {
        if (inputStream == null) return "";

        StringBuilder response = new StringBuilder();
        byte[] buffer = new byte[1024];
        int bytesRead = inputStream.read(buffer);
        response.append(new String(buffer, 0, bytesRead));

        return response.toString().trim();
    }

    private int readSpeed() {
        try {
            sendCommand("01 0D"); // OBD-II command for speed
            String response = readResponse();
            if (response.contains("41 0D")) {
                String[] data = response.split(" ");
                return Integer.parseInt(data[2], 16); // Speed in km/h
            }
        } catch (Exception ignored) {
        }
        return 0; // Default speed
    }

    private int readRPM() {
        try {
            sendCommand("01 0C"); // OBD-II command for RPM
            String response = readResponse();
            if (response.contains("41 0C")) {
                String[] data = response.split(" ");
                int a = Integer.parseInt(data[2], 16);
                int b = Integer.parseInt(data[3], 16);
                return ((a * 256) + b) / 4;
            }
        } catch (Exception ignored) {
        }
        return 0; // Default RPM
    }

    private void handleLocation(Location location) {
        String latitude = String.format(Locale.getDefault(), "%.6f", location.getLatitude());
        String longitude = String.format(Locale.getDefault(), "%.6f", location.getLongitude());
        String altitude = String.format(Locale.getDefault(), "%.2f", location.getAltitude());

        // Local time
        SimpleDateFormat sdfLocal = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
        String localTime = sdfLocal.format(new Date(location.getTime()));

        // UTC time
        SimpleDateFormat sdfUTC = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
        sdfUTC.setTimeZone(TimeZone.getTimeZone("UTC"));
        String utcTime = sdfUTC.format(new Date(location.getTime()));

        int speed = readSpeed();
        int rpm = readRPM();

        locationMessage = latitude + ";" + longitude + ";" + utcTime + ";" + speed + ";" + rpm + ";" + vehicleID;

        // Send the updated data to MainActivity
        sendLocationUpdateToUI(latitude, longitude, localTime, speed, rpm, vehicleID);

        sendUDP(HOST_NAME_1);
        sendUDP(HOST_NAME_2);
        sendUDP(HOST_NAME_3);
    }

    private void sendUDP(final String hostName) {
        if (!isSendingPackets) {
            return; // Don't send packets if the service is stopped
        }

        new Thread(() -> {
            try {
                InetAddress address = InetAddress.getByName(hostName);
                DatagramSocket socket = new DatagramSocket();
                byte[] buf = locationMessage.getBytes();
                DatagramPacket packet = new DatagramPacket(buf, buf.length, address, UDP_PORT);
                socket.send(packet);
                socket.close();
            } catch (Exception ignored) {
            }
        }).start();
    }

    private void sendLocationUpdateToUI(String latitude, String longitude, String utcTime, int speed, int rpm, int vehicleID) {
        Intent intent = new Intent("com.example.sendmygeo.LOCATION_UPDATE");

        // Add the data to the intent
        intent.putExtra("LATITUDE", latitude);
        intent.putExtra("LONGITUDE", longitude);
        intent.putExtra("TIME", utcTime);
        intent.putExtra("SPEED", String.valueOf(speed));
        intent.putExtra("RPM", String.valueOf(rpm));
        intent.putExtra("VEHICLE_ID", String.valueOf(vehicleID));

        // Send the broadcast to update the UI in MainActivity
        sendBroadcast(intent);
    }


    private void closeBluetoothConnection() {
        try {
            if (outputStream != null) outputStream.close();
            if (inputStream != null) inputStream.close();
            if (socket != null) socket.close();
        } catch (IOException ignored) {
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopForeground(true); // Stop the foreground service and remove the notification
        fusedLocationProviderClient.removeLocationUpdates(locationCallback);
        closeBluetoothConnection(); // Close Bluetooth connection if active
        isSendingPackets = false; // Stop sending packets if the service is destroyed
    }


    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
