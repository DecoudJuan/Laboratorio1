document.addEventListener('DOMContentLoaded', function () {
    console.log("JS cargado");

    const denunciasContainer = document.getElementById('denuncias');
    const API_BASE_URL = 'http://localhost:5000'; // Cambia según tu configuración

    if (!denunciasContainer) {
        console.error('No se encontró el elemento con ID "denuncias"');
        return;
    }

    function getCurrentUserId() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        return currentUser.id || currentUser.userId || null;
    }

    async function cargarDenuncias() {
        try {
            const currentUserId = getCurrentUserId();
            if (!currentUserId) {
                denunciasContainer.innerHTML = '<p class="text-danger">Error: Usuario no identificado</p>';
                return;
            }

            // Obtener todas las denuncias y las relaciones owns
            const [complaintsResponse, ownsResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/api/complaint`),
                fetch(`${API_BASE_URL}/api/owns`)
            ]);

            if (!complaintsResponse.ok || !ownsResponse.ok) {
                throw new Error('Error al obtener datos de la API');
            }

            const complaintsData = await complaintsResponse.json();
            const ownsData = await ownsResponse.json();

            if (!complaintsData.success || !ownsData.success) {
                throw new Error('Respuesta con error desde API');
            }

            // Filtrar vehículos que pertenecen al usuario logueado
            const userVehicles = ownsData.owns
                .filter(own => String(own.idUser) === String(currentUserId))
                .map(own => own.idVehicle);

            // Filtrar denuncias donde el vehículo pertenece al usuario actual
            const denunciasFiltradas = complaintsData.denuncias.filter(denuncia =>
                userVehicles.includes(denuncia.idVehiculo)
            );

            mostrarDenuncias(denunciasFiltradas);
        } catch (error) {
            console.error(error);
            denunciasContainer.innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
        }
    }

    function mostrarDenuncias(denuncias) {
        if (!denunciasContainer) return;

        denunciasContainer.innerHTML = '';


        if (denuncias.length === 0) {
            denunciasContainer.innerHTML = '<p>No tienes denuncias pendientes.</p>';
            return;
        }

        denuncias.forEach(denuncia => {
            const div = document.createElement('div');
            div.className = 'card mb-2';
            div.dataset.id = denuncia.idComplaint;
            div.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">Sector: ${denuncia.sector}</h5>
                    <p class="card-text">${denuncia.content}</p>
                    <p class="card-text">${`Solucionado: ${denuncia.solucionado}`}</p>
                </div>
            `;
            denunciasContainer.appendChild(div);
        });
    }

    cargarDenuncias();
});
