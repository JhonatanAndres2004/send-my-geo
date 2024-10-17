import UIManager from './UIManager.js';
const ui = new UIManager();

export default class LocationServices {
    constructor() {}
  
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    roundCoordinate(coord) {
        return Number(coord.toFixed(4));
    }
    
    isSameLocation(coord1, coord2) {
        return roundCoordinate(coord1.lat) === roundCoordinate(coord2.lat) &&
               roundCoordinate(coord1.lng) === roundCoordinate(coord2.lng);
    }

    convertToLocalTime(utcDateString) {
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
    
    convertToGlobalTime(localTime) {
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
} 