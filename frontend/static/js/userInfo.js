document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("authToken");
  
    if (!token) {
      console.error("No hay token de autenticación");
      return;
    }
  
    fetch("http://127.0.0.1:5000/api/user_info", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al obtener los datos del usuario");
        }
        return response.json();
      })
      .then((data) => {
        document.getElementById("nombre").textContent = data.nombre || "-";
        document.getElementById("apellido").textContent = data.apellido || "-";
        document.getElementById("vehiculo_principal").textContent = data.vehiculo_principal || "-";
  
        if (data.vehiculos_secundarios && data.vehiculos_secundarios.length > 0) {
          document.getElementById("vehiculos_secundarios").textContent = data.vehiculos_secundarios.join(", ");
        } else {
          document.getElementById("vehiculos_secundarios").textContent = "Ninguno";
        }
      })
      .catch((error) => {
        console.error(error);
        const msg = document.getElementById("error-msg");
        if (msg) {
          msg.classList.remove("d-none");
        }
      });
  });
  