import MapManager from './MapManager.js';
import LocationServices from './LocationServices.js';
import UIManager from './UIManager.js';

const mapManager = new MapManager();
const locationServices = new LocationServices();
const uiManager = new UIManager();


function liveLocation() {
    uiManager.showTab('realtime');
    locationServices.startLiveLocation();

}

uiManager.loadName();
mapManager.loadMap();
liveLocation();