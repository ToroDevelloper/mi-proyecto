-- Ahora sí modificamos las columnas
ALTER TABLE usuarios 
MODIFY security_question VARCHAR(255) NOT NULL DEFAULT '¿En qué ciudad naciste?',
MODIFY security_answer VARCHAR(255) NOT NULL DEFAULT 'No especificado';

-- Actualizar registros existentes con valores por defecto
UPDATE usuarios 
SET security_question = '¿En qué ciudad naciste?' 
WHERE security_question IS NULL;

UPDATE usuarios 
SET security_answer = 'No especificado' 
WHERE security_answer IS NULL;

-- Verificar la estructura de la tabla
DESC usuarios;

-- Verificar los datos
SELECT email, security_question, security_answer FROM usuarios;