const API_BASE_URL = 'http://localhost:5000';

function preventCaching() {
    // NO ALMACENA CACHÉ
    if (window.location.protocol != 'file:') {
        window.history.replaceState(null, document.title, window.location.href);
    }
}

preventCaching();

function checkToken() {
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');
    if (!authToken || !currentUser) {
        window.location.replace('index.html');
        return false;
    }
    return true;
}

// Verificar autenticación cuando la página vuelve a estar activa
window.addEventListener('pageshow', (event) => {
    // Si la página se restaura desde el caché (botón atrás)
    if (event.persisted) {
        checkToken();
        // Recargar los datos cuando se vuelve desde caché
        loadUserData();
    }
});

// También verificar cuando la página vuelve a estar visible
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        checkToken();
        // Recargar los datos cuando la página vuelve a estar visible
        loadUserData();
    }
});

// Función para verificar validez del token
function checkToken() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
}

// Función centralizada para cargar los datos del usuario
function loadUserData() {
    // Obtener el token almacenado en localStorage
    const token = localStorage.getItem('authToken');
    const currentUserData = localStorage.getItem('currentUser');
    
    if (!token) {
        // Si no hay token, redirigir a la página de login
        window.location.href = 'index.html';
        return;
    }

    // Primero intentar obtener datos del localStorage
    if (currentUserData) {
        try {
            const userData = JSON.parse(currentUserData);
            // Mostrar los datos básicos del localStorage
            document.getElementById('nombre-completo').textContent = userData.username || 'No disponible';
            document.getElementById('email').textContent = userData.email || 'No disponible';
        } catch (e) {
            console.error('Error al parsear datos del usuario desde localStorage:', e);
        }
    }

    // Decodificar token para obtener el ID del usuario
    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(window.atob(base64));
        } catch (e) {
            console.error('Error al decodificar el token:', e);
            return null;
        }
    }
    
    // Usar el token para obtener datos frescos del servidor
    const decodedToken = parseJwt(token);
    if (decodedToken) {
        let userId;
        
        // Manejar diferentes estructuras de token
        if (decodedToken.userId) {
            userId = decodedToken.userId;
        } else if (decodedToken.sub && decodedToken.sub.id) {
            userId = decodedToken.sub.id;
        } else if (decodedToken.id) {
            userId = decodedToken.id;
        }
        
        if (!userId) {
            console.error('No se pudo obtener el ID del usuario del token');
            return;
        }
        
        // Realizar petición al servidor para obtener datos actualizados del usuario
        fetch(`${API_BASE_URL}/api/usuario/id/` + userId, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            // Actualizar localStorage con los datos más recientes
            localStorage.setItem('currentUser', JSON.stringify(data));
            
            // Actualizar la interfaz con los datos del usuario
            document.getElementById('nombre-completo').textContent = data.username || 'No disponible';
            document.getElementById('email').textContent = data.email || 'No disponible';
            document.getElementById('telefono').textContent = data.phone || 'No disponible';

            
            // Ahora cargar los vehículos del usuario
            loadUserVehicles(userId, token);
        })
        .catch(error => {
            console.error('Error al obtener datos del usuario:', error);
            // Si hay error para obtener el usuario, intentar igual con los vehículos
            loadUserVehicles(userId, token);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Configurar botones
    const backToPrincipalBtn = document.getElementById('backToPrincipalBtn');
    if (backToPrincipalBtn) {
        backToPrincipalBtn.addEventListener('click', function() {
            window.location.href = 'principal.html';
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Eliminar token y datos de usuario del localStorage
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            sessionStorage.removeItem('chatEmail');
            
            // Redireccionar a la página de inicio de sesión
            window.location.href = 'index.html';
        });
    }

    // Cargar datos del usuario al iniciar la página
    loadUserData();
});

// Función para cargar los vehículos del usuario
function loadUserVehicles(userId, token) {
    // Obtener vehículo principal
    fetch(`${API_BASE_URL}/api/user-primary-vehicle`, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al obtener vehículo principal: ' + response.status);
        }
        return response.json();
    })
    .then(primaryData => {
        // Mostrar vehículo principal
        const vehiculoPrincipalElement = document.getElementById('vehiculo-principal');
        
        if (primaryData.success && primaryData.has_primary) {
            const vehiculo = primaryData.vehicle;
            vehiculoPrincipalElement.textContent = `${vehiculo.brand} ${vehiculo.model} (${vehiculo.licensePlate || vehiculo.idVehicle})`;
        } else {
            vehiculoPrincipalElement.textContent = 'No asignado';
        }
        
        // Ahora obtener todos los vehículos para mostrar los secundarios
        return fetch(`${API_BASE_URL}/api/user-vehicles/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al obtener vehículos: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        if (!data.success) {
            throw new Error(data.message || 'Error al obtener vehículos');
        }
        
        // Procesar vehículos secundarios
        const vehiculosSecundariosElement = document.getElementById('vehiculos-secundarios');
        vehiculosSecundariosElement.innerHTML = ''; // Limpiar lista anterior
        
        // Filtrar vehículos secundarios (los que no son primarios)
        // Tenemos que hacer una segunda petición para obtener el primario e identificarlo
        fetch(`${API_BASE_URL}/api/user-primary-vehicle`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(primaryData => {
            const primaryVehicleId = primaryData.has_primary ? primaryData.vehicle.idVehicle : null;
            const vehiculosSecundarios = data.vehicles.filter(v => v.idVehicle !== primaryVehicleId);
            
            if (vehiculosSecundarios.length > 0) {
                vehiculosSecundarios.forEach(vehiculo => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item';
                    li.textContent = `${vehiculo.brand} ${vehiculo.model} (${vehiculo.licensePlate || vehiculo.idVehicle})`;
                    vehiculosSecundariosElement.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.textContent = 'No tiene vehículos secundarios';
                vehiculosSecundariosElement.appendChild(li);
            }
        })
        .catch(error => {
            console.error('Error al filtrar vehículos secundarios:', error);
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = 'Error al cargar vehículos secundarios';
            vehiculosSecundariosElement.appendChild(li);
        });
    })
    .catch(error => {
        console.error('Error al obtener vehículos:', error);
        // Mostrar error en los elementos de la interfaz
        document.getElementById('vehiculo-principal').textContent = 'Error al cargar';
        
        const vehiculosSecundariosElement = document.getElementById('vehiculos-secundarios');
        vehiculosSecundariosElement.innerHTML = '';
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.textContent = 'Error al cargar vehículos';
        vehiculosSecundariosElement.appendChild(li);
    });
}

// Función para confirmar borrado
function confirmarBorrado() {
    // Obtener token y decodificarlo para obtener el username
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('Debes iniciar sesión para realizar esta acción');
        return;
    }
    
    // Decodificar token para obtener username
    function parseJwt(token) { 
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(window.atob(base64));
        } catch (e) {
            console.error('Error al decodificar el token:', e);
            return null;
        }
    }
    
    const userData = parseJwt(token);
    
    // Extraer username según la estructura del token
    let username;
    if (userData.sub) {
        username = userData.sub.username;
    } else {
        username = userData.username;
    }
    
    if (!username) {
        alert('Error al obtener datos de sesión. Por favor inicia sesión nuevamente.');
        return;
    }
    
    // Paso 1: Pedir nombre de usuario para confirmación
    const confirmUsername = prompt("Para confirmar el borrado, ingresa tu nombre de usuario:");
    
    if (!confirmUsername || confirmUsername.trim() === "") {
        alert("Debes ingresar un nombre de usuario válido.");
        return;
    }

    // Verificar que el nombre coincida
    if (confirmUsername !== username) {
        alert("El nombre de usuario no coincide con tu cuenta actual.");
        return;
    }

    // Paso 2: Confirmación explícita
    if (!confirm(`¿ESTÁS ABSOLUTAMENTE SEGURO de que deseas borrar PERMANENTEMENTE la cuenta "${username}"?`)) {
        alert("Borrado cancelado.");
        return;
    }

    // Paso 3: Enviar solicitud a la API
    fetch(`${API_BASE_URL}/api/borrar_usuario/${username}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw err; });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert(data.message);
            localStorage.removeItem('authToken'); 
            localStorage.removeItem('currentUser');
            window.location.href = "index.html";
        } else {
            throw new Error(data.message);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert(`Error al borrar usuario: ${error.message || 'Error desconocido'}`);
    });
}