const express = require('express');
const app = express();
const mysql = require('mysql2');
const https = require('https');
const http = require('http');  // Added for HTTP redirection
const fs = require('fs');
const path = require('path');
const { connect } = require('http2');
require('dotenv').config();

// Create a connection to the database
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// Get the port from environment variables, default to 443
const port = process.env.PORT || 80;

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
    const{ID,allVehicles} = req.query
    let query
    if(allVehicles == 1){
        query = `(SELECT * FROM locations WHERE ID = 1 ORDER BY Timestamp DESC LIMIT 1)
            UNION ALL
            (SELECT * FROM locations WHERE ID = 2 ORDER BY Timestamp DESC LIMIT 1);`;
            connection.query(query, (err, results) =>{
                if (err) throw err;
                res.json(results);
            });    
    } else {
            query = `SELECT * FROM locations  WHERE ID=${ID} ORDER BY Timestamp DESC LIMIT 1`;
            connection.query(query, (err, results) => {
                if (err) throw err;
                res.json(results[0]);
            });
    }
    
    
});

//Handled GET request to the '/historics' endpoint
app.get('/historics', (req, res) => {
    const { startDate, endDate, ID, allVehicles } = req.query;
    let query

    // Validate that both start date and end date are provided
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Please provide both startDate and endDate query parameters.' });
    }
    if(allVehicles){

    }
    else{
        // Construct SQL query to retrieve locations within the specified data range
    query = `SELECT * FROM locations WHERE ID =${ID} AND Timestamp BETWEEN '${startDate}' AND '${endDate}';`;
    }
    
    connection.query(query, (err, results) => {
        if (err) throw err;
        res.json(results)
    });
});

app.get('/location-request', (req, res) => {
    const { startDate, endDate, lat, lon, radius, ID } = req.query;

    // Validate that all required query parameters are provided
    if (!startDate || !endDate || !lat || !lon || !radius) {
        return res.status(400).json({ error: 'Please provide all required query parameters.' });
    }

    // Construct SQL query to retrieve locations within the specified radius
    const query = `SELECT *, 
        (6371000 * ACOS(COS(RADIANS(${lat})) * COS(RADIANS(Latitude)) * COS(RADIANS(Longitude) - RADIANS(${lon})) + SIN(RADIANS(${lat})) * SIN(RADIANS(Latitude)))) AS distance
        FROM locations
        WHERE ID =${ID} AND Timestamp BETWEEN '${startDate}' AND '${endDate}'
        HAVING distance <= ${radius}
    `;
    connection.query(query, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

if (port === 443) {
    //HTTPS server configuration
    https.createServer({
        key: fs.readFileSync(`/etc/letsencrypt/live/${process.env.DOMAIN_NAME}/privkey.pem`),
        cert: fs.readFileSync(`/etc/letsencrypt/live/${process.env.DOMAIN_NAME}/fullchain.pem`)
    }, app).listen(port, () => {
        
        console.log(`HTTPS Server running on https://localhost:${port}`);
    });
    // HTTP to HTTPS redirection (listen on port 80)
    http.createServer((req, res) => {
        res.writeHead(301, { "Location": `https://${req.headers.host}${req.url}` });
        res.end();
    }).listen(80, () => {
        console.log(`HTTP server redirecting to HTTPS on port 80`);
    });
} else {
    //HTTP server configuration
    https.createServer({
        key: fs.readFileSync(`/etc/letsencrypt/live/${process.env.DOMAIN_NAME}/privkey.pem`),
        cert: fs.readFileSync(`/etc/letsencrypt/live/${process.env.DOMAIN_NAME}/fullchain.pem`)
    }, app)
    app.listen(port, () => {
        
        console.log(`HTTPS Testing Server running on https://localhost:${port}`);
    });
}
