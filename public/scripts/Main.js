// Import Classes
import MapManager from './MapManager.js';
import LocationServices from './LocationServices.js';
import UIManager from './UIManager.js';

const locationServices = new LocationServices();
const mapManager = new MapManager(locationServices);
const uiManager = new UIManager(locationServices);

// Document Elements
const realtimeButton = document.getElementById('realtime-button');
const historyButton = document.getElementById('history-button');

// Variables
let live;

// Event Listeners
realtimeButton.addEventListener('click', liveLocation);
historyButton.addEventListener('click', historyLocation);

// Functions
function liveLocation() {
    uiManager.showTab('realtime');
    startLiveLocation();
}

function historyLocation() {
    uiManager.showTab('history');
    stopLiveLocation();
}

function fetchLatestLocation() {
    fetch('/latest-location')
        .then(response => response.json())
        .then(data => {
            uiManager.updateLocationDisplay(data);
            mapManager.updateMapAndRoute(data.Latitude, data.Longitude, data.Timestamp);
        })
        .catch(err => console.error('Error fetching latest location:', err));
}

function startLiveLocation() {
    live = setInterval(fetchLatestLocation, 10000);
}

function stopLiveLocation() {
    clearInterval(live);
}

// Main execution
uiManager.loadName();
mapManager.loadMap();
liveLocation();