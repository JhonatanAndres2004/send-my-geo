                                                                                                                                                       
let marker;
var map = L.map('map');

async function initMap() {


        // Set initial map view (center and zoom level)
        map.setView([10.981610,-74.804059],14); 
        //Add OpenStreetMap tiles to the map
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, 
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map); // Initiate the map

    // Start fetching new locations after map is initialized
    setInterval(fetchLatestLocation, 10000);
}

function fetchLatestLocation() {
    fetch('/latest-location')
        .then(response => response.json())
        .then(data => {
            updateLocationDisplay(data);
        updateMapPosition(data.Latitude, data.Longitude);
        })
        .catch(err => console.error('Error fetching latest location:', err));
}

function updateLocationDisplay(data) {
    document.getElementById('latitude').innerText = data.Latitude;
    document.getElementById('longitude').innerText = data.Longitude;
    const timestamp = convertToLocalTime(data.Timestamp); // data.Timestamp;
    const [date, time] = timestamp.split(', ');
    document.getElementById('date').innerText = date;
    document.getElementById('time').innerText = time;
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

function updateMapPosition(lat,lng){
        //Replace last location marker with current location marker
        if (marker){
        marker.remove()
        position = L.latLng(parseFloat(lat),parseFloat(lng)) //create latLng object
        marker = L.marker(position).addTo(map) // Add marker
}
        //Add location marker if
        if(!marker){
        position = L.latLng(parseFloat(lat),parseFloat(lng)) //create latLng object
        marker = L.marker(position).addTo(map) // Add marker
}

}
// Initialize map when the page loads
window.onload = initMap;
