export default class UIManager {
    constructor() {
        this.slider = document.getElementById('slider');
        this.valueSlider = document.getElementById('valueSlider');
        this.toast = this.createToast();
    }
  
    loadName() {
        fetch('/name')
            .then(response => response.json())
            .then(data => {
                document.getElementById('name').innerText = `SendMyGeo (${data.name})`;
            })
            .catch(err => console.error('Error fetching name:', err));
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
    }
  
    showErrorMessage(message) {
        this.toast.fire({
            icon: 'error',
            title: message
        });
    }
}