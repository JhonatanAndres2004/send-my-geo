import MapManager from './MapManager.js';
import LocationServices from './LocationServices.js';
import UIManager from './UIManager.js';

const locationServices = new LocationServices();
const mapManager = new MapManager(locationServices);
const uiManager = new UIManager(locationServices);

let live;

function liveLocation() {
    uiManager.showTab('realtime');
    startLiveLocation();
}

function fetchLatestLocation() {
    fetch('/latest-location')
        .then(response => response.json())
        .then(data => {
            uiManager.updateLocationDisplay(data);

        })
        .catch(err => console.error('Error fetching latest location:', err));
}

function startLiveLocation() {
    live = setInterval(fetchLatestLocation, 10000);
}

function stopLiveLocation() {
    clearInterval(live);
}

uiManager.loadName();
mapManager.loadMap();
liveLocation();