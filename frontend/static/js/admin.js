const API_BASE_URL = 'http://localhost:5000';
let sectorInfo = null;
let cocheraValida = false;
let accionActual = ''; // 'llegada' o 'salida'

function preventCaching() {
    // NO ALMACENA CACHÉ
    if (window.location.protocol != 'file:') {
        window.history.replaceState(null, document.title, window.location.href);
    }
}

// Función para controlar el botón atrás
function setupBackButton() {
    // Reemplazar la página actual en el historial para que el botón atrás vaya a admin.html
    if (document.referrer && !document.referrer.includes('admin.html')) {
        window.history.replaceState(null, document.title, window.location.href);
        window.history.pushState(null, document.title, window.location.href);
    }
    
    // Escuchar el evento popstate (botón atrás)
    window.addEventListener('popstate', function(event) {
        // Redirigir a admin.html cuando se presione atrás
        window.location.href = 'admin.html';
    });
}

// LLAMA A LAS FUNCIONES
preventCaching();
setupBackButton();

// Verificación simplificada de autenticación
function checkToken() {
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');

    
    // Si no hay token o usuario, redirigir al login
    if (!authToken || !currentUser) {
        window.location.replace('index.html');
        return false;
    }
    
    // Verificar que el usuario sea válido (sin verificar rol específico)
    try {
        const userData = JSON.parse(currentUser);
        // Solo verificamos que el usuario tenga datos válidos
        if (!userData || !userData.id) {
            throw new Error("Datos de usuario inválidos");
        }
        return true;
    } catch (e) {
        console.error('Error al procesar datos de usuario:', e);
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.replace('index.html');
        return false;
    }
}

// Ejecutar verificación inmediatamente
if (!checkToken()) {
    throw new Error("Verificación de autenticación fallida");
}

function pedirContrasenaParking() {
    const contrasenaCorrecta = "superadmin123"; 
    const input = prompt("Ingrese la contraseña para acceder a Administración de Sectores:");
    if (input === contrasenaCorrecta) {
        window.location.href = "funcionesSuperusuario.html";
    } else if (input !== null) {
        alert("Contraseña incorrecta.");
    }
}    

// Configurar evento para el botón de cerrar sesión
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.replace('index.html');
    });
}
 
function getUserId() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        try {
            const user = JSON.parse(currentUser);
            return user.id;
        } catch (error) {
            console.error('Error al parsear el usuario actual:', error);
        }
    }
    return null;
}
// Función para cargar los sectores al iniciar la página
function cargarSectores() {
    fetch(`${API_BASE_URL}/api/sectores`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Obtener todos los selects de sector de ambos modales
                const sectorSelects = [
                    document.querySelector('#modalSectorCochera #sectorSelect'),
                    document.querySelector('#modalSectorCocheraPatente #sectorSelect')
                ];

                sectorSelects.forEach(sectorSelect => {
                    if (sectorSelect) {
                        // Limpiar opciones existentes
                        sectorSelect.innerHTML = '<option value="" disabled selected>Seleccioná un sector</option>';
                        
                        // Agregar cada sector como una opción
                        data.sectors.forEach(sector => {
                            const option = document.createElement('option');
                            option.value = sector.nameSec;
                            
                            // Mostrar diferente texto según el tipo de acción (llegada/salida)
                            if (accionActual === "llegada") {
                                option.textContent = `${sector.nameSec} (${sector.freeParkingSpots} disponibles)`;
                                // Deshabilitar sectores sin cocheras disponibles
                                if (sector.freeParkingSpots <= 0) {
                                    option.disabled = true;
                                }
                            } else if (accionActual === "salida") {
                                const cocherasOcupadas = sector.availableParkingSpots - sector.freeParkingSpots;
                                option.textContent = `${sector.nameSec} (${cocherasOcupadas} ocupadas)`;
                                // Deshabilitar sectores sin cocheras ocupadas
                                if (cocherasOcupadas <= 0) {
                                    option.disabled = true;
                                }
                            } else {
                                option.textContent = sector.nameSec;
                            }
                            
                            sectorSelect.appendChild(option);
                        });
                    }
                });
            } else {
                console.error('Error al cargar sectores:', data.error);
            }
        })
        .catch(error => {
            console.error('Error al obtener los sectores:', error);
        });
}

// Función para cargar información del sector seleccionado
function cargarInfoSector(sectorName, modalId) {
    const modal = document.getElementById(modalId);
    const cocheraInput = modal.querySelector('#cocheraInput');
    const cocheraFeedback = modal.querySelector('#cocheraFeedback');
    
    if (!sectorName) {
        cocheraInput.disabled = true;
        cocheraInput.value = '';
        cocheraFeedback.textContent = '';
        sectorInfo = null;
        return;
    }

    cocheraInput.disabled = true;
    cocheraFeedback.textContent = 'Cargando información del sector...';
    
    // Obtener información del sector seleccionado
    fetch(`${API_BASE_URL}/api/sector/${sectorName}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                sectorInfo = data.sector;
                
                // Habilitar la entrada de número de cochera
                cocheraInput.disabled = false;
                cocheraInput.value = '';
                
                if (accionActual === "llegada") {
                    if (sectorInfo.freeParkingSpots <= 0) {
                        cocheraInput.disabled = true;
                        cocheraFeedback.textContent = 'No hay cocheras disponibles en este sector.';
                    } else {
                        cocheraFeedback.textContent = `Ingresa un número de cochera entre 1 y ${sectorInfo.availableParkingSpots}`;
                    }
                } else if (accionActual === "salida") {
                    const cocherasOcupadas = sectorInfo.availableParkingSpots - sectorInfo.freeParkingSpots;
                    if (cocherasOcupadas <= 0) {
                        cocheraInput.disabled = true;
                        cocheraFeedback.textContent = 'No hay cocheras ocupadas en este sector.';
                    } else {
                        cocheraFeedback.textContent = `Ingresa un número de cochera entre 1 y ${sectorInfo.availableParkingSpots}`;
                    }
                }
            } else {
                console.error('Error al obtener información del sector');
                cocheraInput.disabled = true;
                cocheraFeedback.textContent = 'Error al cargar información del sector.';
                sectorInfo = null;
            }
        })
        .catch(error => {
            console.error('Error al cargar sector:', error);
            cocheraInput.disabled = true;
            cocheraFeedback.textContent = 'Error de conexión al cargar el sector.';
            sectorInfo = null;
        });
}

// Función para validar la cochera ingresada
function validarCochera(modalId) {
    const modal = document.getElementById(modalId);
    const cocheraInput = modal.querySelector('#cocheraInput');
    const cocheraFeedback = modal.querySelector('#cocheraFeedback');
    const sectorSelect = modal.querySelector('#sectorSelect');
    
    if (!sectorInfo || cocheraInput.disabled) {
        cocheraValida = false;
        return;
    }
    
    const numeroCochera = parseInt(cocheraInput.value, 10);
    const sectorName = sectorSelect.value;
    
    // Validar que sea un número válido
    if (isNaN(numeroCochera) || numeroCochera <= 0) {
        cocheraFeedback.textContent = 'Ingresa un número de cochera válido.';
        cocheraFeedback.classList.add('text-danger');
        cocheraFeedback.classList.remove('text-success');
        cocheraValida = false;
        return;
    }
    
    // Validar que esté dentro del rango permitido
    if (numeroCochera > sectorInfo.availableParkingSpots) {
        cocheraFeedback.textContent = `El número de cochera debe ser entre 1 y ${sectorInfo.availableParkingSpots}.`;
        cocheraFeedback.classList.add('text-danger');
        cocheraFeedback.classList.remove('text-success');
        cocheraValida = false;
        return;
    }
    
    // Verificar el estado actual de la cochera
    fetch(`${API_BASE_URL}/api/cocheras/${sectorName}/${numeroCochera}`)
        .then(response => response.json())
        .then(dataCochera => {
            const cochera = dataCochera.success ? dataCochera : { ocupado: false };
            
            if (accionActual === "llegada" && cochera.ocupado) {
                cocheraFeedback.textContent = 'Esta cochera ya está ocupada. Por favor, elige otra.';
                cocheraFeedback.classList.add('text-danger');
                cocheraFeedback.classList.remove('text-success');
                cocheraValida = false;
            } else if (accionActual === "salida" && !cochera.ocupado) {
                cocheraFeedback.textContent = 'Esta cochera no está ocupada. No puedes registrar una salida.';
                cocheraFeedback.classList.add('text-danger');
                cocheraFeedback.classList.remove('text-success');
                cocheraValida = false;
            } else {
                // La cochera es válida para la acción seleccionada
                cocheraFeedback.textContent = accionActual === "llegada" ? 
                    'Cochera disponible.' : 'Cochera ocupada, puedes registrar la salida.';
                cocheraFeedback.classList.remove('text-danger');
                cocheraFeedback.classList.add('text-success');
                cocheraValida = true;
            }
        })
        .catch(error => {
            console.error('Error al verificar cochera:', error);
            cocheraFeedback.textContent = 'Error al verificar el estado de la cochera.';
            cocheraFeedback.classList.add('text-danger');
            cocheraFeedback.classList.remove('text-success');
            cocheraValida = false;
        });
}

function guardarLlegadaSalida(modalId) {
    const modal = document.getElementById(modalId);
    const sectorSelect = modal.querySelector('#sectorSelect');
    const cocheraInput = modal.querySelector('#cocheraInput');
    const patenteInput = modal.querySelector('#patenteInput');
    
    const sector = sectorSelect.value;
    const cochera = parseInt(cocheraInput.value, 10);

    if (!accionActual || !sector || isNaN(cochera) || !cocheraValida) {
        alert("Completá todas las opciones con valores válidos antes de guardar.");
        return;
    }

    // Normalizar el nombre del sector
    const sectorNormalizado = sector.charAt(0).toUpperCase() + sector.slice(1).toLowerCase();


    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        alert('Token de autorización no encontrado. Por favor, inicia sesión nuevamente.');
        window.location.replace('index.html');
        return;
    }

    if (accionActual === 'llegada') {
        // Para llegadas, verificar patente
        const patente = patenteInput.value.trim().toUpperCase();
        
        if (!patente) {
            alert("Ingresá la patente del vehículo.");
            return;
        }

        // Verificar que el vehículo existe
        fetch(`${API_BASE_URL}/api/vehiculo/${patente}`)
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    alert("La patente ingresada no está registrada en el sistema.");
                    return;
                }

                // Procesar llegada con patente
                const formData = new FormData();
                formData.append('sector', sectorNormalizado);
                formData.append('cochera', cochera);
                formData.append('patente', patente);

                fetch(`${API_BASE_URL}/api/marcar_llegada_patente`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                        // No incluir Content-Type cuando se usa FormData
                    },    
                    body: formData
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        alert(result.message);
                        // Cerrar modal y actualizar datos
                        bootstrap.Modal.getInstance(modal).hide();
                        location.reload();
                    } else {
                        alert(result.message);
                    }
                })
                .catch(error => {
                    console.error('Error al marcar llegada:', error);
                    alert('Error al procesar la llegada.');
                });
            })
            .catch(error => {
                console.error('Error al verificar patente:', error);
                alert('Error al verificar la patente.');
            });
            
    } else if (accionActual === 'salida') {
        // Para salidas, no requiere patente - solo sector y cochera
        
        // Verificar primero que la cochera esté ocupada
        fetch(`${API_BASE_URL}/api/cocheras/${sectorNormalizado}/${cochera}`)
            .then(response => response.json())
            .then(dataCochera => {
                if (!dataCochera.success) {
                    alert("La cochera especificada no existe.");
                    return;
                }
                
                if (!dataCochera.ocupado) {
                    alert("La cochera no está ocupada. No se puede registrar una salida.");
                    return;
                }
                
                // Confirmar la acción
                const confirmar = confirm(`¿Confirmar salida de cochera ${cochera} en sector ${sectorNormalizado}?`);
                if (!confirmar) {
                    return;
                }

                // Procesar salida administrativa
                const formData = new FormData();
                formData.append('sector', sectorNormalizado);
                formData.append('cochera', cochera);

                fetch(`${API_BASE_URL}/api/marcar_salida_admin`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                        // No incluir Content-Type cuando se usa FormData
                    },
    
                    body: formData
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        alert(result.message);
                        // Cerrar modal y actualizar datos
                        bootstrap.Modal.getInstance(modal).hide();
                        location.reload();
                    } else {
                        alert(result.message);
                    }
                })
                .catch(error => {
                    console.error('Error al marcar salida:', error);
                    alert('Error al procesar la salida.');
                });
            })
            .catch(error => {
                console.error('Error al verificar cochera:', error);
                alert('Error al verificar el estado de la cochera.');
            });
    }
}

// Función auxiliar para procesar la llegada/salida
function procesarLlegadaSalida(modalId) {
    const modal = document.getElementById(modalId);
    const sectorSelect = modal.querySelector('#sectorSelect');
    const cocheraInput = modal.querySelector('#cocheraInput');
    
    const sector = sectorSelect.value;
    const cochera = parseInt(cocheraInput.value, 10);
    const userId = getUserId();
    const sectorNormalizado = sector.charAt(0).toUpperCase() + sector.slice(1).toLowerCase();

    try {
        // Verificar el estado actual de la cochera
        fetch(`${API_BASE_URL}/api/cocheras/${sectorNormalizado}/${cochera}`)
            .then(response => response.json())
            .then(async dataCochera => {
                // Si la cochera no existe, registrarla primero
                if (!dataCochera.success) {
                    
                    const formDataRegistro = new FormData();
                    formDataRegistro.append('sector', sectorNormalizado);
                    formDataRegistro.append('cochera', cochera);
                    formDataRegistro.append('user_id', userId);
                    
                    await fetch(`${API_BASE_URL}/api/registrar_cochera`, {
                        method: 'POST',
                        body: formDataRegistro
                    });
                } 
                // Verificación adicional de estado
                else if (dataCochera.ocupado && accionActual === 'llegada') {
                    alert("Error: La cochera ya está ocupada. Ingresa otro número.");
                    return;
                } 
                else if (!dataCochera.ocupado && accionActual === 'salida') {
                    alert("Error: La cochera no está ocupada. No puedes registrar una salida.");
                    return;
                }

                // Preparar los datos para enviar
                const formData = new FormData();
                formData.append('numero', cochera);
                formData.append('sector', sectorNormalizado);
                formData.append('user_id', userId);
                
                // Determinar el endpoint según la operación
                const endpoint = accionActual === 'llegada' ? 'marcar_llegada' : 'marcar_salida';

                // Realizar la petición
                fetch(`${API_BASE_URL}/api/${endpoint}`, {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        alert(accionActual === 'llegada' ? 
                              '¡Cochera ocupada correctamente!' : 
                              '¡Salida registrada correctamente!');
                        location.reload(); // Recargar para actualizar la interfaz
                    } else {
                        alert(result.message || 'Ocurrió un error al procesar la solicitud.');
                    }
                })
                .catch(error => {
                    console.error('Error al procesar:', error);
                    alert('Ocurrió un error en el servidor.');
                });
            })
            .catch(error => {
                console.error('Error al verificar cochera:', error);
                alert('Error al verificar el estado de la cochera.');
            });
    } catch (error) {
        console.error('Error al guardar:', error);
        alert('Ocurrió un error al guardar los datos.');
    }
}

function verificarCocheraParaSalida(sector, cochera) {
    fetch(`${API_BASE_URL}/api/cocheras/${sector}/${cochera}`)
        .then(response => response.json())
        .then(data => {
            const feedback = document.getElementById('cocheraFeedback');
            
            if (data.success && data.ocupado) {
                feedback.innerHTML = `✓ Cochera ocupada por vehículo: <strong>${data.id_vehicle}</strong>`;
                feedback.className = 'form-text text-success';
            } else if (data.success && !data.ocupado) {
                feedback.textContent = '⚠ Cochera libre - no se puede registrar salida';
                feedback.className = 'form-text text-warning';
            } else {
                feedback.textContent = 'X Cochera no encontrada';
                feedback.className = 'form-text text-danger';
            }
        })
        .catch(error => {
            console.error('Error al verificar cochera:', error);
        });
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

// Función para verificar si el usuario tiene permisos de administrador
function isAdmin() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return false;
    
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        return currentUser && currentUser.userRole === 'administrador';
    } catch (e) {
        console.error('Error al verificar rol de administrador:', e);
        return false;
    }
}

// Función para cargar la lista de usuarios con mejor manejo de errores
function loadUsers() {
    const authToken = localStorage.getItem('authToken');
    
    // Mostrar indicador de carga
    const tableBody = document.querySelector('tbody');
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Cargando usuarios...</td></tr>';
    
    fetch('http://localhost:5000/api/users', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        // Verificar respuesta HTTP
        if (!response.ok) {
            console.error('Error HTTP:', response.status, response.statusText);
            if (response.status === 401 || response.status === 403) {
                alert('No autorizado o sesión expirada. Por favor, inicia sesión nuevamente.');
                // Limpiar tokens y redirigir
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                window.location.replace('index.html');
                throw new Error('No autorizado');
            }
            throw new Error(`Error del servidor: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            displayUsers(data.users);
        } else {
            alert(data.message || 'Error al cargar usuarios');
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Error al cargar usuarios</td></tr>';
        }
    })
    .catch(error => {
        console.error('Error completo:', error);
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Error de conexión</td></tr>';
        
        // Solo mostrar alerta si no es un error de autorización (ya manejado arriba)
        if (!error.message.includes('No autorizado')) {
            alert('Error al cargar los usuarios. Por favor, intenta más tarde.');
        }
    });
}

// Función para mostrar los usuarios en la tabla
function displayUsers(users) {
    const tableBody = document.querySelector('tbody');
    tableBody.innerHTML = '';
    
    if (!users || users.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" class="text-center">No hay usuarios registrados</td>';
        tableBody.appendChild(row);
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.username || 'N/A'}</td>
            <td>${user.phone || 'No disponible'}</td>
            <td>${user.email || 'N/A'}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteUser('${user.username}')">Eliminar</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Función para eliminar un usuario
function deleteUser(username) {
    if (confirm(`¿Estás seguro que deseas eliminar al usuario "${username}"?`)) {
        const authToken = localStorage.getItem('authToken');
        
        fetch(`http://localhost:5000/api/borrar_usuario/${username}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    alert('No autorizado o sesión expirada. Por favor, inicia sesión nuevamente.');
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('currentUser');
                    window.location.replace('index.html');
                    throw new Error('No autorizado');
                }
                throw new Error(`Error del servidor: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('Usuario eliminado correctamente');
                loadUsers(); // Recargar la lista de usuarios
            } else {
                alert(data.message || 'Error al eliminar el usuario');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            if (!error.message.includes('No autorizado')) {
                alert('Error al eliminar el usuario. Por favor, intenta más tarde.');
            }
        });
    }
}

function cargarSectoresDenuncia() {
    // Usar el ID correcto del HTML
    const sectorSelect = document.getElementById('selector-sector-denuncia');
    
    // Verificar que el elemento existe antes de usarlo
    if (!sectorSelect) {
        console.error('Elemento selector-sector-denuncia no encontrado');
        return;
    }
    
    fetch('http://localhost:5000/api/sectores')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            
            if (data.success) {
                sectorSelect.innerHTML = '<option value="" disabled selected>Seleccioná un sector</option>';
                
                if (data.sectors && data.sectors.length > 0) {
                    data.sectors.forEach(sector => {
                        const option = document.createElement('option');
                        option.value = sector.nameSec;
                        option.textContent = sector.nameSec;
                        sectorSelect.appendChild(option);
                    });
                } else {
                    console.error('No hay sectores en la respuesta');
                    sectorSelect.innerHTML += '<option value="" disabled>No hay sectores disponibles</option>';
                }
            } else {
                console.error('Error al cargar sectores:', data.error);
                sectorSelect.innerHTML = '<option value="" disabled selected>Error al cargar sectores</option>';
            }
        })
        .catch(error => {
            console.error('Error al obtener los sectores:', error);
            sectorSelect.innerHTML = '<option value="" disabled selected>Error al cargar sectores</option>';
        });
}

function cargarVehiculosDenuncia() {
    // Usar el ID correcto del HTML
    const vehiculoSelect = document.getElementById('selector-vehiculo-denuncia');
    
    // Verificar que el elemento existe antes de usarlo
    if (!vehiculoSelect) {
        console.error('Elemento selector-vehiculo-denuncia no encontrado');
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
                    console.error('No hay vehículos en la respuesta');
                    vehiculoSelect.innerHTML += '<option value="" disabled>No hay vehículos disponibles</option>';
                }
            } else {
                console.error('Error al cargar vehículos:', data.message);
                vehiculoSelect.innerHTML = '<option value="" disabled selected>Error al cargar vehículos</option>';
            }
        })
        .catch(error => {
            console.error('Error al obtener los vehículos:', error);
            vehiculoSelect.innerHTML = '<option value="" disabled selected>Error al cargar vehículos</option>';
        });
}

// Evento cuando se abre el modal de denuncia
document.getElementById('modalDenunciar').addEventListener('shown.bs.modal', function () {
    cargarSectoresDenuncia();
    cargarVehiculosDenuncia();
});

// Manejar envío de denuncia
async function enviarEmailDenuncia(patente, mensaje, sector) {
    try {
        const response = await fetch('http://localhost:5000/api/send-complaint-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            },
            body: JSON.stringify({
                patente: patente,
                mensaje: mensaje,
                sector: sector
            })
        });

        const data = await response.json();
        
        if (data.success) {
            console.log('Email de denuncia enviado exitosamente');
            return true;
        } else {
            console.error('Error al enviar email:', data.message);
            return false;
        }
    } catch (error) {
        console.error('Error en el envío del email:', error);
        return false;
    }
}

// Manejar envío de denuncia
document.getElementById('complaintForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const mensaje = event.target.querySelector('textarea[name="mensaje"]').value;
    const patente = document.getElementById('selector-vehiculo-denuncia').value;
    const sector = document.getElementById('selector-sector-denuncia').value;
    
    // Obtener ID del usuario actual
    const currentUserData = localStorage.getItem('currentUser');
    let idUser = null;

    if (currentUserData) {
        try {
            const parsedUser = JSON.parse(currentUserData);
            idUser = parsedUser.id;
        } catch (error) {
            console.error('Error al parsear currentUser:', error);
        }
    }
    
    if (!mensaje || !patente || !sector || !idUser) {
        alert('Por favor completa todos los campos');
        return;
    }
    
    // Mostrar indicador de carga
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;
    
    try {
        // Enviar denuncia al foro (usando los campos correctos)
        const complaintResponse = await fetch('http://localhost:5000/api/complaint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            },
            body: JSON.stringify({
                idSuperUser: idUser,    // Campo correcto
                idVehiculo: patente,    // Campo correcto (patente es el ID del vehículo)
                sector: sector,         // Campo correcto
                content: mensaje        // Campo correcto
            })
        });
        
        const complaintData = await complaintResponse.json();
        
        if (complaintData.success) {
            // Enviar email de notificación
            const emailEnviado = await enviarEmailDenuncia(patente, mensaje, sector);
            
            if (emailEnviado) {
                alert('Denuncia enviada exitosamente. Se ha notificado al usuario por email.');
            } else {
                alert('Denuncia enviada exitosamente, pero no se pudo enviar el email de notificación.');
            }
            
            // Limpiar formulario
            event.target.reset();
            document.getElementById('selector-vehiculo-denuncia').value = '';
            document.getElementById('selector-sector-denuncia').value = '';
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalDenunciar'));
            if (modal) {
                modal.hide();
            }
        } else {
            alert('Error al enviar la denuncia: ' + complaintData.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión. Por favor intenta nuevamente.');
    } finally {
        // Restaurar botón
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

function contactarUsuario() {
    const patente = document.getElementById('selector-vehiculo-denuncia').value;
    if (!patente) {
        alert('Por favor selecciona una patente primero');
        return;
    }
    alert(`Contactando al usuario con patente: ${patente}`);

}


// Verificar autenticación al cargar la página completamente
document.addEventListener('DOMContentLoaded', () => {
    
    // Verificar si el usuario está logueado y es administrador
    if (!isAdmin()) {
        window.location.replace('index.html');
        return;
    }

    const btnLlegada = document.getElementById('btnLlegada');
    const btnSalida = document.getElementById('btnSalida');
    
    if (btnLlegada) {
        btnLlegada.addEventListener('click', abrirModalLlegada);
    }
    
    if (btnSalida) {
        btnSalida.addEventListener('click', abrirModalSalida);
    }

    // Cargar lista de usuarios
    loadUsers();

    function abrirModalLlegada() {
        accionActual = 'llegada';
        bootstrap.Modal.getInstance(document.getElementById('modalAccion')).hide();
        setTimeout(() => {
            const modal = new bootstrap.Modal(document.getElementById('modalSectorCochera'));
            modal.show();
            // Cargar sectores después de que el modal se muestre
            setTimeout(() => {
                cargarSectores();
                configurarEventListeners('modalSectorCochera');
            }, 100);
        }, 300);
    }

    function abrirModalSalida() {
        accionActual = 'salida';
        bootstrap.Modal.getInstance(document.getElementById('modalAccion')).hide();
        setTimeout(() => {
            const modal = new bootstrap.Modal(document.getElementById('modalSectorCocheraPatente'));
            modal.show();
            // Cargar sectores después de que el modal se muestre
            setTimeout(() => {
                cargarSectores();
                configurarEventListeners('modalSectorCocheraPatente');
            }, 100);
        }, 300);
    }

    function configurarEventListeners(modalId) {
        const modal = document.getElementById(modalId);
        const sectorSelect = modal.querySelector('#sectorSelect');
        const cocheraInput = modal.querySelector('#cocheraInput');
        const cocheraFeedback = modal.querySelector('#cocheraFeedback');
        
        // Limpiar listeners anteriores
        if (sectorSelect) {
            sectorSelect.replaceWith(sectorSelect.cloneNode(true));
            const newSectorSelect = modal.querySelector('#sectorSelect');
            
            newSectorSelect.addEventListener('change', () => {
                const sector = newSectorSelect.value;
                cargarInfoSector(sector, modalId);
            });
        }
        
        if (cocheraInput) {
            cocheraInput.replaceWith(cocheraInput.cloneNode(true));
            const newCocheraInput = modal.querySelector('#cocheraInput');
            
            newCocheraInput.addEventListener('input', () => {
                validarCochera(modalId);
            });
        }

        // Configurar botón de guardar
        const guardarBtn = modalId === 'modalSectorCochera' ? 
            document.getElementById('guardarLlegada') : 
            document.getElementById('guardarSalida');
            
        if (guardarBtn) {
            guardarBtn.replaceWith(guardarBtn.cloneNode(true));
            const newGuardarBtn = modalId === 'modalSectorCochera' ? 
                document.getElementById('guardarLlegada') : 
                document.getElementById('guardarSalida');
                
            newGuardarBtn.addEventListener('click', () => {
                guardarLlegadaSalida(modalId);
            });
        }
    }

    function inicializarModalDenuncia() {
        cargarSectoresDenuncia();
        cargarVehiculosDenuncia();
    }

    const modalDenunciar = document.getElementById('modalDenunciar');
    if (modalDenunciar) {
        modalDenunciar.addEventListener('shown.bs.modal', function() {
            inicializarModalDenuncia();
        });
    }

    const patenteInput = document.getElementById('patenteInput');
    const patenteFeedback = document.getElementById('patenteFeedback');
    
    if (patenteInput) {
        patenteInput.addEventListener('input', function() {
            const patente = this.value.trim().toUpperCase();
            this.value = patente; // Convertir a mayúsculas automáticamente
            
            if (patente.length >= 3) {
                // Verificar si la patente existe
                fetch(`${API_BASE_URL}/api/vehiculo/${patente}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            patenteFeedback.textContent = `✓ Vehículo encontrado: ${data.vehiculo.brand} ${data.vehiculo.model}`;
                            patenteFeedback.className = 'form-text text-success';
                        } else {
                            patenteFeedback.textContent = '⚠ Patente no encontrada en el sistema';
                            patenteFeedback.className = 'form-text text-warning';
                        }
                    })
                    .catch(error => {
                        patenteFeedback.textContent = '';
                    });
            } else {
                patenteFeedback.textContent = '';
            }
        });
    }

});