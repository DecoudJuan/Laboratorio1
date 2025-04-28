// Configuración global
const API_BASE_URL = 'http://localhost:5000';
let loadedModels = {};

function checkToken() {
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');

    console.log('Token de autenticación:', authToken); // Verifica el token
    console.log('Usuario actual:', currentUser); // Verifica el usuario

    if (!authToken || !currentUser) {
        console.error('No se encontró el token o el usuario actual');
        window.location.replace('index.html');
        return false;
    }
    return true;
}

// Patrones de validación de patentes por país
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

function validatePatent(patent, isEdit = false) {
    patent = patent.toUpperCase().replace(/\s|-/g, '');
    const prefix = isEdit ? 'edit-' : '';
    const errorMsg = document.getElementById(`${prefix}error-message`);
    const countryMsg = document.getElementById(`${prefix}detected-country`);

    for (const key in patterns) {
        const { old, new: nuevo, name } = patterns[key];
        if (old.test(patent)) {
            if (countryMsg) countryMsg.textContent = `Patente válida de ${name} (formato antiguo)`;
            if (errorMsg) errorMsg.style.display = 'none';
            return true;
        }
        if (nuevo.test(patent)) {
            if (countryMsg) countryMsg.textContent = `Patente válida de ${name} (formato nuevo)`;
            if (errorMsg) errorMsg.style.display = 'none';
            return true;
        }
    }

    if (countryMsg) countryMsg.textContent = '';
    if (errorMsg) errorMsg.style.display = 'block';
    return false;
}

// En tu función fetchWithAuth en edicionvehiculo.js
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('authToken'); // O donde almacenes el token
    
    if (!token) {
        console.error('No se encontró el token de autenticación');
        // Redirigir al login si no hay token
        window.location.href = '/index.html';
        return;
    }
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        credentials: 'include' // Para enviar cookies si las usas
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };
    
    try {
        const response = await fetch(url, mergedOptions);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error en la solicitud');
        }
        return await response.json();
    } catch (error) {
        console.error('Error de conexión:', error);
        throw error;
    }
}

async function loadBrands(isEdit = false) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/brands`);
        const brands = await response.json();
        const selector = isEdit ? 'editBrand' : 'brand';
        const brandSelect = document.getElementById(selector);

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

async function loadModels(brandId, isEdit = false) {
    const selector = isEdit ? 'editModel' : 'model';
    const modelSelect = document.getElementById(selector);
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

async function loadUserVehicles() {
    if (!checkToken()) return;
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || !currentUser.id) {
        console.error("No se encontró el usuario actual en localStorage o falta 'idUser'");
        alert("Error: no se pudo identificar al usuario. Por favor iniciá sesión nuevamente.");
        return;
    }
    
    console.log('URL de la API:', `${API_BASE_URL}/api/user-vehicles/${currentUser.id}`);
    console.log('currentUser:', currentUser);
    
    try {
        const data = await fetchWithAuth(`${API_BASE_URL}/api/user-vehicles/${currentUser.id}`);
        console.log('Datos recibidos de la API:', data);
        
        if (data.success) {
            displayVehicles(data.vehicles);
        } else {
            console.error('Error en respuesta:', data.message);
            alert('Error al cargar tus vehículos: ' + data.message);
        }
    } catch (error) {
        console.error('Error al procesar respuesta:', error);
        alert('Error al procesar datos de vehículos.');
    }
}

// Función para mostrar los vehículos en la tabla
function displayVehicles(vehicles) {
    const vehiclesTableBody = document.getElementById('vehiclesTableBody');
    const noVehiclesMessage = document.getElementById('noVehiclesMessage');
    
    console.log('Vehículos recibidos para mostrar:', vehicles); // Verificar los datos recibidos

    if (!vehiclesTableBody) {
        console.error('No se encontró el elemento con id "vehiclesTableBody"');
        return;
    }

    // Limpiar la tabla antes de agregar nuevos datos
    vehiclesTableBody.innerHTML = '';
    
    if (!vehicles || vehicles.length === 0) {
        console.log('No hay vehículos para mostrar.');
        if (noVehiclesMessage) noVehiclesMessage.style.display = 'block';
        return;
    }

    if (noVehiclesMessage) noVehiclesMessage.style.display = 'none';

    vehicles.forEach(vehicle => {
        console.log('Procesando vehículo:', vehicle); // Verificar cada vehículo

        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${vehicle.brand || 'N/A'}</td>
            <td>${vehicle.model || 'N/A'}</td>
            <td>${vehicle.idVehicle || 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-primary edit-vehicle" data-id="${vehicle.idVehicle}"
                    data-brand="${vehicle.brand || ''}" data-model="${vehicle.model || ''}" 
                    data-license="${vehicle.idVehicle || ''}">
                    <i class="bi bi-pencil"></i> Editar
                </button>
                <button class="btn btn-sm btn-danger delete-vehicle" data-id="${vehicle.idVehicle}"
                    data-brand="${vehicle.brand || ''}" data-model="${vehicle.model || ''}" 
                    data-license="${vehicle.idVehicle || ''}">
                    <i class="bi bi-trash"></i> Eliminar
                </button>
            </td>
        `;

        vehiclesTableBody.appendChild(row);
    });

    console.log('Vehículos mostrados en la tabla.'); // Confirmar que se completó el proceso
    attachVehicleButtonListeners();
}

function attachVehicleButtonListeners() {
    document.querySelectorAll('.edit-vehicle').forEach(button => {
        button.addEventListener('click', function() {
            const vehicleId = this.getAttribute('data-id');
            const idVehicle = this.getAttribute('data-license');
            const brand = this.getAttribute('data-brand');
            const model = this.getAttribute('data-model');
            openEditModal(vehicleId, idVehicle, brand, model);
        });
    });

    document.querySelectorAll('.delete-vehicle').forEach(button => {
        button.addEventListener('click', function() {
            const vehicleId = this.getAttribute('data-id');
            const idVehicle = this.getAttribute('data-license');
            const brand = this.getAttribute('data-brand');
            const model = this.getAttribute('data-model');
            openDeleteModal(vehicleId, idVehicle, brand, model);
        });
    });
}

async function openEditModal(idVehicle, brand, model) {
    document.getElementById('editVehicleId').value = vehicleId;
    document.getElementById('editPatent').value = idVehicle;

    await loadBrands(true);

    const brandSelect = document.getElementById('editBrand');
    let brandId = null;

    for (let i = 0; i < brandSelect.options.length; i++) {
        if (brandSelect.options[i].textContent === brand) {
            brandSelect.selectedIndex = i;
            brandId = brandSelect.options[i].value;
            break;
        }
    }

    if (brandId) {
        await loadModels(brandId, true);

        const modelSelect = document.getElementById('editModel');
        for (let i = 0; i < modelSelect.options.length; i++) {
            if (modelSelect.options[i].textContent === model) {
                modelSelect.selectedIndex = i;
                break;
            }
        }
    }

    const editVehicleModal = new bootstrap.Modal(document.getElementById('editVehicleModal'));
    editVehicleModal.show();
}

function openDeleteModal(idVehicle, brand, model) {
    document.getElementById('deleteVehicleId').value = vehicleId;
    document.getElementById('deleteVehicleDetails').innerHTML = `${brand} ${model} (${idVehicle})`;

    const deleteVehicleModal = new bootstrap.Modal(document.getElementById('deleteVehicleModal'));
    deleteVehicleModal.show();
}

// Inicialización y configuración de event listeners
document.addEventListener('DOMContentLoaded', () => {

    // Configurar listeners para cambios de visibilidad
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) checkToken();
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkToken();
    });

    // Configurar elementos de UI y listeners
    setupUIElements();
    setupFormListeners();
    setupModalListeners();
    
    // Cargar datos iniciales
    if (document.getElementById('VehicleForm')) {
        loadUserVehicles();
    }
    
    loadBrands();

});

function setupUIElements() {
    const addVehicleBtn = document.getElementById('showAddVehicleBtn');
    const editVehicleBtn = document.getElementById('showEditVehicleBtn');
    const backToVehicleOptionsFromAdd = document.getElementById('backTobackToVehicleOptionsFromAdd');
    
    if (addVehicleBtn) {
        addVehicleBtn.addEventListener('click', () => {
            document.getElementById('addVehicleForm').style.display = 'block';
            document.getElementById('VehicleForm').style.display = 'none';
        });
    }
    
    if (editVehicleBtn) {
        editVehicleBtn.addEventListener('click', () => {
            document.getElementById('addVehicleForm').style.display = 'none';
            document.getElementById('VehicleForm').style.display = 'block';
        });
    }
    
    if (backToVehicleOptionsFromAdd) {
        backToVehicleOptionsFromAdd.addEventListener('click', () => {
            document.getElementById('addVehicleForm').style.display = 'none';
            document.getElementById('VehicleForm').style.display = 'block';
        });
    }
    
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'principal.html';
        });
    }
}

function setupFormListeners() {
    // Configurar validación para input de patente
    const patentInput = document.getElementById('patent');
    if (patentInput) {
        if (!document.getElementById('detected-country')) {
            const detectedCountry = document.createElement('div');
            detectedCountry.id = 'detected-country';
            detectedCountry.className = 'message';
            patentInput.parentNode.insertAdjacentElement('afterend', detectedCountry);
        }
        
        if (!document.getElementById('error-message')) {
            const errorMessage = document.createElement('div');
            errorMessage.id = 'error-message';
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Formato de patente inválido';
            errorMessage.style.display = 'none';
            errorMessage.style.color = 'red';
            patentInput.parentNode.insertAdjacentElement('afterend', errorMessage);
        }
        
        patentInput.addEventListener('input', () => validatePatent(patentInput.value.trim()));
        patentInput.addEventListener('blur', function() {
            this.value = this.value.toUpperCase();
        });
    }
    
    // Configurar event listeners para cambios de marca
    const brandSelect = document.getElementById('brand');
    if (brandSelect) {
        brandSelect.addEventListener('change', function() {
            loadModels(this.value);
        });
    }
    
    // Configurar event listeners para cambios de modelo
    const modelSelect = document.getElementById('model');
    if (modelSelect) {
        modelSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption && selectedOption.dataset.brandId) {
                const brandId = selectedOption.dataset.brandId;
                if (brandSelect && brandSelect.value !== brandId) {
                    brandSelect.value = brandId;
                }
            }
        });
    }
    
    // Configurar formulario de añadir vehículo
    const addVehicleForm = document.getElementById('addVehicle');
    if (addVehicleForm) {
        addVehicleForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const patent = patentInput.value.trim().toUpperCase();
            const brandId = document.getElementById('brand').value;
            const modelId = document.getElementById('model').value;
            
            if (!validatePatent(patent)) {
                alert('Formato de patente inválido. No se reconoce el país.');
                return;
            }
            
            try {
                const data = await fetchWithAuth(`${API_BASE_URL}/api/register_vehicle`, {
                    method: 'POST',
                    body: JSON.stringify({ 
                        patent, 
                        brand: brandId, 
                        model: modelId 
                    })
                });
                
                // data ya es el objeto JSON procesado
                alert(data.message || 'Vehículo registrado exitosamente.');
                addVehicleForm.reset();
                loadUserVehicles();
            } catch (error) {
                alert(error.message || 'Error al registrar el vehículo.');
                console.error('Error:', error);
            }
        });
    }
}

function setupModalListeners() {
    // Configurar event listeners para el modal de edición
    const editBrandSelect = document.getElementById('editBrand');
    if (editBrandSelect) {
        editBrandSelect.addEventListener('change', function() {
            loadModels(this.value, true);
        });
    }
    
    const editPatentInput = document.getElementById('editPatent');
    if (editPatentInput) {
        editPatentInput.addEventListener('input', function() {
            validatePatent(this.value.trim(), true);
        });
        
        editPatentInput.addEventListener('blur', function() {
            this.value = this.value.toUpperCase();
        });
    }
    
    const editVehicleForm = document.getElementById('editVehicleFormModal');
    if (editVehicleForm) {
        editVehicleForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const vehicleId = document.getElementById('editVehicleId').value;
            const patent = document.getElementById('editPatent').value.trim().toUpperCase();
            const brandId = document.getElementById('editBrand').value;
            const modelId = document.getElementById('editModel').value;
            
            if (!validatePatent(patent, true)) {
                alert('Formato de patente inválido. No se reconoce el país.');
                return;
            }
            
            const response = await fetchWithAuth(`${API_BASE_URL}/api/vehicles/${vehicleId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    idVehicle: patent,
                    brand: brandId,
                    model: modelId
                })
            });
            
            if (!response) return;
            
            try {
                const data = await response.json();
                if (data.success) {
                    alert('Vehículo actualizado correctamente.');
                     loadUserVehicles();
                } else {
                    alert(data.message || 'Error al actualizar el vehículo.');
                }
            } catch (error) {
                console.error('Error al procesar respuesta:', error);
                alert('Error al procesar la respuesta del servidor.');
            }
        });
    }
    
    // Configurar event listener para eliminación de vehículo
    const confirmDeleteBtn = document.getElementById('confirmDeleteVehicle');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async function() {
            const vehicleId = document.getElementById('deleteVehicleId').value;

            
            const response = await fetchWithAuth(`${API_BASE_URL}/api/vehicles/${vehicleId}`, {
                method: 'DELETE'
            });
            
            if (!response) return;
            
            try {
                const data = await response.json();
                if (data.success) {
                    alert('Vehículo eliminado correctamente.');
                    bootstrap.Modal.getInstance(document.getElementById('deleteVehicleModal')).hide();
                    loadUserVehicles();
                } else {
                    alert(data.message || 'Error al eliminar el vehículo.');
                }
            } catch (error) {
                console.error('Error al procesar respuesta:', error);
                alert('Error al procesar la respuesta del servidor.');
            }
        });
    }
}

document.getElementById('logoutBtn').addEventListener('click', function() {
    // Eliminar token y datos de usuario del localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    // Redireccionar a la página de inicio de sesión
    window.location.href = 'index.html';
});