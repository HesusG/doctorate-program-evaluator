# Graduate Programs Evaluator

Una aplicación web para explorar y gestionar programas de doctorado en universidades españolas, con enfoque en ciencias químicas, biomédicas y relacionadas.

## Características

- Visualización de programas de doctorado en un mapa interactivo
- Vista de tabla con capacidad de edición
- Filtrado por múltiples criterios
- Gestión de universidades y programas (agregar, editar, eliminar)
- Panel de información detallada
- Interfaz moderna y responsiva
- Análisis de programas con métricas académicas
- Gestión de estado de aplicación (pendiente, considerando, interesado, aplicando, descartado)
- Sistema de calificación de programas (1-10)
- Favoritos y ranking de programas
- Autenticación segura con JWT (registro solo en localhost)
- Enriquecimiento de datos con OpenAI
- Herramientas de administración de base de datos

## Tecnologías utilizadas

- Frontend: HTML, CSS, JavaScript (vanilla)
- Backend: Node.js, Express
- Base de datos: MongoDB
- Mapas: Leaflet.js
- Visualización: Chart.js
- AI: OpenAI API (GPT-3.5)
- Autenticación: JWT, bcrypt
- Administración: Python (Jupyter Notebook)

## Estructura del proyecto

```
graduate-programs-evaluator/
├── index.html         # Página principal
├── styles.css         # Estilos CSS
├── script.js          # Lógica del frontend
├── server.js          # API y servidor backend
├── import-data.js     # Script para importar datos
├── doctorados.programas.json  # Datos iniciales en formato JSON
├── users.json         # Almacenamiento de usuarios para autenticación
├── utils/             # Utilidades y herramientas
│   ├── mongo-backup.js # Herramienta de backup y restauración
│   ├── data-enricher.js # Enriquecimiento de datos con OpenAI
│   └── cli.js         # Interfaz de línea de comandos
├── backups/           # Directorio para backups de la base de datos
├── admin_notebook.ipynb # Notebook de administración en Python
├── .env               # Variables de entorno
├── .env.example       # Ejemplo de variables de entorno
└── package.json       # Dependencias
```

## Instalación

1. Clona este repositorio:
   ```
   git clone https://github.com/tu-usuario/graduate-programs-evaluator.git
   cd graduate-programs-evaluator
   ```

2. Instala las dependencias:
   ```
   npm install
   ```

3. Configura las variables de entorno:
   - Crea un archivo `.env` basado en el archivo `.env.example` proporcionado:
     ```
     cp .env.example .env
     ```
   - Edita el archivo `.env` con tus valores:
     - Configura la URL de conexión a MongoDB
     - Configura tu API Key de OpenAI (para enriquecimiento de datos)
     - Configura el JWT_SECRET para autenticación (ver sección de Autenticación)

4. Importa los datos iniciales a MongoDB:
   ```
   node import-data.js
   ```

5. Inicia el servidor:
   ```
   npm start
   ```

6. Abre la aplicación en tu navegador:
   ```
   http://localhost:3000
   ```

## Desarrollo

Para iniciar el servidor en modo desarrollo con recarga automática:
```
npm run dev
```

## Herramientas de administración

### CLI para gestión de base de datos

La aplicación incluye una interfaz de línea de comandos para administrar la base de datos:

```
node utils/cli.js
```

Con esta herramienta puedes:
- Crear backups de la base de datos
- Restaurar desde backups
- Importar datos desde archivos JSON
- Enriquecer datos con OpenAI
- Ver estadísticas de la base de datos
- Eliminar documentos

### Scripts de utilidad

#### Backup y restauración

```
# Crear un backup
node utils/mongo-backup.js backup [colección]

# Restaurar desde un backup
node utils/mongo-backup.js restore <ruta-del-backup> [colección-destino] [sobrescribir]

# Listar backups disponibles
node utils/mongo-backup.js list
```

#### Enriquecimiento de datos

```
# Enriquecer datos con OpenAI
node utils/data-enricher.js enrich [colección] [crear-backup]
```

### Notebook de Python

Para análisis avanzado y administración, puedes utilizar el notebook de Jupyter:

```
jupyter notebook admin_notebook.ipynb
```

El notebook proporciona funcionalidades para:
- Conexión a MongoDB
- Backup y restauración de datos
- Enriquecimiento con OpenAI
- Visualización con mapas interactivos y gráficos radiales
- Consultas y filtros personalizados

## Estructura de la base de datos

La base de datos tiene una colección principal:

- `programas`: Almacena información sobre los programas de doctorado

Cada documento en la colección `programas` tiene la siguiente estructura:

```json
{
  "_id": ObjectId,
  "universidad": "Nombre de la Universidad",
  "ciudad": "Ciudad",
  "programa": "Nombre del Programa de Doctorado",
  "linea_investigacion": "Descripción de las líneas de investigación",
  "url": "URL del programa",
  "status": "Estado de la aplicación (pendiente, considerando, interesado, aplicando, descartado)",
  "resumen": "Resumen generado por IA de las líneas de investigación",
  "coords": {
    "lat": "Latitud de la ciudad",
    "lon": "Longitud de la ciudad"
  },
  "stats": {
    "innovacion": "Puntuación de innovación (1-10)",
    "interdisciplinariedad": "Puntuación de interdisciplinariedad (1-10)",
    "impacto": "Puntuación de impacto potencial (1-10)",
    "internacional": "Puntuación de competitividad internacional (1-10)",
    "aplicabilidad": "Puntuación de aplicabilidad (1-10)"
  },
  "calificacion": {
    "valor": "Calificación del usuario (1-10)",
    "estado": "Estado de la calificación (pendiente, calificado)",
    "fecha": "Fecha y hora de la calificación (formato ISO, hora de México)",
    "contador": "Número de veces calificado",
    "usuario": "Nombre del usuario que calificó",
    "usuario_id": "ID del usuario que calificó"
  },
  "ciudad_metrics": {
    "costo_vida": "Índice de costo de vida (0-100)",
    "costo_vida_comentario": "Descripción del costo de vida",
    "calidad_servicio_medico": "Puntuación de calidad sanitaria (1-10)",
    "calidad_servicio_medico_comentario": "Descripción de la calidad sanitaria",
    "calidad_transporte": "Puntuación del transporte público (1-10)",
    "calidad_transporte_comentario": "Descripción del transporte público",
    "calidad_aire": "Puntuación de la calidad del aire (1-10)",
    "calidad_aire_comentario": "Descripción de la calidad del aire",
    "distancia_a_madrid_km": "Distancia a Madrid en km"
  }
}
```

## API Endpoints

- `GET /api/programas`: Obtiene todos los programas
- `GET /api/universidades`: Obtiene programas agrupados por universidad
- `POST /api/universidades`: Agrega una nueva universidad
- `POST /api/programas`: Agrega un nuevo programa
- `DELETE /api/programas/:id`: Elimina un programa
- `PATCH /api/programas/:id/status`: Actualiza el estado de un programa
- `POST /api/enrich`: Enriquece los datos con OpenAI
- `GET /api/analysis`: Obtiene datos para análisis
- `POST /api/register`: Registra un nuevo usuario (solo disponible en localhost)
- `POST /api/login`: Inicia sesión y obtiene un token JWT
- `GET /api/verify-token`: Verifica si un token JWT es válido
- `PUT /api/programas/:id/calificacion`: Actualiza la calificación de un programa (requiere autenticación)

## Autenticación

La aplicación cuenta con un sistema de autenticación basado en JWT (JSON Web Tokens) que permite:
- Registro de usuarios (solo disponible en localhost por seguridad)
- Inicio de sesión con generación de token JWT
- Protección de rutas sensibles (como calificación de programas)

### Configuración del JWT Secret

Para configurar el secreto JWT necesario para la autenticación:

1. **Generar un secreto seguro**:
   ```bash
   # Método 1: Usando Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Método 2: Usando OpenSSL
   openssl rand -hex 32
   ```

2. **Configurar el secreto en el archivo .env**:
   ```
   JWT_SECRET=tu_secreto_generado_aqui
   ```

3. **Para desarrollo local**: Si no se especifica un JWT_SECRET en el archivo .env, la aplicación utilizará un valor por defecto ('desarrollo_local_secreto_temporal'). **Esto es inseguro y solo debe usarse en desarrollo local**.

4. **Para producción**: Es OBLIGATORIO configurar un JWT_SECRET seguro en el entorno de producción.

### Configuración en Render (o similar)

Si despliegas la aplicación en Render:

1. Ve a tu dashboard de Render
2. Selecciona tu servicio
3. Dirígete a "Environment"
4. Agrega una variable de entorno llamada `JWT_SECRET` con el valor generado
5. Haz clic en "Save Changes" para aplicar los cambios

### Gestión de usuarios

Los usuarios se almacenan en un archivo JSON local (`users.json`). Este enfoque es simple y adecuado para aplicaciones con pocos usuarios. Para mayor escala, considera migrar a una base de datos.

## Requisitos

- Node.js 14.x o superior
- MongoDB 4.x o superior
- Python 3.8+ (para el notebook de administración)
- API Key de OpenAI (para el enriquecimiento de datos)

## Licencia

[MIT](LICENSE)