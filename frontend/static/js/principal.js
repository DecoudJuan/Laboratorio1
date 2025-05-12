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

document.getElementById('notificaciones').addEventListener('click', function () {
    console.log('Botón de notificaciones clickeado');
    
    // Eliminar el contenedor anterior si existe
    let existingContainer = document.getElementById('notificaciones-dinámico');
    if (existingContainer) {
        existingContainer.remove();
        return; // Si ya existía, solo lo eliminamos y salimos
    }
    
    // Crear un nuevo contenedor
    const container = document.createElement('div');
    container.id = 'notificaciones-dinámico';
    
    // Aplicar estilos directamente
    Object.assign(container.style, {
        position: 'absolute',
        top: '50px',
        right: '20px',
        width: '250px',
        maxHeight: '400px',
        overflowY: 'auto',
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '10px',
        zIndex: '9999',
        display: 'block'
    });
    
    // Añadir al DOM
    document.body.appendChild(container);
    
    // Añadir un botón para cerrar en la parte superior
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.float = 'right';
    closeButton.style.border = 'none';
    closeButton.style.background = 'none';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = function() {
        container.remove();
    };
    container.appendChild(closeButton);
    
    // Añadir un título
    const title = document.createElement('h5');
    title.textContent = 'Notificaciones';
    title.style.margin = '0 0 10px 0';
    container.appendChild(title);
    
    // Separador
    const divider = document.createElement('hr');
    divider.style.margin = '5px 0 15px 0';
    container.appendChild(divider);
    
    // Mensaje de carga
    const loadingMsg = document.createElement('div');
    loadingMsg.textContent = 'Cargando mensajes...';
    loadingMsg.style.textAlign = 'center';
    loadingMsg.style.padding = '10px';
    container.appendChild(loadingMsg);
    
    // Cargar los mensajes
    console.log('Iniciando petición fetch a la API');
    fetch("http://localhost:5000/api/chat", {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('authToken')
        }
    })
    .then(response => response.json())
    .then(data => {
        // Limpiar el mensaje de carga
        container.removeChild(loadingMsg);
        
        const mensajes = data.mensajes || [];
        console.log('Mensajes recibidos:', mensajes.length);
        
        if (mensajes.length === 0) {
            const vacio = document.createElement('div');
            vacio.textContent = 'No hay mensajes.';
            vacio.style.textAlign = 'center';
            vacio.style.padding = '10px';
            container.appendChild(vacio);
            return;
        }
        
        mensajes.forEach((mensaje, index) => {
            const msgContainer = document.createElement('div');
            msgContainer.style.padding = '8px';
            msgContainer.style.margin = '5px 0';
            msgContainer.style.borderBottom = '1px solid #eee';
            
            // Usuario y fecha
            const header = document.createElement('div');
            header.style.fontSize = '0.8em';
            header.style.color = '#666';
            header.textContent = `${mensaje.usuario} - ${new Date(mensaje.fecha_creacion).toLocaleString()}`;
            msgContainer.appendChild(header);
            
            // Contenido
            const content = document.createElement('div');
            content.style.marginTop = '3px';
            content.textContent = mensaje.contenido || '[Sin contenido]';
            msgContainer.appendChild(content);
            
            container.appendChild(msgContainer);
        });
    })
    .catch(error => {
        console.error('Error al cargar mensajes:', error);
        container.innerHTML = '<div style="color: red; padding: 10px;">Error al cargar mensajes.</div>';
    });
});