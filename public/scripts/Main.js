import MapManager from './MapManager.js';
import LocationServices from './LocationServices.js';
import UIManager from './UIManager.js';

const locationServices = new LocationServices();
const mapManager = new MapManager(locationServices);
const uiManager = new UIManager(locationServices);

function liveLocation() {
    uiManager.showTab('realtime');
    locationServices.startLiveLocation();

}

uiManager.loadName();
mapManager.loadMap();
liveLocation();