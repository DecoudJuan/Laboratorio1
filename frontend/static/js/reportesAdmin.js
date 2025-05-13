document.addEventListener('DOMContentLoaded', function () {
    const reportesContainer = document.getElementById('reportes-container');
    const API_BASE_URL = 'http://localhost:5000/api';

    async function cargarReportes() {
        try {
            const response = await fetch(`${API_BASE_URL}/report`);
            const data = await response.json();

            if (data.success) {
                mostrarReportes(data.reportes);
            } else {
                reportesContainer.innerHTML = '<p class="text-danger">Error al cargar reportes.</p>';
            }
        } catch (error) {
            console.error('Error al obtener los reportes:', error);
            reportesContainer.innerHTML = '<p class="text-danger">Error de conexión.</p>';
        }
    }

    function mostrarReportes(reportes) {
        reportesContainer.innerHTML = '';

        if (reportes.length === 0) {
            reportesContainer.innerHTML = '<p>No hay reportes aún.</p>';
            return;
        }

        reportes.forEach(reporte => {
            const div = document.createElement('div');
            div.className = 'card mb-2';
            div.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">Sector: ${reporte.sector}</h5>
                    <p class="card-text"><strong>Usuario ID:</strong> ${reporte.idUser}</p>
                    <p class="card-text">${reporte.content}</p>
                    <p class="card-text"><small class="text-muted">¿Solucionado?: ${reporte.solucionado ? 'Sí' : 'No'}</small></p>
                </div>
            `;
            reportesContainer.appendChild(div);
        });
    }

    cargarReportes();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.replace('index.html');
});