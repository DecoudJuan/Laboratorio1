document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('editUserForm');

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            // Obtener el valor del establecimiento
            const establecimiento = document.getElementById('registerEstablecimiento').value.trim();

            // Verificar que el campo no esté vacío
            if (!establecimiento) {
                alert('Por favor, complete todos los campos.');
                return;
            }

            // Pedir confirmación antes de crear el establecimiento
            const confirmacion = confirm(`¿Deseas crear el establecimiento "${establecimiento}"?`);
            if (!confirmacion) {
                return;
            }

            // Crear un FormData con los datos del formulario
            const formData = new FormData(form);

            // Agregar un log para verificar que la solicitud se está ejecutando
            console.log('Enviando solicitud...', formData);

            // Realizar la solicitud POST
            fetch(`${API_BASE_URL}/api/crear_establecimiento`, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message || 'Establecimiento creado exitosamente.');
                    window.location.href = 'edicionestablecimiento.html'; // Redirigir después de crear el establecimiento
                } else {
                    alert(data.message || 'Error al crear el establecimiento.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al procesar la solicitud.');
            });
        });
    }
});
