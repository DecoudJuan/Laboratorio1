function preventCaching() {
    // NO ALMACENA CACHÉ
    if (window.location.protocol != 'file:') {
        window.history.replaceState(null, document.title, window.location.href);
    }
}

// LLAMA A LA FUNCION
preventCaching();

// Verificación básica de autenticación (solo al cargar)
function checkToken() {
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');


    // Si no hay token o usuario, redirigir al login
    if (!authToken || !currentUser) {
        window.location.replace('index.html');
        return false;
    }
    
    // Verificar si el usuario es administrador
    try {
        const userData = JSON.parse(currentUser);
        if (userData.userRole !== 'administrador') {
            alert('No tienes permisos de administrador');
            window.location.replace('index.html');
            return false;
        }
    } catch (e) {
        console.error('Error al procesar datos de usuario:', e);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.replace('index.html');
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación solo al cargar la página
    if (!checkToken()) {
        return;
    }

    // Obtener el token almacenado en localStorage
    const token = localStorage.getItem('authToken');

    // Configurar botón de logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        // Eliminar token y datos de usuario del localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        
        // Redireccionar a la página de inicio de sesión
        window.location.href = 'index.html';
    });

    // Decodificar token para obtener datos del usuario
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
    

    
    // Verificar si el token tiene la estructura esperada
    if (!userData) {
        alert('Error al obtener los datos del usuario. Por favor inicia sesión nuevamente.');
        window.location.href = 'index.html';
        return;
    }

    // Extraer información del usuario del token según su estructura
    let username, email;
    
    // Maneja ambas estructuras posibles (con sub o directamente en el token)
    if (userData.sub) {
        // Si los datos están dentro de 'sub'
        username = userData.sub.username;
        email = userData.sub.email;
    } else {
        // Si los datos están directamente en el token
        username = userData.username;
        email = userData.email;
    }

    // Mostrar los datos básicos del token
    document.getElementById('nombre-completo').textContent = username || 'No disponible';
    document.getElementById('email').textContent = email || 'No disponible';
    document.getElementById('telefono').textContent = 'No disponible'; // Cambié data.phone por string fijo
    
    // Configurar lista de vehículos secundarios inicialmente vacía
    const vehiculosSecundariosElement = document.getElementById('vehiculos-secundarios');
    if (vehiculosSecundariosElement) {
        vehiculosSecundariosElement.innerHTML = '';
        
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.textContent = 'No asignado';
        vehiculosSecundariosElement.appendChild(li);
    }
    
    // Intentar obtener datos adicionales del servidor
    fetch(`http://localhost:5000/api/usuario/${username}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            return null;
        }
        return response.json();
    })
    .then(data => {
        if (data && data.success) {
            // Actualizar con datos más completos del servidor
            const vehiculoPrincipalElement = document.getElementById('vehiculo-principal');
            if (vehiculoPrincipalElement) {
                vehiculoPrincipalElement.textContent = data.vehiculo_principal || 'No asignado';
            }
            
            // Actualizar vehículos secundarios
            if (vehiculosSecundariosElement) {
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
                    li.textContent = 'No asignado';
                    vehiculosSecundariosElement.appendChild(li);
                }
            }
        }
    })
    .catch(error => {
        console.error('Error al obtener datos adicionales:', error);
    });
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
function goBackToAdmin() {
    // Ir directamente a admin.html sin pasar por verificaciones
    window.location.replace('admin.html');
}