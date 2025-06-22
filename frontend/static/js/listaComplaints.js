document.addEventListener('DOMContentLoaded', function () {
    console.log("JS cargado");
    
    // Verificar que el elemento existe antes de usarlo
    const denunciasContainer = document.getElementById('denuncias');
    const API_BASE_URL = 'http://localhost:5000'; // Ruta base de la API

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

    // Validar que el contenedor existe
    if (!denunciasContainer) {
        console.error('ERROR: No se encontró el elemento con ID "denuncias"');
        console.error('Elementos disponibles en la página:');
        console.log(document.body.innerHTML);
        return;
    }
    
    console.log("Contenedor encontrado:", denunciasContainer);

    async function cargarDenuncias() {
        try {
            console.log("Iniciando carga de denuncias...");
            const response = await fetch(`${API_BASE_URL}/api/complaint`, {
                headers: getAuthHeaders() // Agregar headers de autorización
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("Datos recibidos:", data);

            if (data.success) {
                mostrarDenuncias(data.denuncias);
            } else {
                console.error("Error en la respuesta:", data.message);
                denunciasContainer.innerHTML = '<p class="text-danger">Error al cargar denuncias: ' + (data.message || 'Error desconocido') + '</p>';
            }
        } catch (error) {
            console.error('Error al obtener las denuncias:', error);
            // Verificar nuevamente antes de modificar innerHTML
            if (denunciasContainer) {
                denunciasContainer.innerHTML = '<p class="text-danger">Error de conexión: ' + error.message + '</p>';
            }
        }
    }

    function mostrarDenuncias(denuncias) {
        // Verificar que el contenedor sigue existiendo
        if (!denunciasContainer) {
            console.error('ERROR: denunciasContainer es null en mostrarDenuncias');
            return;
        }
        
        console.log("Mostrando denuncias:", denuncias);
        denunciasContainer.innerHTML = '';
    
        const denunciasNoSolucionados = denuncias.filter(r => !r.solucionado);
    
        if (denunciasNoSolucionados.length === 0) {
            denunciasContainer.innerHTML = '<p>No hay denuncias pendientes.</p>';
            return;
        }
    
        denunciasNoSolucionados.forEach(denuncia => {
            const div = document.createElement('div');
            div.className = 'card mb-2';
            div.setAttribute('data-id', denuncia.idComplaint);
    
            div.innerHTML = ` 
                <div class="card-body">
                    <h5 class="card-title">Sector: ${denuncia.sector}</h5>
                    <p class="card-text">${denuncia.content}</p>
                    <button class="btn btn-success btn-sm marcar-solucionado-btn">✅ Marcar como solucionado</button>
                    <div class="text-muted" style="font-size: 0.8rem;">${denuncia.fecha_creacion}</div>
                </div>
            `;
    
            denunciasContainer.appendChild(div);
        });
    
        // Event delegation para los botones (solo se agrega una vez)
        setupEventDelegation();
    }

    // Función separada para configurar el event delegation una sola vez
    let eventDelegationSetup = false;
    function setupEventDelegation() {
        if (eventDelegationSetup) return; // Evitar múltiples listeners
        eventDelegationSetup = true;

        document.addEventListener('click', async function(event) {
            if (event.target.classList.contains('marcar-solucionado-btn')) {
                const card = event.target.closest('.card');
                const idComplaint = card.getAttribute('data-id');
    
                try {
                    console.log("Marcando denuncia como solucionada:", idComplaint);
                    const response = await fetch(`${API_BASE_URL}/api/complaint/${idComplaint}/solucionar`, {
                        method: 'POST',
                        headers: getAuthHeaders() // Usar headers con autorización
                    });
    
                    const result = await response.json();
    
                    if (result.success) {
                        card.remove(); // Eliminar del DOM si se marca como solucionado
                        alert(result.message);
                    } else {
                        alert("Error al marcar como solucionado: " + result.message);
                    }
    
                } catch (error) {
                    console.error("Error al marcar como solucionado:", error);
                    alert("Error de conexión.");
                }
            }
        });
    }

    cargarDenuncias();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.replace('index.html');
});