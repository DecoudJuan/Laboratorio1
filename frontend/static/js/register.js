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

// Función de registro modificada para usar API
async function handleRegistration(event, isAdmin = false) {
    event.preventDefault();
    
    const form = event.target;
    const username = form.querySelector('[name="username"]').value;
    const phone = form.querySelector('[name="phone"]').value;
    const email = form.querySelector('[name="email"]').value;
    const password = form.querySelector('[name="password"]').value;
    const confirmPassword = form.querySelector('[name="confirmPassword"]').value;
    
    // Selecciona el mensaje correcto según el formulario
    const messageElement = isAdmin 
        ? document.getElementById('adminRegisterMessage')
        : document.getElementById('registerMessage');
    
    // Campo adminCode solo para formulario de admin
    const adminCode = isAdmin ? form.querySelector('[name="adminCode"]').value : '';

    // Validaciones en el cliente
    if (password !== confirmPassword) {
        showMessage(messageElement, 'Las contraseñas no coinciden.', 'error');
        return;
    }
    
    try {
        // Preparar datos para enviar
        const userData = {
            username,
            phone,
            email,
            password,
            rol: isAdmin ? 'administrador' : 'usuario'
        };
        
        // Si es admin, incluir código de administrador
        if (isAdmin) {
            userData.adminCode = adminCode;
        }
        
        // Endpoint según tipo de registro
        const endpoint = isAdmin ? '/api/register/admin' : '/api/register';
        
        // Enviar datos a la API
        const response = await apiRequest(endpoint, 'POST', userData);
        
        // Mostrar mensaje de éxito
        showMessage(messageElement, response.message || `Registro como ${userData.rol} exitoso! Redirigiendo...`, 'success');
        
        // Redireccionar después de un tiempo
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        // Mostrar mensaje de error
        showMessage(messageElement, error.message || 'Error en el registro.', 'error');
    }
}

// Función para mostrar mensajes (mantener igual)
function showMessage(element, text, type) {
    element.textContent = text;
    element.className = `message ${type}`;
    element.style.display = 'block';
}

// Manejadores de eventos para ambos formularios
document.getElementById('registerUserForm')?.addEventListener('submit', (e) => handleRegistration(e, false));
document.getElementById('registerAdminForm')?.addEventListener('submit', (e) => handleRegistration(e, true));