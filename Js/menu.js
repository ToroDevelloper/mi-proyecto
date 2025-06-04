document.addEventListener('DOMContentLoaded', async function() {
    const recipesContainer = document.getElementById('recipes-container');
    const filterButtons = document.querySelectorAll('.filter-btn');
    let currentCategory = 'all';
    
    // Mover la declaración aquí para usarla en todo el archivo
    const urlParams = new URLSearchParams(window.location.search);
    
    // Función para verificar el estado de inicio de sesión
    function checkLoginState() {
        const token = localStorage.getItem('token');
        
        if (token) {
            if (guestButtons) guestButtons.style.display = 'none';
            if (userButtons) userButtons.style.display = 'flex';
            
            // Decode token and update username if available
            try {
                const tokenData = JSON.parse(atob(token.split('.')[1]));
                if (userName && tokenData.username) {
                    userName.textContent = tokenData.username;
                }
            } catch (error) {
                console.error('Error parsing token:', error);
            }
        } else {
            if (guestButtons) guestButtons.style.display = 'flex';
            if (userButtons) userButtons.style.display = 'none';
            if (userName) userName.textContent = '';
        }
    }

    // Añadir funcionalidad al botón de cerrar sesión
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            Swal.fire({
                title: '¿Estás seguro?',
                text: "Se cerrará tu sesión currente",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, cerrar sesión',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Limpiar localStorage
                    localStorage.removeItem('token');
                    localStorage.removeItem('userName');
                    
                    // Mostrar mensaje de éxito
                    Swal.fire(
                        '¡Sesión cerrada!',
                        'Has cerrado sesión correctamente',
                        'success'
                    ).then(() => {
                        // Redirigir a la página de inicio
                        window.location.href = 'index.html';
                    });
                }
            });
        });
    }

    // Función para filtrar recetas
    function filterRecipes(category) {
        const items = document.querySelectorAll('.category-item');
        items.forEach(item => {
            if (category === 'all' || item.dataset.category === category) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Manejar filtrado de categorías
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.dataset.category;
            filterRecipes(category);
        });
    });

    // Check URL parameters for category filter
    const categoryParam = urlParams.get('categoria');
    if (categoryParam) {
        filterRecipes(categoryParam);
    }

    // Función para cargar recetas
    function loadRecipes() {
        try {
            const container = document.getElementById('recipes-container');
            
            // Verificar si el contenedor existe
            if (!container) {
                console.error('El elemento recipes-container no existe en el DOM');
                return;
            }

            fetch('http://localhost:3000/get-recipes')
                .then(response => {
                    if (!response.ok) throw new Error('Error al cargar las recetas');
                    return response.json();
                })
                .then(recipes => {
                    if (recipes.length > 0) {
                        container.innerHTML = recipes.map(recipe => createRecipeCard(recipe)).join('');
                    } else {
                        container.innerHTML = '<p class="text-center">No hay recetas disponibles.</p>';
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No se pudieron cargar las recetas'
                    });
                });
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Primero, mover la función createRecipeCard fuera del DOMContentLoaded
    function createRecipeCard(recipe) {
        // Calcular el promedio de calificaciones
        const rating = recipe.promedio_calificacion || 0;
        const voteCount = recipe.total_votos || 0;
        
        return `
        <div class="col-md-6 col-lg-4 category-item" data-category="${recipe.categoria}">
            <div class="card recipe-card h-100 shadow-sm">
                <img src="${recipe.imagen_url || 'placeholder.jpg'}" 
                     class="card-img-top" 
                     alt="${recipe.nombre_receta}"
                     style="height: 200px; object-fit: cover;">
                <div class="card-body">
                    <h5 class="card-title mb-3">${recipe.nombre_receta}</h5>
                    <div class="d-flex align-items-center mb-2">
                        <div class="user-info d-flex align-items-center">
                            <img src="${recipe.foto_usuario || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}" 
                                 alt="Foto de perfil" 
                                 class="rounded-circle me-2"
                                 style="width: 30px; height: 30px; object-fit: cover;">
                            <span class="me-2">${recipe.nombre_usuario}</span>
                            <span class="badge bg-primary">${recipe.categoria}</span>
                        </div>
                    </div>
                    <div class="rating-info mb-2">
                        <div class="stars">
                            ${generarEstrellasPromedio(rating)}
                        </div>
                        <small class="text-muted ms-2">${rating.toFixed(1)}/5 de ${voteCount} ${voteCount === 1 ? 'voto' : 'votos'}</small>
                    </div>
                    <div class="d-flex align-items-center justify-content-between">
                        <small class="text-muted">
                            <i class="far fa-clock me-1"></i>${recipe.tiempo || '30'} minutos
                        </small>
                    </div>
                    <div class="d-flex gap-2 mt-3">
                        <button onclick="mostrarModal(${recipe.id})" class="btn btn-primary flex-grow-1">
                            Ver Receta
                        </button>
                        <button onclick="mostrarComentarios(${recipe.id})" class="btn btn-outline-primary">
                            <i class="far fa-comments"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // Add error handling function
    function showError(message) {
        console.error(message);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message
        });
    }

    // Seleccionar elementos
    const categoryItems = document.querySelectorAll('.category-item');
    const recipeItems = document.querySelectorAll('.recipe-item');

    // Función para filtrar elementos
    function filterItems(category) {
        const items = document.querySelectorAll('.category-item, .recipe-item');
        
        items.forEach(item => {
            const itemCategory = item.dataset.category;
            if (category === 'all' || itemCategory === category) {
                item.classList.remove('hidden');
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'scale(1)';
                }, 50);
            } else {
                item.classList.add('hidden');
                item.style.opacity = '0';
                item.style.transform = 'scale(0.8)';
            }
        });
    }

    // Event listeners para los botones de filtrado
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentCategory = button.dataset.category;
            filterItems(currentCategory);
        });
    });

    // Activar el primer filtro por defecto
    filterButtons[0].click();

    // Cargar recetas iniciales
    loadRecipes();

    // Verificar si hay búsqueda
    const searchTerm = urlParams.get('search');

    if (searchTerm) {
        await searchRecipes(searchTerm);
    } else {
        await loadRecipes();
    }

    // Add this line inside DOMContentLoaded if you want to keep the function inside
    window.mostrarModal = mostrarModal;
});

async function mostrarModal(recipeId) {
    try {
        const response = await fetch(`http://localhost:3000/get-recipe/${recipeId}`);
        if (!response.ok) throw new Error('Error al cargar la receta');
        
        const recipe = await response.json();

        // Procesar los ingredientes y pasos para mostrarlos en líneas separadas
        const ingredientes = recipe.ingredientes.split(/\d+\.|\n|\./).filter(item => item.trim()).map(item => item.trim());
        const pasos = recipe.pasos.split(/\d+\.|\n|\./).filter(item => item.trim()).map(item => item.trim());

        const modalHTML = `
            <div class="modal fade" id="recetaModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${recipe.nombre_receta}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="recipe-image-container">
                                <img src="${recipe.imagen_url || 'https://via.placeholder.com/800x600'}" 
                                     alt="${recipe.nombre_receta}"
                                     onerror="this.src='https://via.placeholder.com/800x600'">
                            </div>
                            
                            <div class="recipe-info-section">
                                <h6><i class="fas fa-list me-2"></i>Ingredientes</h6>
                                <ul class="ingredients-list">
                                    ${ingredientes.map(ingrediente => `
                                        <li>${ingrediente}</li>
                                    `).join('')}
                                </ul>
                            </div>

                            <div class="recipe-info-section">
                                <h6><i class="fas fa-info-circle me-2"></i>Información Nutricional</h6>
                                <p>${recipe.informacion_nutricional || 'Información no disponible'}</p>
                            </div>
                            
                            <div class="recipe-info-section">
                                <h6><i class="fas fa-utensils me-2"></i>Pasos de preparación</h6>
                                <ol class="preparation-steps">
                                    ${pasos.map(paso => `
                                        <li>${paso}</li>
                                    `).join('')}
                                </ol>
                            </div>

                            <div class="recipe-meta-info">
                                <p><i class="fas fa-user me-2"></i>Publicado por: ${recipe.nombre_usuario}</p>
                                <p><i class="far fa-clock me-2"></i>${recipe.tiempo} minutos</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Eliminar modal anterior si existe
        const existingModal = document.getElementById('recetaModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('recetaModal'));
        modal.show();

    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'No se pudo cargar la receta', 'error');
    }
}

// Agregar estas funciones al final del archivo

let currentRecipeId = null;
let currentRating = 0;

// Modificar la función mostrarComentarios
function mostrarComentarios(recipeId) {
    currentRecipeId = recipeId;
    const modal = new bootstrap.Modal(document.getElementById('comentariosModal'));
    
    // Si el usuario no está autenticado, mostrar solo los comentarios
    if (!localStorage.getItem('token')) {
        document.getElementById('comentariosModal').querySelector('.modal-body').innerHTML = `
            <div id="listaComentarios" class="comentarios-container">
                <!-- Los comentarios se cargarán aquí -->
            </div>
            <div class="alert alert-info mt-3">
                <i class="fas fa-info-circle"></i> 
                Debes <a href="iniciar_sesion.html" class="alert-link">iniciar sesión</a> para poder comentar
            </div>
        `;
        cargarComentarios(recipeId);
        modal.show();
        return;
    }

    // Obtener datos del usuario del token
    const token = localStorage.getItem('token');
    let userData = {
        nombre: '',
        email: ''
    };

    if (token) {
        try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
                // Verificar si el token está expirado
                const payload = JSON.parse(atob(tokenParts[1]));
                const expTime = payload.exp * 1000; // Convertir a milisegundos
                
                if (Date.now() >= expTime) {
                    // Token expirado, redirigir al login
                    localStorage.removeItem('token');
                    Swal.fire({
                        icon: 'warning',
                        title: 'Sesión expirada',
                        text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
                        confirmButtonText: 'Ir a iniciar sesión'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = 'iniciar_sesion.html';
                        }
                    });
                    return;
                }

                // Si el token es válido, hacer la petición
                fetch('http://localhost:3000/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    if (response.status === 401) {
                        // Token inválido o expirado
                        throw new Error('Token inválido o expirado');
                    }
                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.user) {
                        userData.nombre = data.user.nombre;
                        userData.email = data.user.email;
                        actualizarModalComentarios(userData);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    if (error.message === 'Token inválido o expirado') {
                        localStorage.removeItem('token');
                        Swal.fire({
                            icon: 'warning',
                            title: 'Sesión expirada',
                            text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
                            confirmButtonText: 'Ir a iniciar sesión'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                window.location.href = 'iniciar_sesion.html';
                            }
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'No se pudieron cargar los datos del usuario'
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error al decodificar el token:', error);
            localStorage.removeItem('token');
            window.location.href = 'iniciar_sesion.html';
        }
    }

    // Mostrar el modal inmediatamente con campos vacíos
    modal.show();
}

// Función auxiliar para actualizar el contenido del modal
function actualizarModalComentarios(userData) {
    document.getElementById('comentariosModal').querySelector('.modal-body').innerHTML = `
        <div class="mb-4" id="formComentario">
            <h5>¡Comparte tu experiencia!</h5>
            <p class="text-muted">Tu opinión nos ayuda a mejorar y es valiosa para nuestra comunidad</p>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="form-label">Nombre</label>
                    <input type="text" class="form-control" id="nombreComentario" 
                           value="${userData.nombre}" readonly>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Correo electrónico</label>
                    <input type="email" class="form-control" id="emailComentario" 
                           value="${userData.email}" readonly>
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label">Tu calificación *</label>
                <div class="rating-stars">
                    <i class="far fa-star" data-rating="1"></i>
                    <i class="far fa-star" data-rating="2"></i>
                    <i class="far fa-star" data-rating="3"></i>
                    <i class="far fa-star" data-rating="4"></i>
                    <i class="far fa-star" data-rating="5"></i>
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label">Comentario *</label>
                <textarea class="form-control" id="comentarioText" rows="3" 
                          placeholder="Escribe tu comentario..."></textarea>
            </div>

            <button class="btn btn-primary" onclick="publicarComentario()">
                Publicar el comentario
            </button>
        </div>
        <div id="listaComentarios" class="comentarios-container">
            <!-- Los comentarios se cargarán aquí -->
        </div>
    `;

    // Inicializar el sistema de estrellas DESPUÉS de que el HTML esté cargado
    setTimeout(() => {
        const ratingStars = document.querySelectorAll('.rating-stars i');
        ratingStars.forEach((star, index) => {
            star.addEventListener('click', function() {
                currentRating = index + 1;
                updateStars(currentRating);
            });

            star.addEventListener('mouseover', function() {
                updateStars(index + 1);
            });

            star.addEventListener('mouseout', function() {
                updateStars(currentRating);
            });
        });
    }, 0);

    // Cargar comentarios existentes
    cargarComentarios(currentRecipeId);
}

// Agregar la función updateStars si no existe
function updateStars(rating) {
    const stars = document.querySelectorAll('.rating-stars i');
    stars.forEach((star, index) => {
        star.className = index < rating ? 'fas fa-star text-warning' : 'far fa-star';
    });
}

async function cargarComentarios(recipeId) {
    try {
        const response = await fetch(`http://localhost:3000/api/comentarios_recetas?recipeId=${recipeId}`);
        const comentarios = await response.json();
        const container = document.getElementById('listaComentarios');
        const token = localStorage.getItem('token');
        let userId = null;

        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.id;
        }
        
        container.innerHTML = comentarios.map(comentario => `
            <div class="comment-card mb-4">
                <div class="comment-header">
                    <div class="comment-avatar">
                        <img src="${comentario.avatar_url || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}" 
                             alt="Avatar">
                    </div>
                    <div class="comment-info">
                        <h6 class="comment-author">${comentario.nombre_usuario}</h6>
                        <div class="stars mb-1">
                            ${generarEstrellas(comentario.calificacion)}
                        </div>
                        <small class="comment-date text-muted">
                            ${new Date(comentario.fecha_comentario).toLocaleDateString()}
                        </small>
                    </div>
                </div>
                <div class="comment-text mt-2">
                    ${comentario.comentario}
                </div>
                <div class="comment-actions mt-2">
                    <button class="btn btn-sm btn-outline-primary me-2" 
                            onclick="mostrarFormRespuesta(${comentario.id})">
                        <i class="fas fa-reply"></i> Responder
                    </button>
                    ${userId === comentario.usuario_id ? `
                        <button class="btn btn-sm btn-outline-danger" 
                                onclick="eliminarComentario(${comentario.id})">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    ` : ''}
                </div>
                <div id="form-respuesta-${comentario.id}" class="reply-form mt-3" style="display: none;">
                    <textarea id="respuesta-${comentario.id}" class="form-control mb-2" 
                              placeholder="Escribe tu respuesta..."></textarea>
                    <button class="btn btn-sm btn-primary" 
                            onclick="publicarRespuesta(${comentario.id})">
                        Publicar respuesta
                    </button>
                </div>
                <div id="respuestas-${comentario.id}" class="replies-container">
                </div>
            </div>
        `).join('');

        comentarios.forEach(comentario => {
            cargarRespuestasRecetas(comentario.id);
        });
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'No se pudieron cargar los comentarios', 'error');
    }
}

// Agregar las nuevas funciones para manejar las acciones
function mostrarFormRespuesta(comentarioId) {
    if (!localStorage.getItem('token')) {
        Swal.fire({
            title: 'Iniciar sesión requerido',
            text: 'Debes iniciar sesión para responder a los comentarios',
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Iniciar sesión',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = 'iniciar_sesion.html'; // Cambiar aquí
            }
        });
        return;
    }

    const formRespuesta = document.getElementById(`form-respuesta-${comentarioId}`);
    formRespuesta.style.display = formRespuesta.style.display === 'none' ? 'block' : 'none';
}

async function eliminarComentario(comentarioId) {
    try {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No hay token de autorización');
            }

            const response = await fetch(`http://localhost:3000/api/comentarios_recetas/${comentarioId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al eliminar el comentario');
            }

            await cargarComentarios(currentRecipeId);
            Swal.fire('¡Eliminado!', 'El comentario ha sido eliminado', 'success');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', error.message || 'No se pudo eliminar el comentario', 'error');
    }
}

function generarEstrellas(calificacion) {
    return Array(5).fill().map((_, index) => 
        `<i class="${index < calificacion ? 'fas' : 'far'} fa-star"></i>`
    ).join('');
}

// Modificar la función publicarComentario
async function publicarComentario() {
    if (!localStorage.getItem('token')) {
        Swal.fire({
            title: 'Iniciar sesión requerido',
            text: 'Debes iniciar sesión para publicar un comentario',
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Iniciar sesión',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = 'iniciar_sesion.html';
            }
        });
        return;
    }

    const comentarioText = document.getElementById('comentarioText').value;
    if (!comentarioText || currentRating === 0) {
        Swal.fire('Error', 'Por favor escribe un comentario y selecciona una calificación', 'warning');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/comentarios_recetas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token')
            },
            body: JSON.stringify({
                receta_id: currentRecipeId,
                comentario: comentarioText,
                calificacion: currentRating
            })
        });

        if (!response.ok) throw new Error('Error al publicar el comentario');

        document.getElementById('comentarioText').value = '';
        currentRating = 0;
        document.querySelectorAll('.rating i').forEach(star => star.className = 'far fa-star');
        
        await cargarComentarios(currentRecipeId);
        Swal.fire('¡Éxito!', 'Comentario publicado correctamente', 'success');
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'No se pudo publicar el comentario', 'error');
    }
}

// Función para publicar respuestas
async function publicarRespuesta(comentarioId) {
    const respuestaText = document.getElementById(`respuesta-${comentarioId}`).value;
    
    if (!respuestaText) {
        Swal.fire('Error', 'Por favor escribe una respuesta', 'warning');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/respuestas_comentarios_recetas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token')
            },
            body: JSON.stringify({
                comentario_id: comentarioId,
                respuesta: respuestaText
            })
        });

        if (!response.ok) throw new Error('Error al publicar la respuesta');

        document.getElementById(`respuesta-${comentarioId}`).value = '';
        await cargarRespuestasRecetas(comentarioId);
        
        // Ocultar el formulario de respuesta
        document.getElementById(`form-respuesta-${comentarioId}`).style.display = 'none';
        
        Swal.fire('¡Éxito!', 'Respuesta publicada correctamente', 'success');
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'No se pudo publicar la respuesta', 'error');
    }
}

async function cargarRespuestasRecetas(comentarioId) {
    try {
        const response = await fetch(`http://localhost:3000/api/respuestas_comentarios_recetas/${comentarioId}`);
        if (!response.ok) throw new Error('Error al cargar respuestas');
        
        const respuestas = await response.json();
        const container = document.getElementById(`respuestas-${comentarioId}`);
        const token = localStorage.getItem('token');
        let userId = null;

        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.id;
        }
        
        if (respuestas.length > 0) {
            container.innerHTML = respuestas.map(respuesta => `
                <div class="reply-card mt-2 ms-4" data-respuesta-id="${respuesta.id}">
                    <div class="comment-header d-flex justify-content-between">
                        <div class="d-flex">
                            <div class="comment-avatar">
                                <img src="${respuesta.avatar_url || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}" 
                                     alt="Avatar" class="rounded-circle" style="width: 30px; height: 30px;">
                            </div>
                            <div class="comment-info ms-2">
                                <h6 class="comment-author mb-0">${respuesta.nombre_usuario}</h6>
                                <small class="text-muted">${new Date(respuesta.fecha_respuesta).toLocaleDateString()}</small>
                            </div>
                        </div>
                        ${userId === respuesta.usuario_id ? `
                            <div class="comment-actions">
                                <button class="btn btn-sm btn-outline-danger" 
                                        onclick="eliminarRespuesta(${respuesta.id}, ${comentarioId})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    <div class="comment-text mt-2">
                        ${respuesta.respuesta}
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Agregar listeners para las estrellas
document.addEventListener('DOMContentLoaded', function() {
    const ratingStars = document.querySelectorAll('.rating i');
    ratingStars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.dataset.rating);
            currentRating = rating;
            ratingStars.forEach((s, index) => {
                s.className = index < rating ? 'fas fa-star' : 'far fa-star';
            });
        });
    });
});

async function editarRespuesta(respuestaId, respuestaTexto) {
    try {
        const { value: newText } = await Swal.fire({
            title: 'Editar respuesta',
            input: 'textarea',
            inputValue: respuestaTexto,
            inputPlaceholder: 'Escribe tu respuesta...',
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
                if (!value.trim()) {
                    return 'La respuesta no puede estar vacía';
                }
            }
        });

        if (newText) {
            const response = await fetch(`http://localhost:3000/api/respuestas_comentarios_recetas/${respuestaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token')
                },
                body: JSON.stringify({ respuesta: newText })
            });

            if (!response.ok) throw new Error('Error al actualizar la respuesta');

            await cargarComentarios(currentRecipeId);
            Swal.fire('¡Éxito!', 'Respuesta actualizada correctamente', 'success');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'No se pudo actualizar la respuesta', 'error');
    }
}

async function eliminarRespuesta(respuestaId, comentarioId) {
    try {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No hay token de autorización');
            }

            const response = await fetch(`http://localhost:3000/api/respuestas_recetas/${respuestaId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al eliminar la respuesta');
            }

            // Eliminar inmediatamente la respuesta del DOM
            const respuestaElement = document.querySelector(`[data-respuesta-id="${respuestaId}"]`);
            if (respuestaElement) {
                respuestaElement.remove();
            }

            // Actualizar las respuestas
            await cargarRespuestasRecetas(comentarioId);
            
            Swal.fire('¡Eliminado!', 'La respuesta ha sido eliminada', 'success');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'No se pudo eliminar la respuesta', 'error');
    }
}

// Modificar mostrarComentarios para permitir ver comentarios sin estar registrado
function mostrarComentarios(recipeId) {
    currentRecipeId = recipeId;
    const modal = new bootstrap.Modal(document.getElementById('comentariosModal'));
    
    // Si el usuario no está autenticado, mostrar solo los comentarios
    if (!localStorage.getItem('token')) {
        document.getElementById('comentariosModal').querySelector('.modal-body').innerHTML = `
            <div id="listaComentarios" class="comentarios-container">
                <!-- Los comentarios se cargarán aquí -->
            </div>
            <div class="alert alert-info mt-3">
                <i class="fas fa-info-circle"></i> 
                Debes <a href="iniciar_sesion.html" class="alert-link">iniciar sesión</a> para poder comentar
            </div>
        `;
        cargarComentarios(recipeId);
        modal.show();
        return;
    }

    // Obtener datos del usuario del token
    const token = localStorage.getItem('token');
    let userData = {
        nombre: '',
        email: ''
    };

    if (token) {
        try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
                // Verificar si el token está expirado
                const payload = JSON.parse(atob(tokenParts[1]));
                const expTime = payload.exp * 1000; // Convertir a milisegundos
                
                if (Date.now() >= expTime) {
                    // Token expirado, redirigir al login
                    localStorage.removeItem('token');
                    Swal.fire({
                        icon: 'warning',
                        title: 'Sesión expirada',
                        text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
                        confirmButtonText: 'Ir a iniciar sesión'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = 'iniciar_sesion.html';
                        }
                    });
                    return;
                }

                // Si el token es válido, hacer la petición
                fetch('http://localhost:3000/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    if (response.status === 401) {
                        // Token inválido o expirado
                        throw new Error('Token inválido o expirado');
                    }
                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.user) {
                        userData.nombre = data.user.nombre;
                        userData.email = data.user.email;
                        actualizarModalComentarios(userData);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    if (error.message === 'Token inválido o expirado') {
                        localStorage.removeItem('token');
                        Swal.fire({
                            icon: 'warning',
                            title: 'Sesión expirada',
                            text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
                            confirmButtonText: 'Ir a iniciar sesión'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                window.location.href = 'iniciar_sesion.html';
                            }
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'No se pudieron cargar los datos del usuario'
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error al decodificar el token:', error);
            localStorage.removeItem('token');
            window.location.href = 'iniciar_sesion.html';
        }
    }

    // Mostrar el modal inmediatamente con campos vacíos
    modal.show();
}

document.addEventListener('DOMContentLoaded', function() {
    // Obtener el término de búsqueda de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search');

    if (searchTerm) {
        // Verificar si el elemento existe antes de intentar modificarlo
        const searchTermElement = document.getElementById('searchTerm');
        if (searchTermElement) {
            searchTermElement.textContent = searchTerm;
        }
        
        // Realizar la búsqueda
        searchRecipes(searchTerm);
    }
});

// Eliminar las funciones duplicadas y mantener una versión unificada

// Función principal de búsqueda
async function searchRecipes(searchTerm) {
    try {
        const container = document.getElementById('recipes-container');
        if (!container) {
            throw new Error('Container not found');
        }

        const response = await fetch(`http://localhost:3000/api/search?term=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) throw new Error('Error en la búsqueda');
        
        const recipes = await response.json();

        if (recipes.length > 0) {
            container.innerHTML = recipes.map(recipe => {
                return `
                    <div class="col-md-6 col-lg-4 category-item" data-category="${recipe.categoria}">
                        <div class="card recipe-card h-100 shadow-sm">
                            <img src="${recipe.imagen_url || 'placeholder.jpg'}" 
                                 class="card-img-top" 
                                 alt="${recipe.nombre_receta}"
                                 style="height: 200px; object-fit: cover;">
                            <div class="card-body">
                                <h5 class="card-title mb-3">${recipe.nombre_receta}</h5>
                                <div class="d-flex align-items-center mb-2">
                                    <div class="user-info d-flex align-items-center">
                                        <img src="${recipe.foto_usuario || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}" 
                                             alt="Foto de perfil" 
                                             class="rounded-circle me-2"
                                             style="width: 30px; height: 30px; object-fit: cover;">
                                        <span class="me-2">${recipe.nombre_usuario}</span>
                                        <span class="badge bg-primary">${recipe.categoria}</span>
                                    </div>
                                </div>
                                <div class="rating-info mb-2">
                                    <div class="stars">
                                        ${generarEstrellasPromedio(recipe.promedio_calificacion || 0)}
                                    </div>
                                    <small class="text-muted ms-2">${(recipe.promedio_calificacion || 0).toFixed(1)}/5 de ${recipe.total_votos || 0} votos</small>
                                </div>
                                <div class="d-flex gap-2 mt-3">
                                    <button onclick="mostrarModal(${recipe.id})" class="btn btn-primary flex-grow-1">
                                        Ver Receta
                                    </button>
                                    <button onclick="mostrarComentarios(${recipe.id})" class="btn btn-outline-primary">
                                        <i class="far fa-comments"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<div class="col-12"><p class="text-center">No se encontraron recetas.</p></div>';
        }
    } catch (error) {
        console.error('Error:', error);
        const container = document.getElementById('recipes-container');
        if (container) {
            container.innerHTML = '<div class="col-12"><p class="text-center text-danger">Error al buscar recetas.</p></div>';
        }
    }
}

// Función auxiliar para generar estrellas
function generarEstrellasPromedio(rating) {
    let estrellas = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            estrellas += '<i class="fas fa-star text-warning"></i>';
        } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
            estrellas += '<i class="fas fa-star-half-alt text-warning"></i>';
        } else {
            estrellas += '<i class="far fa-star text-warning"></i>';
        }
    }
    return estrellas;
}