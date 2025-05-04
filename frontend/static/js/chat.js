document.addEventListener('DOMContentLoaded', function () {
    console.log("El script `chat.js` se ha cargado correctamente."); 
    const chatForm = document.getElementById('chatForm');
    const messagesContainer = document.getElementById('messages-container');

    if (!chatForm) {
        console.error("Formulario de chat no encontrado en el DOM");
        return;
    }

    chatForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const mensaje = event.target.querySelector('[name="mensaje"]').value;

        console.log("Mensaje a enviar:", mensaje); // ✅ Verificar que el mensaje se obtiene correctamente

        if (!mensaje) {
            alert("Por favor, escribe un mensaje.");
            return;
        }

        enviarMensaje(mensaje);
    });

    // Cargar mensajes al inicio
    loadMessages();
});

// 🔹 Enviar mensaje al servidor
function enviarMensaje(mensaje) {
    fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem("token")  // ✅ Enviar JWT
        },
        body: JSON.stringify({ mensaje })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Respuesta del servidor:", data); // ✅ Verificar la respuesta del backend

        if (data.success) {
            loadMessages(); // ✅ Recargar mensajes
            document.querySelector('[name="mensaje"]').value = ''; // ✅ Limpiar campo
        } else {
            alert("Error al enviar mensaje: " + data.message);
        }
    })
    .catch(error => {
        console.error("Error en la solicitud:", error);
    });
}

// 🔹 Cargar mensajes existentes
function loadMessages() {
    fetch('http://localhost:5000/api/chat', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem("token")  // ✅ Enviar JWT
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

// 🔹 Mostrar mensajes en la interfaz
function updateMessages(mensajes) {
    const messagesContainer = document.getElementById('messages-container');

    if (!messagesContainer) {
        console.error("Contenedor de mensajes no encontrado en el DOM");
        return;
    }

    messagesContainer.innerHTML = '';  // ✅ Limpiar mensajes anteriores

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