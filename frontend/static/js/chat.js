document.addEventListener('DOMContentLoaded', function () {
    console.log("El script `chat.js` se ha cargado correctamente.");

    const chatForm = document.getElementById('chatForm');
    const messagesContainer = document.getElementById('messages-container');
    const chatContainer = document.getElementById('chatContainer');
    const loadingMessage = document.getElementById('loadingMessage');
    const API_BASE_URL = 'http://localhost:5000/api';
    
    // Variables globales
    let currentUserEmail = '';
    let socket = null;

    // Función para mostrar/ocultar elementos de carga
    function toggleLoadingState(loading) {
        if (loading) {
            chatContainer.style.display = 'none';
            loadingMessage.style.display = 'block';
        } else {
            chatContainer.style.display = 'block';
            loadingMessage.style.display = 'none';
        }
    }


    // Función para inicializar Socket.IO
    function initializeSocket() {
        if (socket) {
            socket.disconnect();
        }

        socket = io('http://localhost:5000', {
            transports: ['polling', 'websocket'],
            timeout: 20000,
            forceNew: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        // Eventos de conexión
        socket.on('connect', function() {
            console.log('Conectado al servidor Socket.IO');
            
            // Unirse al chat solo si tenemos el email del usuario
            if (currentUserEmail) {
                socket.emit('unirse_chat', { usuario_email: currentUserEmail });
            }
        });

        socket.on('disconnect', function() {
            console.log('Desconectado del servidor Socket.IO');
        });

        socket.on('connect_error', function(error) {
            console.error('Error de conexión:', error);
        });

        // Escuchar nuevos mensajes
        socket.on('nuevo_mensaje', function(mensaje) {
            console.log('Nuevo mensaje recibido:', mensaje);
            // Solo agregar si no es nuestro propio mensaje
            if (mensaje.usuario !== currentUserEmail) {
                addMessageToContainer(mensaje);
                showNotification(`Nuevo mensaje de ${mensaje.usuario}`, 'info');
            }
        });

        // Escuchar actualizaciones de reacciones en tiempo real
        socket.on('actualizar_reacciones', function(data) {
            console.log('Actualización de reacciones:', data);
            updateMessageReactions(data.id, data.thumpsUp, data.thumpsDown);
            
            // Mostrar notificación si la reacción no es del usuario actual
            if (data.usuario !== currentUserEmail && data.tipo_reaccion) {
                const emoji = data.tipo_reaccion === 'like' ? '👍' : '👎';
                showNotification(`${data.usuario} reaccionó ${emoji}`, 'info');
            }
        });

        socket.on('conectado', function(data) {
            console.log('Mensaje del servidor:', data.mensaje);
        });

        socket.on('estado', function(data) {
            console.log('Estado del chat:', data.mensaje);
        });
    }

    // Función para cargar los datos del usuario y mostrar su email
    async function loadUserData() {
        const token = localStorage.getItem('authToken');
        const currentUserData = localStorage.getItem('currentUser');

        if (!token) {
            console.error('No hay token de autenticación');
            window.location.href = 'principal.html';
            return false;
        }

        if (currentUserData) {
            try {
                const userData = JSON.parse(currentUserData);
                if (userData.email) {
                    currentUserEmail = userData.email;
                    document.getElementById('emailDisplay').textContent = userData.email;
                    console.log('Usuario cargado:', currentUserEmail);
                    return true;
                }
            } catch (e) {
                console.error('Error al parsear currentUser desde localStorage:', e);
            }
        }

        // Si no hay datos del usuario, intentar obtenerlos
        console.warn('No hay datos del usuario en localStorage, redirigiendo...');
        window.location.href = 'principal.html';
        return false;
    }

    // Función auxiliar para hacer solicitudes fetch con manejo de errores
    async function fetchWithErrorHandling(url, options) {
        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error en solicitud a ${url}:`, error);
            const errorMessage = error.message || "Error de conexión con el servidor";
            showNotification(errorMessage, "error");
            throw error;
        }
    }

    // Función para mostrar notificaciones
    function showNotification(message, type = "info") {
        const notification = document.createElement("div");
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Función para manejar reacciones a mensajes
    async function reactToMessage(id, reaction) {
        if (!id) {
            console.error("Error: ID de mensaje indefinido");
            showNotification("No se pudo procesar la reacción", "error");
            return;
        }

        console.log("Reaccionando al mensaje con ID:", id, "Reacción:", reaction);

        // Deshabilitar botón temporalmente para evitar clics múltiples
        const button = document.querySelector(`[data-id="${id}"][data-action="${reaction}"]`);
        if (button) {
            button.disabled = true;
            button.style.opacity = '0.6';
        }

        try {
            const data = await fetchWithErrorHandling(`${API_BASE_URL}/chat/reaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                },
                body: JSON.stringify({ id, reaction, usuario: currentUserEmail })
            });

            if (data.success) {
                console.log('Reacción procesada correctamente');
                const emoji = reaction === 'like' ? '👍' : '👎';
                showNotification(`Reacción ${emoji} enviada`, 'info');
            } else {
                showNotification("Error al procesar la reacción", "error");
            }
        } catch (error) {
            console.error("Error al procesar reacción:", error);
            showNotification("Hubo un problema al procesar la reacción", "error");
        } finally {
            // Rehabilitar botón
            if (button) {
                button.disabled = false;
                button.style.opacity = '1';
            }
        }
    }

    // Enviar mensaje
    async function enviarMensaje(mensaje) {
        try {
            const data = await fetchWithErrorHandling(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                },
                body: JSON.stringify({ mensaje, usuario: currentUserEmail })
            });
            
            if (data.success) {
                // Agregar nuestro propio mensaje al contenedor inmediatamente
                addMessageToContainer(data.mensaje);
                document.querySelector('[name="mensaje"]').value = '';
                showNotification('Mensaje enviado', 'info');
            }
        } catch (error) {
            console.error("Error al enviar mensaje:", error);
        }
    }
    
    // Cargar mensajes iniciales
    async function loadMessages() {
        try {
            console.log('Cargando mensajes...');
            const data = await fetchWithErrorHandling(`${API_BASE_URL}/chat`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                }
            });
            
            console.log('Mensajes cargados:', data);
            updateMessages(data.mensajes);
            return true;
        } catch (error) {
            console.error("Error al cargar los mensajes:", error);
            showNotification("Error al cargar mensajes", "error");
            return false;
        }
    }

    // Función para agregar un solo mensaje al contenedor
    function addMessageToContainer(mensaje) {
        if (!messagesContainer) {
            console.error("Contenedor de mensajes no encontrado en el DOM");
            return;
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = 'mb-3 border-bottom pb-2';
        messageDiv.setAttribute('data-message-id', mensaje.id);
        
        const fecha = new Date(mensaje.fecha_creacion);
        const fechaFormateada = fecha.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });

        messageDiv.innerHTML = `
            <strong>${mensaje.usuario}</strong>: ${mensaje.contenido}
            <div class="text-muted" style="font-size: 0.8rem;">${fechaFormateada}</div>
            <div class="reaction-buttons">
                <button class="thumb-btn" data-action="like" data-id="${mensaje.id}" title="Me gusta">
                    <i class="bi bi-hand-thumbs-up" style="color: #28a745"></i> 
                    <span class="like-count">${mensaje.thumpsUp || 0}</span>
                </button>
                <button class="thumb-btn" data-action="dislike" data-id="${mensaje.id}" title="No me gusta">
                    <i class="bi bi-hand-thumbs-down" style="color: #dc3545"></i> 
                    <span class="dislike-count">${mensaje.thumpsDown || 0}</span>
                </button>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        
        // Scroll automático al último mensaje
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Función para actualizar las reacciones de un mensaje específico
    function updateMessageReactions(messageId, thumpsUp, thumpsDown) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.querySelector('.like-count').textContent = thumpsUp || 0;
            messageElement.querySelector('.dislike-count').textContent = thumpsDown || 0;
        }
    }

    // Mostrar mensajes iniciales
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
            addMessageToContainer(mensaje);
        });

        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);

    }

    // Función principal de inicialización
    async function initializeChat() {
        console.log('Inicializando chat...');
        
        try {
            // 1. Cargar datos del usuario
            const userLoaded = await loadUserData();
            if (!userLoaded) {
                console.error('No se pudieron cargar los datos del usuario');
                return;
            }

            // 2. Inicializar Socket.IO
            initializeSocket();

            // 3. Cargar mensajes
            const messagesLoaded = await loadMessages();
            if (!messagesLoaded) {
                console.warn('No se pudieron cargar los mensajes, pero continuando...');
            }

            // 4. Ocultar loading y mostrar chat
            toggleLoadingState(false);
            console.log('Chat inicializado correctamente');

        } catch (error) {
            console.error('Error al inicializar el chat:', error);
            showNotification('Error al inicializar el chat', 'error');
            toggleLoadingState(false);
        }
    }

    // Delegar eventos para los botones de reacción
    if (messagesContainer) {
        messagesContainer.addEventListener('click', function(event) {
            const button = event.target.closest('.thumb-btn');
            if (!button) return;
            
            const messageId = button.dataset.id;
            const action = button.dataset.action;
            
            if (!messageId) {
                console.error("No se encontró ID del mensaje");
                return;
            }
            
            console.log(`Click en botón de reacción: ${action} para mensaje ${messageId}`);
            reactToMessage(messageId, action);
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
    if (chatForm) {
        chatForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const mensaje = event.target.querySelector('[name="mensaje"]').value.trim();
            if (!mensaje) {
                showNotification("Por favor, escribe un mensaje.", "error");
                return;
            }
            enviarMensaje(mensaje);
        });
    }

    // Evento para manejar página restaurada desde caché
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            initializeChat();
        }
    });

    // Cleanup al cerrar la página
    window.addEventListener('beforeunload', function() {
        if (currentUserEmail && socket) {
            socket.emit('salir_chat', { usuario_email: currentUserEmail });
        }
        if (socket) {
            socket.disconnect();
        }
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (currentUserEmail && socket) {
                socket.emit('salir_chat', { usuario_email: currentUserEmail });
            }
            if (socket) {
                socket.disconnect();
            }
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            window.location.replace('index.html');
        });
    }

    // Botón de volver a principal
    const backToPrincipalBtn = document.getElementById('backToPrincipalBtn');
    if (backToPrincipalBtn) {
        backToPrincipalBtn.addEventListener('click', function() {
            window.location.href = 'principal.html';
        });
    }

    // Inicializar el chat cuando se carga la página
    initializeChat();
});