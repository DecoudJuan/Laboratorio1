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

const addVehicleForm = document.getElementById('addVehicleForm');
const editVehicleForm = document.getElementById('editVehicleForm');

const vehicleForm = document.getElementById('vehicleForm');
const showAddVehicleBtn = document.getElementById('showAddVehicleBtn');
const showEditVehicleBtn = document.getElementById('showEditVehicleBtn');

const backTobackToVehicleOptionsFromAdd = document.getElementById('backTobackToVehicleOptionsFromAdd');
const backTobackToVehicleOptionsFromEdit = document.getElementById('backTobackToVehicleOptionsFromEdit');

const backTo = document.getElementById('backTo');

// Mostrar formularios
showAddVehicleBtn.addEventListener('click', function() {
    addVehicleForm.style.display = 'block';
    editVehicleForm.style.display = 'none';
    document.getElementById('vehicleForm').style.display = 'none';
});

showEditVehicleBtn.addEventListener('click', function() {
    addVehicleForm.style.display = 'none';
    editVehicleForm.style.display = 'block';
    document.getElementById('vehicleForm').style.display = 'none';
});

// Botones de volver (manteniendo tus IDs originales)
backTobackToVehicleOptionsFromAdd.addEventListener('click', function() {
    addVehicleForm.style.display = 'none';
    document.getElementById('vehicleForm').style.display = 'block';
    $('#vehicleForm').modal('show');
});

backTobackToVehicleOptionsFromEdit.addEventListener('click', function() {
    editVehicleForm.style.display = 'none';
    document.getElementById('vehicleForm').style.display = 'block';
    $('#vehicleForm').modal('show');
});

backTo.addEventListener('click', function() {
    window.location.href = 'principal.html';
});




// JavaScript corregido
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const editarBtn = document.getElementById('editar');
    
    // Solo usar uno de los dos métodos para enviar el formulario
    // Si tienes el botón editar, usa este código
    if (editarBtn) {
        editarBtn.addEventListener('click', function() {
            const patenteActual = prompt("Ingrese su patente actual para confirmar el cambio:");
            
            if (!patenteActual) {
                alert("Debes ingresar tu patente actual para continuar.");
                return;
            }
            
            document.getElementById('patenteActual').value = patenteActual;
            form.submit(); // Envía el formulario correctamente
        });
    }
});

// Evento para el formulario
document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('editCarform');
    
    if (formulario) {
        formulario.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const patenteActual = prompt("Ingrese su patente actual para confirmar el cambio:");
            
            if (!patenteActual) {
                alert("Debes ingresar tu patente actual para continuar.");
                return;
            }
            
            document.getElementById('patenteActual').value = patenteActual;
            
            // Usando la misma estructura que tienes para register
            const form = e.target;
            const formData = new FormData(form);
            
            fetch('http://localhost:5000/api/guardar_datos_vehiculo', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message || 'Datos actualizados correctamente');
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
    }
});