document.addEventListener('DOMContentLoaded', function () {
    
    // Cargar vehículos en el selector de denuncia al inicio
    cargarVehiculos();

    // Esta función será llamada desde el HTML cuando se presione "Contactar al Usuario por la Patente"
    window.contactarUsuario = async function() {
        
        const selectorVehiculo = document.getElementById('selector-vehiculo-denuncia');
        if (!selectorVehiculo) {
            console.error('Elemento selector-vehiculo-denuncia no encontrado');
            alert('Error: No se puede acceder al selector de vehículos');
            return;
        }
        
        const idVehicle = selectorVehiculo.value;

        if (!idVehicle) {
            alert("Debes seleccionar una patente primero.");
            return;
        }


        try {
            const response = await fetch(`http://localhost:5000/api/propietario/${idVehicle}`);

            if (!response.ok) {
                throw new Error(`Error en la respuesta: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Mostrar el teléfono en un modal o alert
                mostrarModalPropietario(data.phone);
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error("Error en la solicitud:", error);
            alert("No se pudo obtener el celular del propietario.");
        }
    }

    // Event listener para logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Verificar si localStorage está disponible
            if (typeof Storage !== 'undefined') {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
            }
            window.location.replace('index.html');
        });
    }
});

function cargarVehiculos() {
    const vehiculoSelect = document.getElementById('selector-vehiculo-denuncia');
    
    if (!vehiculoSelect) {
        console.error('Elemento selector-vehiculo-denuncia no encontrado para cargar vehículos');
        return;
    }
    

    fetch('http://localhost:5000/api/vehiculos')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor: ' + response.status);
            }
            return response.json();
        })
        .then(data => {

            if (data.success) {
                vehiculoSelect.innerHTML = '<option value="" disabled selected>Seleccioná una patente</option>';

                if (data.vehicles && data.vehicles.length > 0) {
                    data.vehicles.forEach(vehicle => {

                        const option = document.createElement('option');
                        option.value = vehicle.idVehicle;
                        option.textContent = vehicle.idVehicle;
                        vehiculoSelect.appendChild(option);
                    });
                } else {
                    vehiculoSelect.innerHTML += '<option value="" disabled>No hay vehículos disponibles</option>';
                }
            } else {
                vehiculoSelect.innerHTML += '<option value="" disabled>Error al cargar vehículos</option>';
                console.error('Error en la respuesta:', data.message || 'Error desconocido');
            }
        })
        .catch(error => {
            console.error('Error al cargar vehículos:', error);
            vehiculoSelect.innerHTML = '<option value="" disabled selected>Error al cargar vehículos</option>';
        });
}

// Función para mostrar el modal con información del propietario
function mostrarModalPropietario(telefono) {
    // Crear modal dinámicamente si no existe
    let modalExistente = document.getElementById('modalPropietario');
    
    if (!modalExistente) {
        const modalHTML = `
        <div class="modal fade" id="modalPropietario" tabindex="-1" aria-labelledby="modalPropietarioLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content" style="box-shadow: 0px 0 20px rgba(0, 0, 0, 0.5); border: 10px solidrgb(0, 0, 0);">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title" id="modalPropietarioLabel">Información del Propietario</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body text-center">
                        <p id="propietarioTelefono" class="fs-5"></p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modalExistente = document.getElementById('modalPropietario');
    }
    
    // Actualizar el contenido del modal
    const propietarioTelefono = document.getElementById('propietarioTelefono');
    if (propietarioTelefono) {
        propietarioTelefono.textContent = `📱 Teléfono: ${telefono}`;
    }
    
    // Mostrar el modal
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modal = new bootstrap.Modal(modalExistente);
        modal.show();
    } else {
        console.warn('Bootstrap no está disponible');
        alert(`📱 Teléfono del propietario: ${telefono}`);
    }
}

// Función de utilidad para verificar si un elemento existe
function elementExists(id) {
    return document.getElementById(id) !== null;
}

// Función para mostrar errores de manera amigable
function showError(message) {
    console.error(message);
    if (typeof alert !== 'undefined') {
        alert(message);
    }
}