// main.js

// ==========================================
// 1. VARIABLES Y CONFIGURACIÓN
// ==========================================
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

// ==========================================
// 2. INYECTAR SELECTOR DE MODOS (UI INFERIOR)
// ==========================================
const bottomNav = document.createElement('div');
bottomNav.innerHTML = `
    <div style="position: absolute; bottom: 30px; width: 100%; display: flex; justify-content: center; z-index: 1000; pointer-events: auto;">
        <select id="mode-selector" style="padding: 12px 20px; font-size: 1rem; border-radius: 25px; border: 2px solid #4CAF50; background: rgba(0,0,0,0.85); color: white; outline: none; box-shadow: 0 4px 15px rgba(0,0,0,0.5); text-align: center; appearance: none; -webkit-appearance: none;">
            <option value="floating">🛸 Modo: Holograma Flotante</option>
            <option value="marker">⬛ Modo: Marcador Hiro</option>
            <option value="hud">🎯 Modo: Anclado a Cámara</option>
        </select>
    </div>
`;
document.getElementById('ui-layer').appendChild(bottomNav);

const modeSelector = document.getElementById('mode-selector');

// ==========================================
// 3. LÓGICA DE CAMBIO DE MODO AR
// ==========================================
// Eliminamos el modelo original estático del HTML para controlarlo con JS
const originalModel = document.getElementById('ar-model');
if (originalModel) originalModel.remove();

let activeContainer = null; // Guardará la referencia al contenedor actual

function applyARMode(mode) {
    // 1. Limpiar el modo anterior
    if (activeContainer) {
        activeContainer.remove();
    }

    // 2. Crear el nuevo contenedor y modelo
    activeContainer = document.createElement('a-entity');
    activeContainer.setAttribute('id', 'model-container');
    
    const model = document.createElement('a-gltf-model');
    model.setAttribute('src', 'key.glb');
    model.setAttribute('scale', '1 1 1');

    if (mode === 'floating') {
        // Modo 1: Flota en unas coordenadas X,Y,Z frente a ti al abrir la app
        model.setAttribute('position', '0 -1 -3');
        activeContainer.appendChild(model);
        scene.appendChild(activeContainer);

    } else if (mode === 'marker') {
        // Modo 2: Requiere que apuntes a un marcador Hiro impreso
        activeContainer = document.createElement('a-marker');
        activeContainer.setAttribute('preset', 'hiro');
        activeContainer.setAttribute('id', 'model-container');
        
        model.setAttribute('position', '0 0 0'); // Sobre el papel
        activeContainer.appendChild(model);
        scene.appendChild(activeContainer);

    } else if (mode === 'hud') {
        // Modo 3: Se pega a la cámara y se mueve exactamente a donde mires
        const camera = document.querySelector('a-entity[camera]');
        model.setAttribute('position', '0 -0.5 -2'); 
        activeContainer.appendChild(model);
        camera.appendChild(activeContainer); // Lo hacemos hijo de la cámara
    }

    // 3. Refrescar visibilidad basada en el GPS/Bypass
    updateVisibility(currentDistance);
}

// Escuchar cambios en el selector inferior
modeSelector.addEventListener('change', (e) => applyARMode(e.target.value));

// ==========================================
// 4. LÓGICA DE BYPASS Y VISIBILIDAD
// ==========================================
bypassToggle.addEventListener('change', (e) => {
    isBypassed = e.target.checked;
    updateVisibility(currentDistance);
});

function updateVisibility(distance) {
    currentDistance = distance; // Guardamos la distancia actual
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
// 5. LÓGICA DE GEOLOCALIZACIÓN (Haversine)
// ==========================================
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; 
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
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
            const distance = calculateDistance(
                position.coords.latitude, position.coords.longitude, 
                TARGET_LAT, TARGET_LNG
            );
            updateVisibility(distance);
        },
        (error) => {
            if (error.code === 1) distanceInfo.textContent = "Permite el acceso al GPS.";
            else distanceInfo.textContent = "Buscando señal GPS...";
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
// Arrancamos con el modo flotante por defecto y encendemos el GPS
applyARMode('floating');
initGeolocation();