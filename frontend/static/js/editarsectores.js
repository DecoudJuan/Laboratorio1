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
        window.location.replace('admin.html');
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
    name: '',
    HorarioApertura: '',
    HorarioCierre: '',
    CocherasDisponibles: '',
};

// Cargar los datos actuales del usuario al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
    // Obtener datos actuales del usuario
    const currentUser = localStorage.getItem('currentUser');
    
    if (currentUser) {
        // Cargar datos desde localStorage
        try {
            const userData = JSON.parse(currentUser);
            datosActuales.name = userData.name || '';
            datosActuales.HorarioApertura = userData.HorarioApertura || '';
            datosActuales.HorarioCierre = userData.HorarioCierre || '';
            datosActuales.CocherasDisponibles = userData.CocherasDisponibles || '';
            
            // Mostrar los datos actuales en el formulario como placeholders
            document.getElementById('registerName').placeholder = datosActuales.name;
            document.getElementById('registerHorarioApertura').placeholder = datosActuales.HorarioApertura;
            document.getElementById('registerHorariocierre').placeholder = datosActuales.HorarioCierre;
            document.getElementById('registerCocherasDisponibles').placeholder = datosActuales.CocherasDisponibles;
        } catch (e) {
            console.error('Error al parsear datos del sector:', e);
        }
    }
});

// Manejar el envío del formulario de edición
document.getElementById('sectorForm').addEventListener('submit', function(e) {
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
        name: document.getElementById('registerName').value || datosActuales.name,
        HorarioApertura: document.getElementById('registerHorarioApertura').value || datosActuales.HorarioApertura,
        HorarioCierre: document.getElementById('registerHorariocierre').value || datosActuales.HorarioCierre,
        CocherasDisponibles: document.getElementById('registerCocherasDisponibles').value || datosActuales.CocherasDisponibles
    };
    
    // Crear FormData para el envío
    const formData = new FormData();
    
    // Agregar todos los campos al FormData
    Object.keys(datosActualizados).forEach(key => {
        formData.append(key, datosActualizados[key]);
    });
    
    // Enviar los datos al servidor
    fetch(`${API_BASE_URL}/api/datos_Sector`, {
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

function confirmarBorradoSector(button) {
    const confirmInput = prompt(`Para confirmar el borrado, escribe el nombre exacto del sector:`);
    if (!confirmInput || confirmInput.trim() === '') {
        alert("Debes ingresar un nombre válido.");
        return;
    }

    const nombreConfirmado = confirmInput.trim();

    if (!confirm(`¿Estás seguro de que deseas borrar permanentemente el sector "${nombreConfirmado}"?`)) {
        alert("Borrado cancelado.");
        return;
    }

    fetch(`http://localhost:5000/api/borrar_sector/${encodeURIComponent(nombreConfirmado)}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) return response.json().then(err => { throw err; });
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert(data.message);
            window.location.href = "admin.html";
        } else {
            throw new Error(data.message);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert(`Error al borrar el sector: ${error.message || 'Error desconocido'}`);
    });
}
