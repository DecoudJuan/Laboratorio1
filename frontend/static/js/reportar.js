document.getElementById('reportForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Evita que el formulario recargue la página

    const API_BASE_URL = 'http://localhost:5000/api'; // URL base centralizada
    const sector = document.getElementById('selector-sector').value;
    const content = document.querySelector('textarea[name="mensaje"]').value;

    // Obtener el idUser desde localStorage
    const currentUserData = localStorage.getItem('currentUser');
    let idUser = null;

    if (currentUserData) {
        try {
            const parsedUser = JSON.parse(currentUserData);
            idUser = parsedUser.id; // Asegurate de que 'id' existe en el objeto guardado
        } catch (error) {
            console.error('Error al parsear currentUser:', error);
        }
    }

    if (!idUser || !sector || !content) {
        alert("Todos los campos son obligatorios.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idUser, sector, content })
        });

        if (response.ok) {
            alert('Reporte enviado con éxito');
            document.getElementById('reportForm').reset();
        } else {
            alert('Error al enviar reporte');
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
    cargarSectores(); // ← Agrega esta llamada

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.replace('index.html');
    });
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