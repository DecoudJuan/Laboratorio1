function preventCaching() {
    if (window.location.protocol !== 'file:') {
        window.history.replaceState(null, document.title, window.location.href);
    }
}

preventCaching();

// Verificación inmediata de autenticación
function checkToken() {
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');

    if (!authToken || !currentUser) {
        window.location.replace('admin.html');
    }
}

// Verificar autenticación al volver a la página
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        checkToken();
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        checkToken();
    }
});

const API_BASE_URL = 'http://localhost:5000';

let datosActuales = {
    nombrecompleto: '',
    numsectores: '',
    numcocheras: '',
    ubicacion: '',
};

document.addEventListener('DOMContentLoaded', function() {
    const currentUser = localStorage.getItem('currentUser');

    if (currentUser) {
        try {
            const userData = JSON.parse(currentUser);
            datosActuales.nombrecompleto = userData.nombrecompleto || '';
            datosActuales.numsectores = userData.numsectores || '';
            datosActuales.numcocheras = userData.numcocheras || '';
            datosActuales.ubicacion = userData.ubicacion || '';

            document.getElementById('registerNombreCompleto').placeholder = datosActuales.nombrecompleto;
            document.getElementById('registerSectores').placeholder = datosActuales.numsectores;
            document.getElementById('registerCocheras').placeholder = datosActuales.numcocheras;
            document.getElementById('registerUbicacion').placeholder = datosActuales.ubicacion;
        } catch (e) {
            console.error('Error al parsear datos del establecimiento:', e);
        }
    }
});

document.getElementById('editEstablishmentForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const nombreAnterior = prompt("Ingrese el nombre actual del establecimiento para confirmar:");

    if (!nombreAnterior) {
        alert("Debes ingresar el nombre actual para continuar.");
        return;
    }

    document.getElementById('nombreAnterior').value = nombreAnterior;

    const datosActualizados = {
        nombre_anterior: nombreAnterior,
        nombrecompleto: document.getElementById('registerNombreCompleto').value || datosActuales.nombrecompleto,
        numsectores: document.getElementById('registerSectores').value || datosActuales.numsectores,
        numcocheras: document.getElementById('registerCocheras').value || datosActuales.numcocheras,
        ubicacion: document.getElementById('registerUbicacion').value || datosActuales.ubicacion,
    };

    const formData = new FormData();
    Object.keys(datosActualizados).forEach(key => {
        formData.append(key, datosActualizados[key]);
    });

    fetch(`${API_BASE_URL}/api/editar_establecimiento`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message || 'Datos actualizados correctamente');
            localStorage.removeItem('currentUser');
            window.location.href = 'admin.html';
        } else {
            alert(data.message || 'Error al actualizar los datos');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al procesar la solicitud');
    });
});

function confirmarBorradoEstablecimiento() {
    const confirmInput = prompt('Para confirmar el borrado, escribe el nombre completo del establecimiento:');
    if (!confirmInput || confirmInput.trim() === '') {
        alert('Debes ingresar un nombre válido.');
        return;
    }

    const nombreConfirmado = confirmInput.trim();

    if (!confirm(`¿Estás seguro de que deseas borrar permanentemente el establecimiento "${nombreConfirmado}"?`)) {
        alert('Borrado cancelado.');
        return;
    }

    fetch(`${API_BASE_URL}/api/borrar_establecimiento/${encodeURIComponent(nombreConfirmado)}`, {
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
            alert(data.message || 'Establecimiento borrado correctamente');
            localStorage.removeItem('currentUser');
            window.location.href = 'admin.html';
        } else {
            throw new Error(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert(`Error al borrar el establecimiento: ${error.message || 'Error desconocido'}`);
    });
}

async function editarParking(event) {
    event.preventDefault(); // No enviar el form automáticamente

    try {
        const token = localStorage.getItem('token');
        const form = document.getElementById('formEditarParking'); // o 'editEstablishmentForm' si querés dejar ese id
        const formData = new FormData(form);

        const response = await fetch('/api/editarParking', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert('¡Establecimiento actualizado correctamente!');
            // Podrías hacer window.location.href = '/otra_pagina' si querés redirigir
        } else {
            alert('Error: ' + result.message);
        }

    } catch (error) {
        console.error('Error al editar establecimiento:', error);
        alert('Error inesperado al editar');
    }
}