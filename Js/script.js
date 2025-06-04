// Función auxiliar para obtener elementos del DOM de forma silenciosa
function getElement(id) {
    return document.getElementById(id);
}

// Función para actualizar botones de autenticación
function updateAuthButtons() {
    // Obtener el token y nombre de usuario actualizado
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    const userButtons = document.getElementById('userButtons');
    const guestButtons = document.getElementById('guestButtons');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const nombreUsuarioSpan = document.getElementById('nombreUsuario');

    if (userButtons && guestButtons) {
        if (token && userName) {
            userButtons.style.display = 'block';
            guestButtons.style.display = 'none';
            // Actualizar todos los elementos que muestran el nombre de usuario
            if (userNameDisplay) {
                userNameDisplay.textContent = userName;
            }
            if (nombreUsuarioSpan) {
                nombreUsuarioSpan.textContent = userName;
            }
        } else {
            userButtons.style.display = 'none';
            guestButtons.style.display = 'flex';
        }
    }
}

// Agregar un evento para actualizar la UI cuando cambie el localStorage
window.addEventListener('storage', function(e) {
    if (e.key === 'userName') {
        updateAuthButtons();
    }
});

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', updateAuthButtons);