// Evita caché en navegadores modernos
function preventCaching() {
    if (window.location.protocol !== 'file:') {
        window.history.replaceState(null, document.title, window.location.href);
    }
}

preventCaching();

// Verifica autenticación
function checkToken() {
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');
    if (!authToken || !currentUser) {
        window.location.replace('index.html');
    }
}

window.addEventListener('pageshow', (event) => {
    if (event.persisted) checkToken();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkToken();
});

const API_BASE_URL = 'http://localhost:5000';

// Mostrar y ocultar formularios
const addVehicleForm = document.getElementById('addVehicleForm');
const editVehicleForm = document.getElementById('editVehicleForm');
const vehicleForm = document.getElementById('vehicleForm');

document.getElementById('showAddVehicleBtn').addEventListener('click', () => {
    addVehicleForm.style.display = 'block';
    editVehicleForm.style.display = 'none';
    vehicleForm.style.display = 'none';
});

document.getElementById('showEditVehicleBtn').addEventListener('click', () => {
    addVehicleForm.style.display = 'none';
    editVehicleForm.style.display = 'block';
    vehicleForm.style.display = 'none';
});

document.getElementById('backTobackToVehicleOptionsFromAdd').addEventListener('click', () => {
    addVehicleForm.style.display = 'none';
    vehicleForm.style.display = 'block';
    $('#vehicleForm').modal('show');
});

document.getElementById('backTobackToVehicleOptionsFromEdit').addEventListener('click', () => {
    editVehicleForm.style.display = 'none';
    vehicleForm.style.display = 'block';
    $('#vehicleForm').modal('show');
});

document.getElementById('backTo').addEventListener('click', () => {
    window.location.href = 'principal.html';
});

// Marcas y modelos
let loadedModels = {};

async function loadBrands() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/brands`);
        const brands = await response.json();
        const brandSelect = document.getElementById('brand');

        if (brandSelect) {
            brandSelect.innerHTML = '<option value="">Seleccione una marca</option>';
            brands.forEach(brand => {
                const option = document.createElement('option');
                option.value = brand.brand_id;
                option.textContent = brand.brand_name;
                brandSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar marcas:', error);
    }
}

async function loadModels(brandId) {
    const modelSelect = document.getElementById('model');
    if (!modelSelect) return;

    modelSelect.innerHTML = '<option value="">Seleccione un modelo</option>';
    if (!brandId) {
        modelSelect.disabled = true;
        return;
    }

    try {
        if (!loadedModels[brandId]) {
            const response = await fetch(`${API_BASE_URL}/api/models/${brandId}`);
            loadedModels[brandId] = await response.json();
        }
        modelSelect.disabled = false;
        loadedModels[brandId].forEach(model => {
            const option = document.createElement('option');
            option.value = model.model_id;
            option.textContent = model.model_name;
            option.dataset.brandId = brandId;
            modelSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar modelos:', error);
        modelSelect.disabled = true;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addVehicle');
    const patentInput = document.getElementById('patent');
    let detectedCountry = document.getElementById('detected-country');
    let errorMessage = document.getElementById('error-message');

    if (!detectedCountry && patentInput) {
        detectedCountry = document.createElement('div');
        detectedCountry.id = 'detected-country';
        detectedCountry.className = 'message';
        patentInput.parentNode.insertAdjacentElement('afterend', detectedCountry);
    }

    if (!errorMessage && patentInput) {
        errorMessage = document.createElement('div');
        errorMessage.id = 'error-message';
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'Formato de patente inválido';
        errorMessage.style.display = 'none';
        errorMessage.style.color = 'red';
        patentInput.parentNode.insertAdjacentElement('afterend', errorMessage);
    }

    const patterns = {
        argentina: { old: /^[A-Z]{3}\d{3}$/, new: /^[A-Z]{2}\d{3}[A-Z]{2}$/, name: "Argentina" },
        brasil:    { old: /^[A-Z]{3}\d{4}$/, new: /^[A-Z]{3}\d[A-Z]\d{2}$/, name: "Brasil" },
        paraguay:  { old: /^[A-Z]{4}\d{3}$/, new: /^[A-Z]{4}\d{3}$/, name: "Paraguay" },
        uruguay:   { old: /^[A-Z]{3}\d{4}$/, new: /^[A-Z]{3}\d{4}$/, name: "Uruguay" },
        chile:     { old: /^[A-Z]{2}\d{4}$/, new: /^[A-Z]{4}\d{2}$/, name: "Chile" },
        bolivia:   { old: /^[A-Z]{3}\d{3}$/, new: /^[A-Z]{2}\d{2}\d{3}$/, name: "Bolivia" },
        venezuela: { old: /^[A-Z]{2}\d{3}[A-Z]{2}$/, new: /^[A-Z]{3}\d{2}[A-Z]$/, name: "Venezuela" },
        colombia:  { old: /^[A-Z]{3}\d{3}$/, new: /^[A-Z]{3}\d{2}[A-Z]$/, name: "Colombia" }
    };

    function validatePatent(patent) {
        patent = patent.toUpperCase().replace(/\s|-/g, '');
        for (const key in patterns) {
            const { old, new: nuevo, name } = patterns[key];
            if (old.test(patent) || nuevo.test(patent)) {
                if (detectedCountry) detectedCountry.textContent = `Patente válida de ${name}`;
                if (errorMessage) errorMessage.style.display = 'none';
                return true;
            }
        }
        if (detectedCountry) detectedCountry.textContent = '';
        if (errorMessage) errorMessage.style.display = 'block';
        return false;
    }

    loadBrands();

    const brandSelect = document.getElementById('brand');
    if (brandSelect) {
        brandSelect.addEventListener('change', function () {
            loadModels(this.value);
        });
    }

    const modelSelect = document.getElementById('model');
    if (modelSelect) {
        modelSelect.addEventListener('change', function () {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption && selectedOption.dataset.brandId) {
                const brandId = selectedOption.dataset.brandId;
                if (brandSelect && brandSelect.value !== brandId) {
                    brandSelect.value = brandId;
                }
            }
        });
    }

    if (patentInput) {
        patentInput.addEventListener('input', () => {
            const patent = patentInput.value.trim();
            validatePatent(patent);
        });

        patentInput.addEventListener('blur', function () {
            this.value = this.value.toUpperCase();
        });
    }

    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const patent = patentInput.value.trim().toUpperCase();
            const brandId = document.getElementById('brand').value;
            const modelId = document.getElementById('model').value;
    
            if (!validatePatent(patent)) {
                alert('Formato de patente inválido. No se reconoce el país.');
                return;
            }
    
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                alert('Debes iniciar sesión para registrar un vehículo.');
                window.location.replace('index.html');
                return;
            }
    
            console.log('Token usado:', authToken); // Para debugging
    
            try {
                const response = await fetch(`${API_BASE_URL}/api/register_vehicle`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ 
                        patent, 
                        brand: brandId, 
                        model: modelId 
                    }),
                });
    
                console.log('Respuesta status:', response.status);
                
                if (response.status === 401) {
                    console.error('Error de autenticación. Detalles:', await response.text());
                    alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('currentUser');
                    window.location.replace('index.html');
                    return;
                }
    
                const data = await response.json();
                if (response.ok) {
                    alert(data.message || 'Vehículo registrado exitosamente.');
                    form.reset();
                    // Opcional: redirigir a alguna página de confirmación
                    // window.location.href = 'misvehiculos.html';
                } else {
                    console.error('Error del servidor:', data);
                    alert(data.message || 'Error al registrar el vehículo.');
                }
            } catch (error) {
                console.error('Error de conexión:', error);
                alert('Error de conexión al registrar el vehículo. Verifica tu conexión a Internet.');
            }
        });
    }

});
