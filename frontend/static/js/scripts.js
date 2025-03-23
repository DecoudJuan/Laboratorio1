//Ojo al lado de contraseña
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".toggle-password").forEach(button => {
        button.addEventListener("click", function () {
            let targetId = this.getAttribute("data-target");
            let passwordInput = document.getElementById(targetId);
            let icon = this.querySelector("i");

            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                icon.classList.replace("bi-eye", "bi-eye-slash");
            } else {
                passwordInput.type = "password";
                icon.classList.replace("bi-eye-slash", "bi-eye");
            }
        });
    });

});

