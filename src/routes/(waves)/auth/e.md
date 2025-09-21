📂 Estructura recomendada para login

Dentro de src/lib crea una carpeta auth (más genérico que login, porque incluirá cosas como roles, permisos y recuperación de contraseña).
La estructura podría ser:

src
 └─ lib
     └─ auth
         ├─ components
         │   ├─ LoginForm.svelte
         │   ├─ RegisterForm.svelte
         │   ├─ LogoutButton.svelte
         │   └─ PasswordResetForm.svelte
         │
         ├─ services
         │   ├─ authService.ts        # Lógica de login, logout, registro
         │   ├─ sessionService.ts     # Manejo de sesión, tokens, refresh
         │   └─ roleService.ts        # Validación de permisos/roles
         │
         ├─ stores
         │   └─ authStore.ts          # Estado reactivo (usuario logueado, rol)
         │
         ├─ utils
         │   ├─ passwordUtils.ts      # Hash, validación de contraseñas
         │   ├─ tokenUtils.ts         # Validación, expiración de tokens
         │   └─ auditUtils.ts         # Helper para enviar logs de acciones
         │
         └─ types
             └─ auth.d.ts             # Tipos TS (User, Role, Session, Log)

📂 Rutas relacionadas al login

En src/routes, crea un grupo auth:

src
 └─ routes
     └─ auth
         ├─ login.svelte
         ├─ register.svelte
         ├─ reset-password.svelte
         └─ profile.svelte            # Perfil del usuario

📂 Base de datos y conexión

Ya tienes supabase.ts en src/lib/. Ese archivo debe centralizar la conexión a Supabase.
Adicionalmente:

src
 └─ lib
     └─ db
         ├─ userRepository.ts     # Funciones específicas para CRUD de usuarios
         ├─ roleRepository.ts     # Funciones específicas para roles/permisos
         └─ auditRepository.ts    # Inserción/consulta de logs de auditoría

📂 Configuración y seguridad

.env → ya lo tienes, asegúrate de tener:

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
JWT_SECRET=    # si usas tokens propios


src/lib/config/ (opcional si crece mucho):

authConfig.ts → tiempos de expiración de sesión, políticas de contraseñas.

roleConfig.ts → definición centralizada de roles y permisos.

=================================================================================
🔑 Autenticación

Registro y login de usuarios

⦁	Guardar contraseñas hashadas (usa bcrypt, argon2 o scrypt).

⦁	Validación de email único.

⦁	Confirmación por correo electrónico (si quieres mayor seguridad).

Sesiones y tokens

⦁	Uso de JWT o sesiones gestionadas por Supabase Auth.

⦁	Refresh tokens para mantener sesiones seguras.

⦁	Manejo de expiración de sesión.

👥 Gestión de Roles y Permisos

Tabla de roles

⦁	admin

⦁	investigador

⦁	(posibles futuros: editor, viewer, etc.)

Relación usuario-rol

⦁	Un usuario debe tener al menos un rol asignado.

Reglas de negocio

⦁	admin: CRUD completo (crear, leer, actualizar, eliminar).

⦁	investigador: solo puede insertar registros, no eliminarlos ni modificarlos.

⦁	Posible auditor: solo lectura, pero acceso a logs.

📊 Auditoría y Logs

Tabla de auditoría (ejemplo: audit_logs)

⦁	id

⦁	usuario_id

⦁	acción (login, logout, insert, update, delete)

⦁	tabla_afectada

⦁	registro_id (el id del registro afectado)

⦁	valores_anteriores (JSON)

⦁	valores_nuevos (JSON)

⦁	fecha_hora (timestamp)

⦁	ip / user_agent (opcional, para trazabilidad)

Triggers en la base de datos

⦁	Cada INSERT, UPDATE, DELETE dispara un trigger que guarda el log en audit_logs.

🔒 Seguridad

⦁	Contraseñas hashadas y con salts.

⦁	Políticas de acceso con Row Level Security (RLS) en Supabase.

⦁	Validación de inputs en el backend (no confiar en el frontend).

⦁	Encriptar datos sensibles cuando sea necesario.

⦁	Límites de intentos de login para evitar fuerza bruta.

⦁	Uso de HTTPS obligatorio.

⦁	Posible 2FA (autenticación de dos factores) en el futuro.

🗄️ Tablas principales que necesitas

users (manejado por Supabase Auth o personalizado)

⦁	id, email, password_hash, nombre, rol_id, etc.

roles

⦁	id, nombre, permisos

audit_logs

⦁	Campos mencionados arriba.

tus_tablas_existentes

⦁	Ajustar permisos vía RLS según rol.

🛠️ Cosas extra a considerar

⦁	Panel de administración para ver usuarios, roles y logs.

⦁	Política de contraseñas (mínimo 8 caracteres, mayúscula, número, etc.).

⦁	Logs de login/logout (no solo de cambios en tablas).

⦁	Backups automáticos de la base de datos.

⦁	Escalabilidad de roles (ej. en el futuro roles más granulares).

⦁	Alertas (ej. si un usuario intenta demasiados accesos fallidos).
===========================================================================================================================


