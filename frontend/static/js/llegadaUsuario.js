// Variables globales para capturar las selecciones
const llegadaSalidaSelect = document.querySelector('#llegadaSalidaSelect');
const sectorSelect = document.querySelector('#selector-sector');
const cocheraInput = document.querySelector('#cochera-input');
const cocheraFeedback = document.querySelector('#cochera-feedback');

// Variables para manejar el estado del vehículo estacionado
let vehicleParkedInfo = null;

// Base URL de tu API
const API_BASE_URL = 'http://localhost:5000';

// Variables para almacenar información sobre el sector
let sectorInfo = null;
let cocheraValida = false;

function preventCaching() {
    // Prevenir almacenamiento en caché
    if (window.location.protocol !== 'file:') {
        window.history.replaceState(null, document.title, window.location.href);
    }
}

function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    const headers = {};
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

function checkToken() {
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');

    if (!authToken || !currentUser) {
        console.error('No se encontró el token o el usuario actual');
        window.location.replace('index.html');
        return false;
    }
    return true;
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

// Función que se ejecuta cuando cambia la selección de llegada/salida
function onLlegadaSalidaChange() {
    const accion = llegadaSalidaSelect.value;
    
    // Resetear campos
    sectorSelect.value = "";
    cocheraInput.value = "";
    cocheraFeedback.textContent = "";
    cocheraFeedback.classList.remove('text-danger', 'text-success', 'text-info', 'text-warning');
    sectorInfo = null;
    cocheraValida = false;
    
    // Ocultar información del vehículo si existe
    const infoContainer = document.getElementById('vehiculo-info-container');
    if (infoContainer) {
        infoContainer.style.display = 'none';
    }
    
    if (accion === 'salida') {
        // Cuando selecciona salida, obtener información del vehículo estacionado
        obtenerVehiculoEstacionado();
    } else if (accion === 'llegada') {
        // Cuando selecciona llegada, habilitar campos y cargar sectores
        habilitarCamposLlegada();
    } else {
        // Si no hay selección válida, deshabilitar campos
        cocheraInput.disabled = true;
        sectorSelect.disabled = false;
    }
}

// Función para obtener la información del vehículo estacionado
function obtenerVehiculoEstacionado() {
    // Mostrar loading mientras se obtiene la información
    mostrarLoadingEnCampos();
    
    // Obtener el ID del usuario
    const userId = getUserId();
    
    if (!userId) {
        alert("Debes iniciar sesión para realizar esta acción.");
        habilitarCamposLlegada();
        return;
    }
    
    fetch(`${API_BASE_URL}/api/user-parked-vehicle?user_id=${userId}`, {
        headers: getAuthHeaders()
    })
    .then(response => {
        if (response.status === 401) {
            throw new Error('Token inválido o expirado');
        }
        return response.json();
    })
    .then(data => {
        if (data.success && data.is_parked) {
            // El vehículo está estacionado, autocompletar y deshabilitar campos
            vehicleParkedInfo = data.parking_info;
            autocompletarCamposSalida(data.parking_info);
        } else if (data.has_vehicle && !data.is_parked) {
            // El usuario tiene vehículo pero no está estacionado
            mostrarMensajeNoEstacionado();
        } else {
            // El usuario no tiene vehículo principal
            mostrarMensajeNoVehiculo();
        }
    })
    .catch(error => {
        console.error('Error al obtener vehículo estacionado:', error);
        if (error.message.includes('Token')) {
            alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        } else {
            alert('Error al obtener la información del vehículo estacionado.');
        }
        // Volver a habilitar los campos en caso de error
        habilitarCamposLlegada();
    });
}

// Función para autocompletar y deshabilitar campos cuando es salida
function autocompletarCamposSalida(parkingInfo) {
    // Cargar sectores primero
    cargarSectores(() => {
        // Esperar un momento para que se rendericen las opciones
        setTimeout(() => {
            // Autocompletar sector (usar el valor exacto que viene del servidor)
            sectorSelect.value = parkingInfo.sector;
            sectorSelect.disabled = true;
            
            // Disparar evento change para actualizar la información del sector
            const event = new Event('change');
            sectorSelect.dispatchEvent(event);
            
            // Esperar un momento para que se cargue la información del sector
            setTimeout(() => {
                // Autocompletar cochera
                cocheraInput.value = parkingInfo.cochera;
                cocheraInput.disabled = true;
                
                // Validar la cochera automáticamente
                cocheraValida = true;
                cocheraFeedback.textContent = `Vehículo estacionado desde: ${formatearFecha(parkingInfo.vehicle_info.checkInTime)}`;
                cocheraFeedback.classList.remove('text-danger');
                cocheraFeedback.classList.add('text-info');
            }, 500); // Aumenté el tiempo de espera
        }, 100); // Pequeña espera para que se renderice el select
    });
}

// Función para crear el contenedor de información del vehículo si no existe
function crearContenedorInfoVehiculo() {
    const container = document.createElement('div');
    container.id = 'vehiculo-info-container';
    container.style.display = 'none';
    
    // Insertar después del campo de cochera
    const cocheraContainer = cocheraInput.closest('.form-group') || cocheraInput.parentElement;
    cocheraContainer.parentNode.insertBefore(container, cocheraContainer.nextSibling);
    
    return container;
}

// Función para mostrar loading en los campos
function mostrarLoadingEnCampos() {
    sectorSelect.disabled = true;
    cocheraInput.disabled = true;
    cocheraInput.placeholder = "Obteniendo información...";
    cocheraFeedback.textContent = 'Consultando dónde está estacionado tu vehículo...';
    cocheraFeedback.classList.remove('text-danger', 'text-success');
    cocheraFeedback.classList.add('text-info');
}

// Función para habilitar campos cuando es llegada
function habilitarCamposLlegada() {
    sectorSelect.disabled = false;
    cocheraInput.disabled = false;
    cocheraInput.placeholder = "Número de cochera";
    cocheraInput.value = '';
    cocheraFeedback.textContent = '';
    cocheraFeedback.classList.remove('text-danger', 'text-success', 'text-info', 'text-warning');
    
    // Ocultar información del vehículo
    const infoContainer = document.getElementById('vehiculo-info-container');
    if (infoContainer) {
        infoContainer.style.display = 'none';
    }
    
    vehicleParkedInfo = null;
    cocheraValida = false;
    
    // Cargar sectores para llegada
    cargarSectores();
}

// Función para mostrar mensaje cuando no está estacionado
function mostrarMensajeNoEstacionado() {
    sectorSelect.disabled = true;
    cocheraInput.disabled = true;
    cocheraInput.value = '';
    cocheraFeedback.textContent = 'Tu vehículo no está estacionado en ninguna cochera. Selecciona "Llegada" para estacionar.';
    cocheraFeedback.classList.remove('text-success', 'text-info', 'text-danger');
    cocheraFeedback.classList.add('text-warning');
    cocheraValida = false;
}

// Función para mostrar mensaje cuando no tiene vehículo
function mostrarMensajeNoVehiculo() {
    sectorSelect.disabled = true;
    cocheraInput.disabled = true;
    cocheraInput.value = '';
    cocheraFeedback.textContent = 'No tienes un vehículo principal registrado. Registra un vehículo primero.';
    cocheraFeedback.classList.remove('text-success', 'text-info', 'text-warning');
    cocheraFeedback.classList.add('text-danger');
    cocheraValida = false;
}

// Función para formatear fecha
function formatearFecha(fechaISO) {
    if (!fechaISO) return 'Fecha no disponible';
    
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Función para cargar los sectores al iniciar la página
function cargarSectores(callback) {
    fetch(`${API_BASE_URL}/api/sectores`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Limpiar opciones existentes
                sectorSelect.innerHTML = '<option value="" disabled selected>Seleccioná un sector</option>';
                
                // Agregar cada sector como una opción
                data.sectors.forEach(sector => {
                    const option = document.createElement('option');
                    option.value = sector.nameSec;
                    
                    // Mostrar diferente texto según el tipo de acción (llegada/salida)
                    const accion = llegadaSalidaSelect.value;
                    if (accion === "llegada") {
                        option.textContent = `${sector.nameSec} (${sector.freeParkingSpots} disponibles)`;
                        // Deshabilitar sectores sin cocheras disponibles
                        if (sector.freeParkingSpots <= 0) {
                            option.disabled = true;
                        }
                    } else if (accion === "salida") {
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
                
                // Ejecutar callback si se proporciona
                if (callback) callback();
            } else {
                console.error('Error al cargar sectores:', data.error);
            }
        })
        .catch(error => {
            console.error('Error al obtener los sectores:', error);
        });
}

// Función para cargar información del sector seleccionado
function cargarInfoSector(sectorName) {
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
                
                // Habilitar la entrada de número de cochera solo si no es salida con info autocompletada
                if (!(llegadaSalidaSelect.value === 'salida' && vehicleParkedInfo)) {
                    cocheraInput.disabled = false;
                    cocheraInput.value = '';
                }
                
                const accion = llegadaSalidaSelect.value;
                
                if (accion === "llegada") {
                    if (sectorInfo.freeParkingSpots <= 0) {
                        cocheraInput.disabled = true;
                        cocheraFeedback.textContent = 'No hay cocheras disponibles en este sector.';
                    } else {
                        cocheraFeedback.textContent = `Ingresa un número de cochera entre 1 y ${sectorInfo.availableParkingSpots}`;
                    }
                } else if (accion === "salida") {
                    if (!vehicleParkedInfo) {
                        const cocherasOcupadas = sectorInfo.availableParkingSpots - sectorInfo.freeParkingSpots;
                        if (cocherasOcupadas <= 0) {
                            cocheraInput.disabled = true;
                            cocheraFeedback.textContent = 'No hay cocheras ocupadas en este sector.';
                        } else {
                            cocheraFeedback.textContent = `Ingresa un número de cochera entre 1 y ${sectorInfo.availableParkingSpots}`;
                        }
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
function validarCochera() {
    if (!sectorInfo || cocheraInput.disabled) {
        cocheraValida = false;
        return;
    }
    
    const numeroCochera = parseInt(cocheraInput.value, 10);
    const accion = llegadaSalidaSelect.value;
    const sectorName = sectorSelect.value;
    
    // Validar que sea un número válido
    if (isNaN(numeroCochera) || numeroCochera <= 0) {
        cocheraFeedback.textContent = 'Ingresa un número de cochera válido.';
        cocheraFeedback.classList.add('text-danger');
        cocheraValida = false;
        return;
    }
    
    // Validar que esté dentro del rango permitido
    if (numeroCochera > sectorInfo.availableParkingSpots) {
        cocheraFeedback.textContent = `El número de cochera debe ser entre 1 y ${sectorInfo.availableParkingSpots}.`;
        cocheraFeedback.classList.add('text-danger');
        cocheraValida = false;
        return;
    }
    
    // Verificar el estado actual de la cochera
    fetch(`${API_BASE_URL}/api/cocheras/${sectorName}/${numeroCochera}`, {
        headers: getAuthHeaders()
    })
        .then(response => response.json())
        .then(dataCochera => {
            const cochera = dataCochera.success ? dataCochera : { ocupado: false };
            
            if (accion === "llegada" && cochera.ocupado) {
                cocheraFeedback.textContent = 'Esta cochera ya está ocupada. Por favor, elige otra.';
                cocheraFeedback.classList.add('text-danger');
                cocheraValida = false;
            } else if (accion === "salida" && !cochera.ocupado) {
                cocheraFeedback.textContent = 'Esta cochera no está ocupada. No puedes registrar una salida.';
                cocheraFeedback.classList.add('text-danger');
                cocheraValida = false;
            } else {
                // La cochera es válida para la acción seleccionada
                cocheraFeedback.textContent = accion === "llegada" ? 
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
            cocheraValida = false;
        });
}

// Función principal para guardar llegada/salida
function guardarLlegadaSalida() {
    const llegadaSalida = llegadaSalidaSelect.value;
    let sector, cochera;
    
    // Si es salida y tenemos información del vehículo estacionado, usar esos datos
    if (llegadaSalida === 'salida' && vehicleParkedInfo) {
        sector = vehicleParkedInfo.sector.toLowerCase();
        cochera = vehicleParkedInfo.cochera;
    } else {
        // Para llegada o si no hay información de vehículo estacionado, usar los campos del formulario
        sector = sectorSelect.value;
        cochera = parseInt(cocheraInput.value, 10);
    }
    
    // Obtener el ID del usuario actual
    const userId = getUserId();

    if (!llegadaSalida || !sector || isNaN(cochera)) {
        alert("Completá todas las opciones con valores válidos antes de guardar.");
        return;
    }

    if (!userId) {
        alert("Debes iniciar sesión para realizar esta acción.");
        return;
    }

    // Verificar que el token esté disponible
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
        return;
    }

    // Para salida con información autocompletada, procesar directamente
    if (llegadaSalida === 'salida' && vehicleParkedInfo) {
        procesarLlegadaSalida();
        return;
    }

    // Para llegada o salida manual, hacer validaciones adicionales
    if (!cocheraValida) {
        alert("La cochera seleccionada no es válida.");
        return;
    }

    // Si es una llegada, verificar primero si el usuario ya tiene una cochera ocupada
    if (llegadaSalida === 'llegada') {
        // Obtener el vehículo principal del usuario
        fetch(`${API_BASE_URL}/api/user-primary-vehicle`, {
            headers: getAuthHeaders()
        })
            .then(response => {
                if (response.status === 401) {
                    throw new Error('Token inválido o expirado');
                }
                return response.json();
            })
            .then(data => {
                if (!data.success || !data.has_primary) {
                    alert("No tienes un vehículo principal registrado. Por favor, registra un vehículo primero.");
                    return;
                }

                // Verificar si el vehículo ya está en alguna cochera
                const sectorNormalizado = sector.charAt(0).toUpperCase() + sector.slice(1).toLowerCase();
                fetch(`${API_BASE_URL}/api/cocheras/${sectorNormalizado}`, {
                    headers: getAuthHeaders()
                })
                    .then(response => {
                        if (response.status === 401) {
                            throw new Error('Token inválido o expirado');
                        }
                        return response.json();
                    })
                    .then(sectorData => {
                        if (sectorData.success) {
                            // Buscar si alguna cochera está ocupada por el vehículo del usuario
                            const cocheraOcupada = sectorData.cocheras.find(c => 
                                c.ocupado && c.id_vehicle === data.vehicle.idVehicle
                            );

                            if (cocheraOcupada) {
                                alert("Ya tienes una cochera ocupada. No puedes ocupar otra cochera.");
                                return;
                            }

                            // Si no tiene cochera ocupada, continuar con el proceso normal
                            procesarLlegadaSalida();
                        } else {
                            alert("Error al verificar el estado de las cocheras.");
                        }
                    })
                    .catch(error => {
                        console.error('Error al verificar cocheras:', error);
                        if (error.message.includes('Token')) {
                            alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                        } else {
                            alert('Error al verificar el estado de las cocheras.');
                        }
                    });
            })
            .catch(error => {
                console.error('Error al obtener vehículo principal:', error);
                if (error.message.includes('Token')) {
                    alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                } else {
                    alert('Error al verificar el vehículo principal.');
                }
            });
    } else {
        // Si es una salida, continuar con el proceso normal
        procesarLlegadaSalida();
    }
}

// Función auxiliar para procesar la llegada/salida
function procesarLlegadaSalida() {
    const llegadaSalida = llegadaSalidaSelect.value;
    let sector, cochera;
    
    // Determinar los valores a usar
    if (llegadaSalida === 'salida' && vehicleParkedInfo) {
        sector = vehicleParkedInfo.sector;
        cochera = parseInt(vehicleParkedInfo.cochera, 10);
    } else {
        sector = sectorSelect.value;
        cochera = parseInt(cocheraInput.value, 10);
    }
    
    const userId = getUserId();
    const sectorNormalizado = sector.charAt(0).toUpperCase() + sector.slice(1).toLowerCase();

    try {
        // Verificar el estado actual de la cochera
        fetch(`${API_BASE_URL}/api/cocheras/${sectorNormalizado}/${cochera}`, {
            headers: getAuthHeaders()
        })
            .then(response => {
                if (response.status === 401) {
                    throw new Error('Token inválido o expirado');
                }
                return response.json();
            })
            .then(async dataCochera => {
                // Si la cochera no existe, registrarla primero
                if (!dataCochera.success) {
                    console.log("Cochera no encontrada, registrando nueva cochera...");
                    
                    const formDataRegistro = new FormData();
                    formDataRegistro.append('sector', sectorNormalizado);
                    formDataRegistro.append('cochera', cochera);
                    formDataRegistro.append('user_id', userId);
                    
                    const token = localStorage.getItem('authToken');
                    await fetch(`${API_BASE_URL}/api/registrar_cochera`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formDataRegistro
                    });
                } 
                // Verificación adicional de estado (solo para entrada manual)
                else if (!vehicleParkedInfo) {
                    if (dataCochera.ocupado && llegadaSalida === 'llegada') {
                        alert("Error: La cochera ya está ocupada. Ingresa otro número.");
                        return;
                    } 
                    else if (!dataCochera.ocupado && llegadaSalida === 'salida') {
                        alert("Error: La cochera no está ocupada. No puedes registrar una salida.");
                        return;
                    }
                }

                // Preparar los datos para enviar
                const formData = new FormData();
                formData.append('numero', cochera);
                formData.append('sector', sectorNormalizado);
                formData.append('user_id', userId);
                
                // Determinar el endpoint según la operación
                const endpoint = llegadaSalida === 'llegada' ? 'marcar_llegada' : 'marcar_salida';

                // Realizar la petición
                const token = localStorage.getItem('authToken');
                fetch(`${API_BASE_URL}/api/${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                })
                .then(response => {
                    if (response.status === 401) {
                        throw new Error('Token inválido o expirado');
                    }
                    return response.json();
                })
                .then(result => {
                    if (result.success) {
                        alert(llegadaSalida === 'llegada' ? 
                              '¡Cochera ocupada correctamente!' : 
                              '¡Salida registrada correctamente!');
                        location.reload(); // Recargar para actualizar la interfaz
                    } else {
                        alert(result.message || 'Ocurrió un error al procesar la solicitud.');
                    }
                })
                .catch(error => {
                    console.error('Error al procesar:', error);
                    if (error.message.includes('Token')) {
                        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    } else {
                        alert('Ocurrió un error en el servidor.');
                    }
                });
            })
            .catch(error => {
                console.error('Error al verificar cochera:', error);
                if (error.message.includes('Token')) {
                    alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                } else {
                    alert('Error al verificar el estado de la cochera.');
                }
            });
    } catch (error) {
        console.error('Error al guardar:', error);
        alert('Ocurrió un error al guardar los datos.');
    }
}

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    preventCaching();
    
    // Verificar autenticación
    if (!checkToken()) return;
    
    // Configurar evento para el botón de logout
    document.getElementById('logoutBtn')?.addEventListener('click', function() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('chatEmail');
        window.location.href = 'index.html';
    });
    
    // Escuchar cambios en la selección de llegada/salida
    llegadaSalidaSelect.addEventListener('change', onLlegadaSalidaChange);
    
    // Escuchar cambios en la selección de sector
    sectorSelect.addEventListener('change', function() {
        const sectorSeleccionado = this.value;
        
        if (sectorSeleccionado) {
            cargarInfoSector(sectorSeleccionado);
        } else {
            cocheraInput.disabled = true;
            cocheraInput.value = "";
            cocheraFeedback.textContent = "";
            cocheraFeedback.classList.remove('text-danger', 'text-success');
            sectorInfo = null;
            cocheraValida = false;
        }
    });
    
    // Escuchar cambios en el campo de entrada de cochera
    cocheraInput.addEventListener('input', function() {
        cocheraFeedback.classList.remove('text-danger', 'text-success');
        cocheraValida = false;
    });
    
    // Validar al perder el foco
    cocheraInput.addEventListener('blur', validarCochera);
    
    // Configurar evento para el botón de guardar
    document.querySelector('.btn-success').addEventListener('click', guardarLlegadaSalida);
});