API_BASE_URL = 'http://localhost:5000'; 

// Función para realizar peticiones autenticadas
function fetchWithAuth(url, options = {}) {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        window.location.href = 'index.html';
        return Promise.reject(new Error('No hay token de autenticación'));
    }
    
    const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    return fetch(url, {
        ...options,
        headers
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                window.location.href = 'index.html';
                throw new Error('Sesión expirada o no autorizado');
            }
            return response.json().then(err => { throw err; });
        }
        return response.json();
    });
}

// Función para crear un nuevo establecimiento
function createEstablishment(event) {
    event.preventDefault();
    
    const establishmentName = document.getElementById('establishmentName').value;
    const location = document.getElementById('establishmentLocation').value;
    
    // Validaciones básicas
    if (!establishmentName || establishmentName.trim() === '') {
        alert('El nombre del establecimiento es obligatorio');
        return;
    }
    
    // Crear objeto con los datos del nuevo establecimiento
    const newEstablishment = {
        nameEst: establishmentName,
        totalSectors: 0,
        totalParkingSpots: 0,
        geographicLocation: location
    };
    
    // Enviar datos al servidor
    fetchWithAuth(`${API_BASE_URL}/api/crear_establecimiento`, {
        method: 'POST',
        body: JSON.stringify(newEstablishment)
    })
    .then(data => {
        if (data.success) {
            alert(data.message || 'Establecimiento creado correctamente');
            
            // Guardar en localStorage si no hay un establecimiento activo
            if (!localStorage.getItem('currentParking')) {
                localStorage.setItem('currentParking', JSON.stringify(newEstablishment));
            }
            
            // Redireccionar a la lista de establecimientos
            window.location.href = 'establecimientos.html';
        } else {
            throw new Error(data.message || 'Error al crear el establecimiento');
        }
    })
    .catch(error => {
        console.error('Error al crear establecimiento:', error);
        alert(`Error al crear el establecimiento: ${error.message || 'Error desconocido'}`);
    });
}

// Configuración de la UI y event listeners
document.addEventListener('DOMContentLoaded', function() {
    
    // Event listener para el formulario de creación
    const createForm = document.getElementById('createEstablishmentForm');
    if (createForm) {
        createForm.addEventListener('submit', createEstablishment);
    }
    
    // Event listener para el botón de regresar
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.href = 'establecimientos.html';
        });
    }
    
    // Event listener para el botón de cancelar
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            window.location.href = 'establecimientos.html';
        });
    }
    
    // Event listener para el botón de cerrar sesión si existe
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            sessionStorage.removeItem('chatEmail');
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }
});