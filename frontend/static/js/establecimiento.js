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
    const currentParking = localStorage.getItem('currentParking');

    // Si no hay token o usuario, redirigir al login
    if (!authToken || !currentParking) {
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

let datosActuales = {
    nombrecompleto: '',
    numsectores: '',
    numcoheras: '',
    ubicacion: ''
};

// Cargar los datos actuales del usuario al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
    // Obtener datos actuales del usuario
    const currentParking = localStorage.getItem('currentParking');
    
    if (currentParking) {
        // Cargar datos desde localStorage
        try {
            const parkingData = JSON.parse(currentParking);
            datosActuales.nombrecompleto = parkingData.nameEst || '';
            datosActuales.numcoheras = parkingData.totalParkingSpots || '';
            datosActuales.numsectores = parkingData.totalSectors || '';
            datosActuales.ubicacion = parkingData.geographicLocation || '';
            
            // Mostrar los datos actuales en el formulario como placeholders
            document.getElementById('registerNombreCompleto').placeholder = datosActuales.nombrecompleto;
            document.getElementById('registerSectores').placeholder = datosActuales.numsectores;
            document.getElementById('registerCocheras').placeholder = datosActuales.numcoheras;
            document.getElementById('registerUbicacion').placeholder = datosActuales.ubicacion;
        } catch (e) {
            console.error('Error al parsear datos del establecimiento:', e);
        }
    }
    
    const form = document.querySelector('form');
    const editarBtn = document.getElementById('editar');
    
    if (editarBtn) {
        editarBtn.addEventListener('click', function() {
            const nombreAnterior = prompt("Ingrese nombre actual del parking para confirmar el cambio:");
            
            if (!nombreAnterior) {
                alert("Debes ingresar el nombre actual del parking para continuar.");
                return;
            }
            document.getElementById('nombreAnterior').value = nombreAnterior;
            form.submit();
        });
    }
});

// Manejar el envío del formulario de edición
document.getElementById('editEstablishmentForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nombreAnterior = prompt("Ingrese el nombre actual del parking para confirmar el cambio:");
    
    if (!nombreAnterior) {
        alert("Debes ingresar tu nombre actual para continuar.");
        return;
    }
    
    document.getElementById('nombreAnterior').value = nombreAnterior;
    
    // Crear un objeto con los datos actualizados, manteniendo los valores actuales si los campos están vacíos
    const datosActualizados = {
        nombre_anterior: nombreAnterior,
        nombreCompleto: document.getElementById('registerNombreCompleto').value || datosActuales.nombrecompleto,
        numsectores: document.getElementById('registerSectores').value || datosActuales.numsectores,
        numcocheras: document.getElementById('registerCocheras').value || datosActuales.numcoheras,
        ubicacion: document.getElementById('registerUbicacion').value || datosActuales.ubicacion
    };
    
    // Crear FormData para el envío
    const formData = new FormData();
    
    // Agregar todos los campos al FormData
    Object.keys(datosActualizados).forEach(key => {
        formData.append(key, datosActualizados[key]);
    });
    
    // Enviar los datos al servidor
    fetch(`${API_BASE_URL}/api/guardar_datosEstablecimiento`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message || 'Datos actualizados correctamente');
            
            // Actualizar los datos en localStorage
            try {
                const currentParkingData = JSON.parse(localStorage.getItem('currentParking')) || {};
                const updatedParkingData = {...currentParkingData, ...datosActualizados};
                delete updatedParkingData.nombre_anterior; // No guardar este campo
                localStorage.setItem('currentParking', JSON.stringify(updatedParkingData));
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