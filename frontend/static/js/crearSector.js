// Variables globales
const API_BASE_URL = 'http://localhost:5000';

// Verificación de autenticación
function checkAuth() {
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');

    if (!authToken || !currentUser) {
        window.location.replace('index.html');
        return false;
    }
    return true;
}

// Función para prevenir caché en navegación
function preventCaching() {
    if (window.location.protocol !== 'file:') {
        window.history.replaceState(null, document.title, window.location.href);
    }
}

// Función para hacer fetch con autenticación
function fetchWithAuth(url, options = {}) {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        alert('No hay sesión activa. Por favor, inicie sesión nuevamente.');
        window.location.replace('index.html');
        return Promise.reject(new Error('No hay token de autenticación'));
    }
    
    // Asegurarse de que headers existe
    if (!options.headers) {
        options.headers = {};
    }
    
    // Añadir token de autorización
    options.headers['Authorization'] = `Bearer ${authToken}`;
    
    return fetch(url, options)
        .then(response => {
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    alert('Sesión expirada. Por favor, inicie sesión nuevamente.');
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('currentUser');
                    window.location.replace('index.html');
                    throw new Error('No autorizado');
                }
                return response.json().then(data => {
                    throw new Error(data.message || `Error del servidor: ${response.status}`);
                });
            }
            return response.json();
        });
}

// Cargar establecimientos para el selector
function cargarEstablecimientos() {
    const selectEstablecimiento = document.getElementById('registerEstablecimiento');
    
    if (!selectEstablecimiento) {
        console.error('Elemento selectEstablecimiento no encontrado');
        return;
    }
    
    // Mostrar indicador de carga
    selectEstablecimiento.innerHTML = '<option value="">Cargando establecimientos...</option>';
    
    fetchWithAuth(`${API_BASE_URL}/api/get_establishments`)
        .then(data => {
            // Limpiar el select
            selectEstablecimiento.innerHTML = '<option value="">Seleccione un establecimiento</option>';
            
            if (data.success && data.establecimientos && data.establecimientos.length > 0) {
                // Agregar opciones al select
                data.establecimientos.forEach(establecimiento => {
                    const option = document.createElement('option');
                    // Comprobar qué propiedad contiene el nombre del establecimiento
                    const nombreEstablecimiento = establecimiento.nombre || establecimiento.nameEst;
                    option.value = nombreEstablecimiento; // Usando el nombre como valor para coincidir con el backend
                    option.textContent = nombreEstablecimiento;
                    selectEstablecimiento.appendChild(option);
                });
            } else {
                const option = document.createElement('option');
                option.value = "";
                option.textContent = "No hay establecimientos disponibles";
                option.disabled = true;
                selectEstablecimiento.appendChild(option);
                console.error('No se encontraron establecimientos');
            }
        })
        .catch(error => {
            console.error('Error al cargar establecimientos:', error);
            selectEstablecimiento.innerHTML = '<option value="">Error al cargar establecimientos</option>';
            
            if (!error.message.includes('No autorizado')) {
                alert('Error al cargar los establecimientos. Por favor, intenta más tarde.');
            }
        });
}

function createSector() {
    // Obtener valores del formulario
    const sectorName = document.getElementById('registerSector')?.value || 
                       document.getElementById('sectorName')?.value;
    
    const establishmentName = document.getElementById('registerEstablecimiento')?.value || 
                             document.getElementById('establishmentName')?.value;
    
    let openingHour = document.getElementById('registerHorarioApertura')?.value || 
                    document.getElementById('openingHour')?.value;
    
    let closingHour = document.getElementById('registerHorarioCierre')?.value || 
                    document.getElementById('closingHour')?.value;
    
    const availableSpots = document.getElementById('registerCocherasDisponibles')?.value || 
                           document.getElementById('availableParkingSpots')?.value || "0";

    // Validar campos obligatorios
    if (!sectorName || !sectorName.trim()) {
        alert('Por favor, ingrese un nombre para el sector');
        return;
    }
    
    if (!establishmentName || !establishmentName.trim()) {
        alert('Por favor, seleccione un establecimiento');
        return;
    }
    
    if (!openingHour) {
        alert('Por favor, ingrese el horario de apertura');
        return;
    }
    
    if (!closingHour) {
        alert('Por favor, ingrese el horario de cierre');
        return;
    }
    
    // Formatear correctamente las horas (formato HH:MM sin segundos)
    // El input time devuelve formato HH:MM o HH:MM:SS
    if (openingHour.includes(':')) {
        // Asegurarse de que solo tengamos HH:MM
        openingHour = openingHour.split(':').slice(0, 2).join(':');
    }
    
    if (closingHour.includes(':')) {
        // Asegurarse de que solo tengamos HH:MM
        closingHour = closingHour.split(':').slice(0, 2).join(':');
    }
    
    // Pedir confirmación
    const confirmacion = confirm(`¿Deseas crear el sector "${sectorName}" en el establecimiento "${establishmentName}"?`);
    if (!confirmacion) {
        return;
    }
    
    // Crear el objeto de datos a enviar
    const sectorData = {
        sector: sectorName.trim(),
        establecimiento: establishmentName.trim(),
        horarioApertura: openingHour,
        horarioCierre: closingHour,
        cocherasDisponibles: parseInt(availableSpots) || 0
    };
    
    
    // Deshabilitar el botón de submit para evitar múltiples envíos
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-hourglass"></i> Guardando...';
    }
    
    // Enviar la solicitud al servidor
    fetchWithAuth(`${API_BASE_URL}/api/crear_sector`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sectorData)
    })
    .then(response => {
        if (response.success) {
            alert(response.message || 'Sector creado exitosamente');
            window.location.href = 'sectores.html';
        } else {
            throw new Error(response.message || 'Error al crear el sector');
        }
    })
    .catch(error => {
        console.error('Error al crear sector:', error);
        alert(`Error: ${error.message || 'No se pudo crear el sector'}`);
    })
    .finally(() => {
        // Rehabilitar el botón de submit
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-save"></i> Guardar';
        }
    });
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    // Prevenir caché
    preventCaching();
    
    // Verificar autenticación
    if (!checkAuth()) return;
    
    // Cargar establecimientos
    cargarEstablecimientos();
    
    // Configurar los campos de hora para asegurar formato correcto
    const timeInputs = document.querySelectorAll('input[type="time"]');
    timeInputs.forEach(input => {
        // Por defecto usar step="60" para evitar segundos
        if (!input.hasAttribute('step')) {
            input.setAttribute('step', '60');
        }
    });
    
    // Configurar el formulario
    const form = document.getElementById('sectorForm');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            createSector();
        });
    }
    
    // Event listener para el botón de volver
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.href = 'sectores.html';
        });
    }
    
    // Configurar el botón de cierre de sesión
    document.getElementById('logoutBtn')?.addEventListener('click', function() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
});