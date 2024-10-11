const express = require('express');
const app = express();
const mysql = require('mysql2');
const path = require('path');
require('dotenv').config();

// Create a connection to the database
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// Middleware to serve static files
app.use(express.static('public'));

// Route to serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api-key', (req, res) => {
    res.json({ key: process.env.API_KEY });
});

app.get('/name', (req, res) => {
    res.json({ name: process.env.NAME });
});

// API endpoint to get the latest location data
app.get('/latest-location', (req, res) => {
    const query = `SELECT Latitude, Longitude, Timestamp FROM locations ORDER BY Timestamp DESC LIMIT 1`;
    connection.query(query, (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});

//Handled GET request to the '/historics' endpoint
app.get('/historics', (req, res) => {
    const { startDate, endDate } = req.query;

    // Validate that both start date and end date are provided
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Please provide both hora1 and hora2 query parameters.' });
    }
    // Construct SQL query to retrieve locations within the specified data range
    const query = `SELECT * FROM locations WHERE Timestamp BETWEEN '${startDate}' AND '${endDate}'`;
    connection.query(query, (err, results) => {
        if (err) throw err;
        res.json(results)
    });
});

app.get('/location-request', (req, res) => {
    const { lat, lon, radius } = req.query;

    // Validate that all required query parameters are provided
    if (!lat || !lon || !radius) {
        return res.status(400).json({ error: 'Please provide lat, lon, and radius query parameters.' });
    }

    // Construct SQL query to retrieve locations within the specified radius
    const query = `SELECT *, 
        (6371000 * ACOS(COS(RADIANS(${lat})) * COS(RADIANS(Latitude)) * COS(RADIANS(Longitude) - RADIANS(${lon})) + SIN(RADIANS(${lat})) * SIN(RADIANS(Latitude)))) AS distance
        FROM locations
        HAVING distance <= ${radius};
    `;
    connection.query(query, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Simple HTTP server on port 3000 for local development
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});