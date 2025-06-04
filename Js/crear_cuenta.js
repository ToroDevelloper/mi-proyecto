document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const securityQuestion = document.getElementById('securityQuestion').value;
    const securityAnswer = document.getElementById('securityAnswer').value.trim();

    // Validación de formato de correo electrónico
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Por favor, ingrese un correo electrónico válido (ejemplo: usuario@dominio.com)'
        });
        return;
    }

    // Validar dominios de correo específicos
    const validDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];
    const emailDomain = email.split('@')[1];
    if (!validDomains.includes(emailDomain)) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Por favor, utilice un correo de Gmail, Hotmail, Outlook o Yahoo'
        });
        return;
    }

    // Añadir logs para debugging
    console.log('Datos a enviar:', {
        nombre,
        email,
        password: '***',
        securityQuestion,
        securityAnswer
    });

    // Validaciones
    if (!nombre || !email || !password || !securityQuestion || !securityAnswer) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Por favor, complete todos los campos'
        });
        return;
    }

    if (password !== confirmPassword) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Las contraseñas no coinciden'
        });
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre,
                email,
                password,
                securityQuestion,
                securityAnswer
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al registrarse');
        }

        Swal.fire({
            icon: 'success',
            title: '¡Registro exitoso!',
            text: 'Tu cuenta ha sido creada correctamente'
        }).then(() => {
            window.location.href = 'iniciar_sesion.html';
        });
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message
        });
        console.error('Error:', error);
    }
});