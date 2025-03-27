document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".toggle-password").forEach(button => {
        button.addEventListener("click", function () {
            // Encuentra el contenedor del campo de contraseña
            let passwordContainer = this.closest('.password-field-container');
            
            // Verificación de error
            if (!passwordContainer) {
                console.error('No se encontró el contenedor de contraseña');
                return;
            }

            // Encuentra el input de contraseña dentro del contenedor
            let passwordInput = passwordContainer.querySelector('input');
            
            if (!passwordInput) {
                console.error('No se encontró el input de contraseña');
                return;
            }

            let icon = this.querySelector("i");

            if (!icon) {
                console.error('Icono no encontrado');
                return;
            }

            // Cambia el tipo de input
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                icon.classList.remove("bi-eye");
                icon.classList.add("bi-eye-slash");
            } else {
                passwordInput.type = "password";
                icon.classList.remove("bi-eye-slash");
                icon.classList.add("bi-eye");
            }
        });
    });
});
