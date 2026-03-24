// main.js

const TARGET_LAT = 39.4673;  
const TARGET_LNG = -0.3340;  
const RADIUS_METERS = 50; 

let isBypassed = false;
let watchId = null;
let currentDistance = null;

const bypassToggle = document.getElementById('bypass-toggle');
const warningOverlay = document.getElementById('location-warning');
const distanceInfo = document.getElementById('distance-info');
const scene = document.querySelector('a-scene');
const modeSelector = document.getElementById('mode-selector');

// ==========================================
// 1. GESTIÓN DEL MODO AR (URL y LocalStorage)
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
let urlMethod = urlParams.get('method');

let currentMode = urlMethod || localStorage.getItem('cabanyal_ar_mode') || 'floating';
localStorage.setItem('cabanyal_ar_mode', currentMode);

// Actualizar el selector visualmente
modeSelector.value = currentMode;

// Evento: Guardar y recargar
modeSelector.addEventListener('change', (e) => {
    const selectedMode = e.target.value;
    localStorage.setItem('cabanyal_ar_mode', selectedMode);
    window.location.href = window.location.pathname + '?method=' + selectedMode;
});

// ==========================================
// 2. CONSTRUIR LA ESCENA AR EN EL ARRANQUE
// ==========================================
let activeContainer = document.createElement('a-entity');
activeContainer.setAttribute('id', 'model-container');
activeContainer.setAttribute('visible', 'false'); // Oculto por defecto

const model = document.createElement('a-gltf-model');
model.setAttribute('src', 'key.glb');
model.setAttribute('scale', '1 1 1');

if (currentMode === 'floating') {
    model.setAttribute('position', '0 -1 -3');
    activeContainer.appendChild(model);
    scene.appendChild(activeContainer);

} else if (currentMode === 'marker') {
    activeContainer = document.createElement('a-marker');
    activeContainer.setAttribute('preset', 'hiro');
    activeContainer.setAttribute('id', 'model-container');
    activeContainer.setAttribute('visible', 'false');
    
    model.setAttribute('position', '0 0 0'); 
    activeContainer.appendChild(model);
    scene.appendChild(activeContainer);

} else if (currentMode === 'hud') {
    const camera = document.querySelector('a-entity[camera]');
    model.setAttribute('position', '0 -0.5 -2'); 
    activeContainer.appendChild(model);
    camera.appendChild(activeContainer); 
}

// ==========================================
// 3. LÓGICA DE BYPASS Y VISIBILIDAD
// ==========================================
bypassToggle.addEventListener('change', (e) => {
    isBypassed = e.target.checked;
    updateVisibility(currentDistance);
});

function updateVisibility(distance) {
    currentDistance = distance;
    const isWithinRadius = distance !== null && distance <= RADIUS_METERS;
    const container = document.getElementById('model-container');

    if (isBypassed || isWithinRadius) {
        warningOverlay.classList.add('hidden');
        if (container) container.setAttribute('visible', 'true');
    } else {
        warningOverlay.classList.remove('hidden');
        if (container) container.setAttribute('visible', 'false');
        
        if (distance !== null) {
            distanceInfo.textContent = `Estás a ${Math.round(distance)} metros del objetivo.`;
        }
    }
}

// ==========================================
// 4. LÓGICA DE GEOLOCALIZACIÓN (Haversine)
// ==========================================
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; 
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
}

function initGeolocation() {
    if (!navigator.geolocation) {
        distanceInfo.textContent = "Tu navegador no soporta geolocalización.";
        return;
    }

    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const distance = calculateDistance(position.coords.latitude, position.coords.longitude, TARGET_LAT, TARGET_LNG);
            updateVisibility(distance);
        },
        (error) => {
            if (error.code === 1) distanceInfo.textContent = "Permite el acceso al GPS.";
            else distanceInfo.textContent = "Buscando señal GPS...";
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
}

// Inicialización
updateVisibility(null);
initGeolocation();