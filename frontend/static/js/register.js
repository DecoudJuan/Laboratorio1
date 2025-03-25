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