function preventCaching() {
    // NO ALMACENA CACHÉ
    if (window.location.protocol != 'file:') {
        window.history.replaceState(null, document.title, window.location.href);
    }
}

preventCaching();

// Verificación inmediata de autenticación (se ejecuta al cargar el script)
function checkToken() {
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');

    // Si no hay token o usuario, redirigir al login
    if (!authToken || !currentUser) {
        window.location.replace('index.html');
        return;
    }
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
        console.log('Página visible - verificando autenticación');
        checkToken();
    }
});

const API_BASE_URL = 'http://localhost:5000';

// JavaScript corregido
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const editarBtn = document.getElementById('editar');
    
    editarBtn.addEventListener('click', function() {
        const nombreAnterior = prompt("Ingrese su nombre actual para confirmar el cambio:");
        
        if (!nombreAnterior) {
            alert("Debes ingresar tu nombre actual para continuar.");
            return;
        }
        document.getElementById('nombreAnterior').value = nombreAnterior;
        form.submit(); // Envía el formulario correctamente
    });
});

// Agrega esto al final de tu archivo js
document.getElementById('editUserForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nombreAnterior = prompt("Ingrese su nombre actual para confirmar el cambio:");
    
    if (!nombreAnterior) {
        alert("Debes ingresar tu nombre actual para continuar.");
        return;
    }
    
    document.getElementById('nombreAnterior').value = nombreAnterior;
    
    // Usando la misma estructura que tienes para register
    const form = e.target;
    const formData = new FormData(form);
    
    fetch('http://localhost:5000/api/datos_Admin', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message || 'Datos actualizados correctamente');
            window.location.href = 'admin.html';
        } else {
            alert(data.message || 'Error al guardar los datos');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al procesar la solicitud');
    });
});