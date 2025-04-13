const API_BASE_URL = 'http://localhost:5000';

// JavaScript corregido
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const editarBtn = document.getElementById('editar');
    
    // Solo usar uno de los dos métodos para enviar el formulario
    // Si tienes el botón editar, usa este código
    if (editarBtn) {
        editarBtn.addEventListener('click', function() {
            const patenteActual = prompt("Ingrese su patente actual para confirmar el cambio:");
            
            if (!patenteActual) {
                alert("Debes ingresar tu patente actual para continuar.");
                return;
            }
            
            document.getElementById('patenteActual').value = patenteActual;
            form.submit(); // Envía el formulario correctamente
        });
    }
});

// Evento para el formulario
document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('editCarform');
    
    if (formulario) {
        formulario.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const patenteActual = prompt("Ingrese su patente actual para confirmar el cambio:");
            
            if (!patenteActual) {
                alert("Debes ingresar tu patente actual para continuar.");
                return;
            }
            
            document.getElementById('patenteActual').value = patenteActual;
            
            // Usando la misma estructura que tienes para register
            const form = e.target;
            const formData = new FormData(form);
            
            fetch('http://localhost:5000/api/guardar_datos_vehiculo', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message || 'Datos actualizados correctamente');
                    window.location.href = 'principal.html';
                } else {
                    alert(data.message || 'Error al guardar los datos');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al procesar la solicitud');
            });
        });
    }
});