// Datos simulados para almacenar usuarios (en un caso real usarías una base de datos)
let users = JSON.parse(localStorage.getItem('users')) || [];

// Elementos DOM
const loginContainer = document.getElementById('loginContainer');


// Formulario de inicio de sesión
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const messageElement = document.getElementById('loginMessage');
    
    // Buscar usuario normal
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        if (user.rol === 'usuario') {
            // Login exitoso - usuario normal
            messageElement.textContent = 'Inicio de sesión exitoso como usuario!';
            window.location.href = 'principal.html'; // Comentado para demo

        } else if (user.rol === 'administrador') {
            // Login exitoso - administrador
            messageElement.textContent = 'Inicio de sesión exitoso como administrador!';
            window.location.href = 'admin.html'; // Comentado para demo

        } else {
            // Login fallido
            messageElement.textContent = 'Correo o contraseña incorrectos.';
            messageElement.className = 'message error';
            messageElement.style.display = 'block';
        }
    }
});