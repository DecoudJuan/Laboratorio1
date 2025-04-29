function preventCaching() {
    // NO ALMACENA CACHÉ
    if (window.location.protocol != 'file:') {
        window.history.replaceState(null, document.title, window.location.href);
    }
}

// LLAMA A LA FUNCION
preventCaching();

// Verificación inmediata de autenticación (se ejecuta al cargar el script)
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
        return true;
    } catch (e) {
        console.error('Error al procesar datos de usuario:', e);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.replace('index.html');
        return false;
    }
}

// Ejecutar verificación inmediatamente
// Esto es crítico para evitar que se vea la página cuando se usa el botón atrás
if (!checkToken()) {
    // Si no pasa la verificación, no seguir ejecutando el script
    throw new Error("Verificación de autenticación fallida");
}

function pedirContrasenaSector() {
    const contrasenaCorrecta = "superadmin123"; 
    const input = prompt("Ingrese la contraseña para acceder a Administración de Sectores:");
    if (input === contrasenaCorrecta) {
        window.location.href = "sectores.html";
    } else if (input !== null) {
        alert("Contraseña incorrecta.");
    }
}

function pedirContrasenaParking() {
    const contrasenaCorrecta = "superadmin123"; 
    const input = prompt("Ingrese la contraseña para acceder a Administración de Sectores:");
    if (input === contrasenaCorrecta) {
        window.location.href = "edicionestablecimiento.html";
    } else if (input !== null) {
        alert("Contraseña incorrecta.");
    }
}    
        
// Configurar evento para el botón de cerrar sesión
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        // Eliminar token y datos de usuario del localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        
        // Redireccionar a la página de inicio de sesión
        window.location.replace('index.html'); // replace elimina la entrada actual del historial
    });
}

// Verificar autenticación cuando la página vuelve a estar activa
window.addEventListener('pageshow', (event) => {
    // Si la página se restaura desde el caché (botón atrás)
    if (event.persisted) {
        console.log('Página restaurada desde caché - verificando autenticación');
        checkToken();
    }
});

// También verificar cuando la página vuelve a estar visible
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        checkToken();
    }
});

// Función para verificar si el usuario tiene permisos de administrador
function isAdmin() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return false;
    
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        return currentUser && currentUser.userRole === 'administrador';
    } catch (e) {
        console.error('Error al verificar rol de administrador:', e);
        return false;
    }
}

// Función para cargar la lista de usuarios con mejor manejo de errores
function loadUsers() {
    const authToken = localStorage.getItem('authToken');
    
    // Mostrar indicador de carga
    const tableBody = document.querySelector('tbody');
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Cargando usuarios...</td></tr>';
    
    fetch('http://localhost:5000/api/users', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        // Verificar respuesta HTTP
        if (!response.ok) {
            console.error('Error HTTP:', response.status, response.statusText);
            if (response.status === 401 || response.status === 403) {
                alert('No autorizado o sesión expirada. Por favor, inicia sesión nuevamente.');
                // Limpiar tokens y redirigir
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                window.location.replace('index.html');
                throw new Error('No autorizado');
            }
            throw new Error(`Error del servidor: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Datos recibidos:', data); // Depuración
        if (data.success) {
            displayUsers(data.users);
        } else {
            alert(data.message || 'Error al cargar usuarios');
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Error al cargar usuarios</td></tr>';
        }
    })
    .catch(error => {
        console.error('Error completo:', error);
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Error de conexión</td></tr>';
        
        // Solo mostrar alerta si no es un error de autorización (ya manejado arriba)
        if (!error.message.includes('No autorizado')) {
            alert('Error al cargar los usuarios. Por favor, intenta más tarde.');
        }
    });
}

// Función para mostrar los usuarios en la tabla
function displayUsers(users) {
    const tableBody = document.querySelector('tbody');
    tableBody.innerHTML = '';
    
    if (!users || users.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" class="text-center">No hay usuarios registrados</td>';
        tableBody.appendChild(row);
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.username || 'N/A'}</td>
            <td>${user.phone || 'No disponible'}</td>
            <td>${user.email || 'N/A'}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteUser('${user.username}')">Eliminar</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Función para eliminar un usuario
function deleteUser(username) {
    if (confirm(`¿Estás seguro que deseas eliminar al usuario "${username}"?`)) {
        const authToken = localStorage.getItem('authToken');
        
        fetch(`http://localhost:5000/api/borrar_usuario/${username}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    alert('No autorizado o sesión expirada. Por favor, inicia sesión nuevamente.');
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('currentUser');
                    window.location.replace('index.html');
                    throw new Error('No autorizado');
                }
                throw new Error(`Error del servidor: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('Usuario eliminado correctamente');
                loadUsers(); // Recargar la lista de usuarios
            } else {
                alert(data.message || 'Error al eliminar el usuario');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            if (!error.message.includes('No autorizado')) {
                alert('Error al eliminar el usuario. Por favor, intenta más tarde.');
            }
        });
    }
}

// Verificar autenticación al cargar la página completamente
document.addEventListener('DOMContentLoaded', () => {
    
    // Verificar si el usuario está logueado y es administrador
    if (!isAdmin()) {
        window.location.replace('index.html');
        return;
    }
    
    // Cargar lista de usuarios
    loadUsers();

});