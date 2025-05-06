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


// ====== MANEJO DEL EMAIL PARA EL CHAT ======

document.addEventListener('DOMContentLoaded', () => {
    const chatLink = document.querySelector('a[href="chat.html"]');
    const emailModal = new bootstrap.Modal(document.getElementById('emailModal'));
    const submitBtn = document.getElementById('submitEmailBtn');

    if (chatLink) {
        chatLink.addEventListener('click', (event) => {
            const email = localStorage.getItem('userEmail');
            if (!email) {
                event.preventDefault(); // Evita que vaya al chat
                emailModal.show();
            }
        });
    }

    submitBtn.addEventListener('click', () => {
        const emailInput = document.getElementById('userEmail');
        const email = emailInput.value.trim();

        if (email && validateEmail(email)) {
            localStorage.setItem('userEmail', email);
            emailModal.hide();
            window.location.href = 'chat.html';
        } else {
            alert('Por favor ingresa un correo electrónico válido.');
        }
    });

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
});
