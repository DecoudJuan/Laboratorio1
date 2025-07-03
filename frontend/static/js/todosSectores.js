const API_BASE_URL = 'http://localhost:5000';

// Función para realizar peticiones autenticadas con manejo de errores mejorado
function fetchWithAuth(url, options = {}) {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        window.location.href = 'index.html';
        return Promise.reject(new Error('No hay token de autenticación'));
    }
    
    const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    return fetch(url, {
        ...options,
        headers
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                window.location.href = 'index.html';
                throw new Error('Sesión expirada o no autorizado');
            }
            return response.json().then(err => { throw err; });
        }
        return response.json();
    });
}

// Función para convertir minutos a formato HH:MM
function minutesToTimeString(minutes) {
    if (minutes === null || minutes === undefined) return 'N/A';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Función para cargar y mostrar todos los sectores
function loadSectors() {
    const tableBody = document.querySelector('tbody') || document.getElementById('sectorsTableBody');
    
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando sectores...</td></tr>';
    }
    
    fetchWithAuth(`${API_BASE_URL}/api/sectores`)
        .then(data => {
            if (data.success) {
                displaySectors(data.sectors || []);
            } else {
                throw new Error(data.message || 'Error al cargar sectores');
            }
        })
        .catch(error => {
            console.error('Error al cargar sectores:', error);
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error de conexión</td></tr>';
            }
            alert('Error al cargar la lista de sectores');
        });
}

function displaySectors(sectors) {
    const tableBody = document.querySelector('tbody') || document.getElementById('sectorsTableBody');
    const noSectorsMessage = document.getElementById('noSectorsMessage');
    
    if (!tableBody) {
        console.error('No se encontró el elemento de tabla para sectores');
        return;
    }
    
    // Limpiar la tabla antes de agregar nuevos datos
    tableBody.innerHTML = '';
    
    if (!sectors || sectors.length === 0) {
        if (noSectorsMessage) noSectorsMessage.style.display = 'block';
        
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="7" class="text-center">No hay sectores registrados</td>';
        tableBody.appendChild(row);
        return;
    }
    
    if (noSectorsMessage) noSectorsMessage.style.display = 'none';
    
    // Actualizar el encabezado de la tabla para incluir el establecimiento
    const thead = document.querySelector('table thead tr');
    if (thead && !thead.innerHTML.includes('Establecimiento')) {
        thead.innerHTML = `
            <th>Establecimiento</th>
            <th>Nombre del sector</th>
            <th>Hora apertura</th>
            <th>Hora cierre</th>
            <th>Total cocheras</th>
            <th>Cocheras libres</th>
            <th>Acciones</th>
        `;
    }
    
    sectors.forEach(sector => {
        // Usar nameSec como nombre principal del sector
        const name = sector.nameSec || 'N/A';

// Nombre del establecimiento
        const establishmentName = sector.establishmentName || 'N/A';
        
        // Formatear las horas directamente desde openingHour y closingHour
        const opening = sector.openingHour || 'No disponible';
        const closing = sector.closingHour || 'No disponible';
        
        // Usar las propiedades correctas para las cocheras
        const totalSpots = sector.availableParkingSpots !== undefined ? sector.availableParkingSpots : 'N/A';
        const freeSpots = sector.freeParkingSpots !== undefined ? sector.freeParkingSpots : 'N/A';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${establishmentName}</td>
            <td>${name}</td>
            <td>${opening}</td>
            <td>${closing}</td>
            <td>${totalSpots}</td>
            <td>${freeSpots}</td>
            <td>
                <button class="btn btn-sm btn-primary edit-sector" data-id="${sector.idSector}">
                    <i class="bi bi-pencil"></i> Editar
                </button>
                <button class="btn btn-sm btn-danger delete-sector" data-id="${sector.idSector}" data-nombre="${name}">
                    <i class="bi bi-trash"></i> Eliminar
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Añadir listeners a los botones
    attachSectorButtonListeners();
}

// Función para añadir event listeners a los botones de acción
function attachSectorButtonListeners() {
    // Botones de editar
    document.querySelectorAll('.edit-sector').forEach(button => {
        button.addEventListener('click', function() {
            const sectorName = this.getAttribute('data-id');
            editSector(sectorName);
        });
    });
    
    // Botones de eliminar
    document.querySelectorAll('.delete-sector').forEach(button => {
        button.addEventListener('click', function() {
            const sectorName = this.getAttribute('data-id');
            deleteSector(sectorName);
        });
    });
}

// Función modificada para editar un sector usando un modal
function editSector(sectorName) {
    fetchWithAuth(`${API_BASE_URL}/api/sector/${encodeURIComponent(sectorName)}`)
        .then(data => {
            if (data.success && data.sector) {
                // Llenar el modal con los datos del sector
                fillEditSectorModal(data.sector);
                
                // Mostrar el modal
                const editModal = document.getElementById('editSectorModal');
                const bsModal = new bootstrap.Modal(editModal);
                bsModal.show();
            } else {
                throw new Error(data.message || 'Error al obtener datos del sector');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cargar los datos del sector');
        });
}

// Función para llenar el modal de edición con los datos del sector
function fillEditSectorModal(sector) {
    document.getElementById('editSectorId').value = sector.idSector || '';
    document.getElementById('editSectorName').value = sector.nameSec || '';
    document.getElementById('editSectorAvailableSpots').value = sector.availableParkingSpots || '';
    document.getElementById('editSectorOpeningHour').value = sector.openingHour || '';
    document.getElementById('editSectorClosingHour').value = sector.closingHour || '';
    
    // Almacenar datos originales para comparación en caso necesario
    document.getElementById('editSectorModal').dataset.originalName = sector.nameSec || '';
}

// Función para actualizar un sector
function updateSector(event) {
    event.preventDefault();
    
    const sectorId = document.getElementById('editSectorId').value;
    const sectorName = document.getElementById('editSectorName').value;
    const availableSpots = document.getElementById('editSectorAvailableSpots').value;
    const openingHour = document.getElementById('editSectorOpeningHour').value;
    const closingHour = document.getElementById('editSectorClosingHour').value;
    
    // Validaciones básicas
    if (!sectorName || sectorName.trim() === '') {
        alert('El nombre del sector es obligatorio');
        return;
    }
    
    if (!availableSpots || isNaN(availableSpots) || availableSpots <= 0) {
        alert('El número de cocheras disponibles debe ser un número positivo');
        return;
    }
    
    const authToken = localStorage.getItem('authToken');
    
    // Objeto con los datos actualizados
    const updatedSector = {
        nameSec: sectorName,
        availableParkingSpots: parseInt(availableSpots),
        openingHour: openingHour,
        closingHour: closingHour
    };
    
    // Si hay un ID de sector, lo incluimos
    if (sectorId) {
        updatedSector.idSector = sectorId;
    }
    
    // Obtener el nombre original para usar en la URL
    const originalName = document.getElementById('editSectorModal').dataset.originalName;
    
    fetch(`${API_BASE_URL}/api/actualizar_sector/${encodeURIComponent(originalName)}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedSector)
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                window.location.href = 'index.html';
                throw new Error('Sesión expirada o no autorizado');
            }
            return response.json().then(err => { throw err; });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Cerrar el modal
            const editModal = document.getElementById('editSectorModal');
            const bsModal = bootstrap.Modal.getInstance(editModal);
            if (bsModal) bsModal.hide();
            
            alert(data.message || 'Sector actualizado correctamente');
            
            // Recargar la lista de sectores
            loadSectors();
        } else {
            throw new Error(data.message || 'Error al actualizar el sector');
        }
    })
    .catch(error => {
        console.error('Error al actualizar sector:', error);
        alert(`Error al actualizar el sector: ${error.message || 'Error desconocido'}`);
    });
}

// Función mejorada para eliminar un sector con confirmación
function deleteSector(sectorName) {
    
    // Verificar si tenemos un modal de confirmación
    const deleteModal = document.getElementById('deleteSectorModal');
    
    if (deleteModal) {
        // Usar el modal Bootstrap para confirmar
        document.getElementById('deleteSectorId').value = sectorName;
        document.getElementById('deleteSectorDetails').textContent = `Sector: ${sectorName}`;
        
        const bsModal = new bootstrap.Modal(deleteModal);
        bsModal.show();
    } else {
        // Usar confirm estándar si no hay modal
        if (confirm(`¿Estás seguro que deseas eliminar el sector "${sectorName}"?`)) {
            proceedWithSectorDeletion(sectorName);
        }
    }
}

// Función que realiza la eliminación del sector
function proceedWithSectorDeletion(sectorName) {
    if (!sectorName) {
        alert('Error: No se ha especificado un sector para eliminar');
        return;
    }
    
    const authToken = localStorage.getItem('authToken');
    
    fetch(`${API_BASE_URL}/api/borrar_sector/${encodeURIComponent(sectorName)}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                window.location.href = 'index.html';
                throw new Error('Sesión expirada o no autorizado');
            }
            return response.json().then(err => { throw err; });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert(data.message || 'Sector eliminado correctamente');
            
            // Cerrar el modal si existe
            const deleteModal = document.getElementById('deleteSectorModal');
            if (deleteModal) {
                const bsModal = bootstrap.Modal.getInstance(deleteModal);
                if (bsModal) bsModal.hide();
            }
            
            // Recargar la lista de sectores
            loadSectors();
        } else {
            throw new Error(data.message || 'Error al eliminar el sector');
        }
    })
    .catch(error => {
        console.error('Error al eliminar sector:', error);
        alert(`Error al eliminar el sector: ${error.message || 'Error desconocido'}`);
    });
}

// Configuración de la UI y event listeners
document.addEventListener('DOMContentLoaded', function() {
    
    // Cargar la lista de sectores
    loadSectors();
    
    // Event listener para el botón de regresar
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.href = 'funcionesSuperusuario.html';
        });
    }
    
    // Event listener para el botón de crear sector
    const showAddSectorBtn = document.getElementById('showAddSectorBtn');
    if (showAddSectorBtn) {
        showAddSectorBtn.addEventListener('click', function() {
            window.location.href = 'crearSector.html';
        });
    }
    
    // Event listener para confirmación de eliminación en el modal
    const confirmDeleteSector = document.getElementById('confirmDeleteSector');
    if (confirmDeleteSector) {
        confirmDeleteSector.addEventListener('click', function() {
            const sectorName = document.getElementById('deleteSectorId').value;
            proceedWithSectorDeletion(sectorName);
        });
    }
    
    // Event listener para el formulario de edición de sector
    const editSectorForm = document.getElementById('editSectorForm');
    if (editSectorForm) {
        editSectorForm.addEventListener('submit', updateSector);
    }
    
    // Event listener para el botón de cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            sessionStorage.removeItem('chatEmail');
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }
});