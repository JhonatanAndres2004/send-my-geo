function fetchLatestLocation() {
    fetch('/latest-location')
        .then(response => response.json())
        .then(data => {
            document.getElementById('latitude').innerText = data.Latitude;
            document.getElementById('longitude').innerText = data.Longitude;
            document.getElementById('timestamp').innerText =
                `${convertToLocalTime(data.Timestamp)}`;
        })
        .catch(err => console.error('Error fetching latest location:', err));
}

function convertToLocalTime(utcDateString) {
    const localDate = new Date(utcDateString); 
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'America/Bogota'
    };   
    return localDate.toLocaleString('en-GB', options); // Format as needed
}

// Fetch the latest location every second
setInterval(fetchLatestLocation, 1000);

// Initial fetch
fetchLatestLocation();