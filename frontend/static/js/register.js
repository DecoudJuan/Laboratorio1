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

/* PREVIO A UNIFICACION 27/3/25

// Elementos DOM
const registerForm = document.getElementById('registerForm');
const adminRegisterForm = document.getElementById('adminRegisterForm');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const showAdminRegisterBtn = document.getElementById('showAdminRegisterBtn');
const backToLoginBtn2 = document.getElementById('backToLoginBtn2');
const backToLoginBtn = document.getElementById('backToLoginBtn');

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

// Volver a inicio de sesión desde registro de administrador
backToLoginBtn.addEventListener('click', function() {
    window.location.href = 'index.html';
});

// Volver a inicio de sesión desde registro de administrador
backToLoginBtn2.addEventListener('click', function() {
    window.location.href = 'index.html';
});


// Manejar el registro unificado
document.getElementById('registerUserForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const adminCode = document.getElementById('adminCode');
    const messageElement = document.getElementById('registerMessage');
    const confirmPassword = document.getElementById('confirmPassword').value;

    
    // Obtener los usuarios existentes del localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Verificar si el email ya está registrado
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        messageElement.textContent = 'El correo electrónico ya está registrado.';
        messageElement.className = 'message error';
        messageElement.style.display = 'block';
        return;
    }

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
        messageElement.textContent = 'Las contraseñas no coinciden.';
        messageElement.className = 'message error';
        messageElement.style.display = 'block';
        return;
    }

    // Validaciones específicas para el registro de administrador
    let rol = 'usuario'; // Por defecto, el rol es usuario
    if (adminCode.length > 0) {
        const ADMIN_CODE = "admin123"; // Código de ejemplo

        // Validar longitud y valor del código de administrador
        if (adminCode.length > 0 && adminCode === ADMIN_CODE) {
            rol = 'administrador'; // Asignar rol de administrador si el código es válido
        } else {
            messageElement.textContent = 'Código de administrador incorrecto.';
            messageElement.className = 'message error';
            messageElement.style.display = 'block';
            return;
        }
    }
    
    // Crear el objeto de usuario
    const userData = {
        username: username,
        email: email,
        password: password,
        rol: rol
    };
    
    // Agregar el nuevo usuario
    users.push(userData);
    localStorage.setItem('users', JSON.stringify(users));
    
    messageElement.textContent = `Registro como ${rol} exitoso! Ahora puedes iniciar sesión.`;
    messageElement.className = 'message success';
    messageElement.style.display = 'block';
    
    // Limpiar el formulario
    event.target.reset();
    
    // Redirigir a la pantalla de inicio de sesión después de 2 segundos
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
});


*/

/*
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
    admins.push({ name, email, password });
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
*/

/* TESTS ACA ABAJO*/

