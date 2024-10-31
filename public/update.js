let map;
let marker;
let marker2;
let polylines = [];
let polylines2 = [];
let routeCoordinates = [];
let routeCoordinates2 = [];
let lastTimestamp = null;
let lastTimestamp2 = null;
let colorIndex = 0;
const colors = ['#FF0000',]; 
let live;
let autocomplete;
let mapThemeId = 'a43cc08dd4e3e26d';
let circle;
let infowindows = [];
let infoWindowMarkers = [];
let polylineColor = '#ff7008';
let polylineColor2 = '#3956FF'
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
let ID = 1;
let vehicle1 = document.getElementById('vehicle1');
let vehicle2 = document.getElementById('vehicle2');
let allVehicles = document.getElementById('all');
let all = 0;
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
    var reproducer = document.getElementById("reproducer");
    var locationHistoryTab = document.getElementById("location-history");

    // If slider is playing, stop it when changing tabs
    if (played === 1 && reproducer.style.visibility === "visible") {
        stopSlider();
        played = 0;
        const toggleButton = document.getElementById('toggleButton');
        toggleButton.classList.remove('pause');
        toggleButton.classList.add('play');
        toggleButton.innerHTML = '▷'; // Play icon
        
        // Close info window and remove marker if they exist
        if (infoWindow) {
            infoWindow.close();
        }
        if (infoWindowMarker) {
            infoWindowMarker.setMap(null);
        }
    }

    if (tab === "realtime") {
        popUpMenu.style.visibility = 'hidden';
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
        reproducer.style.visibility = "hidden";
        reproducer.style.opacity = "0";
        reproducer.style.position = "absolute";
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
        document.getElementById('realtime-button').disabled = false;
        document.getElementById('history-button').disabled = true;
        document.getElementById('start-date').value = "";
        document.getElementById('end-date').value = "";
        reproducer.style.visibility = "hidden";
        reproducer.style.opacity = "0";
        reproducer.style.position = "absolute";
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
        reproducer.style.visibility = "hidden";
        reproducer.style.opacity = "0";
        reproducer.style.position = "absolute";
        document.getElementById('realtime-button').disabled = false;
        document.getElementById('history-button').disabled = false;
        document.getElementById('location-history-button').disabled = true;
        stopLiveLocation();
    } else if (tab === "slider") {
        locationHistoryTab.style.visibility = "hidden";
        locationHistoryTab.style.opacity = "0";
        locationHistoryTab.style.position = "absolute";
        realTimeTab.style.visibility = "hidden";
        realTimeTab.style.opacity = "0";
        realTimeTab.style.position = "absolute";
        historyTab.style.visibility = "hidden";
        historyTab.style.opacity = "0";
        historyTab.style.position = "absolute";
        reproducer.style.visibility = "visible";
        reproducer.style.opacity = "1";
        reproducer.style.position = "relative";
        popUpMenu.style.visibility = 'visible';
        document.getElementById('stopButton').style.visibility = "visible";
        document.getElementById('realtime-button').disabled = false;
        document.getElementById('history-button').disabled = false;
        document.getElementById('location-history-button').disabled = true;
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
    polylines2.forEach(polyline2 => polyline2.setMap(null));
    polylines2 = [];
    let current = parseInt(this.value);
    let prevValue = parseInt(previous);

    if (info[current]) {
        // Case when moving forward (increasing the slider value)
        if (current) { // > prevValue
            for (let i= 0;i<current; i++){
                updateMapAndRouteLocations(info[i].lat, info[i].lng, info[i].Timestamp, true);
                setInfoWindow(info[i].lat, info[i].lng, info[i].Timestamp, info[i].vel, info[i].rpm);
                
            }
        }
        previous = current;
    }
};

function playSlider() {
    // Set initial value for the custom property to reflect the slider position
    slider.style.setProperty('--value', `${(slider.value - slider.min) * 100 / (slider.max - slider.min)}%`);
    if (played == 0){
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
                infoWindow.close();
                infoWindowMarker.setMap(null);
                polylines.forEach(polyline => polyline.setMap(null));
                polylines2.forEach(polyline2 => polyline2.setMap(null));
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
        const response = await fetch(`/latest-location?ID=${encodeURI(ID)}`);
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
    const pin1 = new PinElement({
        scale: 0.8,
        background: '#FF0000',
        borderColor: 'white',
        glyph: '1',
        glyphColor: 'white'

    });
    const pin2 = new PinElement({
        scale: 0.8,
        background: polylineColor2,
        borderColor: 'white',
        glyph: '2',
        glyphColor: 'white'
    });

    marker1 = new AdvancedMarkerElement({
        map: map,
        position: initialPosition,
        title: "Current Location",
        content: pin1.element
    });
    marker = new AdvancedMarkerElement({
        map:map
    })
    marker2 = new AdvancedMarkerElement({
        map:map,
        content: pin2.element
    })
    
    pin = new PinElement({
        scale: 0.8,
        background: polylineColor,
        borderColor: 'white',
        glyph: '!',
        glyphColor: 'white'
    });
    
    
}

function startLiveLocation(id) {
    fetchLatestLocation(id)
    live = setInterval(() => fetchLatestLocation(id), 10000); // Pass `ID` argument to `fetchLatestLocation`
}

function stopLiveLocation() {
    clearInterval(live);
}

function fetchLatestLocation(id,) {
    if(!id){
        id = ID
    }
    fetch(`/latest-location?ID=${encodeURI(id)}&allVehicles=${all}`) ///historics?startDate=${encodeURIComponent(date1)}
        .then(response => response.json())
        .then(data => {
            if (data.length > 1){
                updateLocationDisplay(data[0]);
                updateMapAndRoute(data[0].Latitude, data[0].Longitude, data[0].Timestamp);
                //updateLocationDisplay(data);
                updateMapAndRoute2(data[1].Latitude, data[1].Longitude, data[1].Timestamp, true);
                console.log('fetching both vehicles real time')
            }else{
                updateLocationDisplay(data);
                updateMapAndRoute(data.Latitude, data.Longitude, data.Timestamp);
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
    document.getElementById('velocity').innerText = data.Velocity
    document.getElementById('rpm').innerText = data.RPM
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

function updateMapAndRoute(lat, lng, timestamp, allVehicles=false) {
    const newPosition = { lat: parseFloat(lat), lng: parseFloat(lng) };
    const newTimestamp = new Date(timestamp); 
    
    // Always update HTML display and marker position
    if(allVehicles || ID == 2){
        marker2.position = newPosition;
        //map.panTo(newPosition);
    }else{
        marker1.position = newPosition;
    }
    
    
    if (routeCoordinates.length === 0)  {
        routeCoordinates.push(newPosition);
        lastTimestamp = newTimestamp;
    } else {
        const lastPosition = routeCoordinates[routeCoordinates.length - 1];
        const distance = calculateDistance(lastPosition.lat, lastPosition.lng, newPosition.lat, newPosition.lng);
        const timeDiff = (newTimestamp - lastTimestamp) / (1000 * 60); // time difference in minutes
        
        if (!isSameLocation(newPosition, lastPosition) && distance <= 1 && timeDiff < 1) {
            routeCoordinates.push(newPosition);
            console.log('conditional before polyline')
            if(ID == 1 && !allVehicles){
                drawPolyline(lastPosition, newPosition);
                console.log('in vehicle 1')
            }
            else if(ID == 2){
                drawPolyline(lastPosition, newPosition, true);
                console.log('In vehicle 2')
            }
            else if(allVehicles){
                drawPolyline(lastPosition, newPosition, true);
                console.log('In vehicle 2')
            }
            
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
function updateMapAndRoute2(lat, lng, timestamp, allVehicles=false) {
    const newPosition = { lat: parseFloat(lat), lng: parseFloat(lng) };
    const newTimestamp = new Date(timestamp); 
    
    // Always update HTML display and marker position
    
    
    if (routeCoordinates2.length === 0)  {
        routeCoordinates2.push(newPosition);
        lastTimestamp2 = newTimestamp;
    } else {
        const lastPosition = routeCoordinates2[routeCoordinates2.length - 1];
        const distance = calculateDistance(lastPosition.lat, lastPosition.lng, newPosition.lat, newPosition.lng);
        const timeDiff = (newTimestamp - lastTimestamp) / (1000 * 60); // time difference in minutes
        
        if (!isSameLocation(newPosition, lastPosition) && distance <= 1 && timeDiff < 1) {
            routeCoordinates2.push(newPosition);
            console.log('conditional before polyline')
            
                drawPolyline(lastPosition, newPosition, true);
                console.log('In vehicle 2')
    
            
            //colorIndex = (colorIndex + 1) % colors.length; // choose the next color
        } else if (distance > 1 || timeDiff >= 1) {
            // If distance is greater than 1 kilometer or the time difference is greater (or equal) than 1 minute, 
            // Start a new route from that point
            routeCoordinates2 = [newPosition];
            // Clear the previous drawn polylines
            polylines2.forEach(polyline2 => polyline2.setMap(null));
            polylines2 = [];
            colorIndex = 0; // reset color index
            
        }
        
        lastTimestamp2 = newTimestamp;
    }
}

function updateMapAndRouteHistorics(lat, lng, timestamp, vel,rpm ,searchByLocation = false, allVehicles= false) {
    console.log(allVehicles);
    const newPosition = { lat: parseFloat(lat), lng: parseFloat(lng) };
    const newTimestamp = new Date(timestamp);
    const allInfo ={lat:parseFloat(lat),lng:parseFloat(lng),Timestamp:timestamp,vel:parseFloat(vel),rpm:parseFloat(rpm)}
    if (!searchByLocation) {
        if(allVehicles || ID == 2){
            marker2.position = newPosition
        }else{
            marker1.position = newPosition;
            //map.panTo(newPosition);
        }
        
        
    }
    
    if (routeCoordinates.length === 0) {
        routeCoordinates.push(newPosition);
        lastTimestamp = newTimestamp;
        info.push(allInfo);
    } else {
        const lastPosition = routeCoordinates[routeCoordinates.length - 1];
        const distance = calculateDistance(lastPosition.lat, lastPosition.lng, newPosition.lat, newPosition.lng);
        const timeDiff = (newTimestamp - lastTimestamp) / (1000 * 60); // time difference in minutes
        
        if (!isSameLocation(newPosition, lastPosition) && distance <= 1 && timeDiff < 1) {
            routeCoordinates.push(newPosition);
            if(ID == 1 && !allVehicles){
                drawPolylineHistorics(lastPosition, newPosition);
                console.log('inside of "ID == 1" polyline historics')
            }else if(ID == 2){
                drawPolylineHistorics(lastPosition, newPosition, true);
                console.log('inside of "ID == 2" polyline historics')
            }
            // if(allVehicles){
            //     drawPolylineHistorics(lastPosition, newPosition, true);
            //     console.log('inside conditional of second vehicle')
            //     //marker2.position = newPosition;
            // }
            
            info.push(allInfo);
        } else if (distance > 1 || timeDiff >= 1) {
            // If distance is greater than 1 kilometer or the time difference is greater (or equal) than 1 minute, 
            // Start a new route from that point
            routeCoordinates = [newPosition];
            info.push(allInfo);
        }
        document.getElementById('slider').max = (info.length - 1);
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
            if(ID == 2){
                drawPolylineHistorics(lastPosition, newPosition, true);
            }else{
                drawPolylineHistorics(lastPosition, newPosition);
            }
            
        } else if (distance > 1 || timeDiff >= 0.3) {
            // If distance is greater than 1 kilometer or the time difference is greater (or equal) than 1 minute, 
            // Start a new route from that point
            routeCoordinates = [newPosition];
        }
        lastTimestamp = newTimestamp;
    }
}


function drawPolyline(origin, destination, vehicle2=false) {
    
    const path = [
        new google.maps.LatLng(origin.lat, origin.lng),
        new google.maps.LatLng(destination.lat, destination.lng)
    ];
    if(vehicle2){
        const polyline2 = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: colors[1] ,
            strokeOpacity: 1.0,
            strokeWeight: 4
        })
        polyline2.setMap(map);
        polylines2.push(polyline2);    
    }else{
        const polyline = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: colors[0],
            strokeOpacity: 1.0,
            strokeWeight: 4
        });
        polyline.setMap(map);
        polylines.push(polyline);    
    }
    // const polyline = new google.maps.Polyline({
    //     path: path,
    //     geodesic: true,
    //     strokeColor: colors[0],
    //     strokeOpacity: 1.0,
    //     strokeWeight: 4
    // });

    
}

function drawPolylineHistorics(origin, destination,vehicle2=false) {
    let lineSymbol
    let polyline
    let polyline2
    const path = [
        new google.maps.LatLng(origin.lat, origin.lng),
        new google.maps.LatLng(destination.lat, destination.lng)
    ];
    if(vehicle2){
        polyline2 = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: polylineColor2,
            strokeOpacity: 0.8,
            strokeWeight: 5,
            icons: [{
                icon:lineSymbol,
                repeat: "200px"
            }]
        });
        lineSymbol = {
            path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
            scale: 1,
            strokeColor: polylineColor2,
            strokeWeight: 3
        };    
        
    }else{
        polyline = new google.maps.Polyline({
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
        lineSymbol = {
            path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
            scale: 1,
            strokeColor: polylineColor,
            strokeWeight: 3
        };
    }
    
    // Configuración base de la flecha
    

    if(!vehicle2){
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
    }
    if(vehicle2){
        function updateArrowsByZoom() {
            const zoom = map.getZoom();
            let repeat, scale;
            if (zoom <= 13) {
                polyline2.setOptions({
                    icons: [] 
                });
                return;
            }
    
            if (zoom > 13) {
                scale = 2; 
            } 
    
            polyline2.setOptions({
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
        polyline2.setMap(map);
        polylines2.push(polyline2);
    }

    // Función para actualizar las flechas según el zoom
    
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
    if (infoWindowMarker) infoWindowMarker.setMap(null);
    if (infoWindow) infoWindow.close();
    polylines.forEach(polyline => polyline.setMap(null));
    polylines = [];
    polylines2.forEach(polyline2 => polyline2.setMap(null));
    polylines2 = [];
    routeCoordinates = [];
    lastTimestamp = null;
    colorIndex = 0;
    info = [];
}

document.getElementById('fetch-data').addEventListener('click', () => {
    stopLiveLocation();
    let url
    let url2
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
        if(all == 1){
            
            url = `/historics?startDate=${encodeURIComponent(date1)}&endDate=${encodeURIComponent(date2)}&ID=${encodeURI(ID)}`;
            url2 = `/historics?startDate=${encodeURIComponent(date1)}&endDate=${encodeURIComponent(date2)}&ID=${encodeURI(ID+1)}`;
            console.log('dos vehiculos')
        }
        else{
            url = `/historics?startDate=${encodeURIComponent(date1)}&endDate=${encodeURIComponent(date2)}&ID=${encodeURI(ID)}`;
        }
        // Construct the URL with encoded date parameters for fetching historical data
        
        console.log(all)
        console.log("Encoded URL:", url);
        console.log("url 2 = ",url2)  
        fetch(url)
             
            .then(response => response.json())
            .then(data => {
                if (data.length == 0){
                    Toast.fire({
                        icon: 'warning',
                        title: 'No data found for the selected period'
                    });
                } else{
                    popUpMenu.style.visibility='visible';
                    data.forEach(data => {
                        updateLocationDisplay(data);
                        updateMapAndRouteHistorics(data.Latitude, data.Longitude, data.Timestamp);
                        console.log('fetching data of firsh vehicle')
                    });}
                
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
            
            if(url2){
                
                fetch(url2) 
                    .then(response => response.json())
                    .then(data => {
                        if (data.length == 0){
                            Toast.fire({
                                icon: 'warning',
                                title: 'No data found for the selected period'
                            });
                            console.log('data of the second vehicle =')
                        } else{
                            
                            data.forEach(data => {
                                //updateLocationDisplay(data);
                                updateMapAndRouteHistorics(data.Latitude, data.Longitude, data.Timestamp, data.Velocity,data.RPM,false, true); //add color for second polyline
                                console.log('fetching second vehicle data')
                            });}
                        
                    })
                    .catch(error => {
                        console.error('Error fetching data:', error);
                    });
            
            }
        }
     
    else {
        Toast.fire({
            icon: 'error',
            title: 'Ensure dates are provided and the start date is earlier than the end date.'
        });
    }
});

document.getElementById('fetch-location').addEventListener("click", () => {
    marker1.position = null
    marker2.position = null
    stopLiveLocation();
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

async function setInfoWindow(lat, lng, timestamp, vel, rpm) { 
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    
    if (infoWindowMarker) infoWindowMarker.setMap(null);
    if (infoWindow) infoWindow.close();
    if(ID ==2 ){
        pin.background = polylineColor2
    }else{
        pin.background = polylineColor
    }
    infoWindowMarker = new AdvancedMarkerElement({
        map: map,
        content: pin.element 
    });

    infoWindow = new google.maps.InfoWindow({
        content: "",
    });

    infoWindowMarker.setMap(map);
    // Update infoWindowMarker's position
    infoWindowMarker.position = new google.maps.LatLng(lat, lng);

    // Set the content for the info window
    infoWindow.setContent(`
        <div>
          <p>Time: ${convertToLocalTime(timestamp)}</p>
          <p>Velocity: ${parseFloat(vel)} km/h</p>
          <p> RPM: ${parseFloat(rpm)}<p> 
        </div>
      `);
      //.toFixed(2)

    // Open the info window on the updated marker
    infoWindow.open(map, infoWindowMarker);
}

function geocode(request, startDate, endDate, radius,allVehicles=false) {
    let url
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
            if(allVehicles){
                url = `/location-request?startDate=${startDate}&endDate=${endDate}&lat=${lat}&lon=${lng}&radius=${radius}&ID=${ID}`
            }else{
                url = `/location-request?startDate=${startDate}&endDate=${endDate}&lat=${lat}&lon=${lng}&radius=${radius}&ID=${ID}`
            }
            
            console.log(url);
            fetch(url)
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
                            updateMapAndRouteHistorics(data.Latitude, data.Longitude, data.Timestamp, data.Velocity, data.RPM, true);
                            
                            //setInfoWindow(data.Latitude, data.Longitude, data.Timestamp);
                        });
                        
                    }
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                });
                console.log(info);
                
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
document.getElementById('backToHistorics').addEventListener("click", () => {
    var startPckr = document.getElementById("start-date");
    var endPickr = document.getElementById("end-date");
    var startDate = startPckr.value
    var endDate = endPickr.value
    // Stop the slider animation if it's playing
    if (played === 1) {
        stopSlider();
        played = 0;
        const toggleButton = document.getElementById('toggleButton');
        toggleButton.classList.remove('pause');
        toggleButton.classList.add('play');
        toggleButton.innerHTML = '▷'; // Play icon
    }
    
    clearMap();
    popUpMenu.style.visibility = 'hidden';
    marker.setMap(null);
    showTab("history");
    startPckr.value = startDate;
    endPickr.value = endDate;
});

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

vehicle1.addEventListener('click', () =>{
    var reproducer = document.getElementById("reproducer");
    var startPckr = document.getElementById("start-date");
    var endPickr = document.getElementById("end-date");
    var startDate = startPckr.value
    var endDate = endPickr.value
    if(reproducer.style.visibility == "visible"){
        const toggleButton = document.getElementById('toggleButton');
        //toggleButton.click();
        showTab("history")
        startPckr.value = startDate;
        endPickr.value = endDate;
        popUpMenu.click();
    }
    marker2.position = null
    marker.position = null
    all= 0;
    clearMap();
    stopLiveLocation();
    ID = 1;
    startLiveLocation();
    
})

vehicle2.addEventListener('click', () =>{
    var reproducer = document.getElementById("reproducer");
    var startPckr = document.getElementById("start-date");
    var endPickr = document.getElementById("end-date");
    var startDate = startPckr.value
    var endDate = endPickr.value
    if(reproducer.style.visibility == "visible"){
        const toggleButton = document.getElementById('toggleButton');
        //toggleButton.click();      
        showTab("history")
        startPckr.value = startDate;
        endPickr.value = endDate;
        popUpMenu.click();
    }
    marker1.position = null
    marker.position = null
    all = 0;
    clearMap();
    stopLiveLocation();
    ID = 2;
    startLiveLocation();
    console.log(all)
    
})
allVehicles.addEventListener('click', () =>{
    marker1.position = null
    marker2.position = null
    ID = 1
    clearMap();
    stopLiveLocation();
    all = 1;
    
    startLiveLocation();
    
})
// Initialize map when the page loads
loadName();
//loadMap();
document.addEventListener("DOMContentLoaded", loadMap);
initMap();
showTab("realtime");