export default class MapManager {
    constructor(locationServices) {
        this.map = null;
        this.marker = null;
        this.polylines = [];
        this.routeCoordinates = [];
        this.lastTimestamp = null;
        this.mapThemeId = 'a43cc08dd4e3e26d';
        this.ls = locationServices;
        window.initMap = this.initMap.bind(this);
    }
  
    loadMap() {
        fetch('/api-key')
            .then(response => response.json())
            .then(data => {
                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&loading=async&callback=initMap`;
                script.async = true;
                script.defer = true;
                document.body.appendChild(script);
            })
            .catch(err => console.error('Error fetching API key:', err));
    }

    async initMap() {
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
        
        this.map = new Map(document.getElementById("map"), {
            zoom: 14,
            center: initialPosition,
            mapId: this.mapThemeId,
            mapTypeControl: false,
    
        });
        
        this.marker = new AdvancedMarkerElement({
            map: this.map,
            position: initialPosition,
            title: "Current Location",
        });
    }
  
    updateMapAndRoute(lat, lng, timestamp) {
        const newPosition = { lat: parseFloat(lat), lng: parseFloat(lng) };
        const newTimestamp = new Date(timestamp);
        
        this.updateMarkerPosition(newPosition);
        
        if (this.routeCoordinates.length === 0) {
            this.routeCoordinates.push(newPosition);
            this.lastTimestamp = newTimestamp;
        } else {
            const lastPosition = this.routeCoordinates[this.routeCoordinates.length - 1];
            const distance = this.ls.calculateDistance(lastPosition.lat, lastPosition.lng, newPosition.lat, newPosition.lng);
            const timeDiff = (newTimestamp - this.lastTimestamp) / (1000 * 60); // time difference in minutes
            
            if (!this.ls.isSameLocation(newPosition, lastPosition) && distance <= 1 && timeDiff < 1) {
                this.routeCoordinates.push(newPosition);
                this.drawPolyline(lastPosition, newPosition);
            } else if (distance > 1 || timeDiff >= 1) {
                // If distance is greater than 1 kilometer or the time difference is greater (or equal) than 1 minute, 
                // Start a new route from that point
                this.routeCoordinates = [newPosition];
                // Clear the previous drawn polylines
                this.polylines.forEach(polyline => polyline.setMap(null));
                this.polylines = [];               
            }
            
            this.lastTimestamp = newTimestamp;
        }
    }

    updateMarkerPosition(position) {
        this.marker.position = position;
        this.map.panTo(position);
    }
  
    drawPolyline(origin, destination) {
        const path = [new google.maps.LatLng(origin.lat, origin.lng), new google.maps.LatLng(destination.lat, destination.lng)];
        const polyline = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 4
        });
        polyline.setMap(this.map);
        this.polylines.push(polyline);
    }
  
    clearPolylines() {
        this.polylines.forEach(polyline => polyline.setMap(null));
        this.polylines = [];
        this.routeCoordinates = [];
    }
}  