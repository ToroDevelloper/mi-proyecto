const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadDir = 'uploads/profile-photos';

// Crear el directorio si no existe
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

require('dotenv').config();

const app = express();
const PORT = 3000;

// Al inicio del archivo, después de las importaciones
const JWT_SECRET = 'secret_key'; // Usa la misma clave que usas en /login

// Middleware para filtrar datos sensibles
const filterSensitiveData = (req, res, next) => {
    const originalLog = console.log;
    console.log = (...args) => {
        const sanitizedArgs = args.map(arg => {
            if (typeof arg === 'object') {
                return '[Datos filtrados]';
            }
            return arg;
        });
        originalLog.apply(console, sanitizedArgs);
    };
    next();
};

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use(filterSensitiveData);

// Agregar después de los middleware existentes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Conexión a la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'paginaderecetas'
});

db.connect(err => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conexión exitosa a la base de datos');
});

// Almacén temporal de códigos (en producción usar base de datos)
const verificationCodes = new Map();

// Configurar multer para almacenar archivos
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/profile-photos/');
    },
    filename: function(req, file, cb) {
        cb(null, `user-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: function(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Solo se permiten imágenes'));
        }
        cb(null, true);
    }
});

// Ruta para enviar código de verificación
app.post('/send-verification', async (req, res) => {
    const { email } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        await transporter.sendMail({
            from: '"Recetas de Comidas" <tu_correo@gmail.com>',
            to: email,
            subject: 'Código de Verificación',
            html: `
                <h1>Verificación de Correo</h1>
                <p>Tu código de verificación es: <strong>${code}</strong></p>
                <p>Este código expirará en 10 minutos.</p>
            `
        });

        // Guardar código con tiempo de expiración
        verificationCodes.set(email, {
            code,
            expires: Date.now() + 600000 // 10 minutos
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error al enviar correo:', error);
        res.status(500).json({ error: 'Error al enviar código de verificación' });
    }
});

// Ruta para registrar usuarios
app.post('/register', async (req, res) => {
    try {
        const { nombre, email, password, securityQuestion, securityAnswer } = req.body;

        // Log para debugging
        console.log('Datos recibidos en registro:', {
            nombre,
            email,
            securityQuestion,
            securityAnswer
        });

        // Verificar que todos los campos necesarios estén presentes
        if (!nombre || !email || !password || !securityQuestion || !securityAnswer) {
            return res.status(400).json({
                error: 'Todos los campos son requeridos'
            });
        }

        // Verificar si el usuario ya existe
        const checkUser = 'SELECT * FROM usuarios WHERE email = ?';
        db.query(checkUser, [email], async (err, results) => {
            if (err) {
                console.error('Error en consulta:', err);
                throw err;
            }
            
            if (results.length > 0) {
                return res.status(400).json({
                    error: 'El correo ya está registrado'
                });
            }

            // Hash de la contraseña
            const hashedPassword = await bcrypt.hash(password, 10);

            // Query de inserción con los campos de seguridad
            const insertQuery = `
                INSERT INTO usuarios (
                    nombre, 
                    email, 
                    password, 
                    security_question, 
                    security_answer
                ) VALUES (?, ?, ?, ?, ?)
            `;

            // Insertar nuevo usuario
            db.query(
                insertQuery,
                [nombre, email, hashedPassword, securityQuestion, securityAnswer],
                (err, result) => {
                    if (err) {
                        console.error('Error en inserción:', err);
                        return res.status(500).json({
                            error: 'Error al registrar usuario'
                        });
                    }

                    // Log del resultado
                    console.log('Usuario registrado:', result);

                    res.status(201).json({
                        success: true,
                        message: 'Usuario registrado exitosamente'
                    });
                }
            );
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            error: 'Error al registrar usuario'
        });
    }
});

// Ruta para iniciar sesión
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Validar que todos los campos estén presentes
    if (!email || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const query = 'SELECT * FROM usuarios WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ error: 'Usuario no encontrado' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ error: 'Contraseña incorrecta' });
        }

        // Generar un token
        const token = jwt.sign({ id: user.id }, 'secret_key', { expiresIn: '1h' });
        res.json({ token, nombre: user.nombre });
    });
});

// Ruta para verificar el estado del usuario
app.get('/auth', (req, res) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    jwt.verify(token, 'secret_key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token inválido' });
        }

        res.json({ id: decoded.id });
    });
});

// Middleware para verificar el token JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    // Extraer el token eliminando 'Bearer ' si existe
    const token = authHeader.startsWith('Bearer ') ? 
        authHeader.slice(7) : authHeader;

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Error al verificar token:', err);
            return res.status(403).json({ error: 'Token inválido' });
        }

        req.user = user;
        next();
    });
}

// En server.js
app.post('/add-recipe', authenticateToken, async (req, res) => {
    const { 
        nombre_receta, 
        categoria, 
        tiempo,
        ingredientes, 
        pasos, 
        imagen_url, 
        informacion_nutricional 
    } = req.body;

    if (!nombre_receta || !categoria || !ingredientes || !pasos) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    try {
        const query = `
            INSERT INTO recetas (
                nombre_receta,
                categoria,
                tiempo,
                ingredientes,
                pasos,
                imagen_url,
                informacion_nutricional,
                usuario_id,
                nombre_usuario,
                fecha_creacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const [user] = await new Promise((resolve, reject) => {
            db.query('SELECT nombre FROM usuarios WHERE id = ?', [req.user.id], (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });

        await new Promise((resolve, reject) => {
            db.query(
                query,
                [
                    nombre_receta,
                    categoria,
                    tiempo || '30',
                    ingredientes,
                    pasos,
                    imagen_url || 'https://via.placeholder.com/300',
                    informacion_nutricional || '',
                    req.user.id,
                    user.nombre
                ],
                (error, results) => {
                    if (error) {
                        console.error('Error SQL:', error);
                        reject(error);
                    }
                    resolve(results);
                }
            );
        });

        res.status(201).json({ message: 'Receta añadida exitosamente' });
    } catch (error) {
        console.error('Error al añadir receta:', error);
        res.status(500).json({ error: 'Error al añadir la receta: ' + error.message });
    }
});

// Ruta para obtener todas las recetas
app.get('/get-recipes', (req, res) => {
    const query = `
        SELECT r.*, u.nombre as nombre_usuario, u.foto_url as foto_usuario,
               AVG(cr.calificacion) as promedio_calificacion,
               COUNT(cr.id) as total_votos
        FROM recetas r
        LEFT JOIN usuarios u ON r.usuario_id = u.id
        LEFT JOIN comentarios_recetas cr ON r.id = cr.receta_id
        GROUP BY r.id
        ORDER BY r.fecha_creacion DESC
    `;

    db.query(query, (error, results) => {
        if (error) {
            console.error('Error:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        res.json(results);
    });
});

// Modificar la ruta /profile
app.get('/profile', authenticateToken, (req, res) => {
    const query = `
        SELECT 
            id, 
            nombre, 
            email, 
            foto_url, 
            DATE_FORMAT(fecha_registro, '%Y-%m-%d %H:%i:%s') as fecha_registro
        FROM usuarios 
        WHERE id = ?
    `;

    db.query(query, [req.user.id], (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const userData = results[0];
        res.json({
            user: {
                id: userData.id,
                nombre: userData.nombre,
                email: userData.email,
                foto_url: userData.foto_url || 'https://via.placeholder.com/150',
                fecha_registro: userData.fecha_registro
            }
        });
    });
});

// Ruta para obtener las recetas del usuario
app.get('/user-recipes', authenticateToken, (req, res) => {
    const query = `
        SELECT r.*, u.nombre as nombre_usuario
        FROM recetas r
        LEFT JOIN usuarios u ON r.usuario_id = u.id
        WHERE r.usuario_id = ?
        ORDER BY r.fecha_creacion DESC
    `;
    
    db.query(query, [req.user.id], (error, results) => {
        if (error) {
            console.error('Error al obtener recetas del usuario:', error);
            return res.status(500).json({ error: 'Error al obtener las recetas' });
        }
        res.json(results);
    });
});

// Modifica la ruta update-profile
app.put('/update-profile', (req, res) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    jwt.verify(token, 'secret_key', async (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }

        const userId = decoded.id;
        const { nombre, email, currentPassword, newPassword } = req.body;

        // Validar datos básicos
        if (!nombre || !email) {
            return res.status(400).json({ error: 'Nombre y email son requeridos' });
        }

        try {
            // Iniciar transacción
            await new Promise((resolve, reject) => {
                db.beginTransaction(err => {
                    if (err) reject(err);
                    resolve();
                });
            });

            // Si hay cambio de contraseña
            if (currentPassword && newPassword) {
                // Verificar contraseña actual
                const [userResults] = await new Promise((resolve, reject) => {
                    db.query('SELECT password FROM usuarios WHERE id = ?', [userId], (err, results) => {
                        if (err) reject(err);
                        resolve([results]);
                    });
                });

                if (userResults.length === 0) {
                    await new Promise(resolve => db.rollback(resolve));
                    return res.status(404).json({ error: 'Usuario no encontrado' });
                }

                const isValid = await bcrypt.compare(currentPassword, userResults[0].password);
                if (!isValid) {
                    await new Promise(resolve => db.rollback(resolve));
                    return res.status(401).json({ error: 'Contraseña actual incorrecta' });
                }

                // Hash de la nueva contraseña
                const hashedPassword = await bcrypt.hash(newPassword, 10);

                // Actualizar usuario con nueva contraseña
                await new Promise((resolve, reject) => {
                    db.query('UPDATE usuarios SET nombre = ?, email = ?, password = ? WHERE id = ?',
                        [nombre, email, hashedPassword, userId],
                        (err) => {
                            if (err) reject(err);
                            resolve();
                        });
                });
            } else {
                // Actualizar solo nombre y email
                await new Promise((resolve, reject) => {
                    db.query('UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?',
                        [nombre, email, userId],
                        (err) => {
                            if (err) reject(err);
                            resolve();
                        });
                });
            }

            // Actualizar nombre en todas las recetas del usuario
            await new Promise((resolve, reject) => {
                db.query('UPDATE recetas SET nombre_usuario = ? WHERE usuario_id = ?',
                    [nombre, userId],
                    (err) => {
                        if (err) reject(err);
                        resolve();
                    });
            });

            // Confirmar transacción
            await new Promise((resolve, reject) => {
                db.commit(err => {
                    if (err) {
                        db.rollback(() => reject(err));
                    }
                    resolve();
                });
            });

            res.json({
                user: { nombre, email },
                message: 'Perfil actualizado correctamente'
            });

        } catch (error) {
            // Rollback en caso de error
            await new Promise(resolve => db.rollback(resolve));
            console.error('Error en la actualización:', error);
            res.status(500).json({ error: 'Error al actualizar el perfil' });
        }
    });
});

// Reemplazar la ruta /update-password actual con esta versión
app.put('/update-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    try {
        // Obtener usuario actual
        const [user] = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM usuarios WHERE id = ?', [req.user.id], (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });

        // Verificar contraseña actual
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Contraseña actual incorrecta' });
        }

        // Hash nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar contraseña
        await new Promise((resolve, reject) => {
            db.query('UPDATE usuarios SET password = ? WHERE id = ?', 
                [hashedPassword, req.user.id], 
                (err, results) => {
                    if (err) reject(err);
                    resolve(results);
                });
        });

        res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al actualizar la contraseña' });
    }
});

app.get('/get-recipe/:id', (req, res) => {
    const query = `
        SELECT r.*, u.nombre as nombre_usuario
        FROM recetas r
        LEFT JOIN usuarios u ON r.usuario_id = u.id
        WHERE r.id = ?
    `;
    
    db.query(query, [req.params.id], (error, results) => {
        if (error) {
            console.error('Error al obtener la receta:', error);
            return res.status(500).json({ error: 'Error al obtener la receta' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Receta no encontrada' });
        }
        
        res.json(results[0]);
    });
});

// Ruta para eliminar una receta
app.delete('/delete-recipe/:id', authenticateToken, (req, res) => {
    const query = `
        DELETE FROM recetas 
        WHERE id = ? AND usuario_id = ?
    `;
    
    db.query(query, [req.params.id, req.user.id], (error, results) => {
        if (error) {
            console.error('Error al eliminar la receta:', error);
            return res.status(500).json({ error: 'Error al eliminar la receta' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Receta no encontrada o no autorizado' });
        }
        
        res.json({ message: 'Receta eliminada correctamente' });
    });
});

// Añade esta nueva ruta para eliminar la cuenta
app.delete('/delete-account', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    // Iniciar transacción
    db.beginTransaction(async (err) => {
        if (err) {
            console.error('Error al iniciar transacción:', err);
            return res.status(500).json({ error: 'Error al eliminar la cuenta' });
        }

        try {
            // Primero eliminar todas las recetas del usuario
            await new Promise((resolve, reject) => {
                db.query('DELETE FROM recetas WHERE usuario_id = ?', [userId], (error) => {
                    if (error) reject(error);
                    resolve();
                });
            });

            // Luego eliminar el usuario
            await new Promise((resolve, reject) => {
                db.query('DELETE FROM usuarios WHERE id = ?', [userId], (error) => {
                    if (error) reject(error);
                    resolve();
                });
            });

            // Confirmar transacción
            db.commit((error) => {
                if (error) {
                    console.error('Error al confirmar transacción:', error);
                    return db.rollback(() => {
                        res.status(500).json({ error: 'Error al eliminar la cuenta' });
                    });
                }
                res.json({ message: 'Cuenta eliminada correctamente' });
            });

        } catch (error) {
            console.error('Error en la eliminación:', error);
            return db.rollback(() => {
                res.status(500).json({ error: 'Error al eliminar la cuenta' });
            });
        }
    });
});

// Obtener una receta específica
app.get('/recipe/:id', authenticateToken, async (req, res) => {
    try {
        const [recipe] = await new Promise((resolve, reject) => {
            db.query(
                'SELECT * FROM recetas WHERE id = ? AND usuario_id = ?',
                [req.params.id, req.user.id],
                (error, results) => {
                    if (error) reject(error);
                    resolve(results);
                }
            );
        });

        if (!recipe) {
            return res.status(404).json({ error: 'Receta no encontrada' });
        }

        res.json(recipe);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener la receta' });
    }
});

// Actualizar una receta
app.put('/recipe/:id', authenticateToken, async (req, res) => {
    const { 
        nombre_receta, 
        categoria, 
        tiempo,
        ingredientes, 
        pasos, 
        imagen_url, 
        informacion_nutricional 
    } = req.body;

    try {
        await new Promise((resolve, reject) => {
            db.query(
                `UPDATE recetas SET 
                    nombre_receta = ?,
                    categoria = ?,
                    tiempo = ?,
                    ingredientes = ?,
                    pasos = ?,
                    imagen_url = ?,
                    informacion_nutricional = ?
                WHERE id = ? AND usuario_id = ?`,
                [
                    nombre_receta,
                    categoria,
                    tiempo,
                    ingredientes,
                    pasos,
                    imagen_url,
                    informacion_nutricional,
                    req.params.id,
                    req.user.id
                ],
                (error, results) => {
                    if (error) reject(error);
                    if (results.affectedRows === 0) {
                        reject(new Error('Receta no encontrada o no autorizada'));
                    }
                    resolve(results);
                }
            );
        });

        res.json({ message: 'Receta actualizada exitosamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Eliminar una receta
app.delete('/recipe/:id', authenticateToken, async (req, res) => {
    try {
        await new Promise((resolve, reject) => {
            db.query(
                'DELETE FROM recetas WHERE id = ? AND usuario_id = ?',
                [req.params.id, req.user.id],
                (error, results) => {
                    if (error) reject(error);
                    if (results.affectedRows === 0) {
                        reject(new Error('Receta no encontrada o no autorizada'));
                    }
                    resolve(results);
                }
            );
        });

        res.json({ message: 'Receta eliminada exitosamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Ruta para actualizar foto de perfil
app.post('/update-profile-photo', authenticateToken, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo' });
        }

        const photoUrl = `/uploads/profile-photos/${req.file.filename}`;

        // Obtener la foto anterior para eliminarla
        const [oldPhoto] = await new Promise((resolve, reject) => {
            db.query('SELECT foto_url FROM usuarios WHERE id = ?', 
                [req.user.id], 
                (err, results) => {
                    if (err) reject(err);
                    resolve(results);
                });
        });

        // Eliminar la foto anterior si existe
        if (oldPhoto && oldPhoto.foto_url) {
            const oldPhotoPath = path.join(__dirname, oldPhoto.foto_url);
            if (fs.existsSync(oldPhotoPath)) {
                fs.unlinkSync(oldPhotoPath);
            }
        }

        // Actualizar URL de la foto en la base de datos
        await new Promise((resolve, reject) => {
            db.query('UPDATE usuarios SET foto_url = ? WHERE id = ?', 
                [photoUrl, req.user.id], 
                (err, results) => {
                    if (err) reject(err);
                    resolve();
                });
        });

        res.json({ 
            message: 'Foto actualizada correctamente',
            photoUrl: photoUrl
        });

    } catch (error) {
        console.error('Error:', error);
        // Si algo falla, eliminar la foto que se acaba de subir
        if (req.file) {
            const filePath = path.join(__dirname, '/uploads/profile-photos/', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        res.status(500).json({ error: 'Error al actualizar la foto' });
    }
});

// Modifica la ruta de verificación del token
app.get('/verify-token', (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ valid: false, message: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ valid: false, message: 'Formato de token inválido' });
    }

    try {
        // Usar la misma clave secreta que en /login
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ valid: true, user: decoded });
    } catch (error) {
        console.error('Error de verificación de token:', error);
        res.status(401).json({ valid: false, message: 'Token inválido' });
    }
});

app.get('/recipes', async (req, res) => {
    try {
        const query = `
            SELECT r.*, u.nombre as nombre_usuario, u.foto_url as user_photo 
            FROM recetas r 
            JOIN usuarios u ON r.usuario_id = u.id
        `;
        const result = await new Promise((resolve, reject) => {
            db.query(query, (error, results) => {
                if (error) reject(error);
                resolve(results);
            });
        });
        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al cargar las recetas' });
    }
});

// Agregar nueva ruta para obtener la pregunta de seguridad
app.get('/get-security-question/:email', (req, res) => {
    const email = req.params.email;
    
    const query = 'SELECT security_question FROM usuarios WHERE email = ?';
    
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error('Error al obtener la pregunta:', err);
            return res.status(500).json({
                success: false,
                error: 'Error al obtener la pregunta de seguridad'
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            question: results[0].security_question
        });
    });
});

app.post('/verify-security-answer', async (req, res) => {
    try {
        const { email, question, answer } = req.body;
        
        // Usar una promesa con la consulta
        const query = 'SELECT * FROM usuarios WHERE email = ? AND security_question = ? AND security_answer = ?';
        
        db.query(query, [email, question, answer], (err, results) => {
            if (err) {
                console.error('Error en la consulta:', err);
                return res.json({ 
                    success: false, 
                    error: 'Error al verificar la respuesta' 
                });
            }

            if (results.length > 0) {
                return res.json({ success: true });
            } else {
                return res.json({ 
                    success: false, 
                    error: 'Respuesta incorrecta' 
                });
            }
        });

    } catch (error) {
        console.error('Error en el servidor:', error);
        res.json({ 
            success: false, 
            error: 'Error al verificar la respuesta' 
        });
    }
});

// Agregar la ruta para restablecer la contraseña
app.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ 
            success: false, 
            error: 'Email y nueva contraseña son requeridos' 
        });
    }

    try {
        // Encriptar la nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar la contraseña en la base de datos
        const query = 'UPDATE usuarios SET password = ? WHERE email = ?';
        db.query(query, [hashedPassword, email], (error, results) => {
            if (error) {
                console.error('Error al actualizar la contraseña:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error al actualizar la contraseña' 
                });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Usuario no encontrado' 
                });
            }

            res.json({ 
                success: true, 
                message: 'Contraseña actualizada correctamente' 
            });
        });
    } catch (error) {
        console.error('Error al encriptar la contraseña:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
});

// Verificar que esta ruta esté correctamente definida
app.get('/api/search', (req, res) => {
    const searchTerm = req.query.term;
    
    if (!searchTerm) {
        return res.status(400).json({ error: 'Término de búsqueda requerido' });
    }

    const query = `
        SELECT r.*, 
               u.nombre as nombre_usuario,
               u.foto_url as foto_usuario,
               AVG(cr.calificacion) as promedio_calificacion,
               COUNT(cr.id) as total_votos
        FROM recetas r
        LEFT JOIN usuarios u ON r.usuario_id = u.id
        LEFT JOIN comentarios_recetas cr ON r.id = cr.receta_id
        WHERE 
            r.nombre_receta LIKE ? OR
            r.categoria LIKE ? OR
            r.ingredientes LIKE ? OR
            r.informacion_nutricional LIKE ?
        GROUP BY r.id
        ORDER BY r.fecha_creacion DESC
    `;

    const searchPattern = `%${searchTerm}%`;
    
    db.query(query, [searchPattern, searchPattern, searchPattern, searchPattern], (error, results) => {
        if (error) {
            console.error('Error en la búsqueda:', error);
            return res.status(500).json({ error: 'Error en la búsqueda' });
        }
        res.json(results);
    });
});

// Ruta para obtener comentarios
app.get('/api/comentarios', (req, res) => {
    const query = `
        SELECT c.*, u.nombre as nombre_usuario, u.foto_url as avatar_url 
        FROM comentarios c
        LEFT JOIN usuarios u ON c.usuario_id = u.id
        ORDER BY c.fecha_comentario DESC
    `;
    
    db.query(query, (error, results) => {
        if (error) {
            console.error('Error al obtener comentarios:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        res.json(results);
    });
});

// Ruta para crear comentarios
app.post('/api/comentarios', authenticateToken, async (req, res) => {
    try {
        const { comentario, calificacion } = req.body;
        const usuario_id = req.user.id;
        
        // Cambiamos connection por db
        const query = `
            INSERT INTO comentarios (usuario_id, comentario, calificacion, fecha_comentario, receta_id) 
            VALUES (?, ?, ?, NOW(), 1)
        `;
        
        db.query(query, [usuario_id, comentario, calificacion], (error, results) => {
            if (error) {
                console.error('Error al crear comentario:', error);
                res.status(500).json({ error: 'Error al crear el comentario' });
                return;
            }
            res.status(201).json({ message: 'Comentario creado exitosamente' });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para editar un comentario
app.put('/api/comentarios/:id', authenticateToken, async (req, res) => {
    try {
        const commentId = req.params.id;
        const { comentario } = req.body;

        // Verificar que el comentario pertenece al usuario
        const [comment] = await new Promise((resolve, reject) => {
            db.query('SELECT usuario_id FROM comentarios WHERE id = ?', 
                [commentId], 
                (err, results) => {
                    if (err) reject(err);
                    resolve(results);
                });
        });

        if (!comment || comment.usuario_id !== req.user.id) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        await new Promise((resolve, reject) => {
            db.query('UPDATE comentarios SET comentario = ? WHERE id = ?', 
                [comentario, commentId], 
                (err, results) => {
                    if (err) reject(err);
                    resolve(results);
                });
        });

        res.json({ message: 'Comentario actualizado correctamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al actualizar el comentario' });
    }
});

// Ruta para eliminar un comentario
app.delete('/api/comentarios/:id', authenticateToken, async (req, res) => {
    try {
        const commentId = req.params.id;

        // Verificar que el comentario pertenece al usuario
        const [comment] = await new Promise((resolve, reject) => {
            db.query('SELECT usuario_id FROM comentarios WHERE id = ?', 
                [commentId], 
                (err, results) => {
                    if (err) reject(err);
                    resolve(results);
                });
        });

        if (!comment || comment.usuario_id !== req.user.id) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        await new Promise((resolve, reject) => {
            db.query('DELETE FROM comentarios WHERE id = ?', 
                [commentId], 
                (err, results) => {
                    if (err) reject(err);
                    resolve(results);
                });
        });

        res.json({ message: 'Comentario eliminado correctamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al eliminar el comentario' });
    }
});

// Ruta para obtener respuestas de un comentario
app.get('/api/comentarios/:id/respuestas', (req, res) => {
    const query = `
        SELECT r.*, u.nombre as nombre_usuario, u.foto_url as avatar_url 
        FROM respuestas_comentarios r
        LEFT JOIN usuarios u ON r.usuario_id = u.id
        WHERE r.comentario_id = ?
        ORDER BY r.fecha_respuesta ASC
    `;
    
    db.query(query, [req.params.id], (error, results) => {
        if (error) {
            console.error('Error al obtener respuestas:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        res.json(results);
    });
});

// Ruta para crear una respuesta
app.post('/api/comentarios/:id/respuestas', authenticateToken, (req, res) => {
    const { respuesta } = req.body;
    const comentarioId = req.params.id;
    const usuarioId = req.user.id;

    const query = `
        INSERT INTO respuestas_comentarios (comentario_id, usuario_id, respuesta)
        VALUES (?, ?, ?)
    `;
    
    db.query(query, [comentarioId, usuarioId, respuesta], (error, results) => {
        if (error) {
            console.error('Error al crear respuesta:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        res.status(201).json({ message: 'Respuesta creada exitosamente' });
    });
});

// Eliminar la ruta PUT de respuestas y dejar solo la DELETE
app.delete('/api/respuestas_comentarios_recetas/:id', authenticateToken, (req, res) => {
    const respuestaId = req.params.id;
    const usuarioId = req.user.id;

    const query = `
        DELETE FROM respuestas_comentarios_recetas 
        WHERE id = ? AND usuario_id = ?
    `;
    
    db.query(query, [respuestaId, usuarioId], (error, results) => {
        if (error) {
            console.error('Error al eliminar respuesta:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        if (results.affectedRows === 0) {
            return res.status(403).json({ error: 'No autorizado para eliminar esta respuesta' });
        }
        res.json({ message: 'Respuesta eliminada exitosamente' });
    });
});

// Ruta para obtener comentarios de recetas
app.get('/api/comentarios_recetas', (req, res) => {
    const recetaId = req.query.recipeId;
    const query = `
        SELECT cr.*, u.nombre as nombre_usuario, u.foto_url as avatar_url 
        FROM comentarios_recetas cr
        LEFT JOIN usuarios u ON cr.usuario_id = u.id
        WHERE cr.receta_id = ?
        ORDER BY cr.fecha_comentario DESC
    `;
    
    db.query(query, [recetaId], (error, results) => {
        if (error) {
            console.error('Error al obtener comentarios:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        res.json(results);
    });
});

// Ruta para crear comentarios de recetas
app.post('/api/comentarios_recetas', authenticateToken, (req, res) => {
    const { receta_id, comentario, calificacion } = req.body;
    const usuario_id = req.user.id;
    
    const query = `
        INSERT INTO comentarios_recetas 
        (usuario_id, receta_id, comentario, calificacion, fecha_comentario) 
        VALUES (?, ?, ?, ?, NOW())
    `;
    
    db.query(query, [usuario_id, receta_id, comentario, calificacion], (error, results) => {
        if (error) {
            console.error('Error al crear comentario:', error);
            return res.status(500).json({ error: 'Error al crear el comentario' });
        }
        res.status(201).json({ message: 'Comentario creado exitosamente' });
    });
});

// Ruta para obtener respuestas a comentarios de recetas
app.get('/api/respuestas_comentarios_recetas/:comentarioId', (req, res) => {
    const comentarioId = req.params.comentarioId;
    const query = `
        SELECT rcr.*, u.nombre as nombre_usuario, u.foto_url as avatar_url 
        FROM respuestas_comentarios_recetas rcr
        LEFT JOIN usuarios u ON rcr.usuario_id = u.id
        WHERE rcr.comentario_id = ?
        ORDER BY rcr.fecha_respuesta ASC
    `;
    
    db.query(query, [comentarioId], (error, results) => {
        if (error) {
            console.error('Error al obtener respuestas:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        res.json(results);
    });
});

// Ruta para crear respuestas a comentarios de recetas
app.post('/api/respuestas_comentarios_recetas', authenticateToken, (req, res) => {
    const { comentario_id, respuesta } = req.body;
    const usuario_id = req.user.id;

    const query = `
        INSERT INTO respuestas_comentarios_recetas 
        (comentario_id, usuario_id, respuesta, fecha_respuesta) 
        VALUES (?, ?, ?, NOW())
    `;
    
    db.query(query, [comentario_id, usuario_id, respuesta], (error, results) => {
        if (error) {
            console.error('Error al crear respuesta:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        res.status(201).json({ message: 'Respuesta creada exitosamente' });
    });
});

// Modificar la ruta PUT de comentarios
app.put('/api/comentarios_recetas/:id', authenticateToken, (req, res) => {
    const comentarioId = req.params.id;
    const { comentario, calificacion } = req.body;
    const userId = req.user.id;

    const query = `
        UPDATE comentarios_recetas 
        SET comentario = ?, calificacion = ? 
        WHERE id = ? AND usuario_id = ?
    `;

    db.query(query, [comentario, calificacion, comentarioId, userId], (error, results) => {
        if (error) {
            console.error('Error al actualizar comentario:', error);
            return res.status(500).json({ error: 'Error al actualizar el comentario' });
        }

        if (results.affectedRows === 0) {
            return res.status(403).json({ error: 'No autorizado para editar este comentario' });
        }

        res.json({ message: 'Comentario actualizado correctamente' });
    });
});

// Ruta para eliminar comentario
app.delete('/api/comentarios_recetas/:id', authenticateToken, (req, res) => {
    const comentarioId = req.params.id;
    const userId = req.user.id;

    const query = `
        DELETE FROM comentarios_recetas 
        WHERE id = ? AND usuario_id = ?
    `;

    db.query(query, [comentarioId, userId], (error, results) => {
        if (error) {
            console.error('Error al eliminar comentario:', error);
            return res.status(500).json({ error: 'Error al eliminar el comentario' });
        }

        if (results.affectedRows === 0) {
            return res.status(403).json({ error: 'No autorizado para eliminar este comentario' });
        }

        res.json({ message: 'Comentario eliminado correctamente' });
    });
});

// Ruta para eliminar respuestas
app.delete('/api/respuestas_recetas/:id', authenticateToken, async (req, res) => {
    try {
        const respuestaId = req.params.id;
        const userId = req.user.id;

        // Primero verificamos si el usuario es el dueño de la respuesta
        const checkQuery = 'SELECT usuario_id FROM respuestas_comentarios_recetas WHERE id = ?';
        db.query(checkQuery, [respuestaId], (checkErr, checkResults) => {
            if (checkErr) {
                console.error('Error al verificar la respuesta:', checkErr);
                return res.status(500).json({ message: 'Error interno del servidor' });
            }

            if (checkResults.length === 0) {
                return res.status(404).json({ message: 'Respuesta no encontrada' });
            }

            if (checkResults[0].usuario_id !== userId) {
                return res.status(403).json({ message: 'No autorizado para eliminar esta respuesta' });
            }

            // Si el usuario es el dueño, procedemos a eliminar
            const deleteQuery = 'DELETE FROM respuestas_comentarios_recetas WHERE id = ?';
            db.query(deleteQuery, [respuestaId], (deleteErr, deleteResults) => {
                if (deleteErr) {
                    console.error('Error al eliminar la respuesta:', deleteErr);
                    return res.status(500).json({ message: 'Error al eliminar la respuesta' });
                }

                res.json({ message: 'Respuesta eliminada correctamente' });
            });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Asegúrate de que el middleware authenticateToken esté definido correctamente
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    // Extraer el token eliminando 'Bearer ' si existe
    const token = authHeader.startsWith('Bearer ') ? 
        authHeader.slice(7) : authHeader;

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Error al verificar token:', err);
            return res.status(403).json({ error: 'Token inválido' });
        }

        req.user = user;
        next();
    });
}

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Agregar esta nueva ruta después de las rutas existentes
app.get('/featured-recipes', (req, res) => {
    const query = `
        SELECT r.*, 
               u.nombre as nombre_usuario, 
               u.foto_url as foto_usuario,
               AVG(cr.calificacion) as promedio_calificacion,
               COUNT(cr.id) as total_votos
        FROM recetas r
        LEFT JOIN usuarios u ON r.usuario_id = u.id
        LEFT JOIN comentarios_recetas cr ON r.id = cr.receta_id
        GROUP BY r.id
        HAVING promedio_calificacion IS NOT NULL
        ORDER BY promedio_calificacion DESC, RAND()
        LIMIT 3
    `;

    db.query(query, (error, results) => {
        if (error) {
            console.error('Error al obtener recetas destacadas:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        res.json(results);
    });
});