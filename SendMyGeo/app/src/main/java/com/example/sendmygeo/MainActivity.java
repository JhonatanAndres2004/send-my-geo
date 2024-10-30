package com.example.sendmygeo;

import android.Manifest;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;
import android.os.Handler;
import android.widget.ToggleButton;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.net.DatagramSocket;
import java.net.DatagramPacket;
import java.net.InetAddress;
import java.net.Socket;
import java.io.PrintWriter;
import android.Manifest;
//Bluetooth related imports
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.Handler;
//Frontend imports
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
//Communication related imports
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Set;
//Universal unique identifier that will be user to identify the OBDII
import java.util.UUID;

public class MainActivity extends AppCompatActivity {
    private static final int PERMISSION_REQUEST_LOCATION = 124;
    private ToggleButton startStopButton;
    private ToggleButton protocolButton;
    private TextView latitudeTextView;
    private TextView longitudeTextView;
    private TextView altitudeTextView;
    private TextView timeTextView;
    private FusedLocationProviderClient fusedLocationClient;
    private String locationMessage;
    private LocationCallback locationCallback;
    private LocationRequest locationRequest;
    private Location lastLocation;
    private Handler handler = new Handler();
    private Runnable runnable;
    private boolean isSendingData = true;

    private static final String HOST_NAME_1 = "sendmygeo-k.ddns.net";
    private static final String HOST_NAME_2 = "sendmygeo-j.ddns.net";
    private static final String HOST_NAME_3 = "sendmygeo-e.ddns.net";
    private static final int UDP_PORT = 5000;
    private static final int TCP_PORT = 5001;
    //Define UUID for the OBD and the permission code for bluetooth enable, also  the OBD name from bluetooth section
    private static final UUID OBD2_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    private static final int REQUEST_ENABLE_BT = 1;
    private static final String OBD2_DEVICE_NAME = "OBDII"; // Ajusta al nombre de tu dispositivo
    private BluetoothAdapter bluetoothAdapter;
    private BluetoothSocket socket;
    private OutputStream outputStream;
    private InputStream inputStream;
    private TextView rpmTextView;
    private boolean isRunning = false;
    private TextView speedTextView;
    private static final int BUFFER_SIZE = 1024;
    private static final long READ_TIMEOUT = 2000; // 2 seconds timeout


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        rpmTextView = findViewById(R.id.rpmTextView);
        speedTextView = findViewById(R.id.speedTextView); // Initialize speed TextView

        handler = new Handler();
        startStopButton = findViewById(R.id.startStopButton);
        latitudeTextView = findViewById(R.id.latitudeTextView);
        longitudeTextView = findViewById(R.id.longitudeTextView);
        altitudeTextView = findViewById(R.id.altitudeTextView);
        timeTextView = findViewById(R.id.timeTextView);

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
        createLocationRequest();
        createLocationCallback();
        startStopButton.setOnClickListener(view -> {
            if (isSendingData) {
                stopSendingData();
            } else {
                startSendingData();
            }
        });
        setupBluetooth();
        startSendingData();
        startLocationUpdates();
    }

    private void checkAndRequestPermissions() {
        String[] permissions = {
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.BLUETOOTH,
                Manifest.permission.BLUETOOTH_ADMIN,
                Manifest.permission.BLUETOOTH_CONNECT
        };

        boolean allPermissionsGranted = true;
        for (String permission : permissions) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                allPermissionsGranted = false;
                break;
            }
        }

        if (!allPermissionsGranted) {
            ActivityCompat.requestPermissions(this, permissions, PERMISSION_REQUEST_LOCATION);
        } else {
            startLocationUpdates();
            setupBluetooth();
        }
    }

    private void setupBluetooth() {
        bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        //If there is not a bluetooth module, send an error message of short time length
        if (bluetoothAdapter == null) {
            Toast.makeText(this, "Bluetooth no disponible", Toast.LENGTH_SHORT).show();
            return;
        }
        //if bluetooth is not enabled but module exists, create an Intent (system message) requesting to enable (ACTION_REQUEST_ENABLE) the Bluetooth adapted
        if (!bluetoothAdapter.isEnabled()) {
            Intent enableBtIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED) {
                //This starts an activity, that is, is in charge of the pop up requesting for permission
                startActivityForResult(enableBtIntent, REQUEST_ENABLE_BT);
            }
        } else {
            //If bluetooth is active, start immediately the process
            connectToOBD();
        }
    }

    private void connectToOBD() {
        //Parallel to other processes, the thread connection is created in order to divide execution lines
        new Thread(() -> {
            try {
                // If there is no permission to connect to a device, do nothing
                if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                    ActivityCompat.requestPermissions(this,
                            new String[]{Manifest.permission.BLUETOOTH_CONNECT}, 2);
                }
                //Get bonded bluetoot device and establish the default device to be null
                Set<BluetoothDevice> pairedDevices = bluetoothAdapter.getBondedDevices();
                BluetoothDevice obd2Device = null;
                //in pairedDevices, if a name exists and is equal to OBDII, connect to it and save in the obd2device variable
                for (BluetoothDevice device : pairedDevices) {
                    if (device.getName() != null && device.getName().contains(OBD2_DEVICE_NAME)) {
                        obd2Device = device;
                        break;
                    }
                }
                //Handle if no obd was found
                if (obd2Device == null) {
                    showToast("Dispositivo OBD no encontrado");
                    return;
                }

                // Create RF socket with the obd device
                socket = obd2Device.createRfcommSocketToServiceRecord(OBD2_UUID);
                socket.connect();
                //The getOutputStream() method of Java Socket class returns an output stream for the given socket
                outputStream = socket.getOutputStream();
                //Similar to the getInputStream
                inputStream = socket.getInputStream();

                // Initialize
                Thread.sleep(1000);
                sendCommand("ATZ");     // Reset
                Thread.sleep(1000);
                sendCommand("ATE0");    // Echo off
                Thread.sleep(500);
                sendCommand("ATSP0");   // Automatic protocol
                Thread.sleep(1000);

                showToast("Connected to OBD");
            } catch (Exception e) {
                showToast(e.getMessage());
                closeConnection();
            }
        }).start();
    }

    private int readSpeed() {
        int speed = 0;
        try {
            // OBD command for vehicle speed is 01 0D
            sendCommand("01 0D");
            String response = readResponse();

            if (response.contains("41 0D")) {  // verify valid response
                String[] data = response.split(" ");
                if (data.length >= 3) {
                    // Speed is in the third byte, direct conversion from hex to decimal
                    speed = Integer.parseInt(data[2], 16);
                }
            }
        } catch (Exception e) {
            showToast("Error reading speed: " + e.getMessage());
        }
        return speed;
    }

    private int readRPM() {
        int rpm = 0;
        try {
            //Command to read RPM
            sendCommand("01 0C");
            String response = readResponse();
            //The first two bytes of the responde will always be 41 0C if the engine is running, bytes 2 and 3
            // (starting to count from 0) contain respectively the values of a and b
            if (response.contains("41 0C")) {  // verify valid response
                //Split the response taking as delimiter the space character " "
                String[] data = response.split(" ");
                if (data.length >= 4) {
                    int a = Integer.parseInt(data[2], 16);
                    int b = Integer.parseInt(data[3], 16);
                    //formula obtained from the manual to obtain rpm from 2 bytes, the information was "encoded"
                    rpm = ((a * 256) + b) / 4;
                }
            }
        } catch (Exception e) {
            showToast("Error leyendo RPM: " + e.getMessage());
        }
        return rpm;
    }
    
    private void sendCommand(String command) throws IOException {
        if (outputStream != null) {
            // Clear any existing data in the input buffer
            if (inputStream != null && inputStream.available() > 0) {
                inputStream.skip(inputStream.available());
            }
            // Send the command with carriage return
            outputStream.write((command + "\r").getBytes());
            outputStream.flush();
            // Small delay to ensure command is processed
            try {
                Thread.sleep(200);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    private String readResponse() throws IOException {
        if (inputStream == null) return "";

        StringBuilder response = new StringBuilder();
        byte[] buffer = new byte[BUFFER_SIZE];
        int bytesRead;
        long startTime = System.currentTimeMillis();

        // Wait for data with timeout
        while ((System.currentTimeMillis() - startTime) < READ_TIMEOUT) {
            if (inputStream.available() > 0) {
                bytesRead = inputStream.read(buffer);
                response.append(new String(buffer, 0, bytesRead));

                // Check if we have a complete response
                if (response.toString().contains("\r")) {
                    break;
                }
            }
        }

        // Clean and format the response
        String cleanResponse = response.toString()
                .replace("\r", "")
                .replace("\n", "")
                .trim();

        // Convert response to uppercase and split into lines
        String[] lines = cleanResponse.toUpperCase().split(">");

        // Get the last meaningful response
        for (int i = lines.length - 1; i >= 0; i--) {
            String line = lines[i].trim();
            if (!line.isEmpty() && !line.contains("SEARCHING") && !line.equals("OK")) {
                return line;
            }
        }

        return "";
    }

    private void closeConnection() {
        isRunning = false;
        // if there is an output, input or the socket exists, close it in order to terminate connection
        //Also modifies the boolean isRunning to specify that the connection was killed
        try {
            if (outputStream != null) outputStream.close();
            if (inputStream != null) inputStream.close();
            if (socket != null) socket.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    private void startSendingData() {
        runnable = new Runnable() {
            @Override
            public void run() {
                updateLocationAndSend();
                handler.postDelayed(this, 10000);
            }
        };
        handler.post(runnable);
        isSendingData = true;
    }

    private void stopSendingData() {
        handler.removeCallbacks(runnable);
        isSendingData = false;
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopSendingData();
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
        } else {
            Toast.makeText(MainActivity.this, "It was impossible to obtain the location", Toast.LENGTH_SHORT).show();
        }
    }

    private void updateLocationUI() {
        String latitude = String.format(Locale.getDefault(), "%.6f", lastLocation.getLatitude());
        String longitude = String.format(Locale.getDefault(), "%.6f", lastLocation.getLongitude());
        String altitude = String.format(Locale.getDefault(), "%.2f", lastLocation.getAltitude());

        // Local time to show in screen
        SimpleDateFormat sdfLocal = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
        String localTime = sdfLocal.format(new Date(lastLocation.getTime()));

        // UTC time to send
        SimpleDateFormat sdfUTC = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
        sdfUTC.setTimeZone(TimeZone.getTimeZone("UTC"));
        String utcTime = sdfUTC.format(new Date(lastLocation.getTime()));

        // Speed and rpm data from OBD
        int speed = readSpeed();
        int rpm = readRPM();
        
        latitudeTextView.setText("Latitude: " + latitude);
        longitudeTextView.setText("Longitude: " + longitude);
        altitudeTextView.setText("Altitude: " + altitude + " meters");
        timeTextView.setText("Local Time: " + localTime);
        rpmTextView.setText("RPM: " + rpm);
        speedTextView.setText("Speed: " + speed + " km/h");

        locationMessage = latitude + ";" + longitude + ";" + utcTime + ";" + speed + ";" + rpm;
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
                } catch (Exception e) {
                    e.printStackTrace();
                    showToast("Error sending data via UDP to " + hostName);
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