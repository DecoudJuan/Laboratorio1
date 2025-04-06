// Función para obtener todos los usuarios
async function loadUsers() {
    try {
        const token = localStorage.getItem('token'); // Asume que guardas el token en localStorage
        const response = await fetch('/api/v1/users', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar usuarios');
        }
        
        const data = await response.json();
        renderUsers(data);
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudieron cargar los usuarios. Por favor, intenta nuevamente.');
    }
}

// Función para renderizar los usuarios en la tabla
function renderUsers(data) {
    const tableBody = document.querySelector('.user-table tbody');
    tableBody.innerHTML = '';
    
    if (data && data.users && data.users.length > 0) {
        data.users.forEach((user, index) => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.userRole}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td><span class="badge ${user.active ? 'bg-success' : 'bg-danger'}">${user.active ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <div class="user-actions">
                        <button class="btn btn-edit btn-sm" data-id="${user.idUser}" onclick="prepareEditUser(${user.idUser})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-delete btn-sm" data-id="${user.idUser}" onclick="confirmDeleteUser(${user.idUser})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay usuarios disponibles</td></tr>';
    }
}

// Función para crear usuario
async function createUser(event) {
    event.preventDefault();
    
    const username = document.getElementById('newUsername').value;
    const email = document.getElementById('newEmail').value;
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password,
                rol: role
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Usuario creado exitosamente');
            const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
            modal.hide();
            loadUsers(); // Recargar la lista de usuarios
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al crear el usuario');
    }
}

// Función para preparar edición de usuario
async function prepareEditUser(userId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/v1/users/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener datos del usuario');
        }
        
        const userData = await response.json();
        document.getElementById('editUserId').value = userData.user.idUser;
        document.getElementById('editUsername').value = userData.user.username;
        document.getElementById('editEmail').value = userData.user.email;
        document.getElementById('editRole').value = userData.user.userRole;
        document.getElementById('editStatus').value = userData.user.active ? 'activo' : 'inactivo';
        
        const editModal = new bootstrap.Modal(document.getElementById('editUserModal'));
        editModal.show();
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo cargar la información del usuario');
    }
}

// Función para actualizar usuario
async function updateUser(event) {
    event.preventDefault();
    
    const userId = document.getElementById('editUserId').value;
    const username = document.getElementById('editUsername').value;
    const email = document.getElementById('editEmail').value;
    const password = document.getElementById('editPassword').value;
    const role = document.getElementById('editRole').value;
    const status = document.getElementById('editStatus').value === 'activo';
    
    const userData = {
        username: username,
        email: email,
        userRole: role,
        active: status
    };
    
    // Solo incluir password si se proporcionó uno nuevo
    if (password) {
        userData.password = password;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/v1/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (data.message === 'success') {
            alert('Usuario actualizado exitosamente');
            const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
            modal.hide();
            loadUsers(); // Recargar la lista de usuarios
        } else {
            alert('Error al actualizar el usuario');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar el usuario');
    }
}

// Función para confirmar eliminación
function confirmDeleteUser(userId) {
    document.querySelector('#deleteConfirmModal .btn-delete').dataset.userId = userId;
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    deleteModal.show();
}

// Función para eliminar usuario
async function deleteUser(userId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/v1/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.message === 'success') {
            alert('Usuario eliminado exitosamente');
            loadUsers(); // Recargar la lista de usuarios
        } else {
            alert('Error al eliminar el usuario');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el usuario');
    }
}

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario está autenticado
    const token = localStorage.getItem('token');
    if (!token) {
        // Redirigir a la página de login si no hay token
        window.location.href = 'login.html';
        return;
    }
    
    // Cargar los usuarios
    loadUsers();
    
    // Configurar eventos para los formularios
    document.getElementById('addUserForm').addEventListener('submit', createUser);
    document.getElementById('editUserForm').addEventListener('submit', updateUser);
    
    // Configurar botón de eliminación en el modal de confirmación
    document.querySelector('#deleteConfirmModal .btn-delete').addEventListener('click', function() {
        const userId = this.dataset.userId;
        deleteUser(userId);
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
        modal.hide();
    });
    
    // Configurar búsqueda de usuarios
    document.getElementById('searchButton').addEventListener('click', function() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        // Para una búsqueda local (client-side)
        const rows = document.querySelectorAll('.user-table tbody tr');
        
        rows.forEach(row => {
            const username = row.cells[1].textContent.toLowerCase();
            const email = row.cells[2].textContent.toLowerCase();
            
            if (username.includes(searchTerm) || email.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
    
    // Configurar el botón de logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });
});