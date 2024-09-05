const express = require('express');
const app = express();
const mysql = require('mysql2'); // or pg for PostgreSQL
const path = require('path');

// Create a connection to the database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'user',
    password: 'password',
    database: 'sendmygeo'
});

// Middleware to serve static files
app.use(express.static('public'));

// Route to serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
