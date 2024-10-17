import MapManager from './MapManager.js';
import LocationService from './LocationService.js';
import UIManager from './UIManager.js';

const mapManager = new MapManager();
const locationService = new LocationService();
const uiManager = new UIManager();

uiManager.loadName();
mapManager.loadMap();
uiManager.showTab('realtime');
locationService.startLiveLocation();