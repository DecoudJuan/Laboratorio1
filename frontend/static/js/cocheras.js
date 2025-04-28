document.addEventListener("DOMContentLoaded", function() {
    console.log("Documento cargado. Inicializando funciones de cocheras.");

    // Función para manejar la obtención de datos y mostrar el modal
    async function obtenerCocheras(sector) {
        console.log(`Obteniendo datos para el sector: ${sector}`);
        try {
            const response = await fetch(`http://localhost:5000/api/cocheras/${encodeURIComponent(sector)}`);
            console.log("Respuesta recibida:", response);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("Datos recibidos:", data);

            const modalBody = document.getElementById("modal-body-content");
            if (data.cocheras !== undefined) {
                modalBody.textContent = `Hay ${data.cocheras} cocheras disponibles en el sector ${sector}.`;
            } else if (data.error) {
                modalBody.textContent = data.error;
            } else {
                modalBody.textContent = "No se pudo obtener la información del sector.";
            }

            // Mostrar el modal
            const modalElement = document.getElementById('cocheraModal');
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            
        } catch (error) {
            console.error("Error al obtener datos:", error);
            const modalBody = document.getElementById("modal-body-content");
            modalBody.textContent = `Error de conexión: ${error.message}`;
            
            // Mostrar el modal incluso con error
            const modalElement = document.getElementById('cocheraModal');
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    }

    // Agregar evento de clic a los botones laterales
    const buttons = document.querySelectorAll(".btn.btn-success");
    console.log(`Encontrados ${buttons.length} botones`);
    
    buttons.forEach(button => {
        button.addEventListener("click", function() {
            console.log("Botón presionado:", this.textContent.trim());
            const sector = this.getAttribute("data-name") || this.textContent.trim();
            obtenerCocheras(sector);
        });
    });

    // Agregar evento de clic a los puntos del mapa
    const mapPoints = document.querySelectorAll(".map-point");
    console.log(`Encontrados ${mapPoints.length} puntos en el mapa`);
    
    mapPoints.forEach(point => {
        point.addEventListener("click", function() {
            console.log("Punto del mapa presionado");
            const sector = this.getAttribute("data-name");
            obtenerCocheras(sector);
        });
    });

    // Como alternativa, para asegurar que funcione al menos algo
    console.log("Configurando manejador alternativo en caso de que falle el principal");
    document.querySelectorAll("[data-name]").forEach(element => {
    
        element.onclick = function() {
            const sector = this.getAttribute("data-name");
            console.log("Elemento con data-name presionado:", sector);
            
            // Código alternativo que utiliza datos en memoria como fallback
            const fallbackData = {
                "Comedor": 12,
                "IAE": 8,
                "Medicina": 10,
                "Olivo": 5,
                "Profesores": 7
            };
            
            const modalBody = document.getElementById("modal-body-content");
            
            if (sector && sector in fallbackData) {
                modalBody.textContent = `Hay ${fallbackData[sector]} cocheras disponibles en el sector ${sector} (datos de respaldo).`;
            } else {
                modalBody.textContent = `No hay información disponible para el sector ${sector}.`;
            }
            
            const modalElement = document.getElementById('cocheraModal');
            if (bootstrap && bootstrap.Modal) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            } else {
                console.error("Bootstrap Modal no está disponible");
                alert(`Sector: ${sector} - Ver consola para más detalles`);
            }
        };
    });
        // Arreglo para evitar que quede la pantalla gris al cerrar el modal
        const modalElement = document.getElementById('cocheraModal');
        modalElement.addEventListener('hidden.bs.modal', function () {
            // Limpia clases y overlays si quedaron "pegados"
            document.body.classList.remove('modal-open');
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        });
    
});

document.getElementById('logoutBtn').addEventListener('click', function() {
    // Eliminar token y datos de usuario del localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    // Redireccionar a la página de inicio de sesión
    window.location.href = 'index.html';
});
