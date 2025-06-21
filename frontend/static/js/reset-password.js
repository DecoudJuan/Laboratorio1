document.addEventListener('DOMContentLoaded', function() {
    // Obtener token de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        showAlert('error', 'Token de recuperación no válido. Solicita un nuevo enlace de recuperación.');
        return;
    }
    
    document.getElementById('token').value = token;
    
    // Validar token al cargar la página
    validateToken(token);
    
    // Manejar envío del formulario
    document.getElementById('resetPasswordForm').addEventListener('submit', function(event) {
        event.preventDefault();
        handlePasswordReset();
    });
    
    // Validación en tiempo real de contraseñas
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    function validatePasswords() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword && password !== confirmPassword) {
            confirmPasswordInput.setCustomValidity('Las contraseñas no coinciden');
        } else {
            confirmPasswordInput.setCustomValidity('');
        }
    }
    
    passwordInput.addEventListener('input', validatePasswords);
    confirmPasswordInput.addEventListener('input', validatePasswords);
});

async function validateToken(token) {
    try {
        const response = await fetch('http://localhost:5000/api/validate-recovery-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: token })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            showAlert('error', data.message + ' Solicita un nuevo enlace de recuperación.');
            document.getElementById('resetPasswordForm').style.display = 'none';
        }
    } catch (error) {
        console.error('Error validando token:', error);
        showAlert('error', 'Error de conexión. Verifica tu conexión a internet.');
    }
}

async function handlePasswordReset() {
    const token = document.getElementById('token').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitButton = document.querySelector('button[type="submit"]');
    
    // Validaciones del frontend
    if (password.length < 6) {
        showAlert('error', 'La contraseña debe tener al menos 6 caracteres.');
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert('error', 'Las contraseñas no coinciden.');
        return;
    }
    
    // Mostrar estado de carga
    setLoading(submitButton, true);
    
    try {
        const response = await fetch('http://localhost:5000/api/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                password: password,
                confirmPassword: confirmPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('success', data.message);
            document.getElementById('resetPasswordForm').style.display = 'none';
            
            // Redirigir al login después de 3 segundos
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        } else {
            showAlert('error', data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('error', 'Error de conexión. Por favor intenta más tarde.');
    } finally {
        setLoading(submitButton, false);
    }
}

function showAlert(type, message) {
    const alertContainer = document.getElementById('alertContainer');
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    
    alertContainer.innerHTML = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

function setLoading(button, loading) {
    const buttonText = button.querySelector('.button-text');
    const loadingSpinner = button.querySelector('.loading');
    
    if (loading) {
        buttonText.style.display = 'none';
        loadingSpinner.style.display = 'inline-flex';
        button.disabled = true;
    } else {
        buttonText.style.display = 'inline';
        loadingSpinner.style.display = 'none';
        button.disabled = false;
    }
}