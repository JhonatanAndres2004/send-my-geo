let map;
let marker;
let polylines = [];
let routeCoordinates = [];
let lastTimestamp = null;
let colorIndex = 0;
const colors = ['#FF0000','#e67e22', '#FFFF00','#2ecc71','#3498db','#8e44ad']; 
let live;
let autocomplete;
let mapThemeId = 'c81689827509e41a';
let circle;

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

function showTab(tab) {
    var realTimeTab = document.getElementById("realtime");
    var historyTab = document.getElementById("history");
    var locationHistoryTab = document.getElementById("location-history");
    
    if (tab === "realtime") {
        realTimeTab.style.visibility = "visible";
        realTimeTab.style.opacity = "1";
        realTimeTab.style.position = "relative";
        historyTab.style.visibility = "hidden";
        historyTab.style.opacity = "0";
        historyTab.style.position = "absolute";
        locationHistoryTab.style.visibility = "hidden";
        locationHistoryTab.style.opacity = "0";
        locationHistoryTab.style.position = "absolute";
        document.getElementById('realtime-button').disabled = true;
        document.getElementById('history-button').disabled = false;
        document.getElementById('location-history-button').disabled = false;
        clearMap();
        initMap();
        startLiveLocation();
    } else if (tab === "history") {
        historyTab.style.visibility = "visible";
        historyTab.style.opacity = "1";
        historyTab.style.position = "relative";
        realTimeTab.style.visibility = "hidden";
        realTimeTab.style.opacity = "0";
        realTimeTab.style.position = "absolute";
        locationHistoryTab.style.visibility = "hidden";
        locationHistoryTab.style.opacity = "0";
        locationHistoryTab.style.position = "absolute";
        document.getElementById('realtime-button').disabled = false;
        document.getElementById('history-button').disabled = true;
        document.getElementById('location-history-button').disabled = false;
        document.getElementById('start-date').value = "";
        document.getElementById('end-date').value = "";
        stopLiveLocation();
    } else if (tab === "location-history") {
        locationHistoryTab.style.visibility = "visible";
        locationHistoryTab.style.opacity = "1";
        locationHistoryTab.style.position = "relative";
        realTimeTab.style.visibility = "hidden";
        realTimeTab.style.opacity = "0";
        realTimeTab.style.position = "absolute";
        historyTab.style.visibility = "hidden";
        historyTab.style.opacity = "0";
        historyTab.style.position = "absolute";
        document.getElementById('realtime-button').disabled = false;
        document.getElementById('history-button').disabled = false;
        document.getElementById('location-history-button').disabled = true;
        stopLiveLocation();
    }
}


//load date picker for start date
flatpickr("#start-date", {
    dateFormat: "Y-m-d H:i",
    maxDate: new Date(),
    mod: "multiple",
    enableTime: true,
    onClose: function(selectedDates, dateStr, instance) {
        date1 = dateStr; // Save the selected date to the variable
        console.log(date1)
    }
});

//load date picker for end date
flatpickr("#end-date", {
    dateFormat: "Y-m-d H:i",
    maxDate: new Date(),
    mod: "multiple",
    enableTime: true,
    onClose: function(selectedDates, dateStr, instance) {
        date2 = dateStr; // Save the selected date to the variable
        console.log(date2)
    }
});

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

    let initialPosition = { lat: 0, lng: 0 };
    
    try {
        const response = await fetch('/latest-location');
        const data = await response.json();
        initialPosition = { lat: parseFloat(data.Latitude), lng: parseFloat(data.Longitude) };  
    } catch (err) {
        console.error('Error fetching latest location:', err);
    }
    
    map = new Map(document.getElementById("map"), {
        zoom: 14,
        center: initialPosition,
        mapId: mapThemeId
    });

    marker = new AdvancedMarkerElement({
        map: map,
        position: initialPosition,
        title: "Current Location",
    });
}

function startLiveLocation() {
    live = setInterval(fetchLatestLocation, 10000);
}

function stopLiveLocation() {
    clearInterval(live);
}

function fetchLatestLocation() {
    fetch('/latest-location')
        .then(response => response.json())
        .then(data => {
            updateLocationDisplay(data);
            updateMapAndRoute(data.Latitude, data.Longitude, data.Timestamp);
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

function roundCoordinate(coord) {
    return Number(coord.toFixed(4));
}

function isSameLocation(coord1, coord2) {
    return roundCoordinate(coord1.lat) === roundCoordinate(coord2.lat) &&
           roundCoordinate(coord1.lng) === roundCoordinate(coord2.lng);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // distance in kilometers
    return distance;
}

function updateMapAndRoute(lat, lng, timestamp) {
    const newPosition = { lat: parseFloat(lat), lng: parseFloat(lng) };
    const newTimestamp = new Date(timestamp);
    
    // Always update HTML display and marker position
    marker.position = newPosition;
    map.panTo(newPosition);
    
    if (routeCoordinates.length === 0) {
        routeCoordinates.push(newPosition);
        lastTimestamp = newTimestamp;
    } else {
        const lastPosition = routeCoordinates[routeCoordinates.length - 1];
        const distance = calculateDistance(lastPosition.lat, lastPosition.lng, newPosition.lat, newPosition.lng);
        const timeDiff = (newTimestamp - lastTimestamp) / (1000 * 60); // time difference in minutes
        
        if (!isSameLocation(newPosition, lastPosition) && distance <= 1 && timeDiff < 1) {
            routeCoordinates.push(newPosition);
            drawPolyline(lastPosition, newPosition);
            colorIndex = (colorIndex + 1) % colors.length; // choose the next color
        } else if (distance > 1 || timeDiff >= 1) {
            // If distance is greater than 1 kilometer or the time difference is greater (or equal) than 1 minute, 
            // Start a new route from that point
            routeCoordinates = [newPosition];
            // Clear the previous drawn polylines
            polylines.forEach(polyline => polyline.setMap(null));
            polylines = [];
            colorIndex = 0; // reset color index
        }

        lastTimestamp = newTimestamp;
    }
}

function updateMapAndRouteHistorics(lat, lng, timestamp) {
    const newPosition = { lat: parseFloat(lat), lng: parseFloat(lng) };
    const newTimestamp = new Date(timestamp);
    
    // Always update HTML display and marker position
    marker.position = newPosition;
    map.panTo(newPosition);
    
    if (routeCoordinates.length === 0) {
        routeCoordinates.push(newPosition);
        lastTimestamp = newTimestamp;
    } else {
        const lastPosition = routeCoordinates[routeCoordinates.length - 1];
        const distance = calculateDistance(lastPosition.lat, lastPosition.lng, newPosition.lat, newPosition.lng);
        const timeDiff = (newTimestamp - lastTimestamp) / (1000 * 60); // time difference in minutes
        
        if (!isSameLocation(newPosition, lastPosition) && distance <= 1 && timeDiff < 1) {
            routeCoordinates.push(newPosition);
            drawPolylineHistorics(lastPosition, newPosition);
        } else if (distance > 1 || timeDiff >= 1) {
            // If distance is greater than 1 kilometer or the time difference is greater (or equal) than 1 minute, 
            // Start a new route from that point
            routeCoordinates = [newPosition];
        }

        lastTimestamp = newTimestamp;
    }
}

function drawPolyline(origin, destination) {
    const path = [
        new google.maps.LatLng(origin.lat, origin.lng),
        new google.maps.LatLng(destination.lat, destination.lng)
    ];

    const polyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: colors[colorIndex],
        strokeOpacity: 1.0,
        strokeWeight: 4
    });

    polyline.setMap(map);
    polylines.push(polyline);
    console.log("Polyline drawn successfully");
}

function drawPolylineHistorics(origin, destination) {
    const path = [
        new google.maps.LatLng(origin.lat, origin.lng),
        new google.maps.LatLng(destination.lat, destination.lng)
    ];

    const polyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#3498db',
        strokeOpacity: 0.8,
        strokeWeight: 3
    });

    polyline.setMap(map);
    polylines.push(polyline);
    console.log("Polyline drawn successfully");
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

function convertToGlobalTime(localTime) {
    const utcDate = new Date(localTime);
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'UTC'
    };
    return utcDate.toLocaleDateString('en-GB', options);
}

function formatDateTime(dateTime) {
    const [date, time] = dateTime.split(', ');
    const [day, month, year] = date.split('/');
    return `${year}-${month}-${day} ${time}`;
}

function checkDates(dateStart, dateEnd) {
    let start = new Date(dateStart);
    let end = new Date(dateEnd);
    return start < end;
}

function clearMap() {
    if (circle) circle.setMap(null);    
    polylines.forEach(polyline => polyline.setMap(null));
    polylines = [];
    routeCoordinates = [];
    lastTimestamp = null;
    colorIndex = 0;
}

document.getElementById('fetch-data').addEventListener('click', () => {
    //Stop fetching data
    clearInterval(live);

    let startDate = document.getElementById('start-date').value;
    let endDate = document.getElementById('end-date').value;

    const correctDates = checkDates(startDate, endDate); //check if start date is earlier than end date
    if (startDate && endDate && correctDates) {
        startDate = convertToGlobalTime(startDate); //Convert date to UTC time zone
        endDate = convertToGlobalTime(endDate); //Convert date to UTC time zone

        date1 = formatDateTime(startDate); // Convert the dates to the desired format YYYY/MM/DD HH:MM:SS
        date2 = formatDateTime(endDate); // Convert the dates to the desired format YYYY/MM/DD HH:MM:SS

        // Clear the map before fetching new data
        clearMap();

        // Construct the URL with encoded date parameters for fetching historical data
        const url = `/historics?starDate=${encodeURIComponent(date1)}&endDate=${encodeURIComponent(date2)}`;

        console.log("Encoded URL:", url);  
        fetch(`/historics?startDate=${encodeURIComponent(date1)}&endDate=${encodeURIComponent(date2)}`) 
            .then(response => response.json())
            .then(data => {
                console.log('Data fetched:', data); //for debugging reasons
                console.log(data.length);
                if (data.length == 0){
                    alert("no routes found")
                } else{// Process the received data 
                    data.forEach(data => { //execute for every object in JSON
                        updateLocationDisplay(data);
                        updateMapAndRouteHistorics(data.Latitude, data.Longitude, data.Timestamp);
    
                       
                    });}
                
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    } else {
        alert("Ensure dates are provided and the start date is earlier than the end date.");
    }
});

document.getElementById('fetch-location').addEventListener("click", () => {
    const radiusInput = document.getElementById('radius-input');
    const radius = parseFloat(radiusInput.value);
    if (radius > 0) {
        geocode({ address: document.getElementById('location-input').value });
    } else {
        radiusInput.value = "";
    }
});

document.getElementById('location-input').addEventListener("keydown", (e) => {
    if (!autocomplete) {
        initializeAutocomplete();
    }
});

async function initializeAutocomplete() {
    const { Autocomplete } = await google.maps.importLibrary("places");
    const input = document.getElementById('location-input');
    autocomplete = new Autocomplete(input);
    autocomplete.bindTo("bounds", map);

    const infowindow = new google.maps.InfoWindow();
    const infowindowContent = document.getElementById("infowindow-content");
    infowindow.setContent(infowindowContent);

    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
            return;
        }
    });
}

async function showGeocodedRoutes() {
    const {Geocoder} = await google.maps.importLibrary("geocoding");
    const geocoder = new Geocoder();
}

function geocode(request) {
    clearInterval(live);
    const geocoder = new google.maps.Geocoder();
    clearMap();
    geocoder
        .geocode(request)
        .then((result) => {
            clearMap();
            const { results } = result;
            const center = results[0].geometry.location;
            const radius = parseFloat(document.getElementById('radius-input').value);
            map.setCenter(center);
            marker.position = center;
            marker.setMap(map);
            circle = new google.maps.Circle({
                strokeColor: "#6d00b3",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#6d00b3",
                fillOpacity: 0.35,
                map,
                center: center,
                radius: radius
            });
            return results;
        })
        .catch((e) => {
            alert("Geocode was not successful for the following reason: " + e);
        });
}

function calculateBoundingBoxArea(south, north, west, east) {
    // Calculate the height of the bounding box (distance between south and north along the same longitude)
    const height = calculateDistance(south, west, north, west);
  
    // Calculate the width of the bounding box (distance between west and east along the same latitude)
    const width = calculateDistance(south, west, south, east);
  
    // Area of the rectangle
    const area = height * width;
  
    return area; // Area in square meters
  }  


document.addEventListener("DOMContentLoaded", function() {
    const darkModeToggle = document.getElementById("darkModeToggle");

    darkModeToggle.addEventListener("change", function() {
        document.body.classList.toggle("dark-mode", darkModeToggle.checked);
        //document.getElementById('title-buttons-and-info').classList.toggle("dark-mode", darkModeToggle.checked);
        mapThemeId = darkModeToggle.checked ? 'a43cc08dd4e3e26d' : 'c81689827509e41a';
        initMap();
    });
});
// Initialize map when the page loads
loadName();
loadMap();
initMap();
showTab("realtime");

