function preventCaching() {
    // NO ALMACENA CACHÉ
    if (window.location.protocol != 'file:') {
        window.history.replaceState(null, document.title, window.location.href);
    }
}

preventCaching();

// Verificación inmediata de autenticación (se ejecuta al cargar el script)
function checkToken() {
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');

    // Si no hay token o usuario, redirigir al login
    if (!authToken || !currentUser) {
        window.location.replace('index.html');
        return;
    }
}

// Verificar autenticación cuando la página vuelve a estar activa
window.addEventListener('pageshow', (event) => {
    // Si la página se restaura desde el caché (botón atrás)
    if (event.persisted) {
        console.log('Página restaurada desde caché - verificando autenticación');
        checkToken();
        // Recargar los datos cuando se vuelve desde caché
        loadUserData();
    }
});

// También verificar cuando la página vuelve a estar visible
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('Página visible - verificando autenticación');
        checkToken();
        // Recargar los datos cuando la página vuelve a estar visible
        loadUserData();
    }
});

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
            document.getElementById('vehiculo-principal').textContent = userData.VP || 'No asignado';
            
            // Configurar lista de vehículos secundarios
            const vehiculosSecundariosElement = document.getElementById('vehiculos-secundarios');
            vehiculosSecundariosElement.innerHTML = '';
            
            if (userData.VP2 && userData.VP2.trim() !== '') {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.textContent = userData.VP2;
                vehiculosSecundariosElement.appendChild(li);
            } else {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.textContent = 'No tiene vehículos secundarios';
                vehiculosSecundariosElement.appendChild(li);
            }
        } catch (e) {
            console.error('Error al parsear datos del usuario desde localStorage:', e);
        }
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

    const tokenData = parseJwt(token);
    
    // Verificar la estructura del token y mostrar en consola para depuración
    console.log('Datos del token decodificado:', tokenData);
    
    // Verificar si el token tiene la estructura esperada
    if (!tokenData) {
        alert('Error al obtener los datos del usuario. Por favor inicia sesión nuevamente.');
        window.location.href = 'index.html';
        return;
    }

    // Extraer información del usuario del token según su estructura
    let username;
    
    // Maneja ambas estructuras posibles (con sub o directamente en el token)
    if (tokenData.sub) {
        username = tokenData.sub.username;
    } else {
        username = tokenData.username;
    }

    if (!username) {
        console.error('No se pudo obtener el nombre de usuario del token');
        return;
    }
    
    // Obtener datos más recientes del servidor
    fetch(`http://localhost:5000/api/usuario/${username}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            // Añadir cabecera para evitar caché
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    })
    .then(response => {
        if (!response.ok) {
            console.log('No se pudieron obtener datos adicionales del servidor');
            return null;
        }
        return response.json();
    })
    .then(data => {
        if (data && data.success) {
            // Actualizar con datos más completos del servidor
            document.getElementById('nombre-completo').textContent = data.nombre || username;
            document.getElementById('email').textContent = data.email || 'No disponible';
            document.getElementById('vehiculo-principal').textContent = data.vehiculo_principal || 'No asignado';
            
            // Actualizar vehículos secundarios
            const vehiculosSecundariosElement = document.getElementById('vehiculos-secundarios');
            vehiculosSecundariosElement.innerHTML = '';
            
            if (data.vehiculos_secundarios && data.vehiculos_secundarios.length > 0) {
                data.vehiculos_secundarios.forEach(vehiculo => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item';
                    li.textContent = vehiculo;
                    vehiculosSecundariosElement.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.textContent = 'No tiene vehículos secundarios';
                vehiculosSecundariosElement.appendChild(li);
            }
            
            // Actualizar localStorage con los datos más recientes
            const currentUserObj = {
                username: data.nombre || username,
                email: data.email || '',
                VP: data.vehiculo_principal || '',
                VP2: data.vehiculos_secundarios && data.vehiculos_secundarios.length > 0 
                    ? data.vehiculos_secundarios[0] : ''
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUserObj));
        }
    })
    .catch(error => {
        console.error('Error al obtener datos adicionales:', error);
    });
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
            
            // Redireccionar a la página de inicio de sesión
            window.location.href = 'index.html';
        });
    }

    // Cargar datos del usuario al iniciar la página
    loadUserData();
});

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
    fetch(`http://localhost:5000/api/borrar_usuario/${username}`, {
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