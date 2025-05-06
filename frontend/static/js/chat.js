document.addEventListener('DOMContentLoaded', function () {
    console.log("El script `chat.js` se ha cargado correctamente.");

    const emailForm = document.getElementById('emailForm');
    const emailInput = document.getElementById('emailInput');
    const chatContainer = document.getElementById('chatContainer');
    const emailFormContainer = document.getElementById('emailFormContainer');
    const chatForm = document.getElementById('chatForm');
    const messagesContainer = document.getElementById('messages-container');

    // Verificar si el correo está en el localStorage
    const storedEmail = sessionStorage.getItem('chatEmail');
    if (storedEmail) {
        showChat(storedEmail);
    } else {
        emailFormContainer.style.display = 'block';
        chatContainer.style.display = 'none';
    }

    // Manejar el envío del formulario de email
    emailForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const email = emailInput.value.trim();

        if (email) {
            sessionStorage.setItem('chatEmail', email);
            showChat(email);
        } else {
            alert('Por favor, ingresa un correo válido.');
        }
    });

    // Mostrar el chat y ocultar el formulario de email
    function showChat(email) {
        emailFormContainer.style.display = 'none';
        chatContainer.style.display = 'block';
        loadMessages();
    }

    // Manejar el envío del formulario de chat
    chatForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const mensaje = event.target.querySelector('[name="mensaje"]').value;

        if (!mensaje) {
            alert("Por favor, escribe un mensaje.");
            return;
        }

        enviarMensaje(mensaje);
    });

    // Función para enviar mensaje
    function enviarMensaje(mensaje) {
        const email = sessionStorage.getItem("chatEmail");

        fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem("token")
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

    // Función para cargar los mensajes
    function loadMessages() {
        fetch('http://localhost:5000/api/chat', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem("token")
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

    // Mostrar mensajes en la interfaz
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
            messageDiv.innerHTML = `<strong>${mensaje.usuario}</strong>: ${mensaje.contenido}`;
            messagesContainer.appendChild(messageDiv);
        });
    }

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        // Eliminar datos de la sesión
        sessionStorage.removeItem('chatEmail');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        
        // Redirigir al login
        window.location.replace('index.html');
    });
});
