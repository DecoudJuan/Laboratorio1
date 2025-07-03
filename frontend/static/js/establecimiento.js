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

API_BASE_URL = 'http://localhost:5000'; // Cambia esto a la URL de tu API

document.getElementById('logoutBtn').addEventListener('click', function() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userEmail'); // también limpiamos el email del chat
    sessionStorage.removeItem('chatEmail'); // Limpiar el email del chat
    window.location.href = 'index.html';
});


// Función para cargar y mostrar todos los establecimientos
function loadEstablishments() {
    const tableBody = document.querySelector('tbody') || document.getElementById('establishmentsTableBody');
    
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando establecimientos...</td></tr>';
    }
    
    fetchWithAuth(`${API_BASE_URL}/api/establecimientos`)
        .then(data => {
            if (data.success) {
                displayEstablishments(data.establishments || []);
            } else {
                throw new Error(data.message || 'Error al cargar establecimientos');
            }
        })
        .catch(error => {
            console.error('Error al cargar establecimientos:', error);
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Error de conexión</td></tr>';
            }
            alert('Error al cargar la lista de establecimientos');
        });
}

function displayEstablishments(establishments) {
    const tableBody = document.querySelector('tbody') || document.getElementById('establishmentsTableBody');
    const noEstablishmentsMessage = document.getElementById('noEstablishmentsMessage');
    
    if (!tableBody) {
        console.error('No se encontró el elemento de tabla para establecimientos');
        return;
    }
    
    // Limpiar la tabla antes de agregar nuevos datos
    tableBody.innerHTML = '';
    
    if (!establishments || establishments.length === 0) {
        if (noEstablishmentsMessage) noEstablishmentsMessage.style.display = 'block';
        
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" class="text-center">No hay establecimientos registrados</td>';
        tableBody.appendChild(row);
        return;
    }
    
    if (noEstablishmentsMessage) noEstablishmentsMessage.style.display = 'none';
    
    establishments.forEach(establishment => {
        // Usar nameEst como nombre principal del establecimiento
        const name = establishment.nameEst || 'N/A';
        
        // Usar las propiedades correctas para los datos
        const sectors = establishment.totalSectors !== undefined ? establishment.totalSectors : 'N/A';
        const parkingSpots = establishment.totalParkingSpots !== undefined ? establishment.totalParkingSpots : 'N/A';
        const location = establishment.geographicLocation || 'N/A';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${name}</td>
            <td>${sectors}</td>
            <td>${parkingSpots}</td>
            <td>${location}</td>
            <td>
                <button class="btn btn-sm btn-primary edit-establishment" data-id="${name}">
                    <i class="bi bi-pencil"></i> Editar
                </button>
                <button class="btn btn-sm btn-danger delete-establishment" data-id="${name}" data-nombre="${name}">
                    <i class="bi bi-trash"></i> Eliminar
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Añadir listeners a los botones
    attachEstablishmentButtonListeners();
}

// Función para añadir event listeners a los botones de acción
function attachEstablishmentButtonListeners() {
    // Botones de editar
    document.querySelectorAll('.edit-establishment').forEach(button => {
        button.addEventListener('click', function() {
            const establishmentName = this.getAttribute('data-id');
            editEstablishment(establishmentName);
        });
    });
    
    // Botones de eliminar
    document.querySelectorAll('.delete-establishment').forEach(button => {
        button.addEventListener('click', function() {
            const establishmentName = this.getAttribute('data-id');
            deleteEstablishment(establishmentName);
        });
    });
}

// Función para editar un establecimiento usando un modal
function editEstablishment(establishmentName) {
    fetchWithAuth(`${API_BASE_URL}/api/establecimiento/${encodeURIComponent(establishmentName)}`)
        .then(data => {
            if (data.success && data.establishment) {
                // Llenar el modal con los datos del establecimiento
                fillEditEstablishmentModal(data.establishment);
                
                // Mostrar el modal
                const editModal = document.getElementById('editEstablishmentModal');
                const bsModal = new bootstrap.Modal(editModal);
                bsModal.show();
            } else {
                throw new Error(data.message || 'Error al obtener datos del establecimiento');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cargar los datos del establecimiento');
        });
}

// Función para llenar el modal de edición con los datos del establecimiento
function fillEditEstablishmentModal(establishment) {
    document.getElementById('editEstablishmentId').value = establishment.idEst || '';
    document.getElementById('editEstablishmentName').value = establishment.nameEst || '';
    document.getElementById('editEstablishmentSectors').value = establishment.totalSectors || '';
    document.getElementById('editEstablishmentParkingSpots').value = establishment.totalParkingSpots || '';
    document.getElementById('editEstablishmentLocation').value = establishment.geographicLocation || '';
    
    // Almacenar datos originales para comparación en caso necesario
    document.getElementById('editEstablishmentModal').dataset.originalName = establishment.nameEst || '';
}

// Función para actualizar un establecimiento
function updateEstablishment(event) {
    event.preventDefault();
    
    const establishmentId = document.getElementById('editEstablishmentId').value;
    const establishmentName = document.getElementById('editEstablishmentName').value;
    const totalSectors = document.getElementById('editEstablishmentSectors').value;
    const totalParkingSpots = document.getElementById('editEstablishmentParkingSpots').value;
    const location = document.getElementById('editEstablishmentLocation').value;
    
    // Validaciones básicas
    if (!establishmentName || establishmentName.trim() === '') {
        alert('El nombre del establecimiento es obligatorio');
        return;
    }
    
    if (!totalSectors || isNaN(totalSectors) || totalSectors <= 0) {
        alert('El número de sectores debe ser un número positivo');
        return;
    }
    
    if (!totalParkingSpots || isNaN(totalParkingSpots) || totalParkingSpots <= 0) {
        alert('El número de cocheras debe ser un número positivo');
        return;
    }
    
    // Objeto con los datos actualizados
    const updatedEstablishment = {
        nameEst: establishmentName,
        totalSectors: parseInt(totalSectors),
        totalParkingSpots: parseInt(totalParkingSpots),
        geographicLocation: location
    };
    
    // Si hay un ID de establecimiento, lo incluimos
    if (establishmentId) {
        updatedEstablishment.idEst = establishmentId;
    }
    
    // Obtener el nombre original para usar en la URL
    const originalName = document.getElementById('editEstablishmentModal').dataset.originalName;
    
    fetchWithAuth(`${API_BASE_URL}/api/actualizar_establecimiento/${encodeURIComponent(originalName)}`, {
        method: 'PUT',
        body: JSON.stringify(updatedEstablishment)
    })
    .then(data => {
        if (data.success) {
            // Cerrar el modal
            const editModal = document.getElementById('editEstablishmentModal');
            const bsModal = bootstrap.Modal.getInstance(editModal);
            if (bsModal) bsModal.hide();
            
            alert(data.message || 'Establecimiento actualizado correctamente');
            
            // Actualizar datos en localStorage si es el establecimiento actual
            const currentParking = localStorage.getItem('currentParking');
            if (currentParking) {
                try {
                    const parkingData = JSON.parse(currentParking);
                    if (parkingData.nameEst === originalName) {
                        localStorage.setItem('currentParking', JSON.stringify({
                            ...parkingData,
                            nameEst: establishmentName,
                            totalSectors: parseInt(totalSectors),
                            totalParkingSpots: parseInt(totalParkingSpots),
                            geographicLocation: location
                        }));
                    }
                } catch (e) {
                    console.error('Error al actualizar datos locales:', e);
                }
            }
            
            // Recargar la lista de establecimientos
            loadEstablishments();
        } else {
            throw new Error(data.message || 'Error al actualizar el establecimiento');
        }
    })
    .catch(error => {
        console.error('Error al actualizar establecimiento:', error);
        alert(`Error al actualizar el establecimiento: ${error.message || 'Error desconocido'}`);
    });
}

// Función para eliminar un establecimiento con confirmación
function deleteEstablishment(establishmentName) {
    
    // Verificar si tenemos un modal de confirmación
    const deleteModal = document.getElementById('deleteEstablishmentModal');
    
    if (deleteModal) {
        // Usar el modal Bootstrap para confirmar
        document.getElementById('deleteEstablishmentId').value = establishmentName;
        document.getElementById('deleteEstablishmentDetails').textContent = `Establecimiento: ${establishmentName}`;
        
        const bsModal = new bootstrap.Modal(deleteModal);
        bsModal.show();
    } else {
        // Usar confirm estándar si no hay modal
        if (confirm(`¿Estás seguro que deseas eliminar el establecimiento "${establishmentName}"?`)) {
            proceedWithEstablishmentDeletion(establishmentName);
        }
    }
}

// Función que realiza la eliminación del establecimiento
function proceedWithEstablishmentDeletion(establishmentName) {
    if (!establishmentName) {
        alert('Error: No se ha especificado un establecimiento para eliminar');
        return;
    }
    
    fetchWithAuth(`${API_BASE_URL}/api/borrar_establecimiento/${encodeURIComponent(establishmentName)}`, {
        method: 'DELETE'
    })
    .then(data => {
        if (data.success) {
            alert(data.message || 'Establecimiento eliminado correctamente');
            
            // Cerrar el modal si existe
            const deleteModal = document.getElementById('deleteEstablishmentModal');
            if (deleteModal) {
                const bsModal = bootstrap.Modal.getInstance(deleteModal);
                if (bsModal) bsModal.hide();
            }
            
            // Limpiar localStorage si era el establecimiento actual
            const currentParking = localStorage.getItem('currentParking');
            if (currentParking) {
                try {
                    const parkingData = JSON.parse(currentParking);
                    if (parkingData.nameEst === establishmentName) {
                        localStorage.removeItem('currentParking');
                    }
                } catch (e) {
                    console.error('Error al procesar datos locales:', e);
                }
            }
            
            // Recargar la lista de establecimientos
            loadEstablishments();
        } else {
            throw new Error(data.message || 'Error al eliminar el establecimiento');
        }
    })
    .catch(error => {
        console.error('Error al eliminar establecimiento:', error);
        alert(`Error al eliminar el establecimiento: ${error.message || 'Error desconocido'}`);
    });
}

// Configuración de la UI y event listeners
document.addEventListener('DOMContentLoaded', function() {
    
    // Cargar la lista de establecimientos
    loadEstablishments();
    
    // Event listener para el botón de regresar
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.href = 'funcionesSuperusuario.html';
        });
    }
    
    // Event listener para el botón de crear establecimiento
    const showAddEstablishmentBtn = document.getElementById('showAddEstablishmentBtn');
    if (showAddEstablishmentBtn) {
        showAddEstablishmentBtn.addEventListener('click', function() {
            window.location.href = 'crearEstablecimiento.html';
        });
    }
    
    // Event listener para confirmación de eliminación en el modal
    const confirmDeleteEstablishment = document.getElementById('confirmDeleteEstablishment');
    if (confirmDeleteEstablishment) {
        confirmDeleteEstablishment.addEventListener('click', function() {
            const establishmentName = document.getElementById('deleteEstablishmentId').value;
            proceedWithEstablishmentDeletion(establishmentName);
        });
    }
    
    // Event listener para el formulario de edición de establecimiento
    const editEstablishmentForm = document.getElementById('editEstablishmentForm');
    if (editEstablishmentForm) {
        editEstablishmentForm.addEventListener('submit', updateEstablishment);
    }
    
    // Event listener para el botón de cerrar sesión si existe
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            sessionStorage.removeItem('chatEmail');
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('currentParking');
            window.location.href = 'index.html';
        });
    }
});