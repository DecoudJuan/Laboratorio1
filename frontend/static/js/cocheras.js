function preventCaching() {
    // NO ALMACENA CACHÉ
    if (window.location.protocol != 'file:') {
        window.history.replaceState(null, document.title, window.location.href);
    }
}

preventCaching();

// Verificación inmediata de autenticación (se ejecuta al cargar el script)
function checkToken() {
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');

    // Si no hay token o usuario, redirigir al login
    if (!authToken || !currentUser) {
        window.location.replace('index.html');
        return;
    }
}

// Ejecutar verificación al cargar
checkToken();

// Verificar autenticación cuando la página vuelve a estar activa
window.addEventListener('pageshow', (event) => {
    // Si la página se restaura desde el caché (botón atrás)
    if (event.persisted) {
        console.log('Página restaurada desde caché - verificando autenticación');
        checkToken();
    }
});

setTimeout(function() {
    if (!window.cocherasLoaded) {
        console.log("cocheras.js no se cargó correctamente. Utilizando código alternativo...");
        
        // Código alternativo mínimo
        document.querySelectorAll(".btn.btn-success, .map-point").forEach(element => {
            element.onclick = function() {
                const sector = this.getAttribute("data-name") || this.textContent.trim();
                console.log("Clic en:", sector);
                
                document.getElementById("modal-body-content").textContent = 
                    `Información para el sector ${sector} (modo alternativo)`;
                
                const modalEl = document.getElementById('cocheraModal');
                if (bootstrap && bootstrap.Modal) {
                    const modal = new bootstrap.Modal(modalEl);
                    modal.show();
                } else {
                    alert("Error: Bootstrap Modal no está disponible");
                }
            };
        });
    }
}, 1000);



// También verificar cuando la página vuelve a estar visible
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('Página visible - verificando autenticación');
        checkToken();
    }
});

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

    // Arreglo para evitar que quede la pantalla gris al cerrar el modal
    const modalElement = document.getElementById('cocheraModal');
    modalElement.addEventListener('hidden.bs.modal', function () {
        // Limpia clases y overlays si quedaron "pegados"
        document.body.classList.remove('modal-open');
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    });

    document.getElementById('logoutBtn').addEventListener('click', function() {
        // Eliminar token y datos de usuario del localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        
        // Redireccionar a la página de inicio de sesión
        window.location.replace('index.html');
    });
});
