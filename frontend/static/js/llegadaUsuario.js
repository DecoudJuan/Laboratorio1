// Variables globales para capturar las selecciones
let llegadaSalidaSelect = document.querySelectorAll('select')[0];
let sectorSelect = document.querySelectorAll('select')[1];
let cocheraSelect = document.querySelectorAll('select')[2];
let guardarBtn = document.querySelector('.btn-success');

// Base URL de tu API
const API_BASE_URL = 'http://localhost:5000';  // Asegurate que coincida con tu servidor

// Deshabilitar el select de cocheras al inicio
cocheraSelect.disabled = true;

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

    console.log('Token de autenticación:', authToken); // Verifica el token
    console.log('Usuario actual:', currentUser); // Verifica el usuario

    if (!authToken || !currentUser) {
        console.error('No se encontró el token o el usuario actual');
        window.location.replace('index.html');
        return false;
    }
    return true;
}

guardarBtn.addEventListener('click', async function() {
    const llegadaSalida = llegadaSalidaSelect.value;
    let sector = sectorSelect.value; // OJO, acá es "let" no "const" porque lo vamos a modificar
    const cochera = cocheraSelect.value;

    if (!llegadaSalida || !sector || !cochera) {
        alert("Completá todas las opciones antes de guardar.");
        return;
    }

    // ✨ Acá sí: corregimos el nombre del sector
    sector = sector.charAt(0).toUpperCase() + sector.slice(1).toLowerCase();

    try {
        // Primero obtener los datos del sector
        console.log('Nombre de sector enviado:', sector);
        const resSector = await fetch(`${API_BASE_URL}/api/cocheras/${sector}`);
        const dataSector = await resSector.json();

        if (!dataSector.success) {
            alert('Error al obtener información del sector.');
            return;
        }

        let cocherasLibres = parseInt(dataSector.cocheras);

        // Ajustar el valor de cocheras libres según la acción
        if (llegadaSalida === "llegada") {
            cocherasLibres = Math.max(0, cocherasLibres - 1); // Evita negativos
        } else if (llegadaSalida === "salida") {
            cocherasLibres = cocherasLibres + 1;
        }

        // Actualizar el sector con el nuevo número de cocheras libres
        const formDataSector = new FormData();
        formDataSector.append('name', sector);
        formDataSector.append('CocherasLibres', cocherasLibres);

        await fetch(`${API_BASE_URL}/api/actualizar_freeParkingSpots`, {
            method: 'POST',
            body: formDataSector
        });

        // Luego registrar o actualizar la cochera
        const formDataCochera = new FormData();
        formDataCochera.append('numero', cochera);
        formDataCochera.append('sector', sector);
        formDataCochera.append('ocupado', llegadaSalida === 'llegada' ? true : false);

        await fetch(`${API_BASE_URL}/api/registrar_actualizar_cochera`, {
            method: 'POST',
            body: formDataCochera
        });

        alert('¡Actualización realizada exitosamente!');
        location.reload(); // Recargar la página

    } catch (error) {
        console.error('Error al guardar:', error);
        alert('Ocurrió un error al guardar los datos.');
    }
});
 
document.getElementById('logoutBtn').addEventListener('click', function() {
    // Eliminar token y datos de usuario del localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    // Redireccionar a la página de inicio de sesión
    window.location.href = 'index.html';
});

// Función para cargar los sectores desde la API
document.addEventListener('DOMContentLoaded', function() {
    cargarSectores();
});

// Función para actualizar las opciones de cochera según el sector seleccionado
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