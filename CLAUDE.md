# Doctorate Programs Evaluator - Project Documentation

## Project Overview
This is a web application for exploring and managing doctoral programs in Spanish and Portuguese universities, with a focus on chemical, biomedical, and related sciences. The application provides multiple views for data visualization, program rating, and analysis.

## Architecture Overview

### Frontend Structure
- **index.html**: Main HTML file with multiple view tabs (map, table, analysis, rating, ranking, admin)
- **script.js**: Core frontend logic handling map view, filters, and general functionality
- **calificar-view.js**: Manages the rating/qualification view with detailed criteria evaluation
- **table-view-improved.js**: Handles the table view with university-grouped display and pagination
- **styles.css**: All styling for the application

### Backend Structure
- **server.js**: Express.js server with MongoDB integration
- **Database**: MongoDB with a single collection `programas`

## Database Schema

### Collection: `programas`

```javascript
{
  "_id": ObjectId,
  "universidad": String,           // University name
  "ciudad": String,                // City name
  "programa": String,              // Program name
  "linea_investigacion": String,   // Research lines (multiline text)
  "url": String,                   // Program URL
  "status": String,                // "pendiente" | "considerando" | "interesado" | "aplicando" | "descartado"
  
  // Rating/Qualification
  "calificacion": {
    "valor": Number,              // 1-5 stars rating
    "fecha": String,              // ISO date string
    "comentario": String          // Optional comment
  },
  
  // IMPORTANT: Criteria ratings (1-5 scale each)
  "criterios": {
    "relevancia": Number,         // Personal relevance and thematic affinity (1-5)
    "claridad": Number,           // Clarity of research lines (1-5)
    "transparencia": Number,      // Transparency in information (1-5)
    "actividades": Number,        // Variety of training activities (1-5)
    "resultados": Number          // Transparency in results and quality (1-5)
  },
  
  // AI-enriched data
  "resumen": String,              // AI-generated summary
  "coords": {
    "lat": Number,
    "lon": Number
  },
  "stats": {
    "innovacion": Number,         // 1-10
    "interdisciplinariedad": Number, // 1-10
    "impacto": Number,            // 1-10
    "internacional": Number,       // 1-10
    "aplicabilidad": Number       // 1-10
  },
  "ciudad_metrics": {
    "costo_vida": Number,         // 1-10 (inverted scale: 10=cheap, 1=expensive)
    "costo_vida_comentario": String,
    "calidad_servicio_medico": Number,
    "calidad_servicio_medico_comentario": String,
    "calidad_transporte": Number,
    "calidad_transporte_comentario": String,
    "calidad_aire": Number,
    "calidad_aire_comentario": String,
    "distancia_a_madrid_km": Number,
    "distancia_a_lisboa_km": Number,
    "ciudad_referencia": String
  },
  "university_summary": String,
  "city_description": String,
  "university_description": String,
  "ultimo_enriquecimiento": String  // ISO date of last AI enrichment
}
```

## Component Responsibilities

### server.js (Backend API)
**Purpose**: Handles all database operations and serves the API

**Key Endpoints**:
- `GET /api/programas` - Get all programs (flat list)
- `GET /api/universidades` - Get programs grouped by university
- `GET /api/programas/:id` - Get specific program
- `PUT /api/programas/:id` - Update program (including criterios)
- `PUT /api/programas/:id/calificacion` - Update program rating
- `PATCH /api/programas/:id/status` - Update program status
- `POST /api/programas` - Add new program
- `DELETE /api/programas/:id` - Delete program
- `POST /api/enrich` - Enrich data with AI
- `GET /api/programas/:id/criterios` - Debug endpoint for criteria

### script.js (Main Frontend)
**Purpose**: Core application logic and map view

**Key Functions**:
- `fetchUniversidadesData()` - Loads grouped university data
- `initMap()` - Initializes Leaflet map with markers
- `updateRankings()` - Updates the ranking view
- `setupCalificarTab()` - Initializes the rating tab
- `populateTable()` - Populates the table view

**Data Structure**:
```javascript
universidadesData = {
  programas_doctorado: {
    universidades: [
      {
        nombre: "Universidad Name",
        ciudad: "City",
        coords: { lat, lon },
        programas: [
          {
            _id: "...",
            nombre: "Program Name",
            // ... all program fields
          }
        ]
      }
    ]
  }
}
```

### calificar-view.js (Rating View)
**Purpose**: Handles the detailed rating interface with criteria evaluation

**Key Functions**:
- `initializeCalificarView()` - Loads programs for rating
- `editProgram(programId)` - Opens edit modal with criteria dots
- `setupCriteriaDots(criterionName)` - Sets up 1-5 dot rating for each criterion
- `saveProgram()` - Saves all changes including criterios to database
- `updateRating(programId, rating)` - Updates star rating

**Important**: This component handles the 5 criteria fields that need to be properly saved.

### table-view-improved.js (Table View)
**Purpose**: Displays programs grouped by university with pagination

**Key Features**:
- University-level grouping with collapsible panels
- Pagination (5 universities per page)
- In-line editing capabilities
- Batch save functionality

## Data Flow

### 1. Initial Load
```
Browser → GET /api/universidades → MongoDB → Grouped Data → Frontend State
```

### 2. Rating Update with Criteria
```
User clicks criteria dots → calificar-view.js collects values → 
PUT /api/programas/:id with criterios object → MongoDB update
```

### 3. Data Grouping
- Backend groups programs by university in `/api/universidades`
- Frontend maintains this grouped structure in `universidadesData`
- Each view (map, table, analysis) uses this grouped data

## Best Practices for New Features

### 1. Adding New Database Fields
- Add field to schema documentation in this file
- Update server.js PUT endpoint to accept the field
- Add UI elements in appropriate view files
- Test data persistence end-to-end

### 2. Adding New Criteria
- Add to the `criterios` object in database schema
- Create UI elements in calificar-view.js following existing pattern
- Add setupCriteriaDots() call for new criterion
- Update save logic to include new field

### 3. Data Enrichment
- New enrichment fields should be added to the enrichment functions
- Update both individual and batch enrichment endpoints
- Add appropriate AI prompts for new data generation

## Common Issues and Solutions

### Issue: Criterios not saving to database
**Solution**: Ensure the PUT endpoint includes criterios in the update object:
```javascript
// In saveProgram() function
updateData.criterios = {
  relevancia: parseInt(relevancia),
  claridad: parseInt(claridad),
  transparencia: parseInt(transparencia),
  actividades: parseInt(actividades),
  resultados: parseInt(resultados)
};
```

### Issue: Understanding data grouping
**Key Points**:
- Programs are stored flat in MongoDB
- Grouping happens at the API level in `/api/universidades`
- Frontend maintains grouped structure for performance
- Each university contains array of its programs

## Detailed Component Documentation

### Frontend Components Breakdown

#### index.html Structure
- **Header**: Application title and description
- **Tab Navigation**: Switches between 6 main views (mapa, tabla, analisis, calificar, ranking, admin)
- **Filters Panel**: Global search and filtering controls
- **Content Areas**: Each tab has its own content div
- **Modals**: Edit modals for programs and universities

#### View Components

**1. Mapa View (Map)**
- **Files**: script.js (main logic)
- **Purpose**: Interactive map showing universities with markers
- **Key Features**: 
  - Leaflet.js integration
  - Clustered markers for better visualization
  - Click handlers to open university details

**2. Tabla View (Table)**
- **Files**: table-view-improved.js
- **Purpose**: Paginated table with university grouping
- **Key Features**:
  - Collapsible university panels
  - In-line editing of program fields
  - 5 universities per page
  - Batch save functionality

**3. Análisis View (Analysis)**
- **Files**: script.js
- **Purpose**: Statistical analysis and charts
- **Key Features**:
  - Radar charts for academic metrics
  - City quality metrics visualization
  - University comparison tools

**4. Calificar View (Rating)**
- **Files**: calificar-view.js
- **Purpose**: Detailed program rating and criteria evaluation
- **Key Features**:
  - 5-star rating system
  - 5 detailed criteria evaluation (1-5 scale each)
  - Filter by rating status
  - Export capabilities (JSON/CSV)

**5. Ranking View**
- **Files**: script.js
- **Purpose**: Display ranked programs by rating
- **Key Features**:
  - Sortable ranking table
  - Top statistics
  - Distribution charts

**6. Admin View**
- **Files**: script.js
- **Purpose**: AI data enrichment and administration
- **Key Features**:
  - Bulk AI enrichment
  - Geographic data correction
  - Progress tracking

### API Endpoints Documentation

#### Core Program Endpoints
```javascript
// Get all programs (flat list)
GET /api/programas
// Returns: Array of program objects with all fields

// Get programs grouped by university  
GET /api/universidades
// Returns: { programas_doctorado: { universidades: [...] } }

// Get specific program
GET /api/programas/:id
// Returns: Single program object

// Update program (including criterios)
PUT /api/programas/:id
// Body: Any program fields to update
// Handles: status, url, linea_investigacion, calificacion, criterios

// Update only rating
PUT /api/programas/:id/calificacion
// Body: { calificacion: { valor, fecha, comentario } }

// Update only status
PATCH /api/programas/:id/status
// Body: { status: "pendiente|considerando|interesado|aplicando|descartado" }
```

#### Utility Endpoints
```javascript
// Search with filters
GET /api/busqueda?texto=...&universidad=...&ciudad=...
// Returns: Filtered programs grouped by university

// Analysis data
GET /api/analysis
// Returns: University stats for charts

// Debug endpoint for criterios
GET /api/programas/:id/criterios
// Returns: { programa_id, nombre, criterios, tiene_criterios }

// AI enrichment
POST /api/enrich
// Body: { options: { resumen, metrics, ciudad } }
```

### Data Transformation Flow

#### University Grouping Process
1. **Database Storage**: Programs stored flat with university/city fields
2. **API Aggregation**: `/api/universidades` groups by university+city combination
3. **Frontend State**: Maintains grouped structure in `universidadesData`
4. **View Rendering**: Each view uses the grouped data structure

#### Criterios Evaluation Flow
1. **UI Interaction**: User clicks criteria dots (1-5 scale)
2. **DOM Updates**: Hidden inputs store values, dots show visual state
3. **Save Process**: `saveProgram()` collects all criteria values
4. **API Request**: PUT request with criterios object
5. **Database Storage**: MongoDB stores criterios as nested object
6. **Data Reload**: Views refresh to show updated criteria

### State Management Patterns

#### Global State Variables
```javascript
// In script.js
let universidadesData = { programas_doctorado: { universidades: [] } };
let analysisData = { universidades: [] };

// In calificar-view.js  
let allPrograms = [];
let programStats = { totalCount: 0, universityCount: 0, statusCounts: [] };
```

#### Data Synchronization
- **Initial Load**: All views load from `/api/universidades` 
- **Updates**: Individual views may reload specific data
- **Consistency**: No shared state management - each view responsible for its data

### Error Handling Patterns

#### Frontend Error Handling
```javascript
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  // Process data
} catch (error) {
  console.error('Error description:', error);
  alert(`User-friendly message: ${error.message}`);
}
```

#### Backend Error Handling
```javascript
try {
  // Database operations
  res.json(result);
} catch (error) {
  console.error('Error description:', error);
  res.status(500).json({ message: 'User-friendly message', error: error.message });
}
```

## Development Commands

```bash
# Start development server
npm run dev

# Start production server
npm start

# Run data enrichment
node utils/data-enricher.js enrich

# Create database backup
node utils/mongo-backup.js backup programas

# Import initial data
node import-data.js
```

## Testing Criterios Storage

To test if criterios are being stored correctly:

1. Open browser DevTools Network tab
2. Edit a program and set all 5 criteria values
3. Save the program
4. Check the PUT request payload - should include criterios object
5. Use the debug endpoint: GET `/api/programas/:id/criterios`

## Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/doctorados
OPENAI_API_KEY=your-api-key-here
JWT_SECRET=your-secret-here
PORT=3000
```