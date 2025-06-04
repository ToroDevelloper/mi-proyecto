document.addEventListener('DOMContentLoaded', function() {
    // Verificar estado de autenticación usando token
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    
    // Configurar el botón de logout
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
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Limpiar localStorage
                    localStorage.removeItem('token');
                    localStorage.removeItem('userName');
                    
                    // Mostrar mensaje de éxito
                    Swal.fire({
                        icon: 'success',
                        title: '¡Sesión cerrada!',
                        text: 'Has cerrado sesión correctamente',
                        showConfirmButton: false,
                        timer: 1500
                    }).then(() => {
                        window.location.href = 'index.html';
                    });
                }
            });
        });
    }

    // Animación de scroll suave para links internos
    setupSmoothScroll();

    // Manejo del navbar en scroll
    handleNavbarScroll();

    // Configurar observador para animaciones al scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    // Observar secciones para animaciones
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('section-fade');
        observer.observe(section);
    });
});

// Funciones auxiliares
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function handleNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}