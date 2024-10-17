export default class LocationService {
    constructor() {
        this.live = null;
    }
    
    fetchLatestLocation() {
        fetch('/latest-location')
            .then(response => response.json())
            .then(data => {
                updateLocationDisplay(data);
                updateMapAndRoute(data.Latitude, data.Longitude, data.Timestamp);
            })
            .catch(err => console.error('Error fetching latest location:', err));
    }

    startLiveLocation() {
        this.live = setInterval(this.fetchLatestLocation, 10000);
    }
    
    stopLiveLocation() {
        clearInterval(this.live);
    }
    
  
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
} 