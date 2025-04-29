// Elementos DOM
const loginContainer = document.getElementById('loginContainer');

// Función para guardar el token en localStorage
function saveAuthToken(token, user) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// Función para verificar si hay un token (usuario logueado)
function isLoggedIn() {
    return localStorage.getItem('authToken') !== null;
}

// Función para redireccionar según el rol del usuario
function redirectByRole(role) {
    if (role === 'administrador') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'principal.html';
    }
}

// Verificar al cargar la página si el usuario ya está logueado
document.addEventListener('DOMContentLoaded', function() {
    // NO REDIRECCIONAR EN INDEX.HTML
    const isLoginPage = window.location.pathname.includes('index.html') || 
    window.location.pathname === '/';

    if (isLoggedIn() && !isLoginPage) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    redirectByRole(user.userRole);
    }
});

// Verificar al cargar la página si el usuario ya está logueado
document.addEventListener('DOMContentLoaded', function() {
    // NO REDIRECCIONAR EN REGISTER.HTML
    const isRegisterPage = window.location.pathname.includes('register.html') || 
    window.location.pathname === '/register.html';

    if (isLoggedIn() && !isRegisterPage) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    redirectByRole(user.userRole);
    }
});

// Formulario de inicio de sesión
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const messageElement = document.getElementById('loginMessage');
    
    // Mostrar mensaje de carga
    messageElement.textContent = 'Iniciando sesión...';
    messageElement.className = 'message info';
    messageElement.style.display = 'block';
    
    // Hacer la petición al backend
    fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Login exitoso
            messageElement.textContent = `¡Bienvenido ${data.user.username}!`;
            messageElement.className = 'message success';
            
            // Guardar token y datos del usuario
            saveAuthToken(data.token, data.user);
            
            // Redireccionar según el rol
            setTimeout(() => {
                redirectByRole(data.user.userRole);
            }, 1000);
        } else {
            // Login fallido
            messageElement.textContent = data.message || 'Error al iniciar sesión';
            messageElement.className = 'message error';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        messageElement.textContent = 'Error de conexión. Intenta más tarde.';
        messageElement.className = 'message error';
    });
});

// Función para cerrar sesión (puedes agregarla a un botón de logout)
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
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