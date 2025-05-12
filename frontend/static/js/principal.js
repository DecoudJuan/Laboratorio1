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

// Función que verifica si hay mensajes nuevos y actualiza el estado del punto rojo
function actualizarCampanita() {
    const currentUser = localStorage.getItem('currentUser');
    const ultimaFechaLeida = localStorage.getItem(`ultimaFechaMensaje_${currentUser}`);
    const mensajesLeidos = JSON.parse(localStorage.getItem(`mensajesLeidos_${currentUser}`)) || [];

    // Hacer una solicitud para obtener los mensajes
    fetch("http://localhost:5000/api/chat", {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('authToken')
        }
    })
    .then(response => response.json())
    .then(data => {
        const mensajes = data.mensajes || [];

        // Filtrar los mensajes nuevos que no sean del usuario logueado y que sean posteriores a la última fecha leída
        const mensajesNuevos = mensajes.filter(msg => {
            const fechaMsg = new Date(msg.fecha_creacion);
            const esNuevo = !ultimaFechaLeida || fechaMsg > new Date(ultimaFechaLeida);
            const noEsDelUsuario = msg.usuario !== currentUser;
            const noEsLeido = !mensajesLeidos.includes(msg.id); // Asegurarnos de que no esté marcado como leído
            return esNuevo && noEsDelUsuario && noEsLeido;
        });

        // Si hay mensajes nuevos, mostrar el puntito rojo
        const campanita = document.getElementById('notificaciones');
        const puntoRojo = document.getElementById('punto-rojo');

        if (mensajesNuevos.length > 0) {
            // Si no existe el puntito rojo, lo creamos
            if (!puntoRojo) {
                const puntoRojo = document.createElement('div');
                puntoRojo.id = 'punto-rojo';
                puntoRojo.style.position = 'absolute';
                puntoRojo.style.top = '0';
                puntoRojo.style.right = '0';
                puntoRojo.style.width = '10px';
                puntoRojo.style.height = '10px';
                puntoRojo.style.borderRadius = '50%';
                puntoRojo.style.backgroundColor = 'red';
                campanita.style.position = 'relative';
                campanita.appendChild(puntoRojo);
            } else {
                // Si ya existe el puntito, asegurarnos de que esté visible
                puntoRojo.style.display = 'block';
            }
        } else {
            // Si no hay mensajes nuevos, ocultamos el puntito rojo
            if (puntoRojo) {
                puntoRojo.style.display = 'none';
            }
        }
    })
    .catch(error => {
        console.error('Error al cargar mensajes:', error);
    });
}

// Ejecutar la función de actualización cada 10 segundos (puedes ajustar el intervalo)
setInterval(actualizarCampanita, 1000); // cada 10 segundos

// Función que se ejecuta cuando se hace clic en la campanita
document.getElementById('notificaciones').addEventListener('click', function () {
    console.log('Botón de notificaciones clickeado');

    let existingContainer = document.getElementById('notificaciones-dinámico');
    if (existingContainer) {
        existingContainer.remove();
        return;
    }

    const container = document.createElement('div');
    container.id = 'notificaciones-dinámico';
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

    document.body.appendChild(container);

    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.float = 'right';
    closeButton.style.border = 'none';
    closeButton.style.background = 'none';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => container.remove();
    container.appendChild(closeButton);

    const title = document.createElement('h5');
    title.textContent = 'Notificaciones';
    title.style.margin = '0 0 10px 0';
    container.appendChild(title);

    const divider = document.createElement('hr');
    divider.style.margin = '5px 0 15px 0';
    container.appendChild(divider);

    const tildeBtn = document.createElement('button');
    tildeBtn.innerHTML = '✔ Marcar como leído';
    Object.assign(tildeBtn.style, {
        float: 'right',
        marginBottom: '10px',
        border: 'none',
        backgroundColor: '#28a745',
        color: 'white',
        padding: '5px 10px',
        cursor: 'pointer',
        fontSize: '12px',
        borderRadius: '4px'
    });

    const currentUser = localStorage.getItem('currentUser');
    const ultimaFechaLeida = localStorage.getItem(`ultimaFechaMensaje_${currentUser}`);
    const mensajesLeidos = JSON.parse(localStorage.getItem(`mensajesLeidos_${currentUser}`)) || [];

    tildeBtn.onclick = () => {
        const ahora = new Date().toISOString();
        localStorage.setItem(`ultimaFechaMensaje_${currentUser}`, ahora);
        container.innerHTML = '<div style="text-align: center; padding: 10px;">No hay nuevos mensajes.</div>';

        localStorage.setItem(`mensajesLeidos_${currentUser}`, JSON.stringify([]));

        // Ocultar el punto rojo
        const puntoRojo = document.getElementById('punto-rojo');
        if (puntoRojo) {
            puntoRojo.style.display = 'none';
        }
    };
    container.appendChild(tildeBtn);

    const loadingMsg = document.createElement('div');
    loadingMsg.textContent = 'Cargando mensajes...';
    loadingMsg.style.textAlign = 'center';
    loadingMsg.style.padding = '10px';
    container.appendChild(loadingMsg);

    fetch("http://localhost:5000/api/chat", {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('authToken')
        }
    })
    .then(response => response.json())
    .then(data => {
        container.removeChild(loadingMsg);
        const mensajes = data.mensajes || [];

        const mensajesNuevos = mensajes.filter(msg => {
            const fechaMsg = new Date(msg.fecha_creacion);
            const esNuevo = !ultimaFechaLeida || fechaMsg > new Date(ultimaFechaLeida);
            const noEsDelUsuario = msg.usuario !== currentUser;
            const noEsLeido = !mensajesLeidos.includes(msg.id);
            return esNuevo && noEsDelUsuario && noEsLeido;
        });

        if (mensajesNuevos.length === 0) {
            const vacio = document.createElement('div');
            vacio.textContent = 'No hay nuevos mensajes.';
            vacio.style.textAlign = 'center';
            vacio.style.padding = '10px';
            container.appendChild(vacio);
            return;
        }

        mensajesNuevos.forEach(mensaje => {
            const msgContainer = document.createElement('div');
            msgContainer.style.padding = '8px';
            msgContainer.style.margin = '5px 0';
            msgContainer.style.borderBottom = '1px solid #eee';

            const header = document.createElement('div');
            header.style.fontSize = '0.8em';
            header.style.color = '#666';
            header.textContent = `${mensaje.usuario} - ${new Date(mensaje.fecha_creacion).toLocaleString()}`;
            msgContainer.appendChild(header);

            const content = document.createElement('div');
            content.style.marginTop = '3px';
            content.textContent = mensaje.contenido || '[Sin contenido]';
            msgContainer.appendChild(content);

            container.appendChild(msgContainer);
        });

        tildeBtn.onclick = () => {
            const leidos = mensajesNuevos.map(msg => msg.id);
            const mensajesActualizados = [...mensajesLeidos, ...leidos];
            localStorage.setItem(`mensajesLeidos_${currentUser}`, JSON.stringify(mensajesActualizados));

            const ahora = new Date().toISOString();
            localStorage.setItem(`ultimaFechaMensaje_${currentUser}`, ahora);

            container.innerHTML = '<div style="text-align: center; padding: 10px;">No hay nuevos mensajes.</div>';

            // Ocultar el punto rojo
            const puntoRojo = document.getElementById('punto-rojo');
            if (puntoRojo) {
                puntoRojo.style.display = 'none';
            }
        };
    })
    .catch(error => {
        console.error('Error al cargar mensajes:', error);
        container.innerHTML = '<div style="color: red; padding: 10px;">Error al cargar mensajes.</div>';
    });
});
