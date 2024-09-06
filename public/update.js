let map;
let marker;
let mapInitialized = false;

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    // Get initial position from HTML
    const initialLat = parseFloat(document.getElementById('latitude').innerText) || 0;
    const initialLng = parseFloat(document.getElementById('longitude').innerText) || 0;
    const initialPosition = { lat: initialLat, lng: initialLng };

    map = new Map(document.getElementById("map"), {
        zoom: 10,
        center: initialPosition,
        mapId: "DEMO_MAP_ID",
    });

    marker = new AdvancedMarkerElement({
        map: map,
        position: initialPosition,
        title: "Current Location",
    });

    mapInitialized = true;
    // Start fetching new locations after map is initialized
    setInterval(fetchLatestLocation, 1000);
}

function fetchLatestLocation() {
    fetch('/latest-location')
        .then(response => response.json())
        .then(data => {
            updateLocationDisplay(data);
            if (mapInitialized) {
                updateMapPosition(data.Latitude, data.Longitude);
            }
        })
        .catch(err => console.error('Error fetching latest location:', err));
}

function updateLocationDisplay(data) {
    document.getElementById('latitude').innerText = data.Latitude;
    document.getElementById('longitude').innerText = data.Longitude;
    const timestamp = convertToLocalTime(data.Timestamp);
    const [date, time] = timestamp.split(', ');
    document.getElementById('date').innerText = date;
    document.getElementById('time').innerText = time;
}

function updateMapPosition(lat, lng) {
    const newPosition = { lat: parseFloat(lat), lng: parseFloat(lng) };
    if (map && marker) {
        map.setCenter(newPosition);
        marker.position = newPosition;
    }
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
    return localDate.toLocaleString('en-GB', options);
}

// Initialize map when the page loads
window.onload = initMap;