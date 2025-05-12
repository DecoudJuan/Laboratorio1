document.addEventListener('DOMContentLoaded', function () {
    console.log("El script `chat.js` se ha cargado correctamente.");

    const chatForm = document.getElementById('chatForm');
    const messagesContainer = document.getElementById('messages-container');
    const chatContainer = document.getElementById('chatContainer');
    const API_BASE_URL = 'http://localhost:5000/api'; // Centralizar la URL base

    // Función para cargar los datos del usuario y mostrar su email
    function loadUserData() {
        const token = localStorage.getItem('authToken');
        const currentUserData = localStorage.getItem('currentUser');

        if (!token) {
            // Redirigir si no hay token
            window.location.href = 'principal.html';
            return;
        }

        if (currentUserData) {
            try {
                const userData = JSON.parse(currentUserData);
                if (userData.email) {
                    document.getElementById('emailDisplay').textContent = userData.email;
                }
                chatContainer.style.display = 'block'; // Mostrar el contenedor del chat
            } catch (e) {
                console.error('Error al parsear currentUser desde localStorage:', e);
            }
        } else {
            console.warn('No hay datos del usuario en localStorage.');
        }
    }

    // Función auxiliar para hacer solicitudes fetch con manejo de errores
    async function fetchWithErrorHandling(url, options) {
        try {
            const response = await fetch(url, options);
            
            // Si la respuesta no es exitosa, lanzar un error
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error en solicitud a ${url}:`, error);
            // Mostrar un mensaje al usuario
            const errorMessage = error.message || "Error de conexión con el servidor";
            showNotification(errorMessage, "error");
            throw error;
        }
    }

    // Función para mostrar notificaciones
    function showNotification(message, type = "info") {
        // Crear elemento de notificación
        const notification = document.createElement("div");
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Añadir al DOM
        document.body.appendChild(notification);
        
        // Eliminar después de 5 segundos
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Función para manejar reacciones a mensajes
    // Función para manejar reacciones a mensajes
async function reactToMessage(id, reaction) {
    if (!id) {
        console.error("Error: ID de mensaje indefinido");
        showNotification("No se pudo procesar la reacción", "error");
        return;
    }
    
    console.log("Reaccionando al mensaje con ID:", id, "Reacción:", reaction);
    
    const currentUserData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const email = currentUserData.email || 'anonimo';
    
    try {
        const data = await fetchWithErrorHandling(`${API_BASE_URL}/chat/reaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            },
            body: JSON.stringify({ id, reaction, usuario: email })
        });
        
        if (data.success) {
            const messageElement = document.querySelector(`[data-message-id="${id}"]`);
            if (messageElement) {
                messageElement.querySelector('.like-count').textContent = data.thumpsUp;
                messageElement.querySelector('.dislike-count').textContent = data.thumpsDown;
            }
        }
    } catch (error) {
        console.error("Error al procesar reacción:", error);
    }
}

    // Enviar mensaje
    async function enviarMensaje(mensaje) {
        const currentUserData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const email = currentUserData.email || 'anonimo';

        try {
            const data = await fetchWithErrorHandling(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                },
                body: JSON.stringify({ mensaje, usuario: email })
            });
            
            if (data.success) {
                loadMessages();
                document.querySelector('[name="mensaje"]').value = '';
            }
        } catch (error) {
            console.error("Error al enviar mensaje:", error);
        }
    }
    
    // Cargar mensajes
    async function loadMessages() {
        try {
            const data = await fetchWithErrorHandling(`${API_BASE_URL}/chat`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                }
            });
            
            updateMessages(data.mensajes);
        } catch (error) {
            console.error("Error al cargar los mensajes:", error);
        }
    }

    // Delegar eventos para los botones de reacción
// Delegar eventos para los botones de reacción
    messagesContainer.addEventListener('click', function(event) {
        const button = event.target.closest('.thumb-btn');
        if (!button) return;
        
        // Usar el atributo data-id del botón directamente
        const messageId = button.dataset.id;
        const action = button.dataset.action;
        
        if (!messageId) {
            console.error("No se encontró ID del mensaje");
            return;
        }
        
        console.log(`Click en botón de reacción: ${action} para mensaje ${messageId}`);
        reactToMessage(messageId, action);
    });

    // Mostrar mensajes
function updateMessages(mensajes) {
    if (!messagesContainer) {
        console.error("Contenedor de mensajes no encontrado en el DOM");
        return;
    }

    messagesContainer.innerHTML = '';

    if (!mensajes || mensajes.length === 0) {
        messagesContainer.innerHTML = '<div class="text-center text-muted">No hay mensajes aún</div>';
        return;
    }

    mensajes.forEach(mensaje => {
        // Log para debug
        console.log("Mensaje:", mensaje);
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'mb-3 border-bottom pb-2';
        
        // Establece el ID en el div del mensaje
        messageDiv.setAttribute('data-message-id', mensaje.id);
        
        const fecha = new Date(mensaje.fecha_creacion);
        const fechaFormateada = fecha.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });

        // La diferencia clave: añadir data-id directamente a los botones
        messageDiv.innerHTML = `
            <strong>${mensaje.usuario}</strong>: ${mensaje.contenido}
            <div class="text-muted" style="font-size: 0.8rem;">${fechaFormateada}</div>
            <div class="reaction-buttons">
                <button class="thumb-btn" data-action="like" data-id="${mensaje.id}">
                    <i class="bi bi-hand-thumbs-up" style="color: #28a745"></i> <span class="like-count">${mensaje.thumpsUp || 0}</span>
                </button>
                <button class="thumb-btn" data-action="dislike" data-id="${mensaje.id}">
                    <i class="bi bi-hand-thumbs-down" style="color: #dc3545"></i> <span class="dislike-count">${mensaje.thumpsDown || 0}</span>
                </button>
            </div>
        `;
    
        messagesContainer.appendChild(messageDiv);
    });
}

    // Añadir estilos CSS para las notificaciones
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px;
            border-radius: 5px;
            color: white;
            z-index: 1000;
            animation: fadeIn 0.5s, fadeOut 0.5s 4.5s;
        }
        .notification.info {
            background-color: #2196F3;
        }
        .notification.error {
            background-color: #f44336;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(styleSheet);

    // Evento de envío del formulario
    chatForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const mensaje = event.target.querySelector('[name="mensaje"]').value;
        if (!mensaje) {
            showNotification("Por favor, escribe un mensaje.", "error");
            return;
        }
        enviarMensaje(mensaje);
    });

    // Evento para manejar página restaurada desde caché
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            loadUserData();
            loadMessages();
        }
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.replace('index.html');
    });

    // Botón de volver a principal
    const backToPrincipalBtn = document.getElementById('backToPrincipalBtn');
    if (backToPrincipalBtn) {
        backToPrincipalBtn.addEventListener('click', function() {
            window.location.href = 'principal.html';
        });
    }

    // Cargar datos y mensajes al inicio
    loadUserData();
    loadMessages();
});