// Variables globales para capturar las selecciones
let llegadaSalidaSelect = document.querySelectorAll('select')[0];
let sectorSelect = document.querySelectorAll('select')[1];
let cocheraInput = document.createElement('input'); // Cambiamos el select por un input
let cocheraLabel = document.createElement('label');
let guardarBtn = document.querySelector('.btn-success');

// Configurar el input de cochera
cocheraInput.type = 'number';
cocheraInput.min = '1';
cocheraInput.className = 'form-control';
cocheraInput.placeholder = 'Ingrese número de cochera';
cocheraInput.id = 'cocheraInput';

// Configurar la etiqueta
cocheraLabel.htmlFor = 'cocheraInput';
cocheraLabel.textContent = 'Número de cochera:';

// Reemplazar el selector de cocheras por el input
const cocheraSelectContainer = document.querySelectorAll('select')[2].parentNode;
cocheraSelectContainer.innerHTML = ''; // Limpiar el contenedor
cocheraSelectContainer.appendChild(cocheraLabel);
cocheraSelectContainer.appendChild(cocheraInput);

// Base URL de tu API
const API_BASE_URL = 'http://localhost:5000';  // Asegúrate de que coincida con tu servidor

function preventCaching() {
    // NO ALMACENA CACHÉ
    if (window.location.protocol != 'file:') {
        window.history.replaceState(null, document.title, window.location.href);
    }
}

preventCaching();

function checkToken() {
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');

    console.log('Token de autenticación:', authToken);
    console.log('Usuario actual:', currentUser);

    if (!authToken || !currentUser) {
        console.error('No se encontró el token o el usuario actual');
        window.location.replace('index.html');
        return false;
    }
    return true;
}

// Función para obtener el total de cocheras disponibles en un sector
async function obtenerTotalCocheras(sector) {
    if (!sector) return 0;
    
    // Normalizar el nombre del sector
    sector = sector.charAt(0).toUpperCase() + sector.slice(1).toLowerCase();
    
    try {
        // Primero intentamos obtener el sector directamente de la API
        const sectorResponse = await fetch(`${API_BASE_URL}/api/sector/${sector}`);
        const sectorData = await sectorResponse.json();
        
        if (sectorData.success && sectorData.sector && sectorData.sector.availableParkingSpots) {
            console.log(`Sector ${sector} tiene ${sectorData.sector.availableParkingSpots} cocheras disponibles`);
            return sectorData.sector.availableParkingSpots;
        }
        
        // Si no podemos obtener directamente, intentamos a través de la lista de cocheras
        const cocherasResponse = await fetch(`${API_BASE_URL}/api/cocheras/${sector}`);
        const cocherasData = await cocherasResponse.json();
        
        if (cocherasData.success) {
            const total = cocherasData.total || cocherasData.cocheras?.length || 0;
            console.log(`Sector ${sector} tiene ${total} cocheras según API de cocheras`);
            return total;
        } else {
            console.error('No se pudo obtener el total de cocheras');
            // Valor predeterminado razonable para evitar 0
            return 100;
        }
    } catch (error) {
        console.error('Error al obtener el total de cocheras:', error);
        // Valor predeterminado razonable para evitar 0
        return 100;
    }
}

// Evento para cuando cambia el sector seleccionado
sectorSelect.addEventListener('change', async function() {
    const sector = this.value;
    if (!sector) return;
    
    // Obtener el total de cocheras para este sector
    const totalCocheras = await obtenerTotalCocheras(sector);
    
    // Actualizar el atributo max del input
    cocheraInput.max = totalCocheras;
    cocheraInput.value = '';
});

// Función para verificar la disponibilidad de la cochera
async function verificarCochera(sector, cochera) {
    if (!sector || !cochera) return null;
    
    // Normalizar el nombre del sector
    const sectorNormalizado = sector.charAt(0).toUpperCase() + sector.slice(1).toLowerCase();
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/cocheras/${sectorNormalizado}/${cochera}`);
        const data = await response.json();
        
        return data;
    } catch (error) {
        console.error('Error al verificar estado de cochera:', error);
        return null;
    }
}

// Evento para verificar el estado de una cochera cuando se cambia el valor
cocheraInput.addEventListener('change', async function() {
    const sector = sectorSelect.value;
    const cochera = this.value;
    
    if (!sector || !cochera) return;
    
    // Obtener el total de cocheras para este sector
    const totalCocheras = await obtenerTotalCocheras(sector);
    
    // Verificar si el número introducido es válido
    if (parseInt(cochera) <= 0) {
        alert("Error: El número de cochera debe ser mayor a 0");
        this.value = '';
        return;
    }
    
    if (totalCocheras > 0 && parseInt(cochera) > totalCocheras) {
        alert(`Error: El número de cochera debe ser menor o igual a ${totalCocheras}`);
        this.value = '';
        return;
    }
    
    // Verificar el estado de la cochera según el tipo de operación
    const llegadaSalida = llegadaSalidaSelect.value;
    const cocheraInfo = await verificarCochera(sector, cochera);
    
    if (cocheraInfo) {
        if (llegadaSalida === 'llegada' && cocheraInfo.ocupado) {
            alert("Esta cochera ya está ocupada. Por favor ingrese otro número.");
            this.value = '';
        } else if (llegadaSalida === 'salida' && !cocheraInfo.ocupado) {
            alert("Esta cochera no está ocupada. No se puede registrar una salida.");
            this.value = '';
        }
    }
});

// Evento para actualizar la validación cuando cambia el tipo de operación
llegadaSalidaSelect.addEventListener('change', async function() {
    const sector = sectorSelect.value;
    const cochera = cocheraInput.value;
    
    if (!sector || !cochera) return;
    
    // Verificar el estado de la cochera según el nuevo tipo de operación
    const llegadaSalida = this.value;
    const cocheraInfo = await verificarCochera(sector, cochera);
    
    if (cocheraInfo) {
        if (llegadaSalida === 'llegada' && cocheraInfo.ocupado) {
            alert("Esta cochera ya está ocupada. Por favor ingrese otro número.");
            cocheraInput.value = '';
        } else if (llegadaSalida === 'salida' && !cocheraInfo.ocupado) {
            alert("Esta cochera no está ocupada. No se puede registrar una salida.");
            cocheraInput.value = '';
        }
    }
});

// Función para marcar llegada o salida de una cochera
guardarBtn.addEventListener('click', async function() {
    const llegadaSalida = llegadaSalidaSelect.value;
    let sector = sectorSelect.value;
    const cochera = cocheraInput.value;

    if (!llegadaSalida || !sector || !cochera) {
        alert("Completá todas las opciones antes de guardar.");
        return;
    }

    // Normalizar el nombre del sector
    sector = sector.charAt(0).toUpperCase() + sector.slice(1).toLowerCase();

    try {
        console.log('Nombre de sector enviado:', sector);
        
        // Obtener el total de cocheras para este sector
        const totalCocheras = await obtenerTotalCocheras(sector);
        
        // Verificar si el número de cochera es válido
        if (parseInt(cochera) <= 0) {
            alert("Error: El número de cochera debe ser mayor a 0");
            return;
        }
        
        if (totalCocheras > 0 && parseInt(cochera) > totalCocheras) {
            alert(`Error: El número de cochera debe ser menor o igual a ${totalCocheras}`);
            return;
        }

        // Verificar si la cochera existe y su estado
        const cocheraInfo = await verificarCochera(sector, cochera);
        
        if (!cocheraInfo.success) {
            // La cochera no existe en la base de datos, hay que registrarla
            console.log("Cochera no encontrada, registrando nueva cochera...");
            const resRegistro = await fetch(`${API_BASE_URL}/api/registrar_cochera`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    sector: sector,
                    cochera: cochera
                })
            });
            
            const dataRegistro = await resRegistro.json();
            if (!dataRegistro.success) {
                alert(dataRegistro.message || 'Error al registrar la cochera');
                return;
            }
        } else {
            // Verificar el estado de la cochera según la operación
            if (cocheraInfo.ocupado && llegadaSalida === 'llegada') {
                alert("Error: La cochera ya está ocupada. Ingrese otro número.");
                return;
            } else if (!cocheraInfo.ocupado && llegadaSalida === 'salida') {
                alert("Error: La cochera no está ocupada. No se puede registrar una salida.");
                return;
            }
        }

        // Si todo está correcto, proceder con la operación
        const formDataCochera = new FormData();
        formDataCochera.append('numero', cochera);
        formDataCochera.append('sector', sector);
        formDataCochera.append('ocupado', llegadaSalida === 'llegada' ? true : false);

        const endpoint = llegadaSalida === 'llegada' ? 'marcar_llegada' : 'marcar_salida';
        
        const response = await fetch(`${API_BASE_URL}/api/${endpoint}`, {
            method: 'POST',
            body: formDataCochera
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(llegadaSalida === 'llegada' ? '¡Cochera ocupada correctamente!' : '¡Salida registrada correctamente!');
            location.reload(); // Recargar la página para reflejar el cambio
        } else {
            alert(result.message || 'Ocurrió un error al procesar la solicitud.');
        }

    } catch (error) {
        console.error('Error al guardar:', error);
        alert('Ocurrió un error al guardar los datos.');
    }
});

// Configurar evento para cerrar sesión
document.getElementById('logoutBtn')?.addEventListener('click', function() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
});

// Cargar la información inicial cuando se carga la página
window.addEventListener('DOMContentLoaded', function() {
    checkToken();
});