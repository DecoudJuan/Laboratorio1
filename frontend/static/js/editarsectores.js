document.addEventListener('DOMContentLoaded', function() {
    const guardarBtn = document.getElementById('guardar');
    const borrarBtn = document.getElementById('borrarSector');
    const form = document.getElementById('sectorForm');

    // Función para GUARDAR datos
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

    // Función para BORRAR sector
    borrarBtn.addEventListener('click', function () {
        const nombre = document.getElementById('registerName').value;

        if (!nombre) {
            alert("Por favor, ingrese el nombre del sector que desea borrar.");
            return;
        }

        const confirmacion = confirm(`¿Estás seguro de que querés borrar el sector "${nombre}"? Esta acción no se puede deshacer.`);

        if (confirmacion) {
            fetch(`http://localhost:5000/api/datos_SectorBorrar/${encodeURIComponent(nombre)}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message || 'Sector eliminado correctamente.');
                    window.location.href = 'index.html';
                } else {
                    alert(data.message || 'Error al borrar el sector.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Hubo un error al procesar la solicitud.');
            });
        }
    });
});
