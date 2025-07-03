function preventCaching() {
    // NO ALMACENA CACHÉ
    if (window.location.protocol != 'file:') {
        window.history.replaceState(null, document.title, window.location.href);
    }
}


document.getElementById('logoutBtn').addEventListener('click', function() {
    // Eliminar token y datos de usuario del localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('chatEmail');
    
    // Redireccionar a la página de inicio de sesión
    window.location.href = 'index.html';
});


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
        checkToken();
    }
});

// También verificar cuando la página vuelve a estar visible
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
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

document.addEventListener('DOMContentLoaded', function() {
    // Obtener datos actuales del usuario
    const currentUser = localStorage.getItem('currentUser');
    
    if (currentUser) {
        // Cargar datos desde localStorage
        try {
            const userData = JSON.parse(currentUser);
            datosActuales.username = userData.username || '';
            datosActuales.email = userData.email || '';
            datosActuales.phone = userData.phone || ''; // Añadido campo teléfono
            datosActuales.VP = userData.VP || '';
            datosActuales.VP2 = userData.VP2 || '';
            
            // Mostrar los datos actuales en el formulario como placeholders
            document.getElementById('registerName').placeholder = datosActuales.username;
            document.getElementById('registerEmail').placeholder = datosActuales.email;
            document.getElementById('registerPhone').placeholder = datosActuales.phone; // Placeholder para teléfono
        } catch (e) {
            console.error('Error al parsear datos del usuario:', e);
        }
    }
    
    const form = document.querySelector('form');
    const editarBtn = document.getElementById('editar');
    
    if (editarBtn) {
        editarBtn.addEventListener('click', function() {
            const nombreAnterior = prompt("Ingrese su mail actual para confirmar el cambio:");
            
            if (!nombreAnterior) {
                alert("Debes ingresar tu nombre actual para continuar.");
                return;
            }
            document.getElementById('nombreAnterior').value = nombreAnterior;
            form.submit();
        });
    }

    // Validación del campo de teléfono
    const phoneInput = document.getElementById('registerPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            // Permitir solo números
            this.value = this.value.replace(/[^0-9]/g, '');
            
            // Limitar a una longitud máxima (por ejemplo, 10 dígitos)
            if (this.value.length > 10) {
                this.value = this.value.slice(0, 10);
            }
        });
    }

    // Cargar los vehículos del usuario al cargar la página
    cargarVehiculos();

    // Manejar el cambio de vehículo principal
    document.getElementById('vehiculoPrincipal').addEventListener('change', function() {
        actualizarVehiculoPrincipal(this.value);
    });

    const backToPrincipalBtn = document.getElementById('backToPrincipalBtn');
    if (backToPrincipalBtn) {
        backToPrincipalBtn.addEventListener('click', function() {
            window.location.href = 'misdatos.html';
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
        id: datosActuales.id || JSON.parse(localStorage.getItem('currentUser'))?.id, // más seguro todavía
        nombre_anterior: nombreAnterior,
        username: document.getElementById('registerName').value || datosActuales.username,
        email: document.getElementById('registerEmail').value || datosActuales.email,
        phone: document.getElementById('registerPhone').value || datosActuales.phone, // Añadido campo teléfono
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
            try {
                const currentUserData = JSON.parse(localStorage.getItem('currentUser')) || {};
        
                // Crear uno nuevo actualizando solo campos específicos
                const updatedUserData = {
                    ...currentUserData, // dejamos todo lo que había
                    username: datosActualizados.username || currentUserData.username,
                    email: datosActualizados.email || currentUserData.email,
                    phone: datosActualizados.phone || currentUserData.phone, // Actualizamos el teléfono
                    VP2: datosActualizados.VP2 || currentUserData.VP2
                    // id, vehiculos, etc., se mantienen
                };
        
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

function getUserId() {
    try {
        // Obtener el objeto user del localStorage
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            const userData = JSON.parse(userStr);
            return userData.id; // Devolver el ID del usuario
        }
        return null;
    } catch (error) {
        console.error('Error al obtener ID de usuario:', error);
        return null;
    }
}

function cargarVehiculos() {
    // Obtener el token de autenticación
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        console.error('No se encontró token de autenticación');
        return;
    }
    
    // Obtener el ID del usuario
    const userStr = localStorage.getItem('currentUser');
    let userId = null;
    
    try {
        if (userStr) {
            const userData = JSON.parse(userStr);
            userId = userData.id;
        }
    } catch (error) {
        console.error('Error al parsear información del usuario:', error);
    }
    
    if (!userId) {
        console.error('No se pudo obtener el ID del usuario');
        return;
    }
    
    // Guardar el valor seleccionado actualmente (si existe)
    const selectVehiculo = document.getElementById('vehiculoPrincipal');
    const valorSeleccionado = selectVehiculo ? selectVehiculo.value : "";
    
    // Obtener la lista de vehículos del usuario
    fetch(`${API_BASE_URL}/api/user-vehicles/${userId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al obtener vehículos');
        }
        return response.json();
    })
    .then(data => {
        if (!data.success) {
            console.error('Error al cargar vehículos:', data.message);
            return;
        }
        
        // Limpiar el contenido del select antes de agregar nuevas opciones
        selectVehiculo.innerHTML = '<option value="">Seleccione un vehículo principal</option>';
        
        // Verificar si hay vehículos
        if (!data.vehicles || data.vehicles.length === 0) {
            return;
        }
        
        // Añadir cada vehículo a la lista
        data.vehicles.forEach(vehiculo => {
            // Crear opción para el select
            const option = document.createElement('option');
            option.value = vehiculo.idVehicle;
            option.textContent = `${vehiculo.brand} ${vehiculo.model} (${vehiculo.licensePlate || vehiculo.idVehicle})`;
            
            // Mantener seleccionado el vehículo que estaba seleccionado antes
            // o marcar como seleccionado el vehículo principal si no había selección previa
            if (valorSeleccionado && valorSeleccionado === vehiculo.idVehicle.toString()) {
                option.selected = true;
            } else if (!valorSeleccionado && vehiculo.is_primary) {
                option.selected = true;
            }
            
            selectVehiculo.appendChild(option);
        });
    })
    .catch(error => console.error('Error al cargar vehículos:', error));
}

function actualizarVehiculoPrincipal(idVehicle) {
    if (!idVehicle) return;
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('No se encontró token de autenticación');
        return;
    }
    
    fetch(`${API_BASE_URL}/api/set-primary-vehicle`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ idVehicle: idVehicle })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al actualizar vehículo principal');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Recargar la lista de vehículos para reflejar el cambio
            cargarVehiculos();
        } else {
            alert('Error al actualizar el vehículo principal: ' + (data.message || 'Error desconocido'));
        }
    })
    .catch(error => console.error('Error:', error));
}