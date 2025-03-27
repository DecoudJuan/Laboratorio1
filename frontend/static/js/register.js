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

// Función de registro 
function handleRegistration(event, isAdmin = false) {
    event.preventDefault();
    
    const form = event.target;
    const username = form.querySelector('[name="username"]').value;
    const email = form.querySelector('[name="email"]').value;
    const password = form.querySelector('[name="password"]').value;
    const confirmPassword = form.querySelector('[name="confirmPassword"]').value;
    
    // Selecciona el mensaje correcto según el formulario
    const messageElement = isAdmin 
        ? document.getElementById('adminRegisterMessage')
        : document.getElementById('registerMessage');
    
    // Campo adminCode solo para formulario de admin
    const adminCode = isAdmin ? form.querySelector('[name="adminCode"]').value : '';

    // Validaciones
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    if (users.some(user => user.email === email)) {
        showMessage(messageElement, 'El correo electrónico ya está registrado.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage(messageElement, 'Las contraseñas no coinciden.', 'error');
        return;
    }
    
    // Validación de admin
    let rol = 'usuario';
    if (isAdmin) {
        if (adminCode !== 'admin123') {
            showMessage(messageElement, 'Código de administrador incorrecto.', 'error');
            return;
        }
        rol = 'administrador';
    }
    
    // Registrar usuario
    users.push({ username, email, password, rol });
    localStorage.setItem('users', JSON.stringify(users));
    
    showMessage(messageElement, `Registro como ${rol} exitoso! Redirigiendo...`, 'success');
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
}

// Función para mostrar mensajes
function showMessage(element, text, type) {
    element.textContent = text;
    element.className = `message ${type}`;
    element.style.display = 'block';
}

// Manejadores de eventos para ambos formularios
document.getElementById('registerUserForm')?.addEventListener('submit', (e) => handleRegistration(e, false));
document.getElementById('registerAdminForm')?.addEventListener('submit', (e) => handleRegistration(e, true));

/* TESTS ACA ABAJO*/

