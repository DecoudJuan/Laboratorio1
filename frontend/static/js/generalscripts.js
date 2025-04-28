window.addEventListener('beforeunload', () => {
    localStorage.removeItem('authtoken');
  });

// Funciones de utilidad
function preventCaching() {
    if (window.location.protocol !== 'file:') {
        window.history.replaceState(null, document.title, window.location.href);
    }
}

function checkToken() {
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');
    if (!authToken || !currentUser) {
        window.location.replace('index.html');
        return false;
    }
    return true;
}

function handleAuthError(response) {
    if (response.status === 401) {
        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.replace('index.html');
        return true;
    }
    return false;
}

function showAlert(message, type) {
    const alertPlaceholder = document.getElementById('liveAlertPlaceholder');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `<div class="alert alert-${type} alert-dismissible" role="alert">
                            <div>${message}</div>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>`;
    alertPlaceholder.append(wrapper);
}
function showError(message) {
    showAlert(message, 'danger');
}

preventCaching();
checkToken();