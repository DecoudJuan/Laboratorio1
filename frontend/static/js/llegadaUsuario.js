// Variables globales para capturar las selecciones
const llegadaSalidaSelect = document.querySelector('#llegadaSalidaSelect');
const sectorSelect = document.querySelector('#selector-sector');
const cocheraInput = document.querySelector('#cochera-input'); // Cambiado a input
const cocheraFeedback = document.querySelector('#cochera-feedback'); // Para mostrar mensajes

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
                
                // Habilitar la entrada de número de cochera
                cocheraInput.disabled = false;
                cocheraInput.value = '';
                
                const accion = llegadaSalidaSelect.value;
                
                if (accion === "llegada") {
                    if (sectorInfo.freeParkingSpots <= 0) {
                        cocheraInput.disabled = true;
                        cocheraFeedback.textContent = 'No hay cocheras disponibles en este sector.';
                    } else {
                        cocheraFeedback.textContent = `Ingresa un número de cochera entre 1 y ${sectorInfo.availableParkingSpots}`;
                    }
                } else if (accion === "salida") {
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
    fetch(`${API_BASE_URL}/api/cocheras/${sectorName}/${numeroCochera}`)
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

function guardarLlegadaSalida() {
    const llegadaSalida = llegadaSalidaSelect.value;
    const sector = sectorSelect.value;
    const cochera = parseInt(cocheraInput.value, 10);
    
    // Obtener el ID del usuario actual (esto dependerá de cómo esté implementada la autenticación)
    const userId = getUserId(); // Esta función debe obtener el ID del usuario actual

    if (!llegadaSalida || !sector || isNaN(cochera) || !cocheraValida) {
        alert("Completá todas las opciones con valores válidos antes de guardar.");
        return;
    }

    if (!userId) {
        alert("Debes iniciar sesión para realizar esta acción.");
        return;
    }

    // Normalizar el nombre del sector (primera letra mayúscula, resto minúscula)
    const sectorNormalizado = sector.charAt(0).toUpperCase() + sector.slice(1).toLowerCase();

    try {
        // Verificar el estado actual de la cochera
        fetch(`${API_BASE_URL}/api/cocheras/${sectorNormalizado}/${cochera}`)
            .then(response => response.json())
            .then(async dataCochera => {
                // Si la cochera no existe, registrarla primero
                if (!dataCochera.success) {
                    console.log("Cochera no encontrada, registrando nueva cochera...");
                    
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
                else if (dataCochera.ocupado && llegadaSalida === 'llegada') {
                    alert("Error: La cochera ya está ocupada. Ingresa otro número.");
                    return;
                } 
                else if (!dataCochera.ocupado && llegadaSalida === 'salida') {
                    alert("Error: La cochera no está ocupada. No puedes registrar una salida.");
                    return;
                }

                // Preparar los datos para enviar
                const formData = new FormData();
                formData.append('numero', cochera);
                formData.append('sector', sectorNormalizado);
                formData.append('user_id', userId); // Añadir el ID del usuario
                
                // Determinar el endpoint según la operación
                const endpoint = llegadaSalida === 'llegada' ? 'marcar_llegada' : 'marcar_salida';

                // Realizar la petición
                fetch(`${API_BASE_URL}/api/${endpoint}`, {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
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

function getUserId() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        try {
            const user = JSON.parse(currentUser);
            return user.id; // Asumiendo que el ID del usuario está en el objeto
        } catch (error) {
            console.error('Error al parsear el usuario actual:', error);
        }
    }
    return null;
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
    llegadaSalidaSelect.addEventListener('change', function() {
        sectorSelect.value = "";
        cocheraInput.value = "";
        cocheraInput.disabled = true;
        cocheraFeedback.textContent = "";
        cocheraFeedback.classList.remove('text-danger', 'text-success');
        sectorInfo = null;
        cocheraValida = false;
        
        // Si se seleccionó una opción, cargar los sectores
        if (this.value) {
            cargarSectores();
        }
    });
    
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