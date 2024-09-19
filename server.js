const express = require('express');
const app = express();
const mysql = require('mysql2');
const https = require('https');
const http = require('http');  // Added for HTTP redirection
const fs = require('fs');
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

// HTTPS server configuration
https.createServer({
    key: fs.readFileSync(`/etc/letsencrypt/live/${process.env.DOMAIN_NAME}/privkey.pem`),
    cert: fs.readFileSync(`/etc/letsencrypt/live/${process.env.DOMAIN_NAME}/fullchain.pem`)
}, app).listen(443, () => {
    
    console.log('HTTPS Server running on https://localhost:443');
});

// HTTP to HTTPS redirection (listen on port 80)
http.createServer((req, res) => {
    res.writeHead(301, { "Location": `https://${req.headers.host}${req.url}` });
    res.end();
}).listen(80, () => {
    console.log('HTTP server redirecting to HTTPS on port 80');
});
