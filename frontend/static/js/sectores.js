document.addEventListener('DOMContentLoaded', function() {
    const guardarBtn = document.getElementById('guardar');
    const form = document.getElementById('sectorForm');

    guardarBtn.addEventListener('click', function() {
        const nombreAnterior = prompt("Ingrese el nombre actual del sector para confirmar la modificación:");

        if (!nombreAnterior) {
            alert("Debes ingresar el nombre actual para continuar.");
            return;
        }

        document.getElementById('nombreAnterior').value = nombreAnterior;

        const formData = new FormData(form);

        fetch('http://localhost:5000/api/datos_Sector', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message || 'Datos actualizados correctamente');
                window.location.href = 'index.html';
            } else {
                alert(data.message || 'Error al guardar los datos');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al procesar la solicitud');
        });
    });
});
