export default class MapManager {
    constructor() {
        this.map = null;
        this.marker = null;
        this.polylines = [];
        this.routeCoordinates = [];
        this.colorIndex = 0;
        this.mapThemeId = 'a43cc08dd4e3e26d';
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
  
    updateMarkerPosition(position) {
        this.marker.position = position;
        this.map.panTo(position);
    }
  
    drawPolyline(origin, destination, color) {
        const path = [new google.maps.LatLng(origin.lat, origin.lng), new google.maps.LatLng(destination.lat, destination.lng)];
        const polyline = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: color || '#FF0000',
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