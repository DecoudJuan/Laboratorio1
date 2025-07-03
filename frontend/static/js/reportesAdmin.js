// Función para obtener el token de autorización
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Función para crear headers con autorización (formato JWT)
function getAuthHeaders() {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

document.addEventListener('DOMContentLoaded', function () {
    const reportesContainer = document.getElementById('reportes-container');
    const API_BASE_URL = 'http://localhost:5000';

    async function cargarReportes() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/report`, {
                headers: getAuthHeaders()
            });
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
    
        const reportesNoSolucionados = reportes.filter(r => !r.solucionado);
    
        if (reportesNoSolucionados.length === 0) {
            reportesContainer.innerHTML = '<p>No hay reportes pendientes.</p>';
            return;
        }
    
        reportesNoSolucionados.forEach(reporte => {
            const div = document.createElement('div');
            div.className = 'card mb-2';
            div.setAttribute('data-id', reporte.idReport);
    
            div.innerHTML = ` 
                <div class="card-body">
                <h5 class="card-title">Sector: ${reporte.sector}</h5>
                <p class="card-text">${reporte.content}</p>
                <button class="btn btn-success btn-sm marcar-solucionado-btn">✅ Marcar como solucionado</button>
                <div class="text-muted" style="font-size: 0.8rem;">${reporte.fecha_creacion}</div>
            </div>
            `;
    
            reportesContainer.appendChild(div);
        });
    
        // Delegar evento a los botones de "Marcar como solucionado"
        document.querySelectorAll('.marcar-solucionado-btn').forEach(button => {
            button.addEventListener('click', async function () {
                const card = this.closest('.card');
                const idReport = card.getAttribute('data-id');
    
                try {
                    const response = await fetch(`${API_BASE_URL}/api/report/${idReport}/solucionar`, {
                        method: 'POST',
                        headers: getAuthHeaders() // Usar headers con autorización
                    });
    
                    const result = await response.json();
    
                    if (result.success) {
                        card.remove();
                        alert(result.message);
                    } else {
                        alert(`Error: ${result.message}`);
                    }
    
                } catch (error) {
                    console.error("Error al marcar como solucionado:", error);
                    alert("Error de conexión.");
                }
            });
        });
    }

    cargarReportes();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.replace('index.html');
});