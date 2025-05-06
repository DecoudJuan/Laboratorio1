function preventCaching() {
    if (window.location.protocol != 'file:') {
        window.history.replaceState(null, document.title, window.location.href);
    }
}

preventCaching();

function checkToken() {
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');

    if (!authToken || !currentUser) {
        window.location.replace('index.html');
        return;
    }
}

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        console.log('Página restaurada desde caché - verificando autenticación');
        checkToken();
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('Página visible - verificando autenticación');
        checkToken();
    }
});

document.getElementById('logoutBtn').addEventListener('click', function() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userEmail'); // también limpiamos el email del chat
    sessionStorage.removeItem('chatEmail'); // Limpiar el email del chat
    window.location.href = 'index.html';
});



