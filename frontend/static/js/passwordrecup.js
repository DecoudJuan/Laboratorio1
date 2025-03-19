// filepath: c:\Users\juand\Laboratorio1\frontend\static\js\passwordrecup.js
document.getElementById('passwordRecoveryForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;

    fetch('http://127.0.0.1:3000/send-recovery-email', {  // Asegúrate de que la URL apunte al backend
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Correo de recuperación enviado.');
        } else {
            alert('Error al enviar el correo de recuperación.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al enviar el correo de recuperación.');
    });
});