// Datos simulados para almacenar usuarios (en un caso real usarías una base de datos)
let users = JSON.parse(localStorage.getItem('users')) || [];
let admins = JSON.parse(localStorage.getItem('admins')) || [];
const ADMIN_CODE = "admin123"; // Código de ejemplo para registrarse como administrador

// Elementos DOM
const loginContainer = document.getElementById('loginContainer');
const registerForm = document.getElementById('registerForm');
const adminRegisterForm = document.getElementById('adminRegisterForm');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const showAdminRegisterBtn = document.getElementById('showAdminRegisterBtn');
const backToLoginBtn = document.getElementById('backToLoginBtn');
const backToLoginFromAdminBtn = document.getElementById('backToLoginFromAdminBtn');

// Mostrar formulario de registro normal
showRegisterBtn.addEventListener('click', function() {
    loginContainer.style.display = 'none';
    registerForm.style.display = 'block';
    adminRegisterForm.style.display = 'none';
    showRegisterBtn.style.display = 'none';
    showAdminRegisterBtn.style.display = 'none';
});

// Mostrar formulario de registro de administrador
showAdminRegisterBtn.addEventListener('click', function() {
    loginContainer.style.display = 'none';
    registerForm.style.display = 'none';
    adminRegisterForm.style.display = 'block';
    showRegisterBtn.style.display = 'none';
    showAdminRegisterBtn.style.display = 'none';
});

// Volver a inicio de sesión desde registro normal
backToLoginBtn.addEventListener('click', function() {
    loginContainer.style.display = 'block';
    registerForm.style.display = 'none';
    adminRegisterForm.style.display = 'none';
    showRegisterBtn.style.display = 'block';
    showAdminRegisterBtn.style.display = 'block';
});

// Volver a inicio de sesión desde registro de administrador
backToLoginFromAdminBtn.addEventListener('click', function() {
    loginContainer.style.display = 'block';
    registerForm.style.display = 'none';
    adminRegisterForm.style.display = 'none';
    showRegisterBtn.style.display = 'block';
    showAdminRegisterBtn.style.display = 'block';
});

// Formulario de inicio de sesión
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const messageElement = document.getElementById('loginMessage');
    
    // Buscar usuario normal
    const user = users.find(u => u.email === email && u.password === password);
    
    // Buscar administrador
    const admin = admins.find(a => a.email === email && a.password === password);
    
    if (user) {
        // Login exitoso - usuario normal
        messageElement.textContent = 'Inicio de sesión exitoso como usuario!';
        window.location.href = 'principal.html'; // Comentado para demo

    } else if (admin) {
        // Login exitoso - administrador
        messageElement.textContent = 'Inicio de sesión exitoso como administrador!';
        window.location.href = 'admin.html'; // Comentado para demo

    } else {
        // Login fallido
        messageElement.textContent = 'Correo o contraseña incorrectos.';
        messageElement.className = 'message error';
        messageElement.style.display = 'block';
    }
});

// Formulario de registro normal
document.getElementById('registerUserForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const messageElement = document.getElementById('registerMessage');
    
    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
        messageElement.textContent = 'Las contraseñas no coinciden.';
        messageElement.className = 'message error';
        messageElement.style.display = 'block';
        return;
    }
    
    // Validar si el correo ya está registrado
    if (users.some(u => u.email === email) || admins.some(a => a.email === email)) {
        messageElement.textContent = 'Este correo ya está registrado.';
        messageElement.className = 'message error';
        messageElement.style.display = 'block';
        return;
    }
    
    // Registrar nuevo usuario
    const newUser = {
        name,
        email,
        password,
        role: 'user'
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Mostrar mensaje de éxito
    messageElement.textContent = 'Registro exitoso! Ahora puedes iniciar sesión.';
    messageElement.className = 'message success';
    messageElement.style.display = 'block';
    
    // Limpiar formulario
    document.getElementById('registerUserForm').reset();
    
    // Volver a la pantalla de inicio de sesión después de 2 segundos
    setTimeout(() => {
        backToLoginBtn.click();
    }, 2000);
});

// Formulario de registro de administrador
document.getElementById('registerAdminForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const name = document.getElementById('adminName').value;
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const confirmPassword = document.getElementById('adminConfirmPassword').value;
    const adminCode = document.getElementById('adminCode').value;
    const messageElement = document.getElementById('adminRegisterMessage');
    
    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
        messageElement.textContent = 'Las contraseñas no coinciden.';
        messageElement.className = 'message error';
        messageElement.style.display = 'block';
        return;
    }
    
    // Validar el código de administrador
    if (adminCode !== ADMIN_CODE) {
        messageElement.textContent = 'Código de administrador inválido.';
        messageElement.className = 'message error';
        messageElement.style.display = 'block';
        return;
    }
    
    // Validar si el correo ya está registrado
    if (users.some(u => u.email === email) || admins.some(a => a.email === email)) {
        messageElement.textContent = 'Este correo ya está registrado.';
        messageElement.className = 'message error';
        messageElement.style.display = 'block';
        return;
    }
    
    // Registrar nuevo administrador
    const newAdmin = {
        name,
        email,
        password,
        role: 'admin'
    };
    
    admins.push(newAdmin);
    localStorage.setItem('admins', JSON.stringify(admins));
    
    // Mostrar mensaje de éxito
    messageElement.textContent = 'Registro de administrador exitoso! Ahora puedes iniciar sesión.';
    messageElement.className = 'message success';
    messageElement.style.display = 'block';
    
    // Limpiar formulario
    document.getElementById('registerAdminForm').reset();
    
    // Volver a la pantalla de inicio de sesión después de 2 segundos
    setTimeout(() => {
        backToLoginFromAdminBtn.click();
    }, 2000);
});

document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".toggle-password").forEach(button => {
        button.addEventListener("click", function () {
            let targetId = this.getAttribute("data-target");
            let passwordInput = document.getElementById(targetId);
            let icon = this.querySelector("i");

            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                icon.classList.replace("bi-eye", "bi-eye-slash");
            } else {
                passwordInput.type = "password";
                icon.classList.replace("bi-eye-slash", "bi-eye");
            }
        });
    });
});