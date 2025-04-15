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
    
    console.log('Auth Token:', authToken);
    console.log('Current User:', currentUser);

    // Si no hay token o usuario, redirigir al login
    if (!authToken || !currentUser) {
        window.location.replace('index.html');
        return;
    }
    
    // Verificar si el usuario es administrador
    try {
        const userData = JSON.parse(currentUser);
        if (userData.userRole !== 'administrador') {
            alert('No tienes permisos de administrador');
            window.location.replace('index.html');
        }
    } catch (e) {
        console.error('Error al procesar datos de usuario:', e);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.replace('index.html');
    }
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
        console.log('Página visible - verificando autenticación');
        checkToken();
    }
});

// Verificar autenticación al cargar la página completamente
document.addEventListener('DOMContentLoaded', () => {

    // Verificar si el usuario está logueado y es administrador
    if (!isAdmin()) {
        window.location.replace('index.html');
        return;
    }
    
    // Cargar lista de usuarios
    loadUsers();
    
    document.getElementById('logoutBtn').addEventListener('click', () => {
        // Eliminar token y datos de usuario del localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        console.log(localStorage.getItem('authToken'));
        
        // Redireccionar a la página de inicio de sesión
        window.location.replace('index.html'); // replace elimina la entrada actual del historial
    });
});

// Función para verificar si el usuario tiene permisos de administrador
function isAdmin() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return false;
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    return currentUser && currentUser.userRole === 'administrador';
}

// Función para cargar la lista de usuarios
function loadUsers() {
    const authToken = localStorage.getItem('authToken');
    
    fetch('http://localhost:5000/api/users', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayUsers(data.users);
        } else {
            alert(data.message || 'Error al cargar usuarios');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al cargar los usuarios. Por favor, intenta más tarde.');
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
            <td>${user.username}</td>
            <td>${user.phone || 'No disponible'}</td>
            <td>${user.email}</td>
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
        .then(response => response.json())
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
            alert('Error al eliminar el usuario. Por favor, intenta más tarde.');
        });
    }
}