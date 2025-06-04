document.addEventListener('DOMContentLoaded', function() {
    const commentForm = document.getElementById('commentForm');
    const commentsList = document.getElementById('commentsList');
    const submitButton = document.getElementById('submitComment');
    const commentText = document.getElementById('commentText');
    const userNameInput = document.getElementById('userName');
    const userEmailInput = document.getElementById('userEmail');

    // Cargar datos del usuario si está autenticado
    const token = localStorage.getItem('token');
    if (token) {
        fetch('http://localhost:3000/profile', {
            headers: {
                'Authorization': token
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.user) {
                userNameInput.value = data.user.nombre;
                userEmailInput.value = data.user.email;
            }
        })
        .catch(error => console.error('Error:', error));
    }

    // Configurar el selector de calificación
    const ratingSelector = document.querySelector('.rating-selector');
    const ratingInput = document.getElementById('rating');
    const ratingStars = ratingSelector.querySelectorAll('i');

    ratingStars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const rating = this.getAttribute('data-rating');
            highlightStars(rating);
        });

        star.addEventListener('mouseout', function() {
            const currentRating = ratingInput.value;
            highlightStars(currentRating);
        });

        star.addEventListener('click', function() {
            const rating = this.getAttribute('data-rating');
            ratingInput.value = rating;
            highlightStars(rating);
        });
    });

    function highlightStars(rating) {
        ratingStars.forEach(star => {
            const starRating = star.getAttribute('data-rating');
            if (starRating <= rating) {
                star.classList.remove('far');
                star.classList.add('fas');
            } else {
                star.classList.remove('fas');
                star.classList.add('far');
            }
        });
    }

    // Manejar envío de comentarios
    submitButton.addEventListener('click', async function(e) {
        e.preventDefault();

        if (!token) {
            Swal.fire({
                title: '¡Necesitas iniciar sesión!',
                text: 'Para dejar un comentario, por favor inicia sesión primero',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Iniciar sesión',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'iniciar_sesion.html';
                }
            });
            return;
        }

        // Validar comentario vacío
        if (!commentText.value.trim()) {
            Swal.fire({
                icon: 'error',
                title: 'Campo vacío',
                text: 'Por favor escribe un comentario antes de publicar',
                confirmButtonColor: '#d33'
            });
            return;
        }

        if (!ratingInput.value) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Por favor selecciona una calificación'
            });
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/comentarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({
                    comentario: commentText.value.trim(),
                    calificacion: document.getElementById('rating').value,
                    receta_id: 1 // Por ahora hardcodeado, después se puede obtener de la URL o props
                })
            });

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Comentario publicado!',
                    text: 'Tu comentario ha sido publicado exitosamente',
                    confirmButtonColor: '#28a745'
                });
                commentText.value = '';
                document.getElementById('rating').value = '';
                ratingStars.forEach(star => {
                    star.className = 'far fa-star';
                });
                loadComments(); // Aquí se cargan los comentarios
                updateAverageRating();
            } else {
                throw new Error('Error al publicar el comentario');
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo publicar el comentario',
                confirmButtonColor: '#d33'
            });
        }
    });

    async function loadComments() {
        try {
            const response = await fetch('http://localhost:3000/api/comentarios');
            const comments = await response.json();
            const currentUserId = token ? JSON.parse(atob(token.split('.')[1])).id : null;
            
            const commentsList = document.getElementById('commentsList');
            
            if (!comments || comments.length === 0) {
                commentsList.innerHTML = `
                    <div class="no-comments">
                        <p>No hay comentarios todavía. ¡Sé el primero en comentar!</p>
                    </div>
                `;
                updateAverageRating();
                return;
            }
            
            // Limpiar la lista de comentarios
            commentsList.innerHTML = '';
            
            // Crear y agregar cada comentario
            for (const comment of comments) {
                const commentElement = await createCommentElement(comment, currentUserId);
                commentsList.appendChild(commentElement);
            }

            updateAverageRating();
        } catch (error) {
            console.error('Error al cargar comentarios:', error);
            document.getElementById('commentsList').innerHTML = `
                <div class="error-message">
                    <p>Error al cargar los comentarios. Por favor, intenta más tarde.</p>
                </div>
            `;
        }
    }

    async function createCommentElement(comment, currentUserId) {
        const div = document.createElement('div');
        div.className = 'comment-card';
        div.dataset.commentId = comment.id;
        
        const avatarUrl = comment.avatar_url || 'https://www.gravatar.com/avatar/?d=mp';
        const date = new Date(comment.fecha_comentario).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const isOwner = currentUserId === comment.usuario_id;
        const actionButtons = `
            <button class="btn btn-sm btn-outline-secondary reply-comment-btn">
                <i class="fas fa-reply"></i> Responder
            </button>
            ${isOwner ? `
                <button class="btn btn-sm btn-outline-primary edit-comment-btn">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-sm btn-outline-danger delete-comment-btn">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            ` : ''}
        `;

        div.innerHTML = `
            <div class="comment-header">
                <div class="comment-avatar">
                    <img src="${avatarUrl}" alt="Avatar de ${comment.nombre_usuario}">
                </div>
                <div class="comment-info">
                    <h4 class="comment-author">${comment.nombre_usuario}</h4>
                    <div class="comment-date">${date}</div>
                    <div class="comment-rating">
                        ${getStarRating(comment.calificacion)}
                    </div>
                </div>
            </div>
            <div class="comment-content">
                <p class="comment-text">${comment.comentario}</p>
            </div>
            <div class="comment-actions">
                ${actionButtons}
            </div>
            <div class="replies-container" id="replies-${comment.id}"></div>
        `;

        // Agregar event listeners
        if (isOwner) {
            const editBtn = div.querySelector('.edit-comment-btn');
            const deleteBtn = div.querySelector('.delete-comment-btn');
            
            editBtn.addEventListener('click', () => editComment(comment.id));
            deleteBtn.addEventListener('click', () => deleteComment(comment.id));
        }

        const replyBtn = div.querySelector('.reply-comment-btn');
        replyBtn.addEventListener('click', () => replyToComment(comment.id));

        // Cargar respuestas si existen
        try {
            const response = await fetch(`http://localhost:3000/api/comentarios/${comment.id}/respuestas`);
            const replies = await response.json();
            
            const repliesContainer = div.querySelector(`#replies-${comment.id}`);
            replies.forEach(reply => {
                const isReplyOwner = currentUserId === reply.usuario_id;
                repliesContainer.innerHTML += `
                    <div class="reply-card" data-reply-id="${reply.id}">
                        <div class="reply-header">
                            <img src="${reply.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'}" 
                                 alt="Avatar" class="reply-avatar">
                            <span class="reply-author">${reply.nombre_usuario}</span>
                            <span class="reply-date">
                                ${new Date(reply.fecha_respuesta).toLocaleDateString()}
                            </span>
                        </div>
                        <div class="reply-content">
                            ${reply.respuesta}
                        </div>
                        ${isReplyOwner ? `
                            <div class="reply-actions">
                                <button class="btn btn-sm btn-outline-primary edit-reply-btn">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-reply-btn">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            });

            // Agregar event listeners para los botones de editar y eliminar respuestas
            repliesContainer.querySelectorAll('.reply-card').forEach(replyCard => {
                const replyId = replyCard.dataset.replyId;
                const editBtn = replyCard.querySelector('.edit-reply-btn');
                const deleteBtn = replyCard.querySelector('.delete-reply-btn');

                if (editBtn) {
                    editBtn.addEventListener('click', () => editReply(replyId));
                }
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => deleteReply(replyId));
                }
            });
        } catch (error) {
            console.error('Error al cargar respuestas:', error);
        }

        return div;
    }

    function getStarRating(rating) {
        return `
            <div class="stars">
                ${Array(5).fill(0).map((_, i) => 
                    `<i class="${i < rating ? 'fas' : 'far'} fa-star"></i>`
                ).join('')}
            </div>
        `;
    }

    async function editComment(commentId) {
        const commentCard = document.querySelector(`[data-comment-id="${commentId}"]`);
        const commentText = commentCard.querySelector('.comment-text').textContent;

        const { value: newComment } = await Swal.fire({
            title: 'Editar comentario',
            input: 'textarea',
            inputValue: commentText,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar'
        });

        if (newComment) {
            try {
                const response = await fetch(`http://localhost:3000/api/comentarios/${commentId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify({ comentario: newComment })
                });

                if (response.ok) {
                    Swal.fire('¡Éxito!', 'Comentario actualizado correctamente', 'success');
                    loadComments();
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire('Error', 'No se pudo actualizar el comentario', 'error');
            }
        }
    }

    async function deleteComment(commentId) {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`http://localhost:3000/api/comentarios/${commentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': token
                    }
                });

                if (response.ok) {
                    Swal.fire('¡Eliminado!', 'El comentario ha sido eliminado', 'success');
                    loadComments();
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire('Error', 'No se pudo eliminar el comentario', 'error');
            }
        }
    }

    // Modificar la función updateAverageRating
    async function updateAverageRating() {
        try {
            const starsContainer = document.querySelector('.stars');
            const ratingText = document.querySelector('.rating-text');
            const stars = starsContainer.querySelectorAll('i');
            
            const response = await fetch('http://localhost:3000/api/comentarios');
            const comments = await response.json();

            if (!comments || comments.length === 0) {
                stars.forEach(star => {
                    star.className = 'far fa-star';
                });
                ratingText.textContent = '0/5 de 0 votos';
                return;
            }

            const totalRating = comments.reduce((sum, comment) => sum + Number(comment.calificacion), 0);
            const average = totalRating / comments.length;
            const roundedAverage = Math.round(average * 10) / 10;

            stars.forEach((star, index) => {
                if (index < Math.floor(average)) {
                    star.className = 'fas fa-star';
                } else if (index === Math.floor(average) && average % 1 > 0) {
                    star.className = 'fas fa-star-half-alt';
                } else {
                    star.className = 'far fa-star';
                }
            });

            ratingText.textContent = `${roundedAverage}/5 de ${comments.length} votos`;
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Cargar comentarios al iniciar
    loadComments();
    // Actualizar el promedio de calificaciones
    updateAverageRating();

    // Agregar la función para manejar las respuestas
    async function replyToComment(commentId) {
        if (!token) {
            Swal.fire({
                title: '¡Necesitas iniciar sesión!',
                text: 'Para responder a un comentario, por favor inicia sesión primero',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Iniciar sesión',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'iniciar_sesion.html';
                }
            });
            return;
        }

        const { value: replyText } = await Swal.fire({
            title: 'Responder al comentario',
            input: 'textarea',
            inputPlaceholder: 'Escribe tu respuesta aquí...',
            showCancelButton: true,
            confirmButtonText: 'Responder',
            cancelButtonText: 'Cancelar'
        });

        if (replyText) {
            try {
                const response = await fetch(`http://localhost:3000/api/comentarios/${commentId}/respuestas`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify({ respuesta: replyText })
                });

                if (response.ok) {
                    await loadComments(); // Recargar comentarios y sus respuestas
                    Swal.fire('¡Éxito!', 'Tu respuesta ha sido publicada', 'success');
                } else {
                    throw new Error('Error al publicar la respuesta');
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire('Error', 'No se pudo publicar la respuesta', 'error');
            }
        }
    }

    // Agregar estas funciones al final del archivo
    async function editReply(replyId) {
        const replyCard = document.querySelector(`[data-reply-id="${replyId}"]`);
        const replyContent = replyCard.querySelector('.reply-content').textContent.trim();

        const { value: newReply } = await Swal.fire({
            title: 'Editar respuesta',
            input: 'textarea',
            inputValue: replyContent,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar'
        });

        if (newReply) {
            try {
                const response = await fetch(`http://localhost:3000/api/comentarios/respuestas/${replyId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify({ respuesta: newReply })
                });

                if (response.ok) {
                    await loadComments(); // Recargar comentarios y respuestas
                    Swal.fire('¡Éxito!', 'Respuesta actualizada correctamente', 'success');
                } else {
                    throw new Error('Error al actualizar la respuesta');
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire('Error', 'No se pudo actualizar la respuesta', 'error');
            }
        }
    }

    async function deleteReply(replyId) {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`http://localhost:3000/api/comentarios/respuestas/${replyId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': token
                    }
                });

                if (response.ok) {
                    await loadComments(); // Recargar comentarios y respuestas
                    Swal.fire('¡Eliminado!', 'La respuesta ha sido eliminada', 'success');
                } else {
                    throw new Error('Error al eliminar la respuesta');
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire('Error', 'No se pudo eliminar la respuesta', 'error');
            }
        }
    }
});