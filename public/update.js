function fetchLatestLocation() {
    fetch('/latest-location')
        .then(response => response.json())
        .then(data => {
            document.getElementById('latitude').innerText = data.Latitude;
            document.getElementById('longitude').innerText = data.Longitude;
            document.getElementById('timestamp').innerText =
                `${data.Timestamp.substring(0, 10)}, ${data.Timestamp.substring(11, 19)}`;
        })
        .catch(err => console.error('Error fetching latest location:', err));
}

// Fetch the latest location every 5 seconds
setInterval(fetchLatestLocation, 1000);

// Initial fetch
fetchLatestLocation();