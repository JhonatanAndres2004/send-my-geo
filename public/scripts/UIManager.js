export default class UIManager {
    constructor(locationServices) {
        this.slider = document.getElementById('slider');
        this.valueSlider = document.getElementById('valueSlider');
        this.toast = this.createToast();
        this.dateMin = null;
        this.dateMax = null;
        this.createFlatPickrs();
        this.ls = locationServices;
    }

    // Load date picker for start date
    startDate = flatpickr("#start-date-input", {
        dateFormat: "Y-m-d H:i",
        maxDate: new Date(),
        mod: "multiple",
        enableTime: true,
        onClose: function(dateStr) {
            this.dateMin = dateStr;
            console.log(this.dateMin)
            endDate.set('minDate', dateStr)
        }
    });
    
    
    // Load date picker for end date
    endDate = flatpickr("#end-date-input", {
        dateFormat: "Y-m-d H:i",
        maxDate: new Date(),
        mod: "multiple",
        enableTime: true,
        onClose: function(dateStr) {
            this.dateMax = dateStr;
            console.log(this.dateMax)
            startDate.set('maxDate', dateStr)
        }
    });
  
    loadName() {
        fetch('/name')
            .then(response => response.json())
            .then(data => {
                document.getElementById('name').innerText = `SendMyGeo (${data.name})`;
            })
            .catch(err => console.error('Error fetching name:', err));
    }

    showTab(tabName) {
        const tabs = {
            realtime: 'realtime',
            history: 'history',
            locationHistory: 'location-history',
            player: 'player'
        };
        for (const tab in tabs) {
            const element = document.getElementById(tabs[tab]);
            element.style.visibility = (tab === tabName) ? 'visible' : 'hidden';
            element.style.opacity = (tab === tabName) ? 1 : 0;
            element.style.position = (tab === tabName) ? 'relative' : 'absolute';
        }
        switch (tabName) {
            case 'realtime':
                document.getElementById('realtime-button').disabled = true;
                document.getElementById('history-button').disabled = false;
                break;
            case 'history':
                document.getElementById('realtime-button').disabled = false;
                document.getElementById('history-button').disabled = true;
                break;
            default:
                document.getElementById('realtime-button').disabled = true;
                document.getElementById('history-button').disabled = true;
                break;
        }
    }
  
    updateLocationDisplay(data) {
        document.getElementById('latitude').innerText = data.Latitude;
        document.getElementById('longitude').innerText = data.Longitude;
        const timestamp = this.ls.convertToLocalTime(data.Timestamp);
        const [date, time] = timestamp.split(', ');
        document.getElementById('date').innerText = date;
        document.getElementById('time').innerText = time;
    }

    createToast() {
        return Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            iconColor: "#6e00b3",
            didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
            }
        });
    }

    createFlatPickrs(){
        this.startDatePickr = flatpickr("#start-date-input", {
            dateFormat: "Y-m-d H:i",
            maxDate: new Date(),
            enableTime: true,
            onClose: function(dateStr) {
                this.dateMin = dateStr;
                this.endDatePickr.set('minDate', dateStr);
            }
        });
        
        this.endDatePickr = flatpickr("#end-date-input", {
            dateFormat: "Y-m-d H:i",
            maxDate: new Date(),
            enableTime: true,
            onClose: function(dateStr) {
                this.endDate = dateStr;
                this.startDatePickr.set('maxDate', dateStr);
            }
        });
    }

    showErrorMessage(message) {
        this.toast.fire({
            icon: 'error',
            title: message
        });
    }
}