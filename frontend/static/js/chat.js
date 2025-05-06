document.addEventListener('DOMContentLoaded', function () {
    console.log("El script `chat.js` se ha cargado correctamente.");

    const chatForm = document.getElementById('chatForm');
    const messagesContainer = document.getElementById('messages-container');
    const chatContainer = document.getElementById('chatContainer');

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

    // Enviar mensaje
    function enviarMensaje(mensaje) {
        const currentUserData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const email = currentUserData.email || 'anonimo';

        fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            },
            body: JSON.stringify({ mensaje, usuario: email })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadMessages();
                document.querySelector('[name="mensaje"]').value = '';
            } else {
                alert("Error al enviar mensaje: " + data.message);
            }
        })
        .catch(error => {
            console.error("Error en la solicitud:", error);
        });
    }

    // Cargar mensajes
    function loadMessages() {
        fetch('http://localhost:5000/api/chat', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            }
        })
        .then(response => response.json())
        .then(data => {
            updateMessages(data.mensajes);
        })
        .catch(error => {
            console.error("Error al cargar los mensajes:", error);
        });
    }

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
            const messageDiv = document.createElement('div');
            messageDiv.className = 'mb-3 border-bottom pb-2';
            const fecha = new Date(mensaje.fecha_creacion);
            const fechaFormateada = fecha.toLocaleString();
            messageDiv.innerHTML = `
                <div>
                    <strong>${mensaje.usuario}</strong>: ${mensaje.contenido}
                    <div class="text-muted" style="font-size: 0.8rem;">${fechaFormateada}</div>
                </div>`;
            messagesContainer.appendChild(messageDiv);
        });
    }

    // Evento de envío del formulario
    chatForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const mensaje = event.target.querySelector('[name="mensaje"]').value;
        if (!mensaje) {
            alert("Por favor, escribe un mensaje.");
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
