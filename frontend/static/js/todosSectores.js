// Función para mostrar los sectores en la tabla
function displaySectors(sectors) {
    const tableBody = document.querySelector('tbody');
    tableBody.innerHTML = '';
    
    if (!sectors || sectors.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="text-center">No hay sectores registrados</td>';
        tableBody.appendChild(row);
        return;
    }
    
    sectors.forEach(sector => {
        const name = sector.nameSec || 'N/A';
        const opening = sector.openingHour || 'No disponible';
        const closing = sector.closingHour || 'No disponible';
        const totalSpots = sector.availableParkingSpots ?? 0;
        const freeSpots = sector.freeParkingSpots ?? 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${name}</td>
            <td>${opening}</td>
            <td>${closing}</td>
            <td>${totalSpots}</td>
            <td>${freeSpots}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteSector('${name}')">Eliminar</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Función para cargar la lista de sectores con mejor manejo de errores
function loadSectors() {
    const authToken = localStorage.getItem('authToken');
    const tableBody = document.querySelector('tbody');
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando sectores...</td></tr>';
    
    fetch('http://localhost:5000/api/sectores', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert('No autorizado o sesión expirada. Por favor, inicia sesión nuevamente.');
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                window.location.replace('index.html');
                throw new Error('No autorizado');
            }
            throw new Error(`Error del servidor: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            displaySectors(data.sectors);
        } else {
            alert(data.message || 'Error al cargar sectores');
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Error al cargar sectores</td></tr>';
        }
    })
    .catch(error => {
        console.error('Error completo:', error);
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Error de conexión</td></tr>';
        if (!error.message.includes('No autorizado')) {
            alert('Error al cargar los sectores. Por favor, intenta más tarde.');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("Página cargada, ejecutando loadSectors()");
    loadSectors();
});

function deleteSector(nombre) {
    console.log(`Intentando eliminar el sector: ${nombre}`);
    if (confirm(`¿Estás seguro que deseas eliminar el sector "${nombre}"?`)) {
        const authToken = localStorage.getItem('authToken');

        fetch(`http://localhost:5000/api/borrar_sector/${nombre}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error al eliminar: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert(`Sector "${nombre}" eliminado correctamente`);
                loadSectors(); // Recargar lista de sectores
            } else {
                alert(data.message || 'Error al eliminar el sector');
            }
        })
        .catch(error => {
            console.error('Error al eliminar sector:', error);
            alert('Error al eliminar el sector. Intenta más tarde.');
        });
    }
}
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('btn-danger')) {
        const nombreSector = event.target.getAttribute('data-nombre');
        console.log(`Clic detectado en botón. Sector a eliminar: ${nombreSector}`);

        if (nombreSector) {
            deleteSector(nombreSector);
        } else {
            console.error("El botón no tiene un nombre de sector válido.");
        }
    }
});