let map;
let marker;
let directionsRenderer;
let directionsService;
let source;
let destination;


function loadMap() {
    fetch('/api-key')
        .then(response => response.json())
        .then(data => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&callback=initMap`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        })
        .catch(err => console.error('Error fetching API key:', err));
}

function loadName() {
    fetch('/name')
        .then(response => response.json())
        .then(data => {
            document.getElementById('name').innerText = data.name;
        })
        .catch(err => console.error('Error fetching name:', err));
}

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    const { DirectionsService, DirectionsRenderer} = await google.maps.importLibrary("routes")


    // Get initial position from HTML
    const initialLat = parseFloat(document.getElementById('latitude').innerText) || 0;
    const initialLng = parseFloat(document.getElementById('longitude').innerText) || 0;
    const initialPosition = { lat: initialLat, lng: initialLng };

    map = new Map(document.getElementById("map"), {
        zoom: 14,
        center: initialPosition,
        mapId: "DEMO_MAP_ID",
    });

    marker = new AdvancedMarkerElement({
        map: map,
        position: initialPosition,
        title: "Current Location",
    });
    directionsRenderer = new DirectionsRenderer();
    directionsService = new DirectionsService();
    directionsRenderer.setMap(map)
    fetchLatestLocation(); 
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
    if (!source){
        source = newPosition;
        calcRoute(source,destination)
    } else{
        destination = newPosition
        console.log(destination)
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

function calcRoute(source,destination){
    let request = {
        origin:source,
        destination:destination,
        travelMode:'DRIVING'
    };
    directionsService.route(request,function(result,status){
        if (status === "OK"){
            directionsRenderer.setDirections(result);
        } else{
            console.error('Route request failed due to' + status)
        }
    });
}

// Initialize map when the page loads
loadName();
loadMap();
setInterval(fetchLatestLocation, 10000);