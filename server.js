const express = require('express');
const app = express();
const mysql = require('mysql2'); // or pg for PostgreSQL
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

app.listen(80, () => {
    console.log('Server running on http://localhost:80');
});

https.createServer({
    key: fs.readFileSync(`/etc/letsencrypt/live/${process.env.DOMAIN_NAME}/privkey.pem`),
    cert: fs.readFileSync(`/etc/letsencrypt/live/${process.env.DOMAIN_NAME}/fullchain.pem`)
}, app).listen(443);
