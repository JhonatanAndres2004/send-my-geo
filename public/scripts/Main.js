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
const fetchHistoryButton = document.getElementById('fetch-history-button');
const startDateInput = document.getElementById('start-date-input');
const endDateInput = document.getElementById('end-date-input');
const popUpMenu = document.getElementById('emergent-pop-up');

// Variables
let live;

// Event Listeners
realtimeButton.addEventListener('click', liveLocation);
historyButton.addEventListener('click', historyLocation);
fetchHistoryButton.addEventListener('click', fetchHistory);

// Functions
function liveLocation() {
    uiManager.showTab('realtime');
    startLiveLocation();
}

function historyLocation() {
    uiManager.showTab('history');
    mapManager.clearMap();
    stopLiveLocation();
}

function fetchLatestLocation() {
    fetch('/latest-location')
        .then(response => response.json())
        .then(data => {
            uiManager.updateLocationDisplay(data);
            mapManager.updateMapAndRoute(data.Latitude, data.Longitude, data.Timestamp);
            console.log('Latest location:', data);
        })
        .catch(err => console.error('Error fetching latest location:', err));
}

function startLiveLocation() {
    live = setInterval(fetchLatestLocation, 10000);
}

function stopLiveLocation() {
    clearInterval(live);
}

function fetchHistory(){
    var startDate = startDateInput.value;
    var endDate = endDateInput.value;
    const correctDates = locationServices.checkDates(startDate, endDate);
    if (startDate && endDate && correctDates) {
        startDate = locationServices.convertToGlobalTime(startDate);
        endDate = locationServices.convertToGlobalTime(endDate);

        const date1 = locationServices.formatDateTime(startDate);
        const date2 = locationServices.formatDateTime(endDate);

        mapManager.clearMap();

        fetch(`/historics?startDate=${encodeURIComponent(date1)}&endDate=${encodeURIComponent(date2)}`) 
        .then(response => response.json())
        .then(data => {
            if (data.length == 0){
                UIManager.toast.fire({
                    icon: 'warning',
                    title: 'No data found for the selected period'
                });
            } else {
                popUpMenu.style.visibility = 'visible';
                data.forEach(data => {
                    MapManager.updateMapAndRouteHistorics(data.Latitude, data.Longitude, data.Timestamp);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
    } else {
        UIManager.toast.fire({
            icon: 'error',
            title: 'Ensure dates are provided and the start date is earlier than the end date.'
        });
    }
}

// Main execution
uiManager.loadName();
mapManager.loadMap();
liveLocation();