// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario está logueado y es administrador
    if (!isAdmin()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Cargar lista de usuarios
    loadUsers();
    
    // Configurar el botón de logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        logout();
    });
});

// Función para verificar si el usuario tiene permisos de administrador
function isAdmin() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return false;
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    return currentUser && currentUser.userRole === 'administrador';
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
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