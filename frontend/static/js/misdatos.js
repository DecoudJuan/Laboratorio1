// Elementos DOM (manteniendo tus IDs originales)
const registerForm = document.getElementById('registerForm');
const adminRegisterForm = document.getElementById('adminRegisterForm');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const showAdminRegisterBtn = document.getElementById('showAdminRegisterBtn');
const backToLoginBtn = document.getElementById('backToLoginBtn');
const backToLoginBtn2 = document.getElementById('backToLoginBtn2');
const backToLoginBtn3 = document.getElementById('backToLoginBtn3');
const backToRegisterOptions = document.getElementById('backToRegisterOptions');
const backToRegisterOptionsAdmin = document.getElementById('backToRegisterOptionsAdmin');

// Mostrar formularios (manteniendo tu lógica original)
showRegisterBtn.addEventListener('click', function() {
    registerForm.style.display = 'block';
    adminRegisterForm.style.display = 'none';
    document.getElementById('registerModalContainer').style.display = 'none';
});

showAdminRegisterBtn.addEventListener('click', function() {
    registerForm.style.display = 'none';
    adminRegisterForm.style.display = 'block';
    document.getElementById('registerModalContainer').style.display = 'none';
});

// Botones de volver (manteniendo tus IDs originales)
backToRegisterOptions.addEventListener('click', function() {
    registerForm.style.display = 'none';
    document.getElementById('registerModalContainer').style.display = 'block';
    $('#registerModal').modal('show');
});

backToRegisterOptionsAdmin.addEventListener('click', function() {
    adminRegisterForm.style.display = 'none';
    document.getElementById('registerModalContainer').style.display = 'block';
    $('#registerModal').modal('show');
});

backToLoginBtn.addEventListener('click', function() {
    window.location.href = 'index.html';
});

backToLoginBtn2.addEventListener('click', function() {
    window.location.href = 'index.html';
});

backToLoginBtn3.addEventListener('click', function() {
    window.location.href = 'index.html';
});

// Base URL para las peticiones API (ajustar según tu backend)
const API_BASE_URL = 'http://localhost:5000';

// Función para realizar peticiones a la API
async function apiRequest(endpoint, method, data) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: data ? JSON.stringify(data) : null
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
            throw new Error(responseData.message || 'Ocurrió un error en la petición');
        }
        
        return responseData;
    } catch (error) {
        console.error('Error en la petición API:', error);
        throw error;
    }
}

function getUsernameFromToken() {
    const token = localStorage.getItem("authToken");
    if (!token) return null;

    const payloadBase64 = token.split('.')[1];
    try {
        const payload = JSON.parse(atob(payloadBase64));
        return payload.username; // Asegurate que el token tenga un campo llamado "username"
    } catch (e) {
        console.error("Error al decodificar el token:", e);
        return null;
    }
}


// Función de borrado modificada para usar API
// Función para mostrar el modal de confirmación
function confirmarBorrado() {
    // Paso 1: Pedir nombre de usuario para confirmación
    const username = prompt("Para confirmar el borrado, ingresa tu nombre de usuario:");
    print(username)
    if (!username || username.trim() === "") {
        alert("Debes ingresar un nombre de usuario válido.");
        return;
    }

    // Paso 2: Confirmación explícita
    if (!confirm(`¿ESTÁS ABSOLUTAMENTE SEGURO de que deseas borrar PERMANENTEMENTE la cuenta "${username}"?`)) {
        alert("Borrado cancelado.");
        return;
    }

    // Paso 3: Enviar solicitud a tu ruta específica
    fetch(`/api/borrar_usuario/${username}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
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
            localStorage.removeItem('authToken'); // Limpiar sesión
            window.location.href = "/"; // Redirigir al inicio
        } else {
            throw new Error(data.message);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert(`Error al borrar usuario: ${error.message}`);
    });
}
// Manejadores de eventos para ambos formularios
document.getElementById('registerUserForm')?.addEventListener('submit', (e) => handleRegistration(e, false));
document.getElementById('registerAdminForm')?.addEventListener('submit', (e) => handleRegistration(e, true));