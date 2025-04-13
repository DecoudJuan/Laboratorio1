backToPrincipalBtn = document.getElementById('backToPrincipalBtn');


document.addEventListener('DOMContentLoaded', () => {
    const username = String(document.getElementById('username').value);
  
    if (!username) {
      console.error("No se encontró el nombre de usuario.");
      return;
    }
  
    fetch(`http://localhost:5000/api/usuario/${username}`)
      .then(res => {
        if (!res.ok) {
          throw new Error("No se pudo obtener el usuario");
        }
        return res.json();
      })
      .then(data => {
        document.getElementById('nombre-completo').textContent = data.nombre_completo;
        document.getElementById('email').textContent = data.email;
        document.getElementById('vehiculo-principal').textContent = data.vehiculo_principal;
        document.getElementById('vehiculo-secundario').textContent = data.vehiculo_secundario;
      })
      .catch(err => {
        console.error("Error al obtener datos del usuario:", err);
      });
  });

backToPrincipalBtn.addEventListener('click', function() {
    window.location.href = 'principal.html';
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
    fetch(`http://localhost:5000/api/borrar_usuario/${username}`, {
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