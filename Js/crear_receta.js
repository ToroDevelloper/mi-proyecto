async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add('was-validated');
        return;
    }

    try {
        // Obtener el token
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        const recipeData = {
            nombre_receta: document.getElementById('nombreReceta').value,
            categoria: document.getElementById('categoriaReceta').value,
            tiempo: document.getElementById('tiempoPreparacion').value,
            ingredientes: document.getElementById('ingredientes').value,
            pasos: document.getElementById('pasos').value,
            imagen_url: document.getElementById('imagenUrl').value || 'https://via.placeholder.com/300',
            informacion_nutricional: document.getElementById('infoNutricional').value || ''
        };
        
        // Mostrar indicador de carga
        Swal.fire({
            title: 'Guardando receta...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch('http://localhost:3000/add-recipe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token, // Asegúrate de enviar el token correctamente
                'Accept': 'application/json'
            },
            body: JSON.stringify(recipeData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar la receta');
        }

        // Receta guardada exitosamente
        await Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Receta guardada correctamente',
            showConfirmButton: true,
            confirmButtonText: 'Ver mis recetas'
        });

        // Redirigir al perfil donde se muestran las recetas
        window.location.href = 'perfil.html';

    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'No se pudo guardar la receta. Por favor, intenta nuevamente.',
            confirmButtonColor: '#1976D2'
        });
    }
}

// Asegurarnos que el nombre de usuario se muestre correctamente
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    
    if (!token || !userName) {
        mostrarMensajeNoSesion();
        return;
    }

    // Verificar si el contenedor del formulario existe
    const recipeForm = document.querySelector('.recipe-form-container');
    if (!recipeForm) {
        console.error('No se encontró el contenedor del formulario');
        return;
    }

    // Actualizar el contenido del formulario
    recipeForm.innerHTML = `
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <div class="card recipe-card">
                        <div class="card-header">
                            <h3 class="card-title mb-0">
                                <i class="fas fa-utensils me-2"></i>Nueva Receta
                            </h3>
                        </div>
                        <div class="card-body">
                            <div class="user-info mb-4">
                                <h5 class="text-muted">
                                    <i class="fas fa-user me-2"></i>Creando receta como: 
                                    <span id="nombreUsuario" class="text-primary">${userName}</span>
                                </h5>
                            </div>
                            <form id="nuevaRecetaForm" class="recipe-form needs-validation" novalidate>
                                <div class="row">
                                    <div class="col-md-8 mb-3">
                                        <label for="nombreReceta" class="form-label">
                                            <i class="fas fa-pencil-alt me-2"></i>Nombre de la Receta
                                        </label>
                                        <input type="text" class="form-control" id="nombreReceta" name="nombreReceta" required>
                                        <div class="invalid-feedback">Por favor ingresa un nombre para la receta.</div>
                                    </div>

                                    <div class="col-md-4 mb-3">
                                        <label for="categoriaReceta" class="form-label">
                                            <i class="fas fa-tags me-2"></i>Categoría
                                        </label>
                                        <select class="form-select" id="categoriaReceta" name="categoriaReceta" required>
                                            <option value="">Selecciona...</option>
                                            <option value="desayunos">Desayunos</option>
                                            <option value="comidas">Comidas</option>
                                            <option value="postres">Postres</option>
                                            <option value="bebidas">Bebidas</option>
                                        </select>
                                        <div class="invalid-feedback">Por favor selecciona una categoría.</div>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label for="tiempoPreparacion" class="form-label">
                                        <i class="fas fa-clock me-2"></i>Tiempo de Preparación (minutos)
                                    </label>
                                    <input type="number" class="form-control" id="tiempoPreparacion" name="tiempoPreparacion" min="1" required placeholder="Ej: 30">
                                    <div class="invalid-feedback">Por favor ingresa el tiempo de preparación.</div>
                                </div>

                                <div class="mb-3">
                                    <label for="ingredientes" class="form-label">
                                        <i class="fas fa-list-ul me-2"></i>Ingredientes
                                    </label>
                                    <textarea class="form-control" id="ingredientes" name="ingredientes" rows="4" required 
                                        placeholder="Escribe cada ingrediente en una nueva línea"></textarea>
                                    <div class="invalid-feedback">Por favor ingresa los ingredientes.</div>
                                </div>

                                <div class="mb-3">
                                    <label for="pasos" class="form-label">
                                        <i class="fas fa-tasks me-2"></i>Pasos de Preparación
                                    </label>
                                    <textarea class="form-control" id="pasos" name="pasos" rows="4" required 
                                        placeholder="Escribe cada paso en una nueva línea"></textarea>
                                    <div class="invalid-feedback">Por favor ingresa los pasos de preparación.</div>
                                </div>

                                <div class="mb-3">
                                    <label for="imagenUrl" class="form-label">
                                        <i class="fas fa-image me-2"></i>URL de la Imagen
                                    </label>
                                    <input type="url" class="form-control" id="imagenUrl" name="imagenUrl" 
                                        placeholder="https://ejemplo.com/imagen.jpg">
                                    <small class="text-muted">Si no proporcionas una imagen, se usará una por defecto.</small>
                                </div>

                                <div class="mb-3">
                                    <label for="infoNutricional" class="form-label">
                                        <i class="fas fa-heart me-2"></i>Información Nutricional (opcional)
                                    </label>
                                    <textarea class="form-control" id="infoNutricional" name="infoNutricional" rows="3" 
                                        placeholder="Calorías, proteínas, etc."></textarea>
                                </div>

                                <div class="form-buttons">
                                    <button type="submit" class="btn btn-primary btn-lg">
                                        <i class="fas fa-save me-2"></i>Guardar Receta
                                    </button>
                                    <a href="index.html" class="btn btn-secondary btn-lg ms-2">
                                        <i class="fas fa-times me-2"></i>Cancelar
                                    </a>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Mostrar el formulario
    recipeForm.style.display = 'block';

    // Actualizar el nombre de usuario en el formulario
    const nombreUsuarioSpan = document.getElementById('nombreUsuario');
    if (nombreUsuarioSpan) {
        nombreUsuarioSpan.textContent = userName;
    }

    // Configurar la vista previa de imagen
    const imagenUrlInput = document.getElementById('imagenUrl');
    const imagenPreview = document.getElementById('imagenPreview');
    
    if (imagenUrlInput && imagenPreview) {
        imagenUrlInput.addEventListener('input', function() {
            const url = this.value;
            if (url) {
                imagenPreview.src = url;
                imagenPreview.style.display = 'block';
            } else {
                imagenPreview.style.display = 'none';
            }
        });
    }

    // Manejar el envío del formulario
    const form = document.getElementById('nuevaRecetaForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
});

function mostrarMensajeNoSesion() {
    Swal.fire({
        title: 'Sesión no iniciada',
        text: 'Por favor, inicia sesión para crear una receta',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Ir a login',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = 'iniciar_sesion.html';
        } else {
            window.location.href = 'index.html';
        }
    });
}