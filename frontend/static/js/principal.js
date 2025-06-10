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
    localStorage.removeItem('userEmail');
    sessionStorage.removeItem('chatEmail');
    window.location.href = 'index.html';
});

function actualizarCampanita() {
    // Usar la nueva ruta para obtener mensajes no leídos
    fetch("http://localhost:5000/api/unread-messages", {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const mensajesNuevos = data.mensajes || [];
            const campanita = document.getElementById('notificaciones');
            
            if (mensajesNuevos.length > 0) {
                campanita.style.color = 'red';
                let puntoRojo = document.getElementById('punto-rojo');
                if (!puntoRojo) {
                    puntoRojo = document.createElement('div');
                    puntoRojo.id = 'punto-rojo';
                    puntoRojo.style.position = 'absolute';
                    puntoRojo.style.top = '-5px';
                    puntoRojo.style.right = '-5px';
                    puntoRojo.style.width = '10px';
                    puntoRojo.style.height = '10px';
                    puntoRojo.style.backgroundColor = 'red';
                    puntoRojo.style.borderRadius = '50%';
                    campanita.appendChild(puntoRojo);
                }
            } else {
                campanita.style.color = '';
                let puntoRojo = document.getElementById('punto-rojo');
                if (puntoRojo) {
                    puntoRojo.remove();
                }
            }
        }
    })
    .catch(error => console.error('Error al cargar mensajes no leídos:', error));
}

// Ejecutar la función de actualización cada segundo
setInterval(actualizarCampanita, 1000);

// Función para marcar mensajes como leídos (mejorada)
function marcarMensajesComoLeidos(mensajes) {
    // Separar mensajes por tipo
    const mensajesRegulares = mensajes.filter(msg => msg.tipo === 'mensaje').map(msg => msg.id);
    const complaints = mensajes.filter(msg => msg.tipo === 'complaint').map(msg => msg.id);
    
    const promises = [];
    
    // Solo hacer peticiones si hay mensajes de cada tipo
    if (mensajesRegulares.length > 0) {
        promises.push(
            fetch("http://localhost:5000/api/mark-messages-read", {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message_ids: mensajesRegulares
                })
            }).then(response => response.json())
        );
    }
    
    if (complaints.length > 0) {
        promises.push(
            fetch("http://localhost:5000/api/mark-complaints-read", {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    complaint_ids: complaints
                })
            }).then(response => response.json())
        );
    }
    
    return Promise.all(promises);
}

function mostrarMensajesEnContainer(mensajesNuevos, container, tildeBtn) {
    // Mostrar los mensajes
    mensajesNuevos.forEach(mensaje => {
        const msgContainer = document.createElement('div');
        msgContainer.style.padding = '8px';
        msgContainer.style.margin = '5px 0';
        msgContainer.style.borderBottom = '1px solid #eee';
        
        // Agregar indicador visual según el tipo
        if (mensaje.tipo === 'complaint') {
            msgContainer.style.borderLeft = '3px solid #dc3545'; // Rojo para complaints
        } else {
            msgContainer.style.borderLeft = '3px solid #007bff'; // Azul para mensajes regulares
        }

        const header = document.createElement('div');
        header.style.fontSize = '0.8em';
        header.style.color = '#666';
        
        // Agregar tipo de mensaje al header
        const tipoTexto = mensaje.tipo === 'complaint' ? '[COMPLAINT]' : '[MENSAJE]';
        header.textContent = `${tipoTexto} ${mensaje.usuario} - ${new Date(mensaje.fecha_creacion).toLocaleString()}`;
        msgContainer.appendChild(header);

        const content = document.createElement('div');
        content.style.marginTop = '3px';
        content.textContent = mensaje.contenido || mensaje.content || '[Sin contenido]';
        msgContainer.appendChild(content);
        
        // Agregar información adicional para complaints
        if (mensaje.tipo === 'complaint') {
            if (mensaje.sector) {
                const sector = document.createElement('div');
                sector.style.fontSize = '0.7em';
                sector.style.color = '#888';
                sector.textContent = `Sector: ${mensaje.sector}`;
                msgContainer.appendChild(sector);
            }
            
            const estado = document.createElement('div');
            estado.style.fontSize = '0.7em';
            estado.style.color = mensaje.solucionado ? '#28a745' : '#dc3545';
            estado.textContent = mensaje.solucionado ? 'Solucionado' : 'Pendiente';
            msgContainer.appendChild(estado);
        }

        container.appendChild(msgContainer);
    });

    // Configurar el botón de marcar como leído
    tildeBtn.onclick = () => {
        marcarMensajesComoLeidos(mensajesNuevos)
        .then(responses => {
            // Verificar si al menos una operación fue exitosa
            const algunoExitoso = responses.length === 0 || responses.some(response => response.success);
            
            if (algunoExitoso) {
                container.innerHTML = '<div style="text-align: center; padding: 10px;">No hay nuevos mensajes.</div>';
                
                // Ocultar el punto rojo
                const puntoRojo = document.getElementById('punto-rojo');
                if (puntoRojo) {
                    puntoRojo.remove();
                }
                
                // Actualizar el color de la campanita
                const campanita = document.getElementById('notificaciones');
                campanita.style.color = '';
            } else {
                alert('Error al marcar mensajes como leídos');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al marcar mensajes como leídos');
        });
    };
}

// Función principal de notificaciones
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
        width: '300px',
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

    container.appendChild(tildeBtn);

    const loadingMsg = document.createElement('div');
    loadingMsg.textContent = 'Cargando mensajes...';
    loadingMsg.style.textAlign = 'center';
    loadingMsg.style.padding = '10px';
    container.appendChild(loadingMsg);

    // Obtener mensajes no leídos (ahora incluye complaints)
    fetch("http://localhost:5000/api/unread-messages", {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        container.removeChild(loadingMsg);
        
        if (!data.success) {
            const errorMsg = document.createElement('div');
            errorMsg.textContent = 'Error al cargar mensajes.';
            errorMsg.style.color = 'red';
            errorMsg.style.padding = '10px';
            container.appendChild(errorMsg);
            return;
        }

        const mensajesNuevos = data.mensajes || [];

        if (mensajesNuevos.length === 0) {
            const vacio = document.createElement('div');
            vacio.textContent = 'No hay nuevos mensajes.';
            vacio.style.textAlign = 'center';
            vacio.style.padding = '10px';
            container.appendChild(vacio);
            
            // Ocultar el botón de marcar como leído si no hay mensajes
            tildeBtn.style.display = 'none';
            return;
        }

        // Usar la función mejorada para mostrar mensajes
        mostrarMensajesEnContainer(mensajesNuevos, container, tildeBtn);
    })
    .catch(error => {
        console.error('Error al cargar mensajes:', error);
        container.removeChild(loadingMsg);
        const errorMsg = document.createElement('div');
        errorMsg.textContent = 'Error al cargar mensajes.';
        errorMsg.style.color = 'red';
        errorMsg.style.padding = '10px';
        container.appendChild(errorMsg);
    });
});