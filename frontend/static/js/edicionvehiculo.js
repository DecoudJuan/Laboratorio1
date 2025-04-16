function preventCaching() {
    // NO ALMACENA CACHÉ
    if (window.location.protocol != 'file:') {
        window.history.replaceState(null, document.title, window.location.href);
    }
}

preventCaching();

// Verificación inmediata de autenticación (se ejecuta al cargar el script)
function checkToken() {
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');

    // Si no hay token o usuario, redirigir al login
    if (!authToken || !currentUser) {
        window.location.replace('index.html');
        return;
    }
}

// Verificar autenticación cuando la página vuelve a estar activa
window.addEventListener('pageshow', (event) => {
    // Si la página se restaura desde el caché (botón atrás)
    if (event.persisted) {
        console.log('Página restaurada desde caché - verificando autenticación');
        checkToken();
    }
});

// También verificar cuando la página vuelve a estar visible
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('Página visible - verificando autenticación');
        checkToken();
    }
});

const API_BASE_URL = 'http://localhost:5000';

const addVehicleForm = document.getElementById('addVehicleForm');
const editVehicleForm = document.getElementById('editVehicleForm');

const vehicleForm = document.getElementById('vehicleForm');
const showAddVehicleBtn = document.getElementById('showAddVehicleBtn');
const showEditVehicleBtn = document.getElementById('showEditVehicleBtn');

const backTobackToVehicleOptionsFromAdd = document.getElementById('backTobackToVehicleOptionsFromAdd');
const backTobackToVehicleOptionsFromEdit = document.getElementById('backTobackToVehicleOptionsFromEdit');

const backTo = document.getElementById('backTo');

// Mostrar formularios
showAddVehicleBtn.addEventListener('click', function() {
    addVehicleForm.style.display = 'block';
    editVehicleForm.style.display = 'none';
    document.getElementById('vehicleForm').style.display = 'none';
});

showEditVehicleBtn.addEventListener('click', function() {
    addVehicleForm.style.display = 'none';
    editVehicleForm.style.display = 'block';
    document.getElementById('vehicleForm').style.display = 'none';
});

// Botones de volver (manteniendo tus IDs originales)
backTobackToVehicleOptionsFromAdd.addEventListener('click', function() {
    addVehicleForm.style.display = 'none';
    document.getElementById('vehicleForm').style.display = 'block';
    $('#vehicleForm').modal('show');
});

backTobackToVehicleOptionsFromEdit.addEventListener('click', function() {
    editVehicleForm.style.display = 'none';
    document.getElementById('vehicleForm').style.display = 'block';
    $('#vehicleForm').modal('show');
});

backTo.addEventListener('click', function() {
    window.location.href = 'principal.html';
});


// JavaScript corregido
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const editarBtn = document.getElementById('editar');
    
    // Solo usar uno de los dos métodos para enviar el formulario
    // Si tienes el botón editar, usa este código
    if (editarBtn) {
        editarBtn.addEventListener('click', function() {
            const patenteActual = prompt("Ingrese su patente actual para confirmar el cambio:");
            
            if (!patenteActual) {
                alert("Debes ingresar tu patente actual para continuar.");
                return;
            }
            
            document.getElementById('patenteActual').value = patenteActual;
            form.submit(); // Envía el formulario correctamente
        });
    }
    
    // CÓDIGO NUEVO PARA LOS SELECTORES DE MARCA Y MODELO
    // Cargar marcas al inicio
    loadBrands();
    
    // Configurar eventos para los selects
    const brandSelect = document.getElementById('brand');
    if (brandSelect) {
        brandSelect.addEventListener('change', function() {
            loadModels(this.value);
        });
    }
    
    const modelSelect = document.getElementById('model');
    if (modelSelect) {
        modelSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption && selectedOption.dataset.brandId) {
                const brandId = selectedOption.dataset.brandId;
                const brandSelect = document.getElementById('brand');
                if (brandSelect && brandSelect.value !== brandId) {
                    brandSelect.value = brandId;
                }
            }
        });
    }

    const patentInput = document.getElementById('patent');
    const errorMessage = document.getElementById('error-message');
    const countrySelect = document.getElementById('country');
    const detectedCountry = document.getElementById('detected-country');

    // Patrones por país
    const patterns = {
        argentina: {
            old: /^[A-Z]{3} \d{3}$/,
            new: /^[A-Z]{2} \d{3} [A-Z]{2}$/,
            name: "Argentina"
        },
        brasil: {
            old: /^[A-Z]{3}\d{4}$/,
            new: /^[A-Z]{3}\d[A-Z]\d{2}$/,
            name: "Brasil"
        },
        paraguay: {
            old: /^[A-Z]{4} \d{3}$/,
            new: /^[A-Z]{4} \d{3}$/,  // Mismo formato pero diferente tipo de placa
            name: "Paraguay"
        },
        uruguay: {
            old: /^[A-Z]{3} \d{4}$/,
            new: /^[A-Z]{3} \d{4}$/,  // Mismo formato pero diferente tipo de placa
            name: "Uruguay"
        },
        chile: {
            old: /^[A-Z]{2}-\d{4}$/,
            new: /^[A-Z]{4}-\d{2}$/,
            name: "Chile"
        },
        bolivia: {
            old: /^[A-Z]{3}-\d{3}$/,
            new: /^[A-Z]{2}-\d{2}-\d{3}$/,
            name: "Bolivia"
        },
        venezuela: {
            old: /^[A-Z]{2}\d{3}[A-Z]{2}$/,
            new: /^[A-Z]{3}\d{2}[A-Z]$/,
            name: "Venezuela"
        },
        colombia: {
            old: /^[A-Z]{3}\d{3}$/,
            new: /^[A-Z]{3}\d{2}[A-Z]$/,
            name: "Colombia"
        }
    };

    // Función para validar la patente según el país seleccionado
    function validatePatent(patent, country) {
        // Convertir a mayúsculas
        patent = patent.toUpperCase();
        
        // Si se seleccionó "Todos los países", verificar contra todos los patrones
        if (country === 'all') {
            for (const countryCode in patterns) {
                const countryPatterns = patterns[countryCode];
                if (countryPatterns.old.test(patent) || countryPatterns.new.test(patent)) {
                    detectedCountry.textContent = "Patente válida de " + countryPatterns.name;
                    return true;
                }
            }
            detectedCountry.textContent = "";
            return false;
        } else {
            // Verificar solo contra el patrón del país seleccionado
            const countryPatterns = patterns[country];
            const isValid = countryPatterns.old.test(patent) || countryPatterns.new.test(patent);
            
            if (isValid) {
                detectedCountry.textContent = "Patente válida de " + countryPatterns.name;
            } else {
                detectedCountry.textContent = "";
            }
            
            return isValid;
        }
    }

    // Validar al escribir
    patentInput.addEventListener('input', function() {
        const patent = this.value.trim();
        const country = countrySelect.value;
        
        if (patent && !validatePatent(patent, country)) {
            this.classList.add('error');
            errorMessage.style.display = 'block';
        } else {
            this.classList.remove('error');
            errorMessage.style.display = 'none';
        }
    });

    // Validar cuando cambie el país seleccionado
    countrySelect.addEventListener('change', function() {
        const patent = patentInput.value.trim();
        const country = this.value;
        
        if (patent) {
            if (!validatePatent(patent, country)) {
                patentInput.classList.add('error');
                errorMessage.style.display = 'block';
            } else {
                patentInput.classList.remove('error');
                errorMessage.style.display = 'none';
            }
        }
    });

    // Validar al enviar el formulario
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const patent = patentInput.value.trim();
        const country = countrySelect.value;
        
        if (!validatePatent(patent, country)) {
            patentInput.classList.add('error');
            errorMessage.style.display = 'block';
            alert('Formato de patente inválido para ' + (country === 'all' ? 'los países seleccionados' : patterns[country].name));
        } else {
            alert('Patente válida');
        }
    });

    // Convertir a mayúsculas automáticamente
    patentInput.addEventListener('blur', function() {
        this.value = this.value.toUpperCase();
    });

    
});

// Corrección para el JavaScript (edicionvehiculo.js)
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const patentInput = document.getElementById('patent');
    const countrySelect = document.getElementById('country');
    
    // Crear el elemento detected-country si no existe
    let detectedCountry = document.getElementById('detected-country');
    if (!detectedCountry) {
        detectedCountry = document.createElement('div');
        detectedCountry.id = 'detected-country';
        detectedCountry.className = 'message';
        
        // Insertar después del input de patente
        if (patentInput) {
            patentInput.parentNode.insertAdjacentElement('afterend', detectedCountry);
        }
    }
    
    // Crear el elemento para mensajes de error si no existe
    let errorMessage = document.getElementById('error-message');
    if (!errorMessage) {
        errorMessage = document.createElement('div');
        errorMessage.id = 'error-message';
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'Formato de patente inválido';
        errorMessage.style.display = 'none';
        errorMessage.style.color = 'red';
        
        // Insertar después del input de patente
        if (patentInput) {
            patentInput.parentNode.insertAdjacentElement('afterend', errorMessage);
        }
    }

    // Patrones por país
    const patterns = {
        argentina: {
            old: /^[A-Z]{3} \d{3}$/,
            new: /^[A-Z]{2} \d{3} [A-Z]{2}$/,
            name: "Argentina"
        },
        brasil: {
            old: /^[A-Z]{3}\d{4}$/,
            new: /^[A-Z]{3}\d[A-Z]\d{2}$/,
            name: "Brasil"
        },
        paraguay: {
            old: /^[A-Z]{4} \d{3}$/,
            new: /^[A-Z]{4} \d{3}$/,
            name: "Paraguay"
        },
        uruguay: {
            old: /^[A-Z]{3} \d{4}$/,
            new: /^[A-Z]{3} \d{4}$/,
            name: "Uruguay"
        },
        chile: {
            old: /^[A-Z]{2}-\d{4}$/,
            new: /^[A-Z]{4}-\d{2}$/,
            name: "Chile"
        },
        bolivia: {
            old: /^[A-Z]{3}-\d{3}$/,
            new: /^[A-Z]{2}-\d{2}-\d{3}$/,
            name: "Bolivia"
        },
        venezuela: {
            old: /^[A-Z]{2}\d{3}[A-Z]{2}$/,
            new: /^[A-Z]{3}\d{2}[A-Z]$/,
            name: "Venezuela"
        },
        colombia: {
            old: /^[A-Z]{3}\d{3}$/,
            new: /^[A-Z]{3}\d{2}[A-Z]$/,
            name: "Colombia"
        }
    };

    // Función para validar la patente según el país seleccionado
    function validatePatent(patent, country) {
        // Prevenir errores si no hay input o select
        if (!patent || !country) return false;
        
        // Convertir a mayúsculas
        patent = patent.toUpperCase();
        
        // Si se seleccionó "Todos los países", verificar contra todos los patrones
        if (country === 'all') {
            for (const countryCode in patterns) {
                const countryPatterns = patterns[countryCode];
                if (countryPatterns.old.test(patent) || countryPatterns.new.test(patent)) {
                    if (detectedCountry) {
                        detectedCountry.textContent = "Patente válida de " + countryPatterns.name;
                    }
                    return true;
                }
            }
            if (detectedCountry) {
                detectedCountry.textContent = "";
            }
            return false;
        } else {
            // Verificar solo contra el patrón del país seleccionado
            const countryPatterns = patterns[country];
            if (!countryPatterns) return false;
            
            const isValid = countryPatterns.old.test(patent) || countryPatterns.new.test(patent);
            
            if (detectedCountry) {
                if (isValid) {
                    detectedCountry.textContent = "Patente válida de " + countryPatterns.name;
                } else {
                    detectedCountry.textContent = "";
                }
            }
            
            return isValid;
        }
    }

    // Solo configurar eventos si los elementos existen
    if (patentInput && countrySelect) {
        // Validar al escribir
        patentInput.addEventListener('input', function() {
            const patent = this.value.trim();
            const country = countrySelect.value;
            
            if (patent && !validatePatent(patent, country)) {
                this.classList.add('error');
                if (errorMessage) errorMessage.style.display = 'block';
            } else {
                this.classList.remove('error');
                if (errorMessage) errorMessage.style.display = 'none';
            }
        });

        // Validar cuando cambie el país seleccionado
        countrySelect.addEventListener('change', function() {
            const patent = patentInput.value.trim();
            const country = this.value;
            
            if (patent) {
                if (!validatePatent(patent, country)) {
                    patentInput.classList.add('error');
                    if (errorMessage) errorMessage.style.display = 'block';
                } else {
                    patentInput.classList.remove('error');
                    if (errorMessage) errorMessage.style.display = 'none';
                }
            }
        });

        // Convertir a mayúsculas automáticamente
        patentInput.addEventListener('blur', function() {
            this.value = this.value.toUpperCase();
        });
    }
    
    // Validar al enviar el formulario (solo si el formulario existe)
    if (form) {
        form.addEventListener('submit', function(e) {
            if (patentInput && countrySelect) {
                const patent = patentInput.value.trim();
                const country = countrySelect.value;
                
                if (!validatePatent(patent, country)) {
                    e.preventDefault(); // Detener el envío
                    patentInput.classList.add('error');
                    if (errorMessage) errorMessage.style.display = 'block';
                    alert('Formato de patente inválido para ' + (country === 'all' ? 'los países seleccionados' : patterns[country].name));
                }
            }
        });
    }
});

// FUNCIONES NUEVAS PARA LOS SELECTORES DE MARCA Y MODELO
// Variable para almacenar los modelos ya cargados
let loadedModels = {};

// Función para cargar las marcas de autos
async function loadBrands() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/brands`);
        if (!response.ok) {
            throw new Error('Error al cargar las marcas');
        }
        
        const brands = await response.json();
        const brandSelect = document.getElementById('brand');
        
        if (brandSelect) {
            // Mantener la opción predeterminada si ya existe
            const defaultOption = brandSelect.querySelector('option[value=""]');
            brandSelect.innerHTML = '';
            
            if (defaultOption) {
                brandSelect.appendChild(defaultOption);
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Seleccione una marca';
                brandSelect.appendChild(option);
            }
            
            // Agregar las opciones de marca
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

// Función para cargar los modelos de una marca específica
async function loadModels(brandId) {
    const modelSelect = document.getElementById('model');
    
    if (!modelSelect) return;
    
    // Limpiar opciones actuales, manteniendo la opción predeterminada
    const defaultOption = modelSelect.querySelector('option[value=""]');
    modelSelect.innerHTML = '';
    
    if (defaultOption) {
        modelSelect.appendChild(defaultOption);
    } else {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Seleccione un modelo';
        modelSelect.appendChild(option);
    }
    
    if (!brandId) {
        modelSelect.disabled = true;
        return;
    }
    
    try {
        // Si ya tenemos los modelos cargados para esta marca, no hacemos otra petición
        if (!loadedModels[brandId]) {
            const response = await fetch(`${API_BASE_URL}/api/models/${brandId}`);
            if (!response.ok) {
                throw new Error('Error al cargar los modelos');
            }
            loadedModels[brandId] = await response.json();
        }
        
        // Habilitar y llenar el select de modelos
        modelSelect.disabled = false;
        loadedModels[brandId].forEach(model => {
            const option = document.createElement('option');
            option.value = model.model_id;
            option.textContent = model.model_name;
            option.dataset.brandId = brandId; // Guardar referencia a la marca
            modelSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar modelos:', error);
        modelSelect.disabled = true;
    }
}