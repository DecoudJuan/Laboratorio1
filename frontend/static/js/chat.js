chatForm.addEventListener('submit', function(event) {
    event.preventDefault();  // Evita el envío tradicional del formulario

    const mensaje = event.target.querySelector('[name="mensaje"]').value;

    // Verifica si el mensaje no está vacío
    if (!mensaje) {
        alert("Por favor, escribe un mensaje.");
        return;
    }

    // Realizar una petición POST usando fetch
    fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem("token") 
        },
        credentials: 'include',
        body: JSON.stringify({ mensaje })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => { throw new Error(data.message || 'Error al enviar mensaje'); });
        }
        return response.json();
    })
    .then(data => {
        // Recargar los mensajes
        loadMessages();
        // Limpiar el campo de texto
        event.target.querySelector('[name="mensaje"]').value = '';
    })
    .catch(error => {
        console.error('Error al enviar mensaje:', error.message);
    });

    console.error("Formulario de chat no encontrado en el DOM");  // ❌ Esto está fuera del evento

}); 
// Función para cargar los mensajes iniciales
function loadMessages() {
    fetch('http://localhost:5000/api/chat', {
        method: 'GET',
        credentials: 'include'
    })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    window.location.href = '/api/login';
                    throw new Error('No autorizado');
                }
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            updateMessages(data.mensajes);
        })
        .catch(error => {
            console.error("Error al cargar los mensajes:", error);
            if (!error.message.includes('No autorizado')) {
                const messagesContainer = document.getElementById('messages-container');
                if (messagesContainer) {
                    messagesContainer.innerHTML = '<div class="alert alert-danger">Error al cargar los mensajes</div>';
                }
            }
        });
}

// Función para actualizar los mensajes en la página
function updateMessages(mensajes) {
    const messagesContainer = document.getElementById('messages-container');
    if (!messagesContainer) {
        console.error("Contenedor de mensajes no encontrado en el DOM");
        return;
    }
    
    messagesContainer.innerHTML = '';  // Limpiar los mensajes actuales

    if (!mensajes || mensajes.length === 0) {
        messagesContainer.innerHTML = '<div class="text-center text-muted">No hay mensajes aún</div>';
        return;
    }

    // Recorrer los mensajes y agregarlos al contenedor
    mensajes.forEach(mensaje => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'mb-3 border-bottom pb-2';
        messageDiv.innerHTML = `<strong>${mensaje.usuario}</strong>: ${mensaje.contenido}`;
        messagesContainer.appendChild(messageDiv);
    });
}