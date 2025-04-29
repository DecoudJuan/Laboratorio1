function preventCaching() {
    if (window.location.protocol !== 'file:') {
        window.history.replaceState(null, document.title, window.location.href);
    }
}

preventCaching();

// Verificación inmediata de autenticación
function checkToken() {
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');

    if (!authToken || !currentUser) {
        window.location.replace('admin.html');
        return;
    }
}

// Verificar autenticación cuando la página vuelve a estar activa
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        console.log('Página restaurada desde caché - verificando autenticación');
        checkToken();
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('Página visible - verificando autenticación');
        checkToken();
    }
});

const API_BASE_URL = 'http://localhost:5000';

// Lógica para guardar un nuevo sector
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('editUserForm');

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            // Pedir confirmación antes de crear el sector
            const establecimiento = document.getElementById('registerEstablecimiento').value.trim();
            const sector = document.getElementById('registerSector').value.trim();

            if (!establecimiento || !sector) {
                alert('Por favor, complete todos los campos.');
                return;
            }

            const confirmacion = confirm(`¿Deseas crear el sector "${sector}" en el establecimiento "${establecimiento}"?`);
            if (!confirmacion) {
                return;
            }

            const formData = new FormData(form);

            fetch(`${API_BASE_URL}/api/crear_sector`, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message || 'Sector creado exitosamente.');
                    window.location.href = 'sectores.html';
                } else {
                    alert(data.message || 'Error al crear el sector.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al procesar la solicitud.');
            });
        });
    }
});

// Logout (por si también quieres mantenerlo)
document.getElementById('logoutBtn')?.addEventListener('click', function() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
});