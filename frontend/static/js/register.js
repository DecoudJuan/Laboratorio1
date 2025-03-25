// Elementos DOM
const registerForm = document.getElementById('registerForm');
const adminRegisterForm = document.getElementById('adminRegisterForm');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const showAdminRegisterBtn = document.getElementById('showAdminRegisterBtn');
const backToLoginBtn = document.getElementById('backToLoginBtn');
const backToLoginFromAdminBtn = document.getElementById('backToLoginFromAdminBtn');

// Mostrar formulario de registro normal
showRegisterBtn.addEventListener('click', function() {
    registerForm.style.display = 'block';
    adminRegisterForm.style.display = 'none';
    
    document.getElementById('registerModalContainer').style.display = 'none';

});

// Mostrar formulario de registro de administrador
showAdminRegisterBtn.addEventListener('click', function() {
    registerForm.style.display = 'none';
    adminRegisterForm.style.display = 'block';

    document.getElementById('registerModalContainer').style.display = 'none';

});

// Volver a opciones de registro desde formulario de registro normal
backToRegisterOptions.addEventListener('click', function() {
    registerForm.style.display = 'none';
    document.getElementById('registerModalContainer').style.display = 'block';
    $('#registerModal').modal('show');
});

// Volver a opciones de registro desde formulario de registro de administrador
backToRegisterOptionsAdmin.addEventListener('click', function() {
    adminRegisterForm.style.display = 'none';
    document.getElementById('registerModalContainer').style.display = 'block';
    $('#registerModal').modal('show');
});

// Volver a inicio de sesión desde registro normal
backToLoginBtn.addEventListener('click', function() {
    window.location.href = 'index.html';
});

// Volver a inicio de sesión desde registro de administrador
backToLoginFromAdminBtn.addEventListener('click', function() {
    window.location.href = 'index.html';
});

// Manejar el registro de usuarios
document.getElementById('registerUserForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageElement = document.getElementById('registerMessage');
    
    // Simular el registro de usuario (en un caso real, enviarías una solicitud al servidor)
    const users = JSON.parse(localStorage.getItem('users')) || [];
    users.push({ username, email, password });
    localStorage.setItem('users', JSON.stringify(users));
    
    messageElement.textContent = 'Registro exitoso! Ahora puedes iniciar sesión.';
    messageElement.className = 'message success';
    messageElement.style.display = 'block';
    
    // Limpiar el formulario
    document.getElementById('registerUserForm').reset();
    
    // Volver a la pantalla de inicio de sesión después de 2 segundos
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
});

// Manejar el registro de administradores
document.getElementById('registerAdminForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const adminName = document.getElementById('adminName').value;
    const adminEmail = document.getElementById('adminEmail').value;
    const adminPassword = document.getElementById('adminPassword').value;
    const adminConfirmPassword = document.getElementById('adminConfirmPassword').value;
    const adminCode = document.getElementById('adminCode').value;
    const messageElement = document.getElementById('adminRegisterMessage');
    
    // Validar que las contraseñas coincidan
    if (adminPassword !== adminConfirmPassword) {
        messageElement.textContent = 'Las contraseñas no coinciden.';
        messageElement.className = 'message error';
        messageElement.style.display = 'block';
        return;
    }
    
    // Validar el código de administrador (en un caso real, esto se haría en el servidor)
    const ADMIN_CODE = "admin123"; // Código de ejemplo
    if (adminCode !== ADMIN_CODE) {
        messageElement.textContent = 'Código de administrador incorrecto.';
        messageElement.className = 'message error';
        messageElement.style.display = 'block';
        return;
    }
    
    // Simular el registro de administrador (en un caso real, enviarías una solicitud al servidor)
    const admins = JSON.parse(localStorage.getItem('admins')) || [];
    admins.push({ adminName, adminEmail, adminPassword });
    localStorage.setItem('admins', JSON.stringify(admins));
    
    messageElement.textContent = 'Registro de administrador exitoso! Ahora puedes iniciar sesión.';
    messageElement.className = 'message success';
    messageElement.style.display = 'block';
    
    // Limpiar el formulario
    document.getElementById('registerAdminForm').reset();
    
    // Volver a la pantalla de inicio de sesión después de 2 segundos
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
});