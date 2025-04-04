document.getElementById('logoutBtn').addEventListener('click', function() {
    // Eliminar token y datos de usuario del localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    // Redireccionar a la página de inicio de sesión
    window.location.href = 'index.html';
});

