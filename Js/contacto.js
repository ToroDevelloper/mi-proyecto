document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('#contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
        // Agregar validación en tiempo real
        const inputs = contactForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => validateInput(input));
        });
    }

    // Añadir funcionalidad al botón de cerrar sesión
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
});


async function handleContactSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
        Swal.fire({
            icon: 'error',
            title: 'Error de validación',
            text: 'Por favor, complete todos los campos correctamente'
        });
        return;
    }

    const formData = {
        name: document.querySelector('#name').value.trim(),
        email: document.querySelector('#email').value.trim(),
        subject: document.querySelector('#subject').value.trim(),
        message: document.querySelector('#message').value.trim()
    };

    try {
        const loadingAlert = Swal.fire({
            title: 'Enviando mensaje...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch('http://localhost:3000/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });

        await loadingAlert.close();

        if (!response.ok) {
            throw new Error(await response.text());
        }

        Swal.fire({
            icon: 'success',
            title: '¡Mensaje enviado!',
            text: 'Nos pondremos en contacto contigo pronto'
        });

        document.querySelector('#contactForm').reset();

    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Hubo un error al enviar el mensaje'
        });
    }
}

function validateInput(input) {
    const value = input.value.trim();
    const isValid = value.length > 0;
    
    if (input.id === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValidEmail = emailRegex.test(value);
        input.classList.toggle('is-invalid', !isValidEmail);
        input.classList.toggle('is-valid', isValidEmail);
        return isValidEmail;
    }

    input.classList.toggle('is-invalid', !isValid);
    input.classList.toggle('is-valid', isValid);
    return isValid;
}

function validateForm() {
    const form = document.querySelector('#contactForm');
    if (!form) return false;

    const inputs = form.querySelectorAll('input, textarea');
    let isValid = true;

    inputs.forEach(input => {
        if (!validateInput(input)) {
            isValid = false;
        }
    });

    return isValid;
}