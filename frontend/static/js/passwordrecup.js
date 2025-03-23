document.getElementById('passwordRecoveryForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;

    fetch('http://localhost:3000/send-recovery-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Código de recuperación enviado a su correo electrónico.');
        } else {
            alert('Error al enviar el código de recuperación.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al enviar el código de recuperación.');
    });
});