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

// Variables para almacenar los datos actuales del usuario
let datosActuales = {
    username: '',
    email: '',
    VP: '',
    VP2: ''
};

// Cargar los datos actuales del usuario al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
    // Obtener datos actuales del usuario
    const currentUser = localStorage.getItem('currentUser');
    
    if (currentUser) {
        // Cargar datos desde localStorage
        try {
            const userData = JSON.parse(currentUser);
            datosActuales.username = userData.username || '';
            datosActuales.email = userData.email || '';
            datosActuales.VP = userData.VP || '';
            datosActuales.VP2 = userData.VP2 || '';
            
            // Mostrar los datos actuales en el formulario como placeholders
            document.getElementById('registerName').placeholder = datosActuales.username;
            document.getElementById('registerEmail').placeholder = datosActuales.email;
            document.getElementById('registerVP').placeholder = datosActuales.VP;
            document.getElementById('registerVP2').placeholder = datosActuales.VP2;
        } catch (e) {
            console.error('Error al parsear datos del usuario:', e);
        }
    }
    
    const form = document.querySelector('form');
    const editarBtn = document.getElementById('editar');
    
    if (editarBtn) {
        editarBtn.addEventListener('click', function() {
            const nombreAnterior = prompt("Ingrese su nombre actual para confirmar el cambio:");
            
            if (!nombreAnterior) {
                alert("Debes ingresar tu nombre actual para continuar.");
                return;
            }
            document.getElementById('nombreAnterior').value = nombreAnterior;
            form.submit();
        });
    }
});

// Manejar el envío del formulario de edición
document.getElementById('editUserForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nombreAnterior = prompt("Ingrese su nombre actual para confirmar el cambio:");
    
    if (!nombreAnterior) {
        alert("Debes ingresar tu nombre actual para continuar.");
        return;
    }
    
    document.getElementById('nombreAnterior').value = nombreAnterior;
    
    // Crear un objeto con los datos actualizados, manteniendo los valores actuales si los campos están vacíos
    const datosActualizados = {
        nombre_anterior: nombreAnterior,
        username: document.getElementById('registerName').value || datosActuales.username,
        email: document.getElementById('registerEmail').value || datosActuales.email,
        VP: document.getElementById('registerVP').value || datosActuales.VP,
        VP2: document.getElementById('registerVP2').value || datosActuales.VP2
    };
    
    // Crear FormData para el envío
    const formData = new FormData();
    
    // Agregar todos los campos al FormData
    Object.keys(datosActualizados).forEach(key => {
        formData.append(key, datosActualizados[key]);
    });
    
    // Enviar los datos al servidor
    fetch(`${API_BASE_URL}/api/guardar_datos`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message || 'Datos actualizados correctamente');
            
            // Actualizar los datos en localStorage
            try {
                const currentUserData = JSON.parse(localStorage.getItem('currentUser')) || {};
                const updatedUserData = {...currentUserData, ...datosActualizados};
                delete updatedUserData.nombre_anterior; // No guardar este campo
                localStorage.setItem('currentUser', JSON.stringify(updatedUserData));
            } catch (e) {
                console.error('Error al actualizar datos locales:', e);
            }
            
            window.location.href = 'principal.html';
        } else {
            alert(data.message || 'Error al guardar los datos');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al procesar la solicitud');
    });
});