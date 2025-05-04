// Variables globales para capturar las selecciones
let llegadaSalidaSelect = document.querySelectorAll('select')[0];
let sectorSelect = document.querySelectorAll('select')[1];
let cocheraSelect = document.getElementById('cocheraInput');
let guardarBtn = document.querySelector('.btn-success');
console.log(document.getElementById('logoutBtn'));

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

// Función para marcar llegada o salida de una cochera
guardarBtn.addEventListener('click', async function() {
    const llegadaSalida = llegadaSalidaSelect.value;
    let sector = sectorSelect.value;
    const cochera = parseInt(cocheraSelect.value, 10);  // ✅ Convertir a número

    if (!llegadaSalida || !sector || isNaN(cochera)) {  // ✅ Validar que sea un número válido
        alert("Completá todas las opciones antes de guardar.");
        return;
    }

    sector = sector.charAt(0).toUpperCase() + sector.slice(1).toLowerCase();

    try {
        console.log('Nombre de sector enviado:', sector);

        const resCochera = await fetch(`${API_BASE_URL}/api/cocheras/${sector}/${cochera}`);
        const dataCochera = await resCochera.json();

        if (!dataCochera.success) {
            console.log("Cochera no encontrada, registrando nueva cochera...");
            await fetch(`${API_BASE_URL}/api/registrar_cochera`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    sector: sector,
                    cochera: cochera
                })
            });
        } else if (dataCochera.ocupado && llegadaSalida === 'llegada') {
            alert("Error: La cochera ya está ocupada. Selecciona otra.");
            return;
        } else if (!dataCochera.ocupado && llegadaSalida === 'salida') {
            alert("Error: La cochera no está ocupada. No puedes registrar una salida.");
            return;
        }

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
            location.reload();
        } else {
            alert(result.message || 'Ocurrió un error al procesar la solicitud.');
        }

    } catch (error) {
        console.error('Error al guardar:', error);
        alert('Ocurrió un error al guardar los datos.');
    }
});


// Cargar la información inicial cuando se carga la página
window.addEventListener('DOMContentLoaded', function() {
    
    cargarSectores();
    
    checkToken();
    if (sectorSelect.value) {
        cargarCocheras(sectorSelect.value);
    }

    // Configurar evento para cerrar sesión
    document.getElementById('logoutBtn')?.addEventListener('click', function() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

});

// COCHERAS

// Deshabilitar el select de cocheras al inicio
cocheraSelect.disabled = true;

async function actualizarCocheras(sectorId) {
    try {
        // Primero obtenemos la información del sector para saber cuántas cocheras hay disponibles
        const response = await fetch(`${API_BASE_URL}/api/sector/${sectorId}`);
        const data = await response.json();
        
        if (data.success) {
            const freeParkingSpots = parseInt(data.sector.freeParkingSpots);
            
            // Limpiamos las opciones existentes
            cocheraSelect.innerHTML = '<option value="">Seleccioná una cochera</option>';
            
            // Solo habilitamos el select si hay cocheras disponibles
            if (freeParkingSpots > 0) {
                cocheraSelect.disabled = false;
                
                // Obtenemos las cocheras ocupadas del sector para no mostrarlas
                const cocherasResponse = await fetch(`${API_BASE_URL}/api/cocheras_ocupadas/${sectorId}`);
                const cocherasData = await cocherasResponse.json();
                
                let cocherasOcupadas = [];
                if (cocherasData.success) {
                    cocherasOcupadas = cocherasData.cocheras.map(c => parseInt(c.numero));
                }
                
                // Generamos tantas opciones como espacios totales tenga el sector
                // pero filtramos las ocupadas según la acción (llegada/salida)
                const espaciosTotales = data.sector.totalParkingSpots || 100; // Asumimos 100 si no hay dato
                const accion = llegadaSalidaSelect.value;
                
                for (let i = 1; i <= espaciosTotales; i++) {
                    const estaOcupada = cocherasOcupadas.includes(i);
                    
                    // Si es llegada, mostramos solo las libres
                    // Si es salida, mostramos solo las ocupadas
                    if ((accion === "llegada" && !estaOcupada) || 
                        (accion === "salida" && estaOcupada)) {
                        const option = document.createElement('option');
                        option.value = i;
                        option.textContent = i;
                        cocheraSelect.appendChild(option);
                    }
                }
            } else {
                // No hay cocheras disponibles
                cocheraSelect.disabled = true;
                
                if (llegadaSalidaSelect.value === "llegada") {
                    alert("No hay cocheras disponibles en este sector.");
                }
            }
        } else {
            console.error('Error al obtener información del sector');
            cocheraSelect.disabled = true;
        }
    } catch (error) {
        console.error('Error al actualizar cocheras:', error);
        cocheraSelect.disabled = true;
    }
}

function cargarSectores() {
    // Realizar petición al endpoint de sectores
    fetch(`${API_BASE_URL}/api/sectores`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Obtener el select del DOM
                const selectorSector = document.getElementById('selector-sector');
                
                // Limpiar opciones existentes
                selectorSector.innerHTML = '<option value="" disabled selected>Seleccioná un sector</option>';
                
                // Agregar cada sector como una opción
                data.sectors.forEach(sector => {
                    const option = document.createElement('option');
                    option.value = sector.idSector;
                    option.textContent = `${sector.nameSec} (${sector.freeParkingSpots} disponibles)`;
                    selectorSector.appendChild(option);
                });
                
                // Escuchar cambios en la selección de sector
                selectorSector.addEventListener('change', function() {
                    const sectorSeleccionado = this.value;
                    console.log('Sector seleccionado:', sectorSeleccionado);
                    
                    if (sectorSeleccionado) {
                        // Verificar si se ha seleccionado una opción de llegada/salida
                        if (!llegadaSalidaSelect.value) {
                            alert("Primero seleccioná si llegaste o te vas");
                            selectorSector.value = ""; // Reset selector
                            return;
                        }
                        
                        // Actualizamos las cocheras disponibles según el sector
                        actualizarCocheras(sectorSeleccionado);
                    } else {
                        // Si no hay sector seleccionado, deshabilitamos el selector de cocheras
                        cocheraSelect.disabled = true;
                        cocheraSelect.innerHTML = '<option value="">Seleccioná una cochera</option>';
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

// Escuchar cambios en la selección de llegada/salida
llegadaSalidaSelect.addEventListener('change', function() {
    // Resetear los otros selects cuando cambia este
    sectorSelect.value = "";
    cocheraSelect.disabled = true;
    cocheraSelect.innerHTML = '<option value="">Seleccioná una cochera</option>';
});