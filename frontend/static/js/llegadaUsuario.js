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

// Función para cargar las cocheras según el sector seleccionado
async function cargarCocheras(sector) {
    if (!sector) return;

    // Normalizar el nombre del sector
    sector = sector.charAt(0).toUpperCase() + sector.slice(1).toLowerCase();

    try {
        // Limpiar el selector de cocheras
        cocheraSelect.innerHTML = '<option value="">Seleccioná una cochera</option>';

        // Obtener las cocheras del sector desde la API
        const response = await fetch(`${API_BASE_URL}/api/cocheras/${sector}`);
        const data = await response.json();

        if (data.success && data.cocheras) {
            // Ordenar las cocheras numéricamente
            const cocheras = data.cocheras.sort((a, b) => parseInt(a.numero) - parseInt(b.numero));

            // Añadir cada cochera al selector
            cocheras.forEach(cochera => {
                const option = document.createElement('option');
                option.value = cochera.numero;
                option.textContent = cochera.numero;

                // Marcar visualmente las cocheras ocupadas
                if (cochera.ocupado) {
                    option.disabled = true;
                    option.textContent += ' (Ocupada)';
                    option.style.color = 'red';
                }

                cocheraSelect.appendChild(option);
            });
        } else {
            console.error('No se pudieron cargar las cocheras');
        }
    } catch (error) {
        console.error('Error al cargar cocheras:', error);
    }
}

// Evento para cuando cambia el sector seleccionado
sectorSelect.addEventListener('change', function() {
    cargarCocheras(this.value);
});

// Evento para verificar el estado de una cochera cuando se selecciona
cocheraSelect.addEventListener('change', async function() {
    const sector = sectorSelect.value;
    const cochera = parseInt(this.value, 10);  // ✅ Convertir a número

    if (!sector || isNaN(cochera)) return;  // ✅ Validar que sea un número válido

    try {
        const sectorNormalizado = sector.charAt(0).toUpperCase() + sector.slice(1).toLowerCase();
        const response = await fetch(`${API_BASE_URL}/api/cocheras/${sectorNormalizado}/${cochera}`);
        const data = await response.json();

        if (data.success && data.ocupado) {
            alert("Esta cochera ya está ocupada. Por favor selecciona otra.");
            this.value = ""; // Limpiar la selección
        }
    } catch (error) {
        console.error('Error al verificar estado de cochera:', error);
    }
});

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

// Configurar evento para cerrar sesión
document.getElementById('logoutBtn')?.addEventListener('click', function() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
});

// Cargar la información inicial cuando se carga la página
window.addEventListener('DOMContentLoaded', function() {
    checkToken();
    if (sectorSelect.value) {
        cargarCocheras(sectorSelect.value);
    }
});