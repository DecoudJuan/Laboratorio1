document.getElementById('complaintForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const API_BASE_URL = 'http://localhost:5000/api';
    const sector = document.getElementById('selector-sector').value;
    const idVehicle = document.getElementById('selector-vehiculo').value; // ID corregido
    const content = document.querySelector('textarea[name="mensaje"]').value;

    const currentUserData = localStorage.getItem('currentUser');
    let idUser = null;

    if (currentUserData) {
        try {
            const parsedUser = JSON.parse(currentUserData);
            idUser = parsedUser.id;
        } catch (error) {
            console.error('Error al parsear currentUser:', error);
        }
    }

    if (!idUser || !sector || !idVehicle || !content) {
        alert("Todos los campos son obligatorios.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/complaint`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idSuperUser: idUser, idVehiculo: idVehicle, sector, content }) // Nombres alineados con backend
        });

        if (response.ok) {
            alert('Reporte enviado con éxito');
            document.getElementById('complaintForm').reset();
        } else {
            const errorData = await response.json();
            alert('Error al enviar reporte: ' + (errorData.message || ''));
        }
    } catch (error) {
        console.error('Error en la solicitud:', error);
        alert('Ocurrió un error al enviar el reporte');
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.replace('index.html');
});

document.addEventListener('DOMContentLoaded', function () {
    cargarSectores();
    cargarVehiculos();
});

function cargarSectores() {
    const sectorSelect = document.getElementById('selector-sector');

    fetch('http://localhost:5000/api/sectores')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                sectorSelect.innerHTML = '<option value="" disabled selected>Seleccioná un sector</option>';
                data.sectors.forEach(sector => {
                    const option = document.createElement('option');
                    option.value = sector.nameSec;
                    option.textContent = sector.nameSec;
                    sectorSelect.appendChild(option);
                });
            } else {
                console.error('Error al cargar sectores:', data.error);
            }
        })
        .catch(error => {
            console.error('Error al obtener los sectores:', error);
        });
}

function cargarVehiculos() {
    const vehiculoSelect = document.getElementById('selector-vehiculo');

    fetch('http://localhost:5000/api/vehiculos')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos recibidos de vehiculos:', data); // Para depuración
            
            if (data.success) {
                vehiculoSelect.innerHTML = '<option value="" disabled selected>Seleccioná una patente</option>';
                
                if (data.vehicles && data.vehicles.length > 0) {
                    data.vehicles.forEach(vehicle => {
                        const option = document.createElement('option');
                        option.value = vehicle.idVehicle;
                        option.textContent = vehicle.idVehicle;
                        vehiculoSelect.appendChild(option);
                    });
                } else {
                    console.error('No hay vehículos en la respuesta');
                    vehiculoSelect.innerHTML += '<option value="" disabled>No hay vehículos disponibles</option>';
                }
            } else {
                console.error('Error al cargar vehículos:', data.message);
            }
        })
        .catch(error => {
            console.error('Error al obtener los vehículos:', error);
            vehiculoSelect.innerHTML = '<option value="" disabled selected>Error al cargar vehículos</option>';
        });

}
