// Variables globales para capturar las selecciones
let llegadaSalidaSelect = document.querySelectorAll('select')[0];
let sectorSelect = document.querySelectorAll('select')[1];
let cocheraSelect = document.querySelectorAll('select')[2];
let guardarBtn = document.querySelector('.btn-success');

// Base URL de tu API
const API_BASE_URL = 'http://localhost:5000';  // Asegurate que coincida con tu servidor

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