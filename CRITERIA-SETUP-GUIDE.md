# 🎯 Guía de Configuración de Criterios - MongoDB Integration

Esta guía te llevará paso a paso para configurar y conectar el sistema de criterios con MongoDB.

## 📋 Resumen del Sistema

### Antes (Local Storage)
- ❌ Criterios guardados solo en el navegador
- ❌ Se perdían al limpiar caché
- ❌ No compartibles entre usuarios

### Después (MongoDB)
- ✅ Criterios guardados en base de datos
- ✅ Persistentes y compartibles
- ✅ Centralizados y sincronizados
- ✅ Basados en tu guía completa de evaluación

## 🚀 Pasos de Instalación

### Paso 1: Inicializar la Base de Datos

```bash
# Navegar al directorio del proyecto
cd /mnt/c/Users/HG_Co/OneDrive/Documents/Github/doctorate-programs-evaluator

# Ejecutar el script de inicialización
node initialize-criteria.js
```

**¿Qué hace este script?**
- Crea la configuración inicial de criterios en MongoDB
- Usa los textos exactos de tu "Guía para Evaluar Programas de Doctorado"
- Configura los 5 criterios con sus descripciones completas
- Establece los 5 niveles para cada criterio

### Paso 2: Verificar la Configuración

Después de ejecutar el script, deberías ver:

```
✅ Connected to MongoDB
✅ Criteria configuration created successfully

📋 Current Criteria Configuration:
==================================

1. Relevancia Personal y Afinidad Temática
   Key: relevancia
   Description: Evalúa qué tan alineadas están las líneas de investigación...
   Levels:
     1: Las líneas están en un área general, pero no conectan con tu tema.
     2: Solo hay una línea lejana a tu interés.
     3: Una o dos líneas son parcialmente compatibles.
     4: Una línea muy alineada y otras relacionadas.
     5: Varias líneas directamente relacionadas con tu tema.

[... y así para los 5 criterios]

🎉 Database initialization completed!
```

### Paso 3: Iniciar el Servidor

```bash
# Iniciar el servidor con los nuevos endpoints
npm start
```

### Paso 4: Probar el Admin Panel

1. **Abrir la aplicación**: http://localhost:3000
2. **Ir a Admin tab**: Hacer clic en "⚙️ Admin"
3. **Buscar sección**: "📋 Criterios de Evaluación"
4. **Hacer clic**: "📥 Cargar desde DB"
5. **Verificar**: Los campos se llenan con los datos de tu guía

## 🎛️ Nuevas Funcionalidades

### Admin Panel Mejorado

**📥 Cargar desde DB**
- Carga los criterios actuales desde MongoDB
- Llena automáticamente todos los campos
- Muestra los datos más recientes

**💾 Guardar Cambios**
- Guarda en MongoDB (no localStorage)
- Valida la estructura de datos
- Muestra confirmación de éxito

### Endpoints de API

**GET `/api/admin/criteria-labels`**
- Obtiene configuración completa para admin
- Incluye todos los metadatos
- Formato completo con IDs y estructura

**PUT `/api/admin/criteria-labels`**
- Actualiza configuración en MongoDB
- Valida estructura de datos
- Registra quién hizo el cambio

**GET `/api/criteria-labels`**
- Obtiene criterios para uso público (modales)
- Formato simplificado para frontend
- Solo datos necesarios para evaluación

## 📊 Estructura de Datos

### En MongoDB (Collection: criteria_config)

```javascript
{
  "_id": ObjectId("..."),
  "type": "criteria_config",
  "version": "1.0",
  "lastUpdated": "2025-07-03T12:00:00.000Z",
  "criteria": [
    {
      "id": 1,
      "key": "relevancia",
      "label": "Relevancia Personal y Afinidad Temática",
      "description": "Evalúa qué tan alineadas están...",
      "levels": {
        "1": "Las líneas están en un área general...",
        "2": "Solo hay una línea lejana...",
        "3": "Una o dos líneas son parcialmente...",
        "4": "Una línea muy alineada...",
        "5": "Varias líneas directamente relacionadas..."
      }
    },
    // ... 4 criterios más
  ]
}
```

### Para el Frontend (Formato simplificado)

```javascript
{
  "criteria": {
    "relevancia": {
      "id": 1,
      "label": "Relevancia Personal y Afinidad Temática",
      "description": "Evalúa qué tan alineadas están...",
      "levels": { "1": "...", "2": "...", etc }
    },
    // ... otros criterios por key
  },
  "lastUpdated": "2025-07-03T12:00:00.000Z"
}
```

## 🔧 Próximos Pasos (Para Conectar con Modales)

### Paso 5: Actualizar los Modales

Los criterios ahora están en la base de datos, pero aún necesitas:

1. **Cargar criterios en modales**: Hacer que los modales de calificación usen los labels de la DB
2. **Actualizar descripciones dinámicas**: Las descripciones de niveles 1-5 desde la DB
3. **Sincronización automática**: Que los cambios en admin se reflejen inmediatamente

### Archivos que necesitan actualización:

- `calificar-view.js`: Para cargar criterios de DB
- `index.html`: Modales que muestran criterios
- Cualquier otro lugar que muestre criterios hardcodeados

## 🐛 Troubleshooting

### Error: "Criteria configuration not found"

**Problema**: No se ejecutó el script de inicialización
**Solución**: 
```bash
node initialize-criteria.js
```

### Error: "Cannot connect to MongoDB"

**Problema**: MongoDB no está corriendo o configuración incorrecta
**Solución**: 
1. Verificar que MongoDB está corriendo
2. Revisar variable `MONGODB_URI` en `.env`
3. Revisar conexión de red

### Los campos del admin están vacíos

**Problema**: No se están cargando los datos
**Solución**:
1. Abrir DevTools → Network
2. Hacer clic "📥 Cargar desde DB"
3. Verificar que la request sea exitosa
4. Revisar console para errores

### Los cambios no se guardan

**Problema**: Error en el endpoint de guardado
**Solución**:
1. Verificar DevTools → Network → PUT request
2. Revisar que el formato de datos sea correcto
3. Verificar logs del servidor

## ✅ Lista de Verificación

- [ ] **Paso 1**: Script de inicialización ejecutado exitosamente
- [ ] **Paso 2**: Servidor iniciado sin errores
- [ ] **Paso 3**: Admin panel carga datos desde DB
- [ ] **Paso 4**: Admin panel guarda cambios en DB
- [ ] **Paso 5**: Los criterios reflejan tu guía de evaluación
- [ ] **Paso 6**: (Próximo) Modales usan criterios de DB

## 🎉 ¡Sistema de Criterios Completado!

Una vez completados estos pasos, tendrás:

✅ **Base de datos centralizada** con tus criterios de evaluación
✅ **Admin panel funcional** para gestionar criterios  
✅ **API robusta** para servir criterios a toda la aplicación
✅ **Criterios basados en tu guía** profesional de evaluación
✅ **Sistema escalable** para futuras mejoras

**¡Siguiente fase**: Conectar estos criterios con los modales de calificación para un sistema completamente integrado! 🚀