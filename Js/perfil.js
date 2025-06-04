// Al inicio del archivo
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Verificar el token antes de cargar datos
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        // Verificar si el token es válido
        const response = await fetch('http://localhost:3000/verify-token', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Token inválido');
        }

        // Si el token es válido, inicializar la página
        await initializeProfile();

    } catch (error) {
        console.error('Error de autenticación:', error);
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
});

        function initializeProfile() {
            // Cargar datos iniciales
            loadUserData();
            loadUserRecipes();

            // Event listeners para los botones principales
            setupEventListeners();
        }

        function setupEventListeners() {
            // Botones de perfil
            setupProfileButtons();
            // Botones de recetas
            setupRecipeButtons();
            // Manejo de fotos
            setupPhotoHandlers();
            // Cerrar sesión
            setupLogoutButton();
        }

        // Función que faltaba y causaba el error
        function setupPhotoHandlers() {
            const changePhotoBtn = document.getElementById('changePhotoBtn');
            const viewPhotoBtn = document.getElementById('viewPhotoBtn');
            const photoInput = document.getElementById('photoInput');

            if (changePhotoBtn) {
                changePhotoBtn.addEventListener('click', () => photoInput.click());
            }

            if (viewPhotoBtn) {
                viewPhotoBtn.addEventListener('click', () => {
                    const imgSrc = document.getElementById('profileImage').src;
                    window.open(imgSrc, '_blank');
                });
            }

            if (photoInput) {
                photoInput.addEventListener('change', async function(e) {
                    const file = e.target.files[0];
                    if (!file) return;

                    // Validaciones
                    if (!file.type.startsWith('image/')) {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Por favor selecciona una imagen'
                        });
                        return;
                    }

                    if (file.size > 5 * 1024 * 1024) {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'La imagen es demasiado grande. Máximo 5MB'
                        });
                        return;
                    }

                    try {
                        // Mostrar loading mientras se sube la imagen
                        await Swal.fire({
                            title: 'Subiendo imagen...',
                            text: 'Por favor espere',
                            timer: 5000,
                            timerProgressBar: true,
                            didOpen: () => {
                                Swal.showLoading();
                            }
                        });

                        const formData = new FormData();
                        formData.append('photo', file);

                        const response = await fetch('http://localhost:3000/update-profile-photo', {
                            method: 'POST',
                            headers: {
                                'Authorization': localStorage.getItem('token')
                            },
                            body: formData
                        });

                        if (!response.ok) {
                            throw new Error('Error al actualizar la foto');
                        }

                        const data = await response.json();
                        
                        // Actualizar la imagen
                        document.getElementById('profileImage').src = `http://localhost:3000${data.photoUrl}`;

                        // Mostrar mensaje de éxito que permanecerá hasta que el usuario haga clic en Aceptar
                       
                    } catch (error) {
                        console.error('Error:', error);
                        return Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Error al actualizar la foto de perfil',
                            confirmButtonText: 'Aceptar',
                            confirmButtonColor: '#dc3545',
                            allowOutsideClick: false,
                            allowEscapeKey: false
                        });
                    }
                });
            }
        }

        // Funciones auxiliares para organizar mejor el código
        function setupProfileButtons() {
            const guardarDatosBasicos = document.getElementById('guardarDatosBasicos');
            if (guardarDatosBasicos) {
                guardarDatosBasicos.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await updateUserProfile();
                });
            }

            const guardarPassword = document.getElementById('guardarPassword');
            if (guardarPassword) {
                guardarPassword.addEventListener('click', async function(e) {
                    e.preventDefault(); // Prevenir el comportamiento por defecto
                    await updatePassword();
                });
            }

            const eliminarCuenta = document.getElementById('eliminarCuenta');
            if (eliminarCuenta) {
                eliminarCuenta.addEventListener('click', deleteAccount);
            }
        }

        function setupRecipeButtons() {
            const guardarReceta = document.getElementById('guardarReceta');
            if (guardarReceta) {
                guardarReceta.addEventListener('click', saveRecipe);
            }

            const guardarEdicionReceta = document.getElementById('guardarEdicionReceta');
            if (guardarEdicionReceta) {
                guardarEdicionReceta.addEventListener('click', updateRecipe);
            }
        }

        function setupLogoutButton() {
            const cerrarSesion = document.getElementById('cerrarSesion');
            if (cerrarSesion) {
                cerrarSesion.addEventListener('click', async function(e) {
                    e.preventDefault();
                    
                    const result = await Swal.fire({
                        title: '¿Cerrar sesión?',
                        text: "¿Estás seguro que deseas salir?",
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Sí, cerrar sesión',
                        cancelButtonText: 'Cancelar'
                    });

                    if (result.isConfirmed) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('nombre');
                        
                        await Swal.fire({
                            title: '¡Sesión cerrada!',
                            text: 'Has cerrado sesión correctamente',
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        
                        window.location.href = 'index.html';
                    }
                });
            }
        }
    


        // Función para cargar datos del usuario
        async function loadUserData() {
            try {
                const response = await fetch('http://localhost:3000/profile', {
                    headers: {
                        'Authorization': localStorage.getItem('token')
                    }
                });

                if (!response.ok) {
                    throw new Error('Error al cargar datos del usuario');
                }

                const data = await response.json();
                
                // Actualizar la imagen de perfil
                const profileImage = document.getElementById('profileImage');
                if (data.user.foto_url) {
                    profileImage.src = `http://localhost:3000${data.user.foto_url}`;
                } else {
                    // Usar una imagen por defecto más confiable
                    profileImage.src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
                }

                // Actualizar el resto de datos
                document.getElementById('user-name').textContent = data.user.nombre;
                document.getElementById('user-email').textContent = data.user.email;
                document.getElementById('user-join-date').textContent = new Date(data.user.fecha_registro).toLocaleDateString();
            } catch (error) {
                console.error('Error:', error);
                alert('Error al cargar los datos del usuario');
            }
        }

        // Función para cargar recetas del usuario
        async function loadUserRecipes() {
            try {
                const response = await fetch('http://localhost:3000/user-recipes', {
                    headers: {
                        'Authorization': localStorage.getItem('token')
                    }
                });

                if (!response.ok) {
                    throw new Error('Error al cargar recetas');
                }

                const recipes = await response.json();
                const recipesContainer = document.getElementById('user-recipes');
                
                if (recipes.length === 0) {
                    recipesContainer.innerHTML = `
                        <div class="col-12 text-center py-4">
                            <i class="fas fa-book fa-3x text-muted mb-3"></i>
                            <p class="text-muted">Aún no has publicado ninguna receta</p>
                            <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#nuevaRecetaModal">
                                <i class="fas fa-plus me-1"></i>Crear mi primera receta
                            </button>
                        </div>`;
                    return;
                }

                recipesContainer.innerHTML = recipes.map(recipe => `
                    <div class="col-md-6 mb-3">
                        <div class="card recipe-card h-100 shadow-sm">
                            <img src="${recipe.imagen_url || 'https://placehold.co/300'}" 
                                 class="card-img-top" alt="${recipe.nombre_receta}"
                                 style="height: 200px; object-fit: cover;">
                            <div class="card-body">
                                <h5 class="card-title">${recipe.nombre_receta}</h5>
                                <p class="card-text text-muted">
                                    <i class="fas fa-clock me-1"></i>${recipe.tiempo} minutos
                                </p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge bg-primary">${recipe.categoria}</span>
                                    <div>
                                        <button class="btn btn-sm btn-outline-primary me-1" 
                                                onclick="editRecipe(${recipe.id})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger"
                                                onclick="deleteRecipe(${recipe.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');

            } catch (error) {
                console.error('Error:', error);
                document.getElementById('user-recipes').innerHTML = `
                    <div class="col-12 text-center py-4">
                        <div class="alert alert-danger">Error al cargar las recetas</div>
                    </div>`;
            }
        }
 
        // Función para actualizar el perfil del usuario
        async function updateUserProfile() {
            try {
                const nombre = document.getElementById('editNombre').value;
                const email = document.getElementById('editEmail').value;

                if (!nombre || !email) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Por favor complete todos los campos'
                    });
                    return;
                }

                const response = await fetch('http://localhost:3000/update-profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': localStorage.getItem('token')
                    },
                    body: JSON.stringify({ nombre, email })
                });

                if (!response.ok) {
                    throw new Error('Error al actualizar el perfil');
                }

                const data = await response.json();

                // Actualizar localStorage y UI
                localStorage.setItem('userName', nombre);
                document.getElementById('user-name').textContent = nombre;
                document.getElementById('user-email').textContent = email;
                
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editarPerfilModal'));
                modal.hide();
                
                // Mostrar mensaje de éxito
                await Swal.fire({
                    icon: 'success',
                    title: '¡Perfil actualizado!',
                    text: 'Los cambios se han guardado correctamente'
                });

                // Recargar los datos del usuario
                await loadUserData();

            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo actualizar el perfil'
                });
            }
        }

        // Función para editar receta
        async function editRecipe(recipeId) {
            try {
                const response = await fetch(`http://localhost:3000/recipe/${recipeId}`, {
                    headers: {
                        'Authorization': localStorage.getItem('token')
                    }
                });

                if (!response.ok) {
                    throw new Error('Error al cargar la receta');
                }

                const recipe = await response.json();

                // Llenar el formulario con los datos de la receta
                document.getElementById('editRecipeId').value = recipe.id;
                document.getElementById('editNombreReceta').value = recipe.nombre_receta;
                document.getElementById('editCategoriaReceta').value = recipe.categoria;
                document.getElementById('editTiempoPreparacion').value = recipe.tiempo;
                document.getElementById('editIngredientes').value = recipe.ingredientes;
                document.getElementById('editPasos').value = recipe.pasos;
                document.getElementById('editImagenUrl').value = recipe.imagen_url;
                document.getElementById('editInfoNutricional').value = recipe.informacion_nutricional;

                // Abrir el modal
                const editarRecetaModal = new bootstrap.Modal(document.getElementById('editarRecetaModal'));
                editarRecetaModal.show();

            } catch (error) {
                console.error('Error:', error);
                alert('Error al cargar la receta para editar');
            }
        }

        // Función para actualizar receta
        async function updateRecipe() {
            try {
                // Validar campos requeridos
                const recipeId = document.getElementById('editRecipeId').value;
                const recipeData = {
                    nombre_receta: document.getElementById('editNombreReceta').value,
                    categoria: document.getElementById('editCategoriaReceta').value,
                    tiempo: document.getElementById('editTiempoPreparacion').value,
                    ingredientes: document.getElementById('editIngredientes').value,
                    pasos: document.getElementById('editPasos').value,
                    imagen_url: document.getElementById('editImagenUrl').value,
                    informacion_nutricional: document.getElementById('editInfoNutricional').value
                };

                // Validar campos obligatorios
                if (!recipeData.nombre_receta || !recipeData.categoria || !recipeData.tiempo || !recipeData.ingredientes || !recipeData.pasos) {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Por favor complete todos los campos requeridos',
                        confirmButtonColor: '#dc3545'
                    });
                    return;
                }

                // Mostrar loading
                Swal.fire({
                    title: 'Actualizando receta...',
                    text: 'Por favor espere',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                const response = await fetch(`http://localhost:3000/recipe/${recipeId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': localStorage.getItem('token')
                    },
                    body: JSON.stringify(recipeData)
                });

                if (!response.ok) {
                    throw new Error('Error al actualizar la receta');
                }

                // Cerrar modal y recargar recetas
                const modal = bootstrap.Modal.getInstance(document.getElementById('editarRecetaModal'));
                modal.hide();
                await loadUserRecipes();

                // Mostrar mensaje de éxito
                await Swal.fire({
                    icon: 'success',
                    title: '¡Receta actualizada!',
                    text: 'Los cambios se han guardado correctamente',
                    confirmButtonColor: '#28a745',
                    confirmButtonText: 'Aceptar',
                    allowOutsideClick: false,
                    allowEscapeKey: false
                });

            } catch (error) {
                console.error('Error:', error);
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al actualizar la receta: ' + error.message,
                    confirmButtonColor: '#dc3545',
                    confirmButtonText: 'Aceptar'
                });
            }
        }

        // Función para eliminar receta
        async function deleteRecipe(recipeId) {
            try {
                // Confirmación con SweetAlert2
                const result = await Swal.fire({
                    title: '¿Eliminar receta?',
                    text: '¿Estás seguro de que quieres eliminar esta receta? Esta acción no se puede deshacer.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#dc3545',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Sí, eliminar',
                    cancelButtonText: 'Cancelar'
                });

                if (!result.isConfirmed) return;

                // Mostrar loading
                Swal.fire({
                    title: 'Eliminando receta...',
                    text: 'Por favor espere',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                const response = await fetch(`http://localhost:3000/recipe/${recipeId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': localStorage.getItem('token')
                    }
                });

                if (!response.ok) {
                    throw new Error('Error al eliminar la receta');
                }

                // Recargar lista de recetas
                await loadUserRecipes();

                // Mostrar mensaje de éxito
                await Swal.fire({
                    icon: 'success',
                    title: 'Receta eliminada',
                    text: 'La receta ha sido eliminada correctamente',
                    confirmButtonColor: '#28a745'
                });

            } catch (error) {
                console.error('Error:', error);
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al eliminar la receta: ' + error.message
                });
            }
        }

        // Función para actualizar contraseña
        async function updatePassword() {
            try {
                const currentPassword = document.getElementById('currentPassword')?.value;
                const newPassword = document.getElementById('newPassword')?.value;
                const confirmNewPassword = document.getElementById('confirmNewPassword')?.value;

                // Validar que los campos existan y no estén vacíos
                if (!currentPassword || !newPassword || !confirmNewPassword) {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Por favor complete todos los campos',
                        confirmButtonColor: '#e74c3c'
                    });
                    return;
                }

                // Validar que las contraseñas coincidan
                if (newPassword !== confirmNewPassword) {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Las contraseñas nuevas no coinciden',
                        confirmButtonColor: '#e74c3c'
                    });
                    return;
                }

                // Mostrar loading
                Swal.fire({
                    title: 'Actualizando contraseña...',
                    text: 'Por favor espere',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                const response = await fetch('http://localhost:3000/reset-password', { // Usar reset-password
                    method: 'POST', // Usar POST
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: document.getElementById('user-email').textContent, // Incluir email
                        currentPassword: currentPassword, // Incluir contraseña actual
                        newPassword: newPassword
                    })
                });

                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error || 'Error al actualizar la contraseña');
                }

                // Limpiar campos
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmNewPassword').value = '';
                
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editarPerfilModal'));
                modal.hide();

                // Mostrar mensaje de éxito
                await Swal.fire({
                    icon: 'success',
                    title: '¡Éxito!',
                    text: 'Contraseña actualizada correctamente',
                    confirmButtonColor: '#0d6efd'
                });

            } catch (error) {
                console.error('Error:', error);
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Error al actualizar la contraseña',
                    confirmButtonColor: '#e74c3c'
                });
            }
        }
 
        async function deleteAccount() {
            try {
                // Confirmación con SweetAlert2
                const result = await Swal.fire({
                    title: '¿Eliminar cuenta?',
                    text: 'Esta acción eliminará permanentemente tu cuenta y todas tus recetas. Esta acción no se puede deshacer.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#dc3545',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Sí, eliminar cuenta',
                    cancelButtonText: 'Cancelar'
                });

                if (!result.isConfirmed) return;

                // Mostrar loading
                Swal.fire({
                    title: 'Eliminando cuenta...',
                    text: 'Por favor espere',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                const response = await fetch('http://localhost:3000/delete-account', {
                    method: 'DELETE',
                    headers: {
                        'Authorization': localStorage.getItem('token')
                    }
                });

                if (!response.ok) {
                    throw new Error('Error al eliminar la cuenta');
                }

                // Limpiar localStorage
                localStorage.removeItem('token');
                localStorage.removeItem('nombre');

                // Mostrar mensaje de éxito
                await Swal.fire({
                    icon: 'success',
                    title: 'Cuenta eliminada',
                    text: 'Tu cuenta ha sido eliminada correctamente',
                    confirmButtonColor: '#28a745',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Redireccionar al login
                window.location.href = 'login.html';

            } catch (error) {
                console.error('Error:', error);
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al eliminar la cuenta: ' + error.message
                });
            }
        }

        // Función para guardar nueva receta
        async function saveRecipe() {
            try {
                // Validar campos requeridos
                const nombreReceta = document.getElementById('nombreReceta').value;
                const categoria = document.getElementById('categoriaReceta').value;
                const tiempo = document.getElementById('tiempoPreparacion').value;
                const ingredientes = document.getElementById('ingredientes').value;
                const pasos = document.getElementById('pasos').value;

                if (!nombreReceta || !categoria || !tiempo || !ingredientes || !pasos) {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Campos incompletos',
                        text: 'Por favor complete todos los campos requeridos',
                        confirmButtonColor: '#dc3545'
                    });
                    return;
                }

                // Confirmación antes de guardar
                const confirmResult = await Swal.fire({
                    title: '¿Guardar receta?',
                    text: '¿Deseas guardar esta nueva receta?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#28a745',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Sí, guardar',
                    cancelButtonText: 'Cancelar'
                });

                if (!confirmResult.isConfirmed) return;

                // Mostrar loading mientras se guarda
                Swal.fire({
                    title: 'Guardando receta...',
                    text: 'Por favor espere',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Crear objeto con datos de la receta
                const recipeData = {
                    nombre_receta: nombreReceta,
                    categoria: categoria,
                    tiempo: tiempo,
                    ingredientes: ingredientes,
                    pasos: pasos,
                    imagen_url: document.getElementById('imagenUrl').value || 'https://placehold.co/300',
                    informacion_nutricional: document.getElementById('infoNutricional').value || ''
                };

                // Enviar al servidor
                const response = await fetch('http://localhost:3000/add-recipe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': localStorage.getItem('token')
                    },
                    body: JSON.stringify(recipeData)
                });

                if (!response.ok) {
                    throw new Error('Error al guardar la receta');
                }

                // Cerrar modal y limpiar formulario
                const modal = bootstrap.Modal.getInstance(document.getElementById('nuevaRecetaModal'));
                modal.hide();
                document.getElementById('nuevaRecetaForm').reset();

                // Recargar lista de recetas
                await loadUserRecipes();

                // Mostrar mensaje de éxito
                await Swal.fire({
                    icon: 'success',
                    title: '¡Receta guardada!',
                    text: 'La receta se ha guardado exitosamente',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#28a745'
                });

            } catch (error) {
                console.error('Error:', error);
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al guardar la receta: ' + error.message,
                    confirmButtonColor: '#dc3545'
                });
            }
        }

        // Agregar evento al botón Nueva Receta
        document.querySelector('.btn-success').addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Mostrar mensaje de bienvenida antes de abrir el modal
            const result = await Swal.fire({
                title: '¡Crear Nueva Receta!',
                html: `
                    <div class="text-start">
                        <p>¡Es momento de compartir tu deliciosa receta!</p>
                        <p>Por favor, asegúrate de incluir:</p>
                        <ul>
                            <li>Nombre de la receta</li>
                            <li>Categoría</li>
                            <li>Tiempo de preparación</li>
                            <li>Lista de ingredientes</li>
                            <li>Pasos de preparación</li>
                        </ul>
                        <p class="text-muted small">Los campos marcados con * son obligatorios</p>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: '¡Empezar a Crear!',
                confirmButtonColor: '#28a745',
                showCancelButton: true,
                cancelButtonText: 'Cancelar',
                cancelButtonColor: '#6c757d',
                allowOutsideClick: false,
                allowEscapeKey: false
            });

            // Solo abrir el modal si el usuario confirmó
            if (result.isConfirmed) {
                const modal = new bootstrap.Modal(document.getElementById('nuevaRecetaModal'));
                modal.show();
            }
        });

        // Agregar evento al botón guardar receta
        document.getElementById('guardarReceta').addEventListener('click', async function() {
            try {
                // Validar campos requeridos
                const nombreReceta = document.getElementById('nombreReceta').value;
                const categoria = document.getElementById('categoriaReceta').value;
                const tiempo = document.getElementById('tiempoPreparacion').value;
                const ingredientes = document.getElementById('ingredientes').value;
                const pasos = document.getElementById('pasos').value;

                if (!nombreReceta || !categoria || !tiempo || !ingredientes || !pasos) {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Campos incompletos',
                        text: 'Por favor complete todos los campos requeridos',
                        confirmButtonColor: '#dc3545'
                    });
                    return;
                }

                // Confirmación antes de guardar
                const confirmResult = await Swal.fire({
                    title: '¿Guardar receta?',
                    text: '¿Deseas guardar esta nueva receta?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#28a745',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Sí, guardar',
                    cancelButtonText: 'Cancelar'
                });

                if (!confirmResult.isConfirmed) return;

                // Mostrar loading mientras se guarda
                Swal.fire({
                    title: 'Guardando receta...',
                    text: 'Por favor espere',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Crear objeto con datos de la receta
                const recipeData = {
                    nombre_receta: nombreReceta,
                    categoria: categoria,
                    tiempo: tiempo,
                    ingredientes: ingredientes,
                    pasos: pasos,
                    imagen_url: document.getElementById('imagenUrl').value || 'https://placehold.co/300',
                    informacion_nutricional: document.getElementById('infoNutricional').value || ''
                };

                // Enviar al servidor
                const response = await fetch('http://localhost:3000/add-recipe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': localStorage.getItem('token')
                    },
                    body: JSON.stringify(recipeData)
                });

                if (!response.ok) {
                    throw new Error('Error al guardar la receta');
                }

                // Cerrar modal y limpiar formulario
                const modal = bootstrap.Modal.getInstance(document.getElementById('nuevaRecetaModal'));
                modal.hide();
                document.getElementById('nuevaRecetaForm').reset();

                // Recargar lista de recetas
                await loadUserRecipes();

                // Mostrar mensaje de éxito
                await Swal.fire({
                    icon: 'success',
                    title: '¡Receta guardada!',
                    text: 'La receta se ha guardado exitosamente',
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#28a745'
                });

            } catch (error) {
                console.error('Error:', error);
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al guardar la receta: ' + error.message,
                    confirmButtonColor: '#dc3545'
                });
            }
        });

        // Agregar después de setupEventListeners()
        document.getElementById('forgotPasswordLink').addEventListener('click', function(e) {
            e.preventDefault();
            
            // Cerrar el modal de editar perfil
            const editarPerfilModal = bootstrap.Modal.getInstance(document.getElementById('editarPerfilModal'));
            editarPerfilModal.hide();

            // Abrir el modal de pregunta de seguridad
            const securityQuestionModal = new bootstrap.Modal(document.getElementById('securityQuestionModalProfile'));
            securityQuestionModal.show();
        });

        // Manejar la verificación de la pregunta de seguridad
        document.getElementById('verifyAnswerBtnProfile').addEventListener('click', async function() {
            const selectedQuestion = document.getElementById('securityQuestionSelectProfile').value;
            const answer = document.getElementById('securityAnswerProfile').value.trim();

            if (!selectedQuestion || !answer) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Por favor complete todos los campos'
                });
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/verify-security-answer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': localStorage.getItem('token')
                    },
                    body: JSON.stringify({
                        email: document.getElementById('user-email').textContent,
                        question: selectedQuestion,
                        answer: answer.toLowerCase()
                    })
                });

                const data = await response.json();

                if (data.success) {
                    // Cerrar modal de pregunta de seguridad
                    const securityModal = bootstrap.Modal.getInstance(document.getElementById('securityQuestionModalProfile'));
                    securityModal.hide();

                    // Mostrar modal para nueva contraseña
                    await Swal.fire({
                        title: 'Nueva Contraseña',
                        html: `
                            <input type="password" id="newPasswordRecovery" class="swal2-input" placeholder="Nueva contraseña">
                            <input type="password" id="confirmPasswordRecovery" class="swal2-input" placeholder="Confirmar contraseña">
                        `,
                        confirmButtonText: 'Cambiar Contraseña',
                        showCancelButton: true,
                        cancelButtonText: 'Cancelar',
                        preConfirm: () => {
                            const newPass = document.getElementById('newPasswordRecovery').value;
                            const confirmPass = document.getElementById('confirmPasswordRecovery').value;
                            
                            if (!newPass || !confirmPass) {
                                Swal.showValidationMessage('Por favor complete ambos campos');
                                return false;
                            }
                            
                            if (newPass !== confirmPass) {
                                Swal.showValidationMessage('Las contraseñas no coinciden');
                                return false;
                            }
                            
                            return { newPassword: newPass };
                        }
                    }).then(async (result) => {
                        if (result.isConfirmed) {
                            // Actualizar contraseña
                            const updateResponse = await fetch('http://localhost:3000/reset-password', { // Cambiar a reset-password
                                method: 'POST', // Cambiar a POST como en el resto del código
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': localStorage.getItem('token')
                                },
                                body: JSON.stringify({
                                    email: document.getElementById('user-email').textContent,
                                    newPassword: result.value.newPassword
                                })
                            });

                            if (updateResponse.ok) {
                                await Swal.fire({
                                    icon: 'success',
                                    title: '¡Éxito!',
                                    text: 'Tu contraseña ha sido actualizada correctamente',
                                    confirmButtonColor: '#28a745'
                                });
                            } else {
                                throw new Error('Error al actualizar la contraseña');
                            }
                        }
                    });
                } else {
                    throw new Error('Respuesta incorrecta');
                }
            } catch (error) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Error al verificar la respuesta',
                    confirmButtonColor: '#dc3545'
                });
            }
        });



