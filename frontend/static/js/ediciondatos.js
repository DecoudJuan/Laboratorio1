const API_BASE_URL = 'http://localhost:5000';

// JavaScript corregido
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const editarBtn = document.getElementById('editar');
    
    editarBtn.addEventListener('click', function() {
        const nombreAnterior = prompt("Ingrese su nombre actual para confirmar el cambio:");
        
        if (!nombreAnterior) {
            alert("Debes ingresar tu nombre actual para continuar.");
            return;
        }
        document.getElementById('nombreAnterior').value = nombreAnterior;
        form.submit(); // Envía el formulario correctamente
    });
});

// Agrega esto al final de tu archivo js
document.getElementById('editUserForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nombreAnterior = prompt("Ingrese su nombre actual para confirmar el cambio:");
    
    if (!nombreAnterior) {
        alert("Debes ingresar tu nombre actual para continuar.");
        return;
    }
    
    document.getElementById('nombreAnterior').value = nombreAnterior;
    
    // Usando la misma estructura que tienes para register
    const form = e.target;
    const formData = new FormData(form);
    
    fetch('http://localhost:5000/api/guardar_datos', {
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