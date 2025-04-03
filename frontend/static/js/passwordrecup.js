document.getElementById('passwordRecoveryForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const messageContainer = document.getElementById('messageContainer') || 
                            document.querySelector('.message');
    
    // Comprobar si existe el contenedor de mensaje
    if (!messageContainer) {
        console.error('No se encontró el contenedor de mensajes');
        return;
    }
    
    // Mostrar mensaje de carga
    messageContainer.innerHTML = 'Enviando solicitud...';
    messageContainer.className = 'message'; // Resetear clases
    messageContainer.style.display = 'block';

    fetch('http://localhost:5000/api/send-recovery-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email })
    })
    .then(response => response.json())
    .then(data => {
        // Mostrar el mensaje que viene directamente del backend
        if (data.success) {
            messageContainer.innerHTML = data.message;
            messageContainer.className = 'message success';
        } else {
            messageContainer.innerHTML = data.message;
            messageContainer.className = 'message error';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        messageContainer.innerHTML = 'Error al conectar con el servidor. Por favor intenta más tarde.';
        messageContainer.className = 'message error';
    });
});