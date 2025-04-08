const editar = document.getElementById('editar');
editar.addEventListener('click', function() {
    const nombreAnterior = prompt("Ingrese su nombre actual para confirmar el cambio:");

    if (!nombreAnterior) {
        e.preventDefault(); // Cancelar envío
        alert("Debes ingresar tu nombre actual para continuar.");
        return;
    }

    document.getElementById('nombreAnterior').value = nombreAnterior;
    window.location.href = 'index.html'
});

document.getElementById('editar')?.addEventListener('submit', (e) => handleRegistration(e, false));

