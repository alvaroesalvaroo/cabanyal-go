// main.js

// ==========================================
// 1. VARIABLES DE CONFIGURACIÓN DE UBICACIÓN
// ==========================================
// Coordenadas objetivo (Ejemplo: Zona del Cabanyal, Valencia)
const TARGET_LAT = 39.4673;  
const TARGET_LNG = -0.3340;  
const RADIUS_METERS = 50; // Radio de detección en metros

// ==========================================
// 2. VARIABLES DE ESTADO Y ELEMENTOS DEL DOM
// ==========================================
let isBypassed = false;
let watchId = null;

const bypassToggle = document.getElementById('bypass-toggle');
const warningOverlay = document.getElementById('location-warning');
const distanceInfo = document.getElementById('distance-info');
const arModel = document.getElementById('ar-model');

// ==========================================
// 3. LÓGICA DE BYPASS Y UI
// ==========================================
bypassToggle.addEventListener('change', (e) => {
    isBypassed = e.target.checked;
    updateVisibility(0); // Forzamos actualización visual
});

function updateVisibility(distance) {
    const isWithinRadius = distance !== null && distance <= RADIUS_METERS;

    if (isBypassed || isWithinRadius) {
        // Mostrar modelo, ocultar aviso
        warningOverlay.classList.add('hidden');
        arModel.setAttribute('visible', 'true');
    } else {
        // Mostrar aviso, ocultar modelo
        warningOverlay.classList.remove('hidden');
        arModel.setAttribute('visible', 'false');
        
        if (distance !== null) {
            distanceInfo.textContent = `Estás a ${Math.round(distance)} metros del objetivo.`;
        }
    }
}

// ==========================================
// 4. LÓGICA DE GEOLOCALIZACIÓN
// ==========================================

// Fórmula de Haversine para calcular distancia en metros entre dos coordenadas
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio de la Tierra en metros
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

    // Solicitamos y vigilamos la posición en tiempo real
    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const currentLat = position.coords.latitude;
            const currentLng = position.coords.longitude;
            
            const distance = calculateDistance(currentLat, currentLng, TARGET_LAT, TARGET_LNG);
            updateVisibility(distance);
        },
        (error) => {
            console.warn('Error GPS:', error);
            if (error.code === 1) {
                distanceInfo.textContent = "Por favor, permite el acceso al GPS para jugar.";
            } else {
                distanceInfo.textContent = "Buscando señal GPS...";
            }
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        }
    );
}

// Iniciar app
initGeolocation();