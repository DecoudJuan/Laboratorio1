document.addEventListener('DOMContentLoaded', function () {
    cargarVehiculos();

    document.getElementById('buscarPropietario').addEventListener('click', async function () {
        const idVehicle = document.getElementById('selector-vehiculo').value;

        if (!idVehicle) {
            alert("⚠️ Debes seleccionar una patente primero.");
            return;
        }

        console.log("🔍 Buscando propietario para:", idVehicle);

        try {
            const response = await fetch(`http://localhost:5000/api/propietario/${idVehicle}`);
            console.log("📡 Respuesta del servidor:", response.status);

            if (!response.ok) {
                throw new Error(`Error en la respuesta: ${response.status}`);
            }

            const data = await response.json();
            console.log("📜 Datos recibidos:", data);

            if (data.success) {
                document.getElementById('propietarioTelefono').textContent = `📱 Teléfono: ${data.phone}`;
                new bootstrap.Modal(document.getElementById('propietarioModal')).show();
            } else {
                alert(`❌ Error: ${data.message}`);
            }
        } catch (error) {
            console.error("🔥 Error en la solicitud:", error);
            alert("❌ No se pudo obtener el celular del propietario.");
        }
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.replace('index.html');
    });
});

function cargarVehiculos() {
    const vehiculoSelect = document.getElementById('selector-vehiculo');
    console.log('🚗 Iniciando carga de vehículos...');

    fetch('http://localhost:5000/api/vehiculos')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor: ' + response.status);
            }
            return response.json();
        })
        .then(data => {

            if (data.success) {
                vehiculoSelect.innerHTML = '<option value="" disabled selected>Seleccioná una patente</option>';

                if (data.vehicles && data.vehicles.length > 0) {
                    data.vehicles.forEach(vehicle => {
                        console.log("🛠️ Agregando vehículo al selector:", vehicle.idVehicle);

                        const option = document.createElement('option');
                        option.value = vehicle.idVehicle;
                        option.textContent = vehicle.idVehicle;
                        vehiculoSelect.appendChild(option);
                    });
                } else {
                    vehiculoSelect.innerHTML += '<option value="" disabled>No hay vehículos disponibles</option>';
                }
            } else {
                vehiculoSelect.innerHTML += '<option value="" disabled>Error al cargar vehículos</option>';
            }
        })
        .catch(error => {
            vehiculoSelect.innerHTML = '<option value="" disabled selected>Error al cargar vehículos</option>';
        });
}