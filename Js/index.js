document.addEventListener('DOMContentLoaded', function () {
    // Elementos de la página principal
    const addRecipeButton = document.getElementById('addRecipeButton');
    const heroContent = document.querySelector('.hero-content');
    const recipeContainer = document.querySelector('.row.g-4.justify-content-center');
    const userButtons = document.getElementById('userButtons');
    const guestButtons = document.getElementById('guestButtons');
    const userNameDisplay = document.getElementById('userNameDisplay');

    // Verificar elementos esenciales
    if (!heroContent || !recipeContainer) {
        console.error('No se encontraron elementos esenciales de la página.');
        return;
    }

    // Función para actualizar botones de autenticación
    function updateAuthButtons() {
        const token = localStorage.getItem('token');
        const userName = localStorage.getItem('userName');

        if (userButtons && guestButtons) {
            if (token) {
                userButtons.style.display = 'block';
                guestButtons.style.display = 'none';
                if (userNameDisplay && userName) {
                    userNameDisplay.textContent = userName;
                }
            } else {
                userButtons.style.display = 'none';
                guestButtons.style.display = 'flex';
            }
        }
    }

    // Manejar el botón de añadir receta
    if (addRecipeButton) {
        addRecipeButton.addEventListener('click', function() {
            const token = localStorage.getItem('token');
            const usuario = localStorage.getItem('usuario');

            if (token && usuario) {
                window.location.href = 'crear_receta.html';
            } else {
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
                    }
                });
            }
        });
    }

    // Manejar el cierre de sesión
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            Swal.fire({
                title: '¿Estás seguro?',
                text: "Se cerrará tu sesión actual",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, cerrar sesión',
                cancelButtonText: 'Cancelar',
                customClass: {
                    confirmButton: 'swal2-confirm swal2-styled',
                    cancelButton: 'swal2-cancel swal2-styled'
                },
                buttonsStyling: true // Habilitamos los estilos por defecto de SweetAlert
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userName');
                    
                    Swal.fire({
                        icon: 'success',
                        title: '¡Sesión cerrada!',
                        text: 'Has cerrado sesión correctamente',
                        showConfirmButton: false,
                        timer: 1500,
                        customClass: {
                            popup: 'swal2-show'
                        }
                    }).then(() => {
                        updateCTAButton(); // Agregar esta línea
                        window.location.reload();
                    });
                }
            });
        });
    }

    // Manejar clicks en enlaces de categoría
    const categoryLinks = document.querySelectorAll('.category-link');
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.getAttribute('data-category');
            // Guardar la categoría seleccionada en sessionStorage
            sessionStorage.setItem('selectedCategory', category);
            // Redirigir a la página de menú
            window.location.href = 'Menu.html';
        });
    });

    // Actualizar botones de autenticación al cargar la página
    updateAuthButtons();
});

// Configurar el Intersection Observer una sola vez
function handleIntersection(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('appear');
        }
    });
}

const observer = new IntersectionObserver(handleIntersection, {
    threshold: 0.1
});

// Observar todos los elementos con animación de una vez
const elementsToObserve = [
    ...document.querySelectorAll('.section-fade-up'),
    ...document.querySelectorAll('.category-card'),
    ...document.querySelectorAll('.recipe-card')
];

elementsToObserve.forEach(el => observer.observe(el));

// Configurar buscador
const searchInput = document.querySelector('.search-bar input');
const searchButton = document.querySelector('.search-bar button');

if (searchButton && searchInput) {
    searchButton.addEventListener('click', () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            console.log('Buscando:', searchTerm);
            // Aquí irá la lógica de búsqueda
        }
    });

    // Búsqueda al presionar Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });
}

// Modificar la función handleSearch
async function handleSearch(event) {
    event.preventDefault();
    
    const searchTerm = document.getElementById('searchInput').value.trim();
    
    if (searchTerm === '') {
        Swal.fire({
            icon: 'warning',
            title: 'Campo vacío',
            text: 'Por favor ingresa un término de búsqueda'
        });
        return;
    }

    try {
        // Corregir la URL de la búsqueda
        const response = await fetch(`http://localhost:3000/api/search?term=${encodeURIComponent(searchTerm)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const results = await response.json();
        
        // Guardar los resultados en sessionStorage
        sessionStorage.setItem('searchResults', JSON.stringify(results));
        sessionStorage.setItem('searchTerm', searchTerm);
        
        // Redirigir a la página de menú con el término de búsqueda
        window.location.href = `Menu.html?search=${encodeURIComponent(searchTerm)}`;
        
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al realizar la búsqueda'
        });
    }
}

// Agregar evento para manejar la tecla Enter en el campo de búsqueda
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleSearch(event);
            }
        });
    }
});

function handleLogin(event) {
    event.preventDefault();
    // ... código existente ...
    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userName', data.nombre); // Guardar el nombre
            window.location.href = 'index.html';
        } else {
            showError(data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Error al iniciar sesión');
    });
}

// Agregar esta función después del DOMContentLoaded
async function loadFeaturedRecipes() {
    try {
        const response = await fetch('http://localhost:3000/featured-recipes');
        if (!response.ok) throw new Error('Error al cargar las recetas destacadas');
        
        const recipes = await response.json();
        const container = document.querySelector('.featured-recipes .row');
        
        if (!container) return;

        if (recipes.length === 0) {
            container.innerHTML = '<div class="col-12 text-center"><p>No hay recetas destacadas disponibles.</p></div>';
            return;
        }

        container.innerHTML = recipes.map(recipe => `
            <div class="col-md-6 col-lg-4">
                <div class="recipe-card delay-1 rounded-3 overflow-hidden shadow-sm h-100">
                    <div class="recipe-image" style="height: 200px; background-image: url('${recipe.imagen_url || 'https://via.placeholder.com/300'}'); background-size: cover; background-position: center;"></div>
                    <div class="recipe-details p-4">
                        <h3 class="h4 mb-3">${recipe.nombre_receta}</h3>
                        <div class="recipe-meta d-flex justify-content-between mb-3 text-muted small">
                            <span><i class="far fa-clock me-1"></i> ${recipe.tiempo || '45'} min</span>
                            <span><i class="fas fa-star me-1"></i> ${recipe.promedio_calificacion?.toFixed(1) || '0.0'}</span>
                        </div>
                        <div class="d-flex align-items-center mb-3">
                            <img src="${recipe.foto_usuario || 'https://via.placeholder.com/30'}" 
                                 alt="${recipe.nombre_usuario}" 
                                 class="rounded-circle me-2"
                                 style="width: 30px; height: 30px; object-fit: cover;">
                            <span class="text-muted small">${recipe.nombre_usuario}</span>
                        </div>
                        <button class="btn btn-danger w-100" onclick="mostrarModal(${recipe.id})">
                            Ver Receta
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error:', error);
        const container = document.querySelector('.featured-recipes .row');
        if (container) {
            container.innerHTML = '<div class="col-12 text-center"><p>Error al cargar las recetas destacadas.</p></div>';
        }
    }
}

// Agregar después de loadFeaturedRecipes
async function mostrarModal(recipeId) {
    try {
        const response = await fetch(`http://localhost:3000/get-recipe/${recipeId}`);
        if (!response.ok) throw new Error('Error al cargar la receta');
        
        const recipe = await response.json();

        // Procesar los ingredientes y pasos para mostrarlos en líneas separadas
        const ingredientes = recipe.ingredientes.split(/\d+\.|\n|\./).filter(item => item.trim()).map(item => item.trim());
        const pasos = recipe.pasos.split(/\d+\.|\n|\./).filter(item => item.trim()).map(item => item.trim());

        const modalHTML = `
            <div class="modal fade" id="recipeModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${recipe.nombre_receta}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
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
        const existingModal = document.getElementById('recipeModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('recipeModal'));
        modal.show();

    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'No se pudo cargar la receta', 'error');
    }
}

// Modificar el event listener DOMContentLoaded para incluir la carga de recetas destacadas
document.addEventListener('DOMContentLoaded', function() {
    // ... código existente ...
    
    // Cargar recetas destacadas
    loadFeaturedRecipes();
    
    // Agregar esta función para manejar los clicks en las recetas
    const recipeCards = document.querySelectorAll('.recipe-card');
    
    recipeCards.forEach(card => {
        card.querySelector('.btn').addEventListener('click', function(e) {
            e.preventDefault();
            const recipeId = card.dataset.recipeId;
            // Guardar el ID de la receta en sessionStorage
            sessionStorage.setItem('selectedRecipe', recipeId);
            // Redirigir a la página de menú
            window.location.href = 'Menu.html';
        });
    });
});

// Agregar después de updateAuthButtons()
function updateCTAButton() {
    const ctaButtonContainer = document.getElementById('ctaButtonContainer');
    const token = localStorage.getItem('token');

    if (ctaButtonContainer) {
        if (token) {
            ctaButtonContainer.innerHTML = `
                <a href="Menu.html" class="btn btn-danger btn-lg px-5 py-3">
                    <i class="fas fa-utensils me-2"></i>Ver Recetas
                </a>
            `;
        } else {
            ctaButtonContainer.innerHTML = `
                <a href="crear_cuenta.html" class="btn btn-danger btn-lg px-5 py-3">
                    <i class="fas fa-user-plus me-2"></i>Registrarse Ahora
                </a>
            `;
        }
    }
}

// Modificar el event listener DOMContentLoaded existente
document.addEventListener('DOMContentLoaded', function() {
    // ...existing code...
    
    // Agregar después de updateAuthButtons();
    updateCTAButton();
    
    // ...existing code...
});