let map;
let marker;
let polylines = [];
let routeCoordinates = [];
let lastTimestamp = null;
let colorIndex = 0;
const colors = ['#FF0000']; 
let live;
let autocomplete;
let mapThemeId = 'a43cc08dd4e3e26d';
let circle;
let infowindows = [];
let infoWindowMarkers = [];
let polylineColor = '#ff7008';
let popUpMenu=document.getElementById('emergent-pop-up');
let locationHistoryTab = document.getElementById("location-history");
let closeButtonContainer=document.getElementById("close-popup-container")
let closeButton=document.getElementById("close-popup")
let slider = document.getElementById('slider');
let valueSlider = document.getElementById('valueSlider')
let info= []
let previous;
let played = 0;
let infoWindow;
let infoWindowMarker;
let pin;
slider.value = 0

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    iconColor:"#6e00b3",
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    }
});


const style = document.createElement('style');
style.textContent = `
    .custom-toast-popup {
        padding: 10px 20px;
    }
    .custom-toast-title {
        font-size: 14px;
    }
    .swal2-timer-progress-bar {
        background: #6e00b3;
    }
`;
document.head.appendChild(style);
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
    var slider = document.getElementById("reproducer");
    console.log(tab);
    if (tab === "realtime") {
        popUpMenu.style.visibility='hidden'
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
        slider.style.visibility = "hidden";
        slider.style.opacity = "0";
        slider.style.position = "absolute";
        clearMap();
        initMap();
        startLiveLocation();
        console.log("Realtime tab selected");
    } else if (tab === "history") {
        historyTab.style.visibility = "visible";
        historyTab.style.opacity = "1";
        historyTab.style.position = "relative";
        realTimeTab.style.visibility = "hidden";
        realTimeTab.style.opacity = "0";
        realTimeTab.style.position = "absolute";
        document.getElementById('realtime-button').disabled = false;
        document.getElementById('history-button').disabled = true;
        document.getElementById('start-date').value = "";
        document.getElementById('end-date').value = "";
        slider.style.visibility = "hidden";
        slider.style.opacity = "0";
        slider.style.position = "absolute";
  
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
        slider.style.visibility = "hidden";
        slider.style.opacity = "0";
        slider.style.position = "absolute";
        document.getElementById('realtime-button').disabled = false;
        document.getElementById('history-button').disabled = false;
        document.getElementById('location-history-button').disabled = true;
        stopLiveLocation();
    } else if (tab === "slider"){
        locationHistoryTab.style.visibility = "hidden";
        locationHistoryTab.style.opacity = "0";
        locationHistoryTab.style.position = "absolute";
        realTimeTab.style.visibility = "hidden";
        realTimeTab.style.opacity = "0";
        realTimeTab.style.position = "absolute";
        historyTab.style.visibility = "hidden";
        historyTab.style.opacity = "0";
        historyTab.style.position = "absolute";
        slider.style.visibility = "visible";
        slider.style.opacity = "1";
        slider.style.position = "relative";
        popUpMenu.style.visibility='visible';
        document.getElementById('stopButton').style.visibility="visible"
        document.getElementById('realtime-button').disabled = false;
        document.getElementById('history-button').disabled = false;
        document.getElementById('location-history-button').disabled = true
    }
}

// Update the valueSlider when the slider changes
slider.oninput = function() {
    this.style.setProperty('--value', `${(this.value - this.min) * 100 / (this.max - this.min)}%`);
    routeCoordinates=[];
    if (previous == null) {
        previous = this.value;
    }
    polylines.forEach(polyline => polyline.setMap(null));
    polylines = [];
    //valueSlider.innerHTML = this.value;  // Display the current slider value
    let current = parseInt(this.value);  // Parse the slider value as an integer
    let prevValue = parseInt(previous);  // Previous value as an integer

    // Ensure the current value exists in the data (e.g., `info`)
    if (info[current]) {

        // Case when moving forward (increasing the slider value)
        if (current) { // > prevValue
            for (let i= 0;i<current -1; i++){
                updateMapAndRouteLocations(info[i].lat, info[i].lng, info[i].Timestamp, true);
                setInfoWindow(info[i].lat, info[i].lng, info[i].Timestamp);
                
            }
            
        // Case when moving backward (decreasing the slider value)
        } //else if (current <= prevValue) {
        //     if (polylines[current-1]) { //infoWindowMarkers[current-1] && 
        //         // Remove marker and polyline from the map
        //         //infoWindowMarkers[current-1].setMap(null);
        //         polylines[current-1].setMap(null);

        //         // Optionally, you can remove them from the arrays if needed
        //         //infoWindowMarkers.pop();
        //         polylines.pop();
                
        //     }
        // }

        // Update previous value for the next input
        previous = current;

    }
};

function playSlider() {
    const slider = document.getElementById('slider');
  
    // Set initial value for the custom property to reflect the slider position
    slider.style.setProperty('--value', `${(slider.value - slider.min) * 100 / (slider.max - slider.min)}%`);
    if (played == 0){
        let slider = document.getElementById('slider');
        let max = slider.max;  // Max value of the slider
    
        // Start the interval to update the slider value every 500ms (or any speed you like)
        playInterval = setInterval(() => {
            let currentValue = parseInt(slider.value);
            if (currentValue < max) {
                slider.value = currentValue + 1; // Increment slider value
                slider.oninput();  // Trigger the oninput function to update map locations
            } else {
                slider.value = 0;
                slider.style.setProperty('--value', `${(slider.value - slider.min) * 100 / (slider.max - slider.min)}%`);
                clearInterval(playInterval);  // Stop when the slider reaches the max value
                played = 0;
                infoWindow.close
                infoWindowMarker.setMap(null);
                toggleButton.classList.remove('pause');
                toggleButton.classList.add('play');
                toggleButton.innerHTML = '▷'; // Play icon and text
            }
        }, 1000);  // Adjust the time interval for the speed (500ms = 0.5 seconds)
        played = 1;
    }

}

function stopSlider(){
    clearInterval(playInterval)
}


//load date picker for start date
let startdate = flatpickr("#start-date", {
    dateFormat: "Y-m-d H:i",
    maxDate: new Date(),
    mod: "multiple",
    enableTime: true,
    onClose: function(selectedDates, dateStr, instance) {
        dateMin = dateStr; // Save the selected date to the variable
        console.log(dateMin)
        enddate.set('minDate',dateStr)
    }
});


//load date picker for end date
let enddate = flatpickr("#end-date", {
    dateFormat: "Y-m-d H:i",
    maxDate: new Date(),
    mod: "multiple",
    enableTime: true,
    onClose: function(selectedDates, dateStr, instance) {
        date2 = dateStr; // Save the selected date to the variable
        console.log(date2)
        startdate.set('maxDate',dateStr)
    }
});

function loadName() {
    fetch('/name')
        .then(response => response.json())
        .then(data => {
            document.getElementById('name').innerText = `SendMyGeo (${data.name})`;
        })
        .catch(err => console.error('Error fetching name:', err));
}

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

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
        mapId: mapThemeId,
        mapTypeControl: false,

    });

    marker = new AdvancedMarkerElement({
        map: map,
        position: initialPosition,
        title: "Current Location",
    });
    
    pin = new PinElement({
        scale: 0.8,
        background: polylineColor,
        borderColor: 'white',
        glyph: '!',
        glyphColor: 'white'
    });

    infoWindowMarker = new AdvancedMarkerElement({
        map: map,
        //position: initialPosition,
        content: pin.element
    });

    infoWindow = new google.maps.InfoWindow({
        content: "",
    });
}

function startLiveLocation() {
    console.log('Starting live location updates...');
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
            console.log(data.Latitude, data.Longitude, data.Timestamp);
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
            //colorIndex = (colorIndex + 1) % colors.length; // choose the next color
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

function updateMapAndRouteHistorics(lat, lng, timestamp, searchByLocation = false) {
    const newPosition = { lat: parseFloat(lat), lng: parseFloat(lng) };
    const newTimestamp = new Date(timestamp);
    const allInfo ={lat:parseFloat(lat),lng:parseFloat(lng),Timestamp:timestamp}
    if (!searchByLocation) {
        marker.position = newPosition;
        map.panTo(newPosition);
    }
    
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
            info.push(allInfo);
        } else if (distance > 1 || timeDiff >= 1) {
            // If distance is greater than 1 kilometer or the time difference is greater (or equal) than 1 minute, 
            // Start a new route from that point
            routeCoordinates = [newPosition];
            info.push(allInfo);
        }
        
        //console.log(info)
        document.getElementById('slider').max = info.length
        lastTimestamp = newTimestamp;
    }
}


function updateMapAndRouteLocations(lat, lng, timestamp, searchByLocation = false) {
    const newPosition = { lat: parseFloat(lat), lng: parseFloat(lng) };
    const newTimestamp = new Date(timestamp);
    //const allInfo ={lat:parseFloat(lat),lng:parseFloat(lng),Timestamp:timestamp}
    if (!searchByLocation) {
        marker.position = newPosition;
        map.panTo(newPosition);
    }
    
    if (routeCoordinates.length === 0) {
        routeCoordinates.push(newPosition);
        lastTimestamp = newTimestamp;
    } else {
        const lastPosition = routeCoordinates[routeCoordinates.length - 1];
        const distance = calculateDistance(lastPosition.lat, lastPosition.lng, newPosition.lat, newPosition.lng);
        const timeDiff = (newTimestamp - lastTimestamp) / (1000 * 60); // time difference in minutes
        
        if (!isSameLocation(newPosition, lastPosition) && distance <= 1 && timeDiff < 0.3 && newTimestamp > lastTimestamp) {
            routeCoordinates.push(newPosition);
            drawPolylineHistorics(lastPosition, newPosition);
            //console.log(timeDiff)
            //info.push(allInfo);
        } else if (distance > 1 || timeDiff >= 0.3) {
            // If distance is greater than 1 kilometer or the time difference is greater (or equal) than 1 minute, 
            // Start a new route from that point
            routeCoordinates = [newPosition];
            //info.push(allInfo);
        }
        
        //console.log(info)
        //document.getElementById('slider').max = info.length
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
    
    // Configuración base de la flecha
    const lineSymbol = {
        path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
        scale: 1,
        strokeColor: polylineColor,
        strokeWeight: 3
    };

    const polyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: polylineColor,
        strokeOpacity: 0.8,
        strokeWeight: 5,
        icons: [{
            icon: lineSymbol,
            repeat: "200px"
        }]
    });

    // Función para actualizar las flechas según el zoom
    function updateArrowsByZoom() {
        const zoom = map.getZoom();
        let repeat, scale;
        if (zoom <= 13) {
            polyline.setOptions({
                icons: [] 
            });
            return;
        }

        if (zoom > 13) {
            scale = 2; 
        } 

        polyline.setOptions({
            icons: [{
                icon: {
                    ...lineSymbol,
                    scale: scale
                },
                offset: "100%",
                repeat: repeat
            }]
        });
    }

    // Añadir listener para el cambio de zoom
    google.maps.event.addListener(map, 'zoom_changed', updateArrowsByZoom);

    // Establecer configuración inicial
    updateArrowsByZoom();

    // Añadir la polilínea al mapa
    polyline.setMap(map);
    polylines.push(polyline);
    //console.log(polylines.length)
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
    infoWindowMarkers.forEach(marker => marker.setMap(null));
    infowindows.forEach(infowindow => infowindow.close());
    infoWindowMarkers = [];
    infowindows = []; 
    polylines.forEach(polyline => polyline.setMap(null));
    polylines = [];
    routeCoordinates = [];
    lastTimestamp = null;
    colorIndex = 0;
    info = [];
    infoWindow.close;
    infoWindowMarker.setMap(null);
  
}

document.getElementById('fetch-data').addEventListener('click', () => {
    console.log(dateMin);
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
                //console.log('Data fetched:', data); //for debugging reasons
                //console.log(data.length);
                if (data.length == 0){
                    Toast.fire({
                        icon: 'warning',
                        title: 'No data found for the selected period'
                    });
                } else{// Process the received data 
                    popUpMenu.style.visibility='visible';
                    data.forEach(data => { //execute for every object in JSON
                        updateLocationDisplay(data);
                        updateMapAndRouteHistorics(data.Latitude, data.Longitude, data.Timestamp);
    
                       
                    });}
                
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    } else {
        Toast.fire({
            icon: 'error',
            title: 'Ensure dates are provided and the start date is earlier than the end date.'
        });
    }
});

document.getElementById('fetch-location').addEventListener("click", () => {
    clearMap();
    let startDate = document.getElementById('start-date').value;
    let endDate = document.getElementById('end-date').value;
    startDate = convertToGlobalTime(startDate);
    endDate = convertToGlobalTime(endDate);

    date1 = formatDateTime(startDate);
    date2 = formatDateTime(endDate);
    const radiusInput = document.getElementById('radius-input');
    const radius = parseFloat(radiusInput.value);

    if (radius > 0) {
        geocode({ address: document.getElementById('location-input').value }, date1, date2, radius);
        showTab("slider")
        
    } else {
        radiusInput.value = "";
    }
    //console.log("probando")
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
    autocomplete.setComponentRestrictions({
        country: ["col"],
      });
    autocomplete.bindTo("bounds", map);

    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
            return;
        }
    });
}

async function setInfoWindow(lat, lng, timestamp) { 
    console.log(lat)
    infoWindowMarker.setMap(map);
    // Update infoWindowMarker's position
    infoWindowMarker.position = new google.maps.LatLng(lat, lng);

    // Set the content for the info window
    infoWindow.setContent(` ${convertToLocalTime(timestamp)}`);

    // Open the info window on the updated marker
    infoWindow.open(map, infoWindowMarker);

    infoWindowMarker.addListener('click', () => {
        infowindows.forEach(infowindow => infowindow.close());
        infoWindow.open(map, infoWindowMarker);
    });
}

function geocode(request, startDate, endDate, radius) {
    const geocoder = new google.maps.Geocoder();
    clearMap();
    geocoder
        .geocode(request)
        .then((result) => { 
            const { results } = result;
            const center = results[0].geometry.location;
            map.setCenter(center);
            marker.position = center;
            marker.setMap(map);
            circle = new google.maps.Circle({
                strokeColor: polylineColor,
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: polylineColor,
                fillOpacity: 0.15,
                map,
                center: center,
                radius: radius
            });

            // Fetch data after the marker's position is updated
            const lat = center.lat();
            const lng = center.lng();
            console.log(`/location-request?startDate=${startDate}&endDate=${endDate}&lat=${lat}&lon=${lng}&radius=${radius}`);
            fetch(`/location-request?startDate=${startDate}&endDate=${endDate}&lat=${lat}&lon=${lng}&radius=${radius}`)
                .then(response => response.json())
                .then(data => {
                    //document.getElementById('sliderLocations').max = data.length
                    console.log('Data fetched:', data);

                    if (data.length == 0) {
                        Toast.fire({
                            icon: 'warming',
                            title: 'No routes were found'
                        });
                    } else {
                        data.forEach(data => {
                            updateLocationDisplay(data);
                            updateMapAndRouteHistorics(data.Latitude, data.Longitude, data.Timestamp, true);
                            
                            //setInfoWindow(data.Latitude, data.Longitude, data.Timestamp);
                        });
                        
                    }
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                });
                
        })
        .catch((e) => {
            Toast.fire({
                icon: 'info',
                title: 'It was impossible to use geocoding for this location'
            });
        });
}


popUpMenu.addEventListener("click", () => {
    locationHistoryTab.style.visibility = "visible";
    locationHistoryTab.style.opacity=1;
    closeButtonContainer.style.visibility="visible";
    closeButtonContainer.style.opacity=1;
});

closeButton.addEventListener('click',()=>{
    locationHistoryTab.style.visibility = "hidden";
    locationHistoryTab.style.opacity=0;
    closeButtonContainer.style.visibility="hidden";
    closeButtonContainer.style.opacity=0;
})
document.getElementById('backToHistorics').addEventListener("click", ()=>{
    clearMap();
    popUpMenu.style.visibility='hidden';
    marker.setMap(null);
    showTab("history");
    document.getElementById('start-date').value = ''
    document.getElementById('end-date').value =  ''
} )

const toggleButton = document.getElementById('toggleButton');
    
toggleButton.addEventListener('click', () => {
    if (toggleButton.classList.contains('play')) {
        toggleButton.classList.remove('play');
        toggleButton.classList.add('pause');
        toggleButton.innerHTML = '❚❚'; // Pause icon and text
        playSlider();
    } else {
        toggleButton.classList.remove('pause');
        toggleButton.classList.add('play');
        toggleButton.innerHTML = '▷'; // Play icon and text
        stopSlider();
        played = 0;
    }
});
// Initialize map when the page loads
loadName();
loadMap();
initMap();
showTab("realtime");

