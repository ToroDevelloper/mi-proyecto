document.addEventListener('DOMContentLoaded', function() {
    // Mostrar/ocultar contraseña
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.closest('.input-group').querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });

    // Manejar el inicio de sesión
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

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
                // Guardar datos en localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('userName', data.nombre);
                localStorage.setItem('isLoggedIn', 'true');
                
                // Mostrar mensaje de éxito
                Swal.fire({
                    title: '¡Bienvenido!',
                    text: `Es un placer tenerle de vuelta, Sr(a). ${data.nombre}`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = 'index.html';
                });
            } else {
                throw new Error('Credenciales incorrectas');
            }
        })
        .catch(error => {
            Swal.fire({
                title: 'Error',
                text: error.message || 'Hubo un problema al iniciar sesión',
                icon: 'error',
                confirmButtonText: 'Ok'
            });
        });
    });

    // Referencia al modal
    const securityQuestionModal = new bootstrap.Modal(document.getElementById('securityQuestionModal'));
    const changePasswordModal = new bootstrap.Modal(document.getElementById('changePasswordModal'));

    // Manejar clic en "¿Olvidaste tu contraseña?"
    document.querySelector('a[href="recuperar_contrasena.html"]').addEventListener('click', function(e) {
        e.preventDefault();
        securityQuestionModal.show();
    });

    // Cargar pregunta de seguridad cuando se ingrese el email
    document.getElementById('recoveryEmail').addEventListener('blur', async function() {
        const email = this.value.trim();
        if (!email) return;

        try {
            // Corregir la URL codificando el email correctamente
            const response = await fetch(`http://localhost:3000/get-security-question/${encodeURIComponent(email)}`);
            const data = await response.json();

            if (data.success) {
                const securityQuestionSelect = document.getElementById('securityQuestionSelect');
                Array.from(securityQuestionSelect.options).forEach(option => {
                    if (option.value === data.question) {
                        option.selected = true;
                    }
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se encontró el usuario con ese correo'
                });
            }
        } catch (error) {
            console.error('Error al cargar la pregunta:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar la pregunta de seguridad'
            });
        }
    });

    // Verificar respuesta
    document.getElementById('verifyAnswerBtn').addEventListener('click', async function() {
        const email = document.getElementById('recoveryEmail').value.trim();
        const selectedQuestion = document.getElementById('securityQuestionSelect').value;
        const answer = document.getElementById('securityAnswer').value.trim();

        if (!email || !selectedQuestion || !answer) {
            Swal.fire({
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
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    question: selectedQuestion,
                    answer: answer.toLowerCase() // Convertir a minúsculas para evitar problemas de mayúsculas
                })
            });

            const data = await response.json();

            if (data.success) {
                const securityQuestionModal = bootstrap.Modal.getInstance(document.getElementById('securityQuestionModal'));
                const changePasswordModal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
                
                securityQuestionModal.hide();
                changePasswordModal.show();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.error || 'La respuesta es incorrecta'
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al verificar la respuesta'
            });
        }
    });

    // Cambiar contraseña
    document.getElementById('changePasswordBtn').addEventListener('click', async function() {
        const email = document.getElementById('recoveryEmail').value.trim();
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (newPassword !== confirmNewPassword) {
            Swal.fire({
                title: 'Error',
                text: 'Las contraseñas no coinciden',
                icon: 'error'
            });
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, newPassword })
            });

            const data = await response.json();

            if (data.success) {
                changePasswordModal.hide();
                Swal.fire({
                    title: '¡Éxito!',
                    text: 'Tu contraseña ha sido cambiada correctamente',
                    icon: 'success'
                }).then(() => {
                    window.location.reload();
                });
            } else {
                throw new Error('No se pudo cambiar la contraseña');
            }
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Hubo un problema al cambiar la contraseña',
                icon: 'error'
            });
        }
    });
});