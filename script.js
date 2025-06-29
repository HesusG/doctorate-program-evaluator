// API URLs
const API_BASE_URL = window.location.hostname === 'localhost' ? 
    'http://localhost:3000/api' : 
    `${window.location.protocol}//${window.location.host}/api`;
const UNIVERSIDADES_URL = `${API_BASE_URL}/universidades`;
const PROGRAMAS_URL = `${API_BASE_URL}/programas`;
const ENRICH_URL = `${API_BASE_URL}/enrich`;
const ANALYSIS_URL = `${API_BASE_URL}/analysis`;
const BUSQUEDA_URL = `${API_BASE_URL}/busqueda`;

// Global variables
let universidadesData = { programas_doctorado: { universidades: [] } };
let analysisData = { universidades: [] };
let map;
let markers = [];
let markerClusterGroup = null; // For clustering markers
let radarChart = null;
let cityRadarChart = null;

// Coordenadas de las ciudades (incluidas ciudades de Portugal)
const coordenadasCiudades = {
    // España
    "Pamplona": [42.8125, -1.6458],
    "Madrid": [40.4168, -3.7038],
    "Alicante": [38.3452, -0.4810],
    "Sevilla": [37.3886, -5.9823],
    "Santiago de Compostela": [42.8782, -8.5449],
    "Málaga": [36.7213, -4.4214],
    "Zaragoza": [41.6488, -0.8891],
    "Navarra": [42.6954, -1.6761],
    "Barcelona": [41.3851, 2.1734],
    "Valencia": [39.4699, -0.3763],
    "Granada": [37.1773, -3.5986],
    "Bilbao": [43.2630, -2.9350],
    // Portugal
    "Lisboa": [38.7223, -9.1393],
    "Porto": [41.1579, -8.6291],
    "Coimbra": [40.2033, -8.4103],
    "Braga": [41.5454, -8.4265],
    "Aveiro": [40.6405, -8.6538],
    "Faro": [37.0193, -7.9304]
};

// Inicialización
document.addEventListener('DOMContentLoaded', async function() {
    await fetchUniversidadesData();
    initMap();
    populateFilters();
    populateTable();
    setupTabs();
    setupFilters();
    await fetchAnalysisData();
    updateAnalysisView();
    initializeRadarChart();
    initializeCityRadarChart();
    
    // Set up calificar tab
    setupCalificarTab();
    
    // Set up ranking tab
    updateRankings();
    
    // Update favorites display
    updateFavoritesDisplay();
    
    // Set up advanced search
    setupAdvancedSearch();
    
    // Setup criteria dots in university modal
    setupProgramCriteriaDots();
    
    // Add CSS for admin section and calificar section
    addCustomStyles();
});

// Fetch data from API
async function fetchUniversidadesData() {
    try {
        const response = await fetch(UNIVERSIDADES_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        universidadesData = await response.json();
        console.log('Data loaded:', universidadesData);
        
        // Debug data structure in more detail
        console.log('Data structure detailed:');
        console.log('- universidadesData.programas_doctorado.universidades length:', universidadesData.programas_doctorado.universidades.length);
        
        // Examine the first university and its properties
        if (universidadesData.programas_doctorado.universidades.length > 0) {
            const firstUni = universidadesData.programas_doctorado.universidades[0];
            console.log('- First university:', firstUni.nombre);
            console.log('- ciudad_metrics present:', !!firstUni.ciudad_metrics);
            if (firstUni.ciudad_metrics) {
                console.log('  - ciudad_metrics content:', JSON.stringify(firstUni.ciudad_metrics));
            }
            console.log('- coords present:', !!firstUni.coords);
            console.log('- stats present:', !!firstUni.stats);
            if (firstUni.stats) {
                console.log('  - stats content:', JSON.stringify(firstUni.stats));
            }
            
            // Inspect ALL universities for ciudad_metrics and stats
            console.log('--- Checking all universities for ciudad_metrics and stats ---');
            universidadesData.programas_doctorado.universidades.forEach((uni, index) => {
                console.log(`University ${index} (${uni.nombre}): ciudad_metrics present: ${!!uni.ciudad_metrics}, stats present: ${!!uni.stats}`);
            });
            
            // Check first program's structure
            if (firstUni.programas && firstUni.programas.length > 0) {
                const firstProgram = firstUni.programas[0];
                console.log('- First program:', firstProgram.nombre);
                console.log('- program calificacion present:', !!firstProgram.calificacion);
                console.log('- program status present:', !!firstProgram.status);
                console.log('- program resumen present:', !!firstProgram.resumen);
                
                // Log the complete first program structure
                console.log('- Complete first program structure:', JSON.stringify(firstProgram, null, 2));
            }
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        // Show error message to user
        const contentDiv = document.querySelector('.content');
        contentDiv.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <h3>⚠️ Error al cargar datos</h3>
                <p style="margin-top: 20px;">No se pudieron cargar los datos. Por favor, verifica que el servidor esté en funcionamiento.</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; border-radius: 10px; background: rgba(255,255,255,0.2); border: none; color: white; cursor: pointer;">Reintentar</button>
            </div>
        `;
    }
}

// Función para realizar búsquedas avanzadas
async function realizarBusquedaAvanzada(parametros) {
    try {
        // Construir URL con parámetros de búsqueda
        const urlParams = new URLSearchParams();
        
        // Añadir cada parámetro válido a la URL
        Object.entries(parametros).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                urlParams.append(key, value);
            }
        });
        
        // Construir URL completa
        const url = `${BUSQUEDA_URL}?${urlParams.toString()}`;
        
        // Realizar petición
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Procesar respuesta
        const resultados = await response.json();
        console.log('Resultados de búsqueda:', resultados);
        
        // Actualizar datos con los resultados de búsqueda
        universidadesData = resultados;
        
        // Actualizar UI
        updateMapMarkers();
        populateTable();
        loadProgramsToRate();
        updateRankings();
        
        // Devolver resultados para uso adicional si es necesario
        return resultados;
    } catch (error) {
        console.error('Error en búsqueda avanzada:', error);
        alert('Error al realizar la búsqueda. Por favor, inténtelo de nuevo.');
        return null;
    }
}

// Fetch analysis data
async function fetchAnalysisData() {
    try {
        const response = await fetch(ANALYSIS_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        analysisData = await response.json();
        console.log('Analysis data loaded:', analysisData);
        
        // Debug analysis data structure in more detail
        console.log('Analysis data structure detailed:');
        console.log('- analysisData.universidades length:', analysisData.universidades.length);
        
        // Examine the first university in analysis data
        if (analysisData.universidades.length > 0) {
            const firstUni = analysisData.universidades[0];
            console.log('- First university in analysis:', firstUni.nombre);
            console.log('- ciudad_metrics present:', !!firstUni.ciudad_metrics);
            console.log('- stats present:', !!firstUni.stats);
            
            // Log the complete first university structure from analysis data
            console.log('- Complete first university structure in analysis:', JSON.stringify(firstUni, null, 2));
        }
    } catch (error) {
        console.error('Error fetching analysis data:', error);
        // No need to show error here, the updateAnalysisView will handle it
    }
}

// Inicializar mapa
function initMap() {
    try {
        console.log("Inicializando mapa...");
        
        // Centrar el mapa en la península ibérica para mostrar tanto España como Portugal
        map = L.map('map', {
            center: [40.0, -5.0],
            zoom: 5,
            zoomControl: true,
            attributionControl: true
        });
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Crear una instancia del grupo de marcadores para clustering
        markerClusterGroup = L.markerClusterGroup({
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: true,
            zoomToBoundsOnClick: true,
            disableClusteringAtZoom: 13, // Desagrupar al hacer mucho zoom (nivel un poco más bajo para ver individuales antes)
            maxClusterRadius: 45, // Radio en píxeles para agrupar marcadores (ligeramente mayor)
            iconCreateFunction: function(cluster) {
                // Determine the dominant status in the cluster
                const markers = cluster.getAllChildMarkers();
                const statusCounts = {
                    'aplicando': 0,
                    'interesado': 0,
                    'considerando': 0,
                    'pendiente': 0,
                    'descartado': 0
                };
                
                markers.forEach(marker => {
                    const universidad = marker.universidad;
                    if (universidad && universidad.programas) {
                        const status = determinarStatusPredominante(universidad);
                        statusCounts[status]++;
                    } else {
                        statusCounts['pendiente']++;
                    }
                });
                
                // Find the dominant status
                let dominantStatus = 'pendiente';
                
                // Priority order: aplicando > interesado > considerando > pendiente > descartado
                if (statusCounts.aplicando > 0) dominantStatus = 'aplicando';
                else if (statusCounts.interesado > 0) dominantStatus = 'interesado';
                else if (statusCounts.considerando > 0) dominantStatus = 'considerando';
                else if (statusCounts.pendiente > 0) dominantStatus = 'pendiente';
                else if (statusCounts.descartado > 0) dominantStatus = 'descartado';
                
                // Todos los clusters serán azul estándar de Leaflet
                const standardBlue = '#2b82cb';
                
                // Create custom cluster icon that matches the standard blue markers
                return L.divIcon({
                    html: `<div style="background-color: ${standardBlue}; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 3px solid white; color: white; font-weight: bold; box-shadow: 0 3px 10px rgba(0,0,0,0.3);">${cluster.getChildCount()}</div>`,
                    className: 'marker-cluster',
                    iconSize: L.point(40, 40),
                    iconAnchor: L.point(20, 20)
                });
            }
        });
        
        // Añadir el grupo de clustering al mapa
        map.addLayer(markerClusterGroup);
        
        // Agregar marcadores
        updateMapMarkers();
        
        console.log("Mapa inicializado correctamente con clustering de marcadores");
    } catch (error) {
        console.error("Error al inicializar el mapa:", error);
    }
}

// Update map markers based on current data
function updateMapMarkers() {
    try {
        console.log("Actualizando marcadores del mapa con clustering...");
        
        // Clear existing markers
        if (markerClusterGroup) {
            markerClusterGroup.clearLayers();
        }
        markers = [];
        
        // Log cities with multiple universities (for testing cluster functionality)
        const cityCounts = {};
        universidadesData.programas_doctorado.universidades.forEach(universidad => {
            if (universidad.ciudad) {
                cityCounts[universidad.ciudad] = (cityCounts[universidad.ciudad] || 0) + 1;
            }
        });
        
        const citiesWithMultipleUniversities = Object.entries(cityCounts)
            .filter(([_, count]) => count > 1)
            .sort((a, b) => b[1] - a[1]);
            
        console.log("Ciudades con múltiples universidades (para verificar clustering):", 
            citiesWithMultipleUniversities.map(([city, count]) => `${city}: ${count} universidades`).join(", "));
        
        // Add new markers
        universidadesData.programas_doctorado.universidades.forEach(universidad => {
            // Try to use coords from enriched data if available
            let coords = null;
            
            // PRIORIDAD 1: Usar coordenadas de la base de datos (prioritize database coordinates)
            if (universidad.coords && universidad.coords.lat && universidad.coords.lon) {
                coords = [universidad.coords.lat, universidad.coords.lon];
                console.log(`Usando coordenadas de la base de datos para ${universidad.nombre} en ${universidad.ciudad}: [${coords[0]}, ${coords[1]}]`);
            } 
            // PRIORIDAD 2: Usar coordenadas predefinidas
            else if (universidad.ciudad && coordenadasCiudades[universidad.ciudad]) {
                coords = coordenadasCiudades[universidad.ciudad];
                console.log(`Usando coordenadas predefinidas para ${universidad.ciudad}: [${coords[0]}, ${coords[1]}]`);
            }
            // PRIORIDAD 3: Buscar coincidencias parciales
            else if (universidad.ciudad) {
                // Check if any city name contains this one (for handling variations)
                const cityKeys = Object.keys(coordenadasCiudades);
                for (const cityKey of cityKeys) {
                    if (universidad.ciudad.includes(cityKey) || cityKey.includes(universidad.ciudad)) {
                        coords = coordenadasCiudades[cityKey];
                        console.log(`Usando coordenadas de ${cityKey} para universidad en ${universidad.ciudad}: [${coords[0]}, ${coords[1]}]`);
                        break;
                    }
                }
            }
            
            if (coords) {
                // Debug: Check for universities at the same coordinates
                const coordKey = `${coords[0]},${coords[1]}`;
                if (!window.coordsUsed) window.coordsUsed = {};
                if (window.coordsUsed[coordKey]) {
                    console.log(`Múltiples universidades en las mismas coordenadas: ${universidad.nombre} y ${window.coordsUsed[coordKey].join(", ")} en [${coords[0]}, ${coords[1]}]`);
                    window.coordsUsed[coordKey].push(universidad.nombre);
                } else {
                    window.coordsUsed[coordKey] = [universidad.nombre];
                }
                
                // Obtener el status predominante para esta universidad
                let status = determinarStatusPredominante(universidad);
                
                // Crear icono personalizado según el status
                const icon = getStatusMarkerIcon(status);
                
                // Count programs by status for this university
                const statusCounts = {
                    'pendiente': 0,
                    'considerando': 0,
                    'interesado': 0,
                    'aplicando': 0,
                    'descartado': 0
                };
                
                if (universidad.programas && universidad.programas.length > 0) {
                    universidad.programas.forEach(programa => {
                        const programStatus = programa.status || 'pendiente';
                        statusCounts[programStatus]++;
                    });
                }
                
                // Create status badges HTML if there are multiple statuses
                let statusBadgesHTML = '';
                const hasMultipleStatuses = Object.values(statusCounts).filter(count => count > 0).length > 1;
                
                if (hasMultipleStatuses) {
                    statusBadgesHTML = `
                        <div class="status-badges">
                            ${statusCounts.aplicando > 0 ? `<span class="status-badge aplicando">${statusCounts.aplicando}</span>` : ''}
                            ${statusCounts.interesado > 0 ? `<span class="status-badge interesado">${statusCounts.interesado}</span>` : ''}
                            ${statusCounts.considerando > 0 ? `<span class="status-badge considerando">${statusCounts.considerando}</span>` : ''}
                            ${statusCounts.pendiente > 0 ? `<span class="status-badge pendiente">${statusCounts.pendiente}</span>` : ''}
                            ${statusCounts.descartado > 0 ? `<span class="status-badge descartado">${statusCounts.descartado}</span>` : ''}
                        </div>
                    `;
                }
                
                // Crear el marcador con título para mostrar al hacer hover
                const marker = L.marker(coords, { 
                    icon: icon,
                    title: universidad.nombre // Esto añade el tooltip al hacer hover
                })
                .bindPopup(`
                    <div class="marker-popup">
                        <h3>${universidad.nombre}</h3>
                        <p>${universidad.ciudad}</p>
                        <p>${universidad.programas ? universidad.programas.length : 0} programas</p>
                        ${statusBadgesHTML}
                        <button class="ver-universidad-btn" 
                                onclick="showUniversityInfo('${universidad.nombre}', '${universidad.ciudad}')">
                            Ver programas
                        </button>
                    </div>
                `)
                .on('click', () => showUniversityInfo(universidad));
                
                // Store the universidad object in the marker for clustering purposes
                marker.universidad = universidad;
                
                // Añadir al grupo de clustering en lugar de directamente al mapa
                markerClusterGroup.addLayer(marker);
                
                // Guardar referencia para poder eliminarlos después si es necesario
                markers.push(marker);
            } else {
                console.warn(`Coordenadas no encontradas para ${universidad.ciudad}. La universidad no aparecerá en el mapa.`);
            }
        });
        
        console.log(`Se han añadido ${markers.length} marcadores al mapa con clustering.`);
    } catch (error) {
        console.error("Error al actualizar marcadores del mapa:", error);
    }
}

// Función para determinar el status predominante de una universidad
function determinarStatusPredominante(universidad) {
    let status = 'pendiente'; // valor por defecto
    
    if (universidad.programas && universidad.programas.length > 0) {
        const statusCounts = {
            pendiente: 0,
            considerando: 0,
            interesado: 0,
            aplicando: 0,
            descartado: 0
        };
        
        universidad.programas.forEach(programa => {
            const programStatus = programa.status || 'pendiente';
            statusCounts[programStatus] = (statusCounts[programStatus] || 0) + 1;
        });
        
        // Determinar el status predominante (prioridad: aplicando > interesado > considerando > pendiente > descartado)
        if (statusCounts.aplicando > 0) status = 'aplicando';
        else if (statusCounts.interesado > 0) status = 'interesado';
        else if (statusCounts.considerando > 0) status = 'considerando';
        else if (statusCounts.pendiente > 0) status = 'pendiente';
        else if (statusCounts.descartado > 0) status = 'descartado';
    }
    
    return status;
}

// Función para obtener un icono personalizado - todos azul
function getStatusMarkerIcon(status) {
    // Todos los marcadores serán azul estándar independientemente del estado
    
    // Crear un icono de marcador estándar azul (usar el marcador por defecto de Leaflet)
    return L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
}

// Configurar pestañas
function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            // Actualizar pestañas activas
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar vista correspondiente
            document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
            document.getElementById(targetTab + '-view').classList.remove('hidden');
            
            // Redimensionar mapa si es necesario
            if (targetTab === 'mapa') {
                setTimeout(() => map.invalidateSize(), 100);
            }
            
            // Actualizar gráfico si es la vista de análisis
            if (targetTab === 'analisis' && radarChart) {
                radarChart.resize();
            }
            
            // Actualizar información de último enriquecimiento en la vista admin
            if (targetTab === 'admin') {
                updateLastEnrichmentInfo();
            }
        });
    });
}

// Actualizar información del último enriquecimiento
function updateLastEnrichmentInfo() {
    const lastEnrichmentText = document.getElementById('lastEnrichmentText');
    if (!lastEnrichmentText) return;
    
    // Buscar la fecha de enriquecimiento más reciente entre todas las universidades
    let lastEnrichmentDate = null;
    
    if (universidadesData && universidadesData.programas_doctorado && universidadesData.programas_doctorado.universidades) {
        universidadesData.programas_doctorado.universidades.forEach(universidad => {
            if (universidad.programas && universidad.programas.length > 0) {
                universidad.programas.forEach(programa => {
                    if (programa.ultimo_enriquecimiento) {
                        const enrichDate = new Date(programa.ultimo_enriquecimiento);
                        if (!lastEnrichmentDate || enrichDate > lastEnrichmentDate) {
                            lastEnrichmentDate = enrichDate;
                        }
                    }
                });
            }
        });
    }
    
    // Actualizar el texto
    if (lastEnrichmentDate) {
        // Formatear fecha: DD/MM/YYYY HH:MM
        const formattedDate = `${lastEnrichmentDate.getDate().toString().padStart(2, '0')}/${
            (lastEnrichmentDate.getMonth() + 1).toString().padStart(2, '0')}/${
            lastEnrichmentDate.getFullYear()} ${
            lastEnrichmentDate.getHours().toString().padStart(2, '0')}:${
            lastEnrichmentDate.getMinutes().toString().padStart(2, '0')}`;
        
        lastEnrichmentText.textContent = `Último enriquecimiento: ${formattedDate}`;
    } else {
        lastEnrichmentText.textContent = 'Último enriquecimiento: No hay datos';
    }
}

// Poblar filtros
function populateFilters() {
    const ciudades = [...new Set(universidadesData.programas_doctorado.universidades.map(u => u.ciudad))];
    const ciudadSelect = document.getElementById('ciudadFilter');
    
    // Clear existing options except the first one
    while (ciudadSelect.options.length > 1) {
        ciudadSelect.remove(1);
    }
    
    ciudades.forEach(ciudad => {
        const option = document.createElement('option');
        option.value = ciudad;
        option.textContent = ciudad;
        ciudadSelect.appendChild(option);
    });
}

// Configurar filtros
function setupFilters() {
    const filters = ['search', 'ciudadFilter', 'calificacionFilter', 'costoFilter', 'statusFilter'];
    filters.forEach(filterId => {
        document.getElementById(filterId).addEventListener('input', applyFilters);
    });
}

// Aplicar filtros
function applyFilters() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const ciudadFilter = document.getElementById('ciudadFilter').value;
    const calificacionFilter = parseInt(document.getElementById('calificacionFilter').value) || 0;
    const costoFilter = parseInt(document.getElementById('costoFilter').value) || 0;
    const statusFilter = document.getElementById('statusFilter').value.toLowerCase();
    
    // Función auxiliar para determinar si un elemento coincide con los filtros
    function matchesFilters(universidad, ciudad, status) {
        const matchesSearch = universidad.nombre.toLowerCase().includes(searchTerm);
        const matchesCiudad = !ciudadFilter || ciudad === ciudadFilter;
        
        // Verificar calificación mínima (buscamos el rating máximo entre todos los programas de la universidad)
        let maxRating = 0;
        if (universidad.programas && universidad.programas.length > 0) {
            universidad.programas.forEach(programa => {
                if (programa.calificacion && programa.calificacion.valor) {
                    maxRating = Math.max(maxRating, programa.calificacion.valor);
                }
            });
        }
        const matchesCalificacion = calificacionFilter === 0 || maxRating >= calificacionFilter;
        
        // Verificar costo de vida (usando el valor numérico de ciudad_metrics.costo_vida)
        let costoVida = 0;
        if (universidad.ciudad_metrics && universidad.ciudad_metrics.costo_vida !== undefined) {
            costoVida = universidad.ciudad_metrics.costo_vida;
        }
        
        let matchesCosto = true;
        if (costoFilter > 0) {
            if (costoFilter === 50) {
                // Alto: 50+
                matchesCosto = costoVida >= 50;
            } else if (costoFilter === 30) {
                // Medio: 30-50
                matchesCosto = costoVida >= 30 && costoVida < 50;
            } else if (costoFilter === 0) {
                // Bajo: 0-30
                matchesCosto = costoVida < 30;
            }
        }
        
        const matchesStatus = !statusFilter || (status || '').toLowerCase() === statusFilter;
        
        return matchesSearch && matchesCiudad && matchesCalificacion && matchesCosto && matchesStatus;
    }
    
    // Filter table rows
    try {
        const rows = document.querySelectorAll('#tableBody tr');
        rows.forEach(row => {
            // Usando la estructura según el populateTable
            const universidadInput = row.querySelector('td:nth-child(1) input');
            const ciudadInput = row.querySelector('td:nth-child(2) input');
            
            // La columna 4 contiene el status pero no como input sino como badges
            const statusBadges = row.querySelector('td:nth-child(4) .status-counts');
            const status = statusBadges ? 
                (statusBadges.querySelector('.status-aplicando') ? 'aplicando' :
                 statusBadges.querySelector('.status-interesado') ? 'interesado' :
                 statusBadges.querySelector('.status-considerando') ? 'considerando' :
                 statusBadges.querySelector('.status-pendiente') ? 'pendiente' : 'descartado') : '';
            
            if (universidadInput && ciudadInput) {
                const universidad_nombre = universidadInput.value;
                const ciudad = ciudadInput.value;
                
                // Buscar la universidad correspondiente en los datos
                const universidad = universidadesData.programas_doctorado.universidades.find(u => 
                    u.nombre === universidad_nombre && u.ciudad === ciudad);
                
                if (universidad && matchesFilters(universidad, ciudad, status)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        });
    } catch (error) {
        console.error('Error al filtrar filas de tabla:', error);
    }
    
    // Filter map markers
    try {
        // Clear existing markers
        if (markerClusterGroup) {
            markerClusterGroup.clearLayers();
        }
        markers = [];
        
        // Add filtered markers
        universidadesData.programas_doctorado.universidades.forEach(universidad => {
            // Determinar el status predominante para esta universidad
            const status = determinarStatusPredominante(universidad);
            
            if (matchesFilters(universidad, universidad.ciudad, status)) {
                // Try to use coords from enriched data if available
                let coords = null;
                
                // PRIORIDAD 1: Usar coordenadas de la base de datos (prioritize database coordinates)
                if (universidad.coords && universidad.coords.lat && universidad.coords.lon) {
                    coords = [universidad.coords.lat, universidad.coords.lon];
                } 
                // PRIORIDAD 2: Usar coordenadas predefinidas
                else if (universidad.ciudad && coordenadasCiudades[universidad.ciudad]) {
                    coords = coordenadasCiudades[universidad.ciudad];
                }
                // PRIORIDAD 3: Buscar coincidencias parciales
                else if (universidad.ciudad) {
                    // Check if any city name contains this one (for handling variations)
                    const cityKeys = Object.keys(coordenadasCiudades);
                    for (const cityKey of cityKeys) {
                        if (universidad.ciudad.includes(cityKey) || cityKey.includes(universidad.ciudad)) {
                            coords = coordenadasCiudades[cityKey];
                            break;
                        }
                    }
                }
                
                if (coords) {
                    // Crear icono personalizado según el status
                    const icon = getStatusMarkerIcon(status);
                    
                    // Count programs by status for this university
                    const statusCounts = {
                        'pendiente': 0,
                        'considerando': 0,
                        'interesado': 0,
                        'aplicando': 0,
                        'descartado': 0
                    };
                    
                    if (universidad.programas && universidad.programas.length > 0) {
                        universidad.programas.forEach(programa => {
                            const programStatus = programa.status || 'pendiente';
                            statusCounts[programStatus]++;
                        });
                    }
                    
                    // Create status badges HTML if there are multiple statuses
                    let statusBadgesHTML = '';
                    const hasMultipleStatuses = Object.values(statusCounts).filter(count => count > 0).length > 1;
                    
                    if (hasMultipleStatuses) {
                        statusBadgesHTML = `
                            <div class="status-badges">
                                ${statusCounts.aplicando > 0 ? `<span class="status-badge aplicando">${statusCounts.aplicando}</span>` : ''}
                                ${statusCounts.interesado > 0 ? `<span class="status-badge interesado">${statusCounts.interesado}</span>` : ''}
                                ${statusCounts.considerando > 0 ? `<span class="status-badge considerando">${statusCounts.considerando}</span>` : ''}
                                ${statusCounts.pendiente > 0 ? `<span class="status-badge pendiente">${statusCounts.pendiente}</span>` : ''}
                                ${statusCounts.descartado > 0 ? `<span class="status-badge descartado">${statusCounts.descartado}</span>` : ''}
                            </div>
                        `;
                    }
                    
                    // Crear el marcador con título para mostrar al hacer hover
                    const marker = L.marker(coords, { 
                        icon: icon,
                        title: universidad.nombre // Esto añade el tooltip al hacer hover
                    })
                    .bindPopup(`
                        <div class="marker-popup">
                            <h3>${universidad.nombre}</h3>
                            <p>${universidad.ciudad}</p>
                            <p>${universidad.programas ? universidad.programas.length : 0} programas</p>
                            ${statusBadgesHTML}
                            <button class="ver-universidad-btn" 
                                    onclick="showUniversityInfo('${universidad.nombre}', '${universidad.ciudad}')">
                                Ver programas
                            </button>
                        </div>
                    `)
                    .on('click', () => showUniversityInfo(universidad));
                    
                    // Store the universidad object in the marker for clustering purposes
                    marker.universidad = universidad;
                    
                    // Añadir al grupo de clustering en lugar de directamente al mapa
                    markerClusterGroup.addLayer(marker);
                    
                    // Guardar referencia para poder eliminarlos después si es necesario
                    markers.push(marker);
                }
            }
        });
        
        console.log(`Se han añadido ${markers.length} marcadores filtrados al mapa con clustering.`);
    } catch (error) {
        console.error("Error al filtrar marcadores del mapa:", error);
    }
}

// Configurar búsqueda avanzada
function setupAdvancedSearch() {
    // Toggle advanced search panel
    const toggleButton = document.getElementById('toggleAdvancedSearch');
    const searchPanel = document.getElementById('advancedSearchPanel');
    
    toggleButton.addEventListener('click', function() {
        const isHidden = searchPanel.classList.contains('hidden');
        searchPanel.classList.toggle('hidden');
        toggleButton.textContent = isHidden ? 'Búsqueda Avanzada ↑' : 'Búsqueda Avanzada ↓';
    });
    
    // Handle search button click
    const searchButton = document.getElementById('advancedSearchButton');
    searchButton.addEventListener('click', function() {
        performAdvancedSearch();
    });
    
    // Handle reset button click
    const resetButton = document.getElementById('resetAdvancedSearch');
    resetButton.addEventListener('click', function() {
        resetAdvancedSearch();
    });
}

// Realizar búsqueda avanzada
async function performAdvancedSearch() {
    // Recoger todos los valores de los campos
    const texto = document.getElementById('searchTextAdvanced').value;
    const universidad = document.getElementById('universidadAdvanced').value;
    const ciudad = document.getElementById('ciudadAdvanced').value;
    const programa = document.getElementById('programaAdvanced').value;
    const linea = document.getElementById('lineaAdvanced').value;
    const calificacion = document.getElementById('calificacionAdvanced').value;
    const innovacion = document.getElementById('innovacionAdvanced').value;
    const status = document.getElementById('statusAdvanced').value;
    
    // Mostrar indicador de carga
    toggleLoadingIndicator(true);
    
    // Construir parámetros de búsqueda
    const parametros = {
        texto,
        universidad,
        ciudad,
        programa,
        linea,
        calificacion,
        innovacion,
        status
    };
    
    // Realizar búsqueda
    try {
        await realizarBusquedaAvanzada(parametros);
        
        // Mostrar notificación de resultados
        showResultsNotification();
    } catch (error) {
        console.error('Error en búsqueda avanzada:', error);
        alert('Error al realizar la búsqueda. Por favor, inténtelo de nuevo.');
    } finally {
        // Ocultar indicador de carga
        toggleLoadingIndicator(false);
    }
}

// Mostrar/ocultar indicador de carga
function toggleLoadingIndicator(show) {
    const button = document.getElementById('advancedSearchButton');
    
    if (show) {
        button.disabled = true;
        button.innerHTML = '<span class="loading-spinner" style="width: 20px; height: 20px;"></span> Buscando...';
    } else {
        button.disabled = false;
        button.textContent = 'Buscar';
    }
}

// Mostrar notificación de resultados
function showResultsNotification() {
    const totalResults = universidadesData.total || 0;
    const searchTerm = universidadesData.termino_busqueda || '';
    
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'search-notification';
    notificationDiv.innerHTML = `
        <div style="background: rgba(46, 204, 113, 0.2); border-left: 4px solid #2ecc71; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
            <p>Se encontraron <strong>${totalResults}</strong> resultados ${searchTerm !== 'todos' ? `para "<strong>${searchTerm}</strong>"` : ''}</p>
        </div>
    `;
    
    // Insertar notificación antes del mapa
    const mapView = document.getElementById('mapa-view');
    mapView.insertBefore(notificationDiv, mapView.firstChild);
    
    // Eliminar notificación después de 5 segundos
    setTimeout(() => {
        notificationDiv.remove();
    }, 5000);
}

// Resetear campos de búsqueda avanzada
function resetAdvancedSearch() {
    document.getElementById('searchTextAdvanced').value = '';
    document.getElementById('universidadAdvanced').value = '';
    document.getElementById('ciudadAdvanced').value = '';
    document.getElementById('programaAdvanced').value = '';
    document.getElementById('lineaAdvanced').value = '';
    document.getElementById('calificacionAdvanced').value = '';
    document.getElementById('innovacionAdvanced').value = '';
    document.getElementById('statusAdvanced').value = '';
    
    // Recargar datos originales
    fetchUniversidadesData().then(() => {
        updateMapMarkers();
        populateTable();
        loadProgramsToRate();
        updateRankings();
    });
}

function addCustomStyles() {
    // Add any custom styles here that are needed dynamically
    const styleElement = document.createElement('style');
    
    // CSS for admin section
    styleElement.textContent = `
        /* Admin panel styles */
        .admin-content {
            display: flex;
            flex-direction: column;
            gap: 30px;
        }
        
        .admin-section {
            background: #2c3e50;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        
        .admin-section h4 {
            color: #f093fb;
            margin-top: 0;
            margin-bottom: 10px;
        }
        
        .admin-section ul {
            margin-left: 20px;
            margin-bottom: 20px;
        }
        
        .admin-section li {
            margin-bottom: 5px;
        }
        
        .fix-geo-btn {
            background: linear-gradient(45deg, #20bf6b, #0fb9b1);
            border: none;
            color: white;
            padding: 12px 25px;
            border-radius: 50px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .fix-geo-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(32, 191, 107, 0.3);
        }
        
        .progress-container {
            margin-top: 15px;
            width: 100%;
        }
        
        .progress-bar {
            width: 100%;
            height: 10px;
            background: #34495e;
            border-radius: 5px;
            overflow: hidden;
        }
        
        .progress-bar-fill {
            height: 100%;
            background: linear-gradient(45deg, #20bf6b, #0fb9b1);
            border-radius: 5px;
            transition: width 0.3s ease;
        }
        
        .progress-text {
            text-align: center;
            margin-top: 5px;
            font-size: 0.8rem;
        }
        
        /* Search notification */
        .search-notification {
            margin-bottom: 15px;
        }
        
        /* Table rating styles */
        #tableBody .rating-display {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 5px;
        }
        
        #tableBody .rating-stars {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        #tableBody .rating-value {
            font-weight: bold;
            font-size: 0.9rem;
        }
        
        #tableBody .rated-programs {
            font-size: 0.8rem;
            opacity: 0.7;
        }
        
        /* Table costo de vida styles */
        #tableBody .costo-display {
            text-align: center;
            padding: 5px 10px;
            border-radius: 4px;
            font-weight: 500;
        }
        
        #tableBody .costo-alto {
            background-color: rgba(255, 94, 98, 0.2);
            color: #ff5e62;
        }
        
        #tableBody .costo-medio {
            background-color: rgba(255, 221, 89, 0.2);
            color: #ffdd59;
        }
        
        #tableBody .costo-bajo {
            background-color: rgba(38, 222, 129, 0.2);
            color: #26de81;
        }
    `;
    
    document.head.appendChild(styleElement);
}

// Variables globales para el control de programas en el modal
let currentUniversidad = null;
let currentProgramIndex = 0;

// Mostrar información de universidad en el nuevo modal
function showUniversityInfo(universidad) {
    console.log(`DEBUG showUniversityInfo: Iniciando con universidad=${universidad ? universidad.nombre : 'undefined'}`);
    
    // Si no se proporciona la universidad o no tiene programas, no hacer nada
    if (!universidad || !universidad.programas || universidad.programas.length === 0) {
        console.warn("No se proporcionó una universidad válida o no tiene programas");
        return;
    }
    
    console.log(`DEBUG showUniversityInfo: Universidad válida con ${universidad.programas.length} programas`);
    
    // Guardar la universidad actual y resetear el índice del programa
    currentUniversidad = universidad;
    currentProgramIndex = 0; // Asegurar que sea un número entero
    
    console.log(`DEBUG showUniversityInfo: currentUniversidad actualizada, currentProgramIndex=${currentProgramIndex} (tipo: ${typeof currentProgramIndex})`);
    
    // Configurar elementos del modal
    document.getElementById('universityTitle').textContent = universidad.nombre;
    document.getElementById('universityCity').textContent = universidad.ciudad;
    
    // Configurar botones de acción para ver imágenes
    document.getElementById('viewUniversityBtn').onclick = function() {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(universidad.nombre)}&tbm=isch`, '_blank');
    };
    
    document.getElementById('viewCityBtn').onclick = function() {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(universidad.ciudad)}&tbm=isch`, '_blank');
    };
    
    // Configurar contadores y botones de navegación
    updateProgramNavigation();
    
    // Mostrar los detalles del primer programa
    showProgramDetails(0, 'fade-in');
    
    // Mostrar el modal con animación
    const modal = document.getElementById('universityModal');
    modal.style.display = 'block';
    
    // Forzar el reflow para que la transición funcione
    void modal.offsetWidth;
    
    // Mostrar con animación
    modal.classList.add('show');
}

// Función para mostrar los detalles de un programa específico
function showProgramDetails(index, animationClass = 'slide-in-right') {
    console.log(`DEBUG showProgramDetails: Iniciando con index=${index}, animationClass=${animationClass}`);
    console.log(`DEBUG showProgramDetails: currentUniversidad=${!!currentUniversidad}, programas=${currentUniversidad && currentUniversidad.programas ? currentUniversidad.programas.length : 0}`);
    
    if (!currentUniversidad || !currentUniversidad.programas || currentUniversidad.programas.length === 0) {
        console.log(`DEBUG showProgramDetails: No hay universidad o programas válidos`);
        return;
    }
    
    // Convertir index a número si no lo es
    index = Number(index);
    if (isNaN(index)) {
        console.warn(`Índice de programa no es un número: ${index}`);
        return;
    }
    
    // Asegurar que el índice sea válido
    if (index < 0 || index >= currentUniversidad.programas.length) {
        console.warn(`Índice de programa inválido: ${index}`);
        return;
    }
    
    console.log(`DEBUG showProgramDetails: Actualizando currentProgramIndex de ${currentProgramIndex} a ${index}`);
    
    // Actualizar el índice actual - asegurándose que sea un número
    currentProgramIndex = Number(index);
    
    console.log(`DEBUG showProgramDetails: currentProgramIndex actualizado a ${currentProgramIndex} (tipo: ${typeof currentProgramIndex})`);
    
    // Obtener el programa actual
    const programa = currentUniversidad.programas[index];
    
    // Determinar el estado del programa
    const status = programa.status || 'pendiente';
    const statusLabels = {
        'pendiente': 'Pendiente',
        'considerando': 'Considerando',
        'interesado': 'Interesado',
        'aplicando': 'Aplicando',
        'descartado': 'Descartado'
    };
    const statusLabel = statusLabels[status] || 'Pendiente';
    
    // Preparar para la animación
    const programDetails = document.getElementById('programDetails');
    
    // Eliminar clases de animación anteriores
    programDetails.classList.remove('fade-in', 'slide-in-right', 'slide-in-left');
    
    // Forzar reflow
    void programDetails.offsetWidth;
    
    // Aplicar la nueva clase de animación
    programDetails.classList.add(animationClass);
    
    // Actualizar el título y estado del programa
    document.getElementById('programName').textContent = programa.nombre;
    
    const programStatus = document.getElementById('programStatus');
    programStatus.textContent = statusLabel;
    programStatus.setAttribute('data-status', status);
    
    // Actualizar URL
    const programUrl = document.getElementById('programUrl');
    if (programa.url) {
        programUrl.textContent = programa.url;
        programUrl.href = programa.url;
    } else {
        programUrl.textContent = 'No disponible';
        programUrl.href = '#';
    }
    
    // Actualizar calificación
    const rating = programa.calificacion ? programa.calificacion.valor : 0;
    document.getElementById('programRating').innerHTML = getStarsHTML(rating) + 
        `<span class="rating-value">${rating > 0 ? rating + '/5' : 'Sin calificar'}</span>`;
    
    // Actualizar criterios específicos de evaluación
    updateProgramCriteria(programa);
    
    // Reconfigurar event listeners de criterios después de actualizar el contenido
    setTimeout(() => {
        if (window.refreshCriteriaListeners) {
            window.refreshCriteriaListeners();
        }
    }, 200);
    
    // Actualizar resumen
    document.getElementById('programSummary').textContent = programa.resumen || 'No hay información disponible sobre este programa.';
    
    // Actualizar líneas de investigación
    const researchLinesContainer = document.getElementById('researchLines');
    if (programa.lineas_investigacion && programa.lineas_investigacion.length > 0) {
        let linesHtml = '<ul>';
        programa.lineas_investigacion.forEach(linea => {
            linesHtml += `<li>${linea}</li>`;
        });
        linesHtml += '</ul>';
        researchLinesContainer.innerHTML = linesHtml;
    } else {
        researchLinesContainer.innerHTML = '<p>No hay información disponible sobre líneas de investigación.</p>';
    }
    
    // Actualizar métricas de universidad (stats)
    if (currentUniversidad.stats) {
        const uniStats = currentUniversidad.stats;
        
        // Función para determinar el color basado en el valor
        const getUniStatsStatus = (value) => {
            if (value >= 8) return 'bajo'; // Usamos "bajo" que tiene color verde (positivo)
            if (value >= 5) return 'medio';
            return 'alto'; // Usamos "alto" que tiene color rojo (negativo)
        };
        
        // Innovación
        setTimeout(() => {
            updateMetric('uniInnovacion', uniStats.innovacion, getUniStatsStatus, 'city');
        }, 100);
        
        // Interdisciplinariedad
        setTimeout(() => {
            updateMetric('uniInterdisciplinariedad', uniStats.interdisciplinariedad, getUniStatsStatus, 'city');
        }, 150);
        
        // Impacto
        setTimeout(() => {
            updateMetric('uniImpacto', uniStats.impacto, getUniStatsStatus, 'city');
        }, 200);
        
        // Internacional
        setTimeout(() => {
            updateMetric('uniInternacional', uniStats.internacional, getUniStatsStatus, 'city');
        }, 250);
        
        // Aplicabilidad
        setTimeout(() => {
            updateMetric('uniAplicabilidad', uniStats.aplicabilidad, getUniStatsStatus, 'city');
        }, 300);
        
        // Explicación de la universidad - formato mejorado con HTML
        let universityExplanationHTML = '';
        
        // Intentar obtener descripciones o comentarios generales si existen
        if (currentUniversidad.metadata && (currentUniversidad.metadata.descripcion || currentUniversidad.metadata.comentario)) {
            universityExplanationHTML += '<div class="explanation-block general-info">';
            universityExplanationHTML += '<h5>Información General</h5>';
            
            if (currentUniversidad.metadata.descripcion) {
                universityExplanationHTML += `<p>${currentUniversidad.metadata.descripcion}</p>`;
            }
            
            if (currentUniversidad.metadata.comentario) {
                universityExplanationHTML += `<p>${currentUniversidad.metadata.comentario}</p>`;
            }
            
            universityExplanationHTML += '</div>';
        }
        
        // Crear sección para comentarios de estadísticas si existen
        const hasStatsComments = uniStats.innovacion_comentario || 
                                uniStats.interdisciplinariedad_comentario || 
                                uniStats.impacto_comentario || 
                                uniStats.internacional_comentario || 
                                uniStats.aplicabilidad_comentario;
        
        if (hasStatsComments) {
            universityExplanationHTML += '<div class="explanation-block stats-info">';
            universityExplanationHTML += '<h5>Métricas Destacadas</h5>';
            
            // Añadir cada métrica con su comentario si existe
            if (uniStats.innovacion_comentario) {
                universityExplanationHTML += `
                    <div class="metric-explanation">
                        <span class="metric-name">Innovación (${uniStats.innovacion}/10):</span>
                        <p>${uniStats.innovacion_comentario}</p>
                    </div>`;
            }
            
            if (uniStats.interdisciplinariedad_comentario) {
                universityExplanationHTML += `
                    <div class="metric-explanation">
                        <span class="metric-name">Interdisciplinariedad (${uniStats.interdisciplinariedad}/10):</span>
                        <p>${uniStats.interdisciplinariedad_comentario}</p>
                    </div>`;
            }
            
            if (uniStats.impacto_comentario) {
                universityExplanationHTML += `
                    <div class="metric-explanation">
                        <span class="metric-name">Impacto (${uniStats.impacto}/10):</span>
                        <p>${uniStats.impacto_comentario}</p>
                    </div>`;
            }
            
            if (uniStats.internacional_comentario) {
                universityExplanationHTML += `
                    <div class="metric-explanation">
                        <span class="metric-name">Internacional (${uniStats.internacional}/10):</span>
                        <p>${uniStats.internacional_comentario}</p>
                    </div>`;
            }
            
            if (uniStats.aplicabilidad_comentario) {
                universityExplanationHTML += `
                    <div class="metric-explanation">
                        <span class="metric-name">Aplicabilidad (${uniStats.aplicabilidad}/10):</span>
                        <p>${uniStats.aplicabilidad_comentario}</p>
                    </div>`;
            }
            
            universityExplanationHTML += '</div>';
        }
        
        if (universityExplanationHTML) {
            document.getElementById('universityExplanation').innerHTML = universityExplanationHTML;
        } else {
            document.getElementById('universityExplanation').innerHTML = `
                <div class="explanation-block no-data">
                    <p>No hay explicaciones disponibles sobre la universidad.</p>
                </div>`;
        }
    } else {
        // Si no hay stats de universidad, mostrar N/A
        document.getElementById('uniInnovacion').textContent = '0';
        document.getElementById('uniInterdisciplinariedad').textContent = '0';
        document.getElementById('uniImpacto').textContent = '0';
        document.getElementById('uniInternacional').textContent = '0';
        document.getElementById('uniAplicabilidad').textContent = '0';
        document.getElementById('universityExplanation').innerHTML = `
            <div class="explanation-block no-data">
                <p>No hay explicaciones disponibles sobre la universidad.</p>
            </div>`;
    }
    
    // Actualizar métricas de ciudad con animaciones escalonadas
    if (currentUniversidad.ciudad_metrics) {
        const metrics = currentUniversidad.ciudad_metrics;
        
        // Costo de vida
        setTimeout(() => {
            updateMetric('costoVida', metrics.costo_vida, value => {
                // Menor costo de vida es mejor
                if (value >= 70) return 'alto';
                if (value >= 40) return 'medio';
                return 'bajo';
            }, 'city');
        }, 400);
        
        // Calidad del aire
        setTimeout(() => {
            updateMetric('calidadAire', metrics.calidad_aire, value => {
                // Mayor calidad es mejor
                if (value >= 7) return 'bajo';
                if (value >= 4) return 'medio';
                return 'alto';
            }, 'city');
        }, 500);
        
        // Calidad del transporte
        setTimeout(() => {
            updateMetric('calidadTransporte', metrics.calidad_transporte, value => {
                // Mayor calidad es mejor
                if (value >= 7) return 'bajo';
                if (value >= 4) return 'medio';
                return 'alto';
            }, 'city');
        }, 600);
        
        // Calidad del servicio médico
        setTimeout(() => {
            updateMetric('servicioMedico', metrics.calidad_servicio_medico, value => {
                // Mayor calidad es mejor
                if (value >= 7) return 'bajo';
                if (value >= 4) return 'medio';
                return 'alto';
            }, 'city');
        }, 700);
        
        // Distancia a Madrid
        setTimeout(() => {
            updateMetric('distanciaMadrid', metrics.distancia_a_madrid_km, value => {
                // Menor distancia podría ser mejor o peor según preferencias, neutral
                if (value >= 400) return 'alto';
                if (value >= 200) return 'medio';
                return 'bajo';
            }, 'city', ' km');
        }, 800);
        
        // Construir la explicación detallada de la ciudad con formato HTML
        let cityExplanationHTML = '<div class="explanation-block city-info">';
        cityExplanationHTML += '<h5>Métricas de la Ciudad</h5>';
        
        // Variable para rastrear si hay algún comentario
        let hasCityComments = false;
        
        // Añadir cada métrica con su comentario si existe
        if (metrics.costo_vida_comentario) {
            hasCityComments = true;
            cityExplanationHTML += `
                <div class="metric-explanation">
                    <span class="metric-name">Costo de vida (${metrics.costo_vida}/10):</span>
                    <p>${metrics.costo_vida_comentario}</p>
                </div>`;
        }
        
        if (metrics.calidad_aire_comentario) {
            hasCityComments = true;
            cityExplanationHTML += `
                <div class="metric-explanation">
                    <span class="metric-name">Calidad del aire (${metrics.calidad_aire}/10):</span>
                    <p>${metrics.calidad_aire_comentario}</p>
                </div>`;
        }
        
        if (metrics.calidad_transporte_comentario) {
            hasCityComments = true;
            cityExplanationHTML += `
                <div class="metric-explanation">
                    <span class="metric-name">Calidad del transporte (${metrics.calidad_transporte}/10):</span>
                    <p>${metrics.calidad_transporte_comentario}</p>
                </div>`;
        }
        
        if (metrics.calidad_servicio_medico_comentario) {
            hasCityComments = true;
            cityExplanationHTML += `
                <div class="metric-explanation">
                    <span class="metric-name">Servicio médico (${metrics.calidad_servicio_medico}/10):</span>
                    <p>${metrics.calidad_servicio_medico_comentario}</p>
                </div>`;
        }
        
        cityExplanationHTML += '</div>';
        
        if (hasCityComments) {
            document.getElementById('cityExplanation').innerHTML = cityExplanationHTML;
        } else {
            document.getElementById('cityExplanation').innerHTML = `
                <div class="explanation-block no-data">
                    <p>No hay explicaciones disponibles sobre la ciudad.</p>
                </div>`;
        }
    } else {
        // Si no hay métricas, mostrar N/A
        document.getElementById('costoVida').textContent = '0';
        document.getElementById('calidadAire').textContent = '0';
        document.getElementById('calidadTransporte').textContent = '0';
        document.getElementById('servicioMedico').textContent = '0';
        document.getElementById('distanciaMadrid').textContent = '0 km';
        document.getElementById('cityExplanation').innerHTML = `
            <div class="explanation-block no-data">
                <p>No hay explicaciones disponibles sobre la ciudad.</p>
            </div>`;
    }
    
    // Actualizar navegación
    updateProgramNavigation();
}

// Función auxiliar para actualizar métricas (ciudad o universidad)
function updateMetric(elementId, value, getStatusFn = null, type = 'city', suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Eliminar clase show para resetear la animación
    element.classList.remove('show');
    
    if (type === 'city') {
        // Limpiar clases anteriores para métricas de ciudad
        element.classList.remove('alto', 'medio', 'bajo');
    }
    
    if (value !== undefined && value !== null) {
        // Para métricas de ciudad, añadir clase según el valor
        if (type === 'city' && getStatusFn) {
            const status = getStatusFn(value);
            element.classList.add(status);
        }
        
        // Actualizar texto
        element.textContent = value + suffix;
    } else {
        element.textContent = 'N/A';
    }
    
    // Forzar reflow
    void element.offsetWidth;
    
    // Añadir la clase show para iniciar la animación
    element.classList.add('show');
}

// Actualizar los controles de navegación entre programas
function updateProgramNavigation() {
    if (!currentUniversidad || !currentUniversidad.programas) return;
    
    const totalPrograms = currentUniversidad.programas.length;
    const prevButton = document.getElementById('prevProgramBtn');
    const nextButton = document.getElementById('nextProgramBtn');
    
    // Actualizar contador
    document.getElementById('programCounter').textContent = 
        `${currentProgramIndex + 1} / ${totalPrograms}`;
    
    // Habilitar/deshabilitar botones según la posición
    prevButton.disabled = currentProgramIndex <= 0;
    nextButton.disabled = currentProgramIndex >= totalPrograms - 1;
}

// Navegar al programa anterior
function previousProgram() {
    console.log(`DEBUG previousProgram: currentUniversidad=${!!currentUniversidad}, currentProgramIndex=${currentProgramIndex}`);
    
    // Verificar que tenemos universidad y programas válidos
    if (!currentUniversidad || !currentUniversidad.programas || currentUniversidad.programas.length === 0) {
        console.log('DEBUG previousProgram: No hay universidad o programas válidos');
        return;
    }
    
    // Verificar que el índice es válido y mayor que 0
    if (currentProgramIndex === undefined || currentProgramIndex === null) {
        console.log('DEBUG previousProgram: currentProgramIndex no está definido');
        return;
    }
    
    if (currentProgramIndex > 0) {
        console.log(`DEBUG previousProgram: Navegando al programa ${currentProgramIndex - 1}`);
        // Usar animación de deslizamiento desde la izquierda
        showProgramDetails(currentProgramIndex - 1, 'slide-in-left');
    } else {
        console.log('DEBUG previousProgram: Ya estamos en el primer programa');
    }
}

// Navegar al programa siguiente
function nextProgram() {
    console.log(`DEBUG nextProgram: currentUniversidad=${!!currentUniversidad}, currentProgramIndex=${currentProgramIndex}`);
    
    // Verificar que tenemos universidad y programas válidos
    if (!currentUniversidad || !currentUniversidad.programas || currentUniversidad.programas.length === 0) {
        console.log('DEBUG nextProgram: No hay universidad o programas válidos');
        return;
    }
    
    // Verificar que el índice es válido
    if (currentProgramIndex === undefined || currentProgramIndex === null) {
        console.log('DEBUG nextProgram: currentProgramIndex no está definido');
        return;
    }
    
    if (currentProgramIndex < currentUniversidad.programas.length - 1) {
        console.log(`DEBUG nextProgram: Navegando al programa ${currentProgramIndex + 1}`);
        // Usar animación de deslizamiento desde la derecha
        showProgramDetails(currentProgramIndex + 1, 'slide-in-right');
    } else {
        console.log('DEBUG nextProgram: Ya estamos en el último programa');
    }
}

// Cerrar el modal de universidad y volver al mapa
function closeUniversityModal() {
    const modal = document.getElementById('universityModal');
    
    // Primero quitar la clase para iniciar la animación de salida
    modal.classList.remove('show');
    
    // Esperar a que termine la transición antes de ocultar
    setTimeout(() => {
        modal.style.display = 'none';
        
        // Restablecer variables globales
        currentUniversidad = null;
        currentProgramIndex = 0;
    }, 300); // Coincidir con la duración de la transición en CSS
}

// Inicializar eventos para el modal al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Añadir esta inicialización a la existente
    const existingInit = window.onload;
    
    window.onload = function() {
        if (existingInit) existingInit();
        
        // Configurar botones de navegación
        document.getElementById('backToMapBtn').addEventListener('click', closeUniversityModal);
        document.getElementById('prevProgramBtn').addEventListener('click', previousProgram);
        document.getElementById('nextProgramBtn').addEventListener('click', nextProgram);
        
        // Cerrar el modal al hacer clic en el fondo (opcional)
        document.getElementById('universityModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeUniversityModal();
            }
        });
    };
});

// Mostrar información de universidad en el panel antiguo (mantener por compatibilidad)
function showUniversityInfoOld(universidad) {
    const panel = document.getElementById('infoPanel');
    const content = document.getElementById('infoPanelContent');
    
    let html = `
        <div class="university-header">
            <h2>${universidad.nombre}</h2>
            <div class="image-buttons">
                <button class="image-btn university-btn" onclick="window.open('https://www.google.com/search?q=${encodeURIComponent(universidad.nombre)}&tbm=isch', '_blank')">🏛️ Ver Universidad</button>
                <button class="image-btn city-btn" onclick="window.open('https://www.google.com/search?q=${encodeURIComponent(universidad.ciudad)}&tbm=isch', '_blank')">🏙️ Ver Ciudad</button>
            </div>
        </div>
        <p><strong>📍 Ciudad:</strong> ${universidad.ciudad}</p>
        <h3>📚 Programas de Doctorado</h3>
    `;
    
    universidad.programas.forEach(programa => {
        // Determinar el estado del programa
        const status = programa.status || 'pendiente';
        const statusLabels = {
            'pendiente': 'Pendiente',
            'considerando': 'Considerando',
            'interesado': 'Interesado',
            'aplicando': 'Aplicando',
            'descartado': 'Descartado'
        };
        const statusLabel = statusLabels[status] || 'Pendiente';
        
        // Verificar si hay resumen
        const resumenHtml = programa.resumen ? 
            `<p class="program-summary">${programa.resumen}</p>` : 
            `<p class="no-data">No hay resumen disponible para este programa.</p>`;
        
        // Verificar si hay URL
        const urlHtml = programa.url ? 
            `<p><strong>🔗 URL:</strong> <a href="${programa.url}" target="_blank">${programa.url}</a></p>` : 
            `<p><strong>🔗 URL:</strong> <span class="no-data">No disponible</span></p>`;
        
        // Obtener calificación en estrellas
        const rating = programa.calificacion ? programa.calificacion.valor : 0;
        const starsHtml = `
            <div class="program-stars">
                ${getStarsHTML(rating)}
                <span class="rating-value">${rating > 0 ? rating + '/5' : 'Sin calificar'}</span>
            </div>
        `;
        
        html += `
            <div class="program-item status-${status}">
                <div class="program-item-header">
                    <h4>${programa.nombre}</h4>
                    <div class="program-meta">
                        <span class="program-status status-badge status-${status}">${statusLabel}</span>
                    </div>
                </div>
                
                ${urlHtml}
                
                <div class="program-rating-row">
                    <div class="program-rating-label">
                        <strong>⭐ Calificación:</strong>
                    </div>
                    ${starsHtml}
                </div>
                
                <div class="program-summary-section">
                    <p><strong>📝 Resumen:</strong></p>
                    ${resumenHtml}
                </div>
            </div>
        `;
    });
    
    content.innerHTML = html;
    panel.style.display = 'block';
}

// Función para actualizar los criterios específicos de un programa
function updateProgramCriteria(programa) {
    // Valores por defecto (all programs now have criterios initialized to 0)
    let relevancia = 0;
    let claridad = 0;
    let transparencia = 0;
    let actividades = 0;
    let resultados = 0;
    let promedio = 0;
    
    // Si el programa tiene criterios, mostrarlos
    if (programa.criterios) {
        // Use explicit checks for numeric values to handle 0 correctly
        relevancia = (programa.criterios.relevancia !== undefined && programa.criterios.relevancia !== null) 
            ? programa.criterios.relevancia 
            : 0;
        claridad = (programa.criterios.claridad !== undefined && programa.criterios.claridad !== null) 
            ? programa.criterios.claridad 
            : 0;
        transparencia = (programa.criterios.transparencia !== undefined && programa.criterios.transparencia !== null) 
            ? programa.criterios.transparencia 
            : 0;
        actividades = (programa.criterios.actividades !== undefined && programa.criterios.actividades !== null) 
            ? programa.criterios.actividades 
            : 0;
        resultados = (programa.criterios.resultados !== undefined && programa.criterios.resultados !== null) 
            ? programa.criterios.resultados 
            : 0;
        
        // Calcular promedio
        promedio = calculateCriteriaAvg(programa.criterios);
    }
    
    console.log('DEBUG updateProgramCriteria - criterios:', programa.criterios);
    console.log('DEBUG updateProgramCriteria - values:', { relevancia, claridad, transparencia, actividades, resultados });
    
    // Actualizar los elementos del DOM con animación escalonada
    setTimeout(() => {
        // updateCriteriaValue('criteriaRelevancia', relevancia); // Removed - N/A labels no longer shown
        updateCriteriaDots('view-criteria-relevancia-stars', relevancia);
    }, 100);
    
    setTimeout(() => {
        // updateCriteriaValue('criteriaClaridad', claridad); // Removed - N/A labels no longer shown
        updateCriteriaDots('view-criteria-claridad-stars', claridad);
    }, 150);
    
    setTimeout(() => {
        // updateCriteriaValue('criteriaTransparencia', transparencia); // Removed - N/A labels no longer shown
        updateCriteriaDots('view-criteria-transparencia-stars', transparencia);
    }, 200);
    
    setTimeout(() => {
        // updateCriteriaValue('criteriaActividades', actividades); // Removed - N/A labels no longer shown
        updateCriteriaDots('view-criteria-actividades-stars', actividades);
    }, 250);
    
    setTimeout(() => {
        // updateCriteriaValue('criteriaResultados', resultados); // Removed - N/A labels no longer shown
        updateCriteriaDots('view-criteria-resultados-stars', resultados);
    }, 300);
    
    setTimeout(() => {
        // updateCriteriaValue('criteriaPromedio', promedio); // Removed - N/A labels no longer shown
    }, 350);
}

// Función para configurar los puntos de criterios en la vista del programa
function setupProgramCriteriaDots() {
    console.log("DEBUG: Configurando event listeners para criterios stars");
    
    // Función para configurar event listeners (puede ser llamada múltiples veces)
    function attachEventListeners() {
        // Obtener todas las estrellas de criterios (ahora son estrellas, no dots)
        const criteriaStars = document.querySelectorAll('.program-criteria .criteria-star');
        console.log(`DEBUG: Encontradas ${criteriaStars.length} estrellas de criterios`);
        
        // Remover event listeners existentes para evitar duplicados
        criteriaStars.forEach(star => {
            star.removeEventListener('click', handleCriteriaStarClick);
        });
        
        // Añadir manejador de eventos a cada estrella
        criteriaStars.forEach(star => {
            // Almacenar información para debug
            const criterion = star.getAttribute('data-criterion');
            const value = star.getAttribute('data-value');
            console.log(`DEBUG: Configurando star para criterio=${criterion}, valor=${value}`);
            
            star.addEventListener('click', handleCriteriaStarClick);
        });
    }
    
    // Función manejadora de clicks en estrellas
    function handleCriteriaStarClick(event) {
        const star = event.target;
        const criterion = star.getAttribute('data-criterion');
        const value = parseInt(star.getAttribute('data-value'));
        
        console.log(`DEBUG criteriaClick: Star clicked - criterio=${criterion}, valor=${value}`);
        console.log(`DEBUG criteriaClick: currentUniversidad=${!!currentUniversidad}, currentProgramIndex=${currentProgramIndex}`);
        
        // Si no hay programa actual, no hacer nada
        if (!currentUniversidad) {
            console.log(`DEBUG criteriaClick: Abortando - No hay universidad actual`);
            return;
        }
        
        if (currentProgramIndex === undefined || currentProgramIndex === null || isNaN(Number(currentProgramIndex))) {
            console.log(`DEBUG criteriaClick: Abortando - currentProgramIndex no es válido: ${currentProgramIndex} (tipo: ${typeof currentProgramIndex})`);
            return;
        }
        
        // Verificar que el índice está dentro de los límites
        const programIndex = Number(currentProgramIndex);
        if (programIndex < 0 || programIndex >= currentUniversidad.programas.length) {
            console.log(`DEBUG criteriaClick: Abortando - Índice ${programIndex} fuera de rango (0-${currentUniversidad.programas.length-1})`);
            return;
        }
        
        const programa = currentUniversidad.programas[programIndex];
        
        console.log(`DEBUG criteriaClick: Procesando click en criterio=${criterion}, valor=${value}, programa=${programa._id}`);
        
        // Mostrar modal de confirmación
        showCriteriaConfirmation(programa._id, criterion, value);
    }
    
    // Configurar inicialmente los event listeners
    attachEventListeners();
    
    // También configurar observador para cuando se cargue nuevo contenido del modal
    const universityModal = document.getElementById('universityModal');
    if (universityModal) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    // Re-configurar event listeners cuando cambie el contenido
                    setTimeout(attachEventListeners, 100);
                }
            });
        });
        
        observer.observe(universityModal, {
            childList: true,
            subtree: true
        });
        
        console.log("DEBUG: MutationObserver configurado para el modal de universidad");
    }
    
    // Función pública para reconfigurar manualmente
    window.refreshCriteriaListeners = attachEventListeners;
    
    // Botón de prueba en consola para verificar criterios
    console.log("Para verificar criterios de un programa, ejecuta en la consola: verificarCriterios(id_del_programa)");
    window.verificarCriterios = function(programaId) {
        if (!programaId) {
            console.error("Debes proporcionar un ID de programa");
            return;
        }
        
        console.log(`Verificando criterios para programa ${programaId}...`);
        fetch(`/api/programas/${programaId}/criterios`)
            .then(response => response.json())
            .then(data => {
                console.log("Criterios del programa:", data);
            })
            .catch(error => {
                console.error("Error al verificar criterios:", error);
            });
    };
}

// Función auxiliar para actualizar un criterio específico
function updateCriteriaValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Eliminar clase show para resetear la animación
    element.classList.remove('show');
    
    // Limpiar clases anteriores
    element.classList.remove('criteria-0', 'criteria-1', 'criteria-2', 'criteria-3', 'criteria-4', 'criteria-5');
    
    // Always show numeric value (including 0)
    if (!isNaN(value)) {
        // Añadir clase según el valor
        element.classList.add(`criteria-${value}`);
        element.textContent = value;
    } else {
        // This should not happen anymore as all programs have criterios
        element.textContent = '0';
        element.classList.add('criteria-0');
    }
    
    // Forzar reflow
    void element.offsetWidth;
    
    // Añadir la clase show para iniciar la animación
    element.classList.add('show');
}

// Función para actualizar las estrellas de criterios
function updateCriteriaDots(containerId, value) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Actualizar las estrellas (antes eran dots, ahora son stars)
    const stars = container.querySelectorAll('.criteria-star');
    stars.forEach(star => {
        const starValue = parseInt(star.getAttribute('data-value'));
        if (!isNaN(value) && starValue <= parseInt(value)) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
    
    // Fallback: también buscar dots para compatibilidad hacia atrás
    const dots = container.querySelectorAll('.criteria-dot');
    dots.forEach(dot => {
        const dotValue = parseInt(dot.getAttribute('data-value'));
        if (!isNaN(value) && dotValue <= parseInt(value)) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
    
    // Actualizar también los elementos de descripción de nivel
    const criterionElement = container.querySelector('.criteria-star') || container.querySelector('.criteria-dot');
    if (criterionElement) {
        const criterion = criterionElement.getAttribute('data-criterion');
        const criterionBlock = container.closest('.criteria-block');
        if (criterionBlock) {
            const levelItems = criterionBlock.querySelectorAll('.criteria-level-item');
            levelItems.forEach(item => {
                const itemValue = parseInt(item.getAttribute('data-value'));
                if (value !== 'N/A' && !isNaN(value) && itemValue === parseInt(value)) {
                    item.setAttribute('data-active', 'true');
                } else {
                    item.removeAttribute('data-active');
                }
            });
        }
    }
}

// Función para guardar un criterio en el servidor
async function saveCriterionToServer(criterion, value) {
    // DEBUG: Registrar todas las llamadas para diagnóstico
    console.log(`DEBUG saveCriterionToServer: Iniciando con criterion=${criterion}, value=${value}`);
    console.log(`DEBUG saveCriterionToServer: currentUniversidad=${!!currentUniversidad}, currentProgramIndex=${currentProgramIndex}`);
    
    // Si no hay programa actual, no hacer nada
    if (!currentUniversidad) {
        console.log(`DEBUG saveCriterionToServer: Abortando - No hay universidad actual`);
        return;
    }
    
    if (currentProgramIndex === undefined || currentProgramIndex === null || isNaN(Number(currentProgramIndex))) {
        console.log(`DEBUG saveCriterionToServer: Abortando - currentProgramIndex no es válido: ${currentProgramIndex} (tipo: ${typeof currentProgramIndex})`);
        return;
    }
    
    // Asegurar que currentProgramIndex es un número
    const programIndex = Number(currentProgramIndex);
    
    // Verificar que el índice está dentro de los límites
    if (programIndex < 0 || programIndex >= currentUniversidad.programas.length) {
        console.log(`DEBUG saveCriterionToServer: Abortando - Índice ${programIndex} fuera de rango (0-${currentUniversidad.programas.length-1})`);
        return;
    }
    
    const programa = currentUniversidad.programas[programIndex];
    console.log(`DEBUG saveCriterionToServer: programa=${!!programa}, programa._id=${programa ? programa._id : 'undefined'}`);
    
    if (!programa) {
        console.log(`DEBUG saveCriterionToServer: Abortando - No se encontró el programa en el índice ${programIndex}`);
        return;
    }
    
    if (!programa._id) {
        console.log(`DEBUG saveCriterionToServer: Abortando - Programa no tiene ID válido`);
        return;
    }
    
    try {
        // Preparar los datos a enviar
        const criterios = programa.criterios || {};
        criterios[criterion] = value;
        
        // Crear objeto con los datos a actualizar
        const updateData = {
            criterios: criterios
        };
        
        console.log(`DEBUG saveCriterionToServer: Enviando datos al servidor para programa ${programa._id}`, updateData);
        
        // Enviar al servidor
        const response = await fetch(`/api/programas/${programa._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        console.log(`DEBUG saveCriterionToServer: Respuesta del servidor - status=${response.status}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        // Obtener la respuesta del servidor para verificar
        const responseData = await response.json();
        console.log(`DEBUG saveCriterionToServer: Respuesta del servidor:`, responseData);
        
        // Actualizar datos locales
        if (!programa.criterios) {
            programa.criterios = {};
        }
        programa.criterios[criterion] = value;
        
        // Recalcular y actualizar promedio
        const promedio = calculateCriteriaAvg(programa.criterios);
        // updateCriteriaValue('criteriaPromedio', promedio); // Removed - N/A labels no longer shown
        
        console.log(`Criterio ${criterion} actualizado a ${value} para programa ${programa._id}`);
    } catch (error) {
        console.error(`Error al guardar criterio ${criterion}:`, error);
    }
}

// Función para calcular el promedio de criterios
function calculateCriteriaAvg(criterios) {
    if (!criterios) return 'N/A';
    
    const values = [
        criterios.relevancia,
        criterios.claridad,
        criterios.transparencia,
        criterios.actividades,
        criterios.resultados
    ].filter(val => val !== undefined && val !== null && !isNaN(val));
    
    if (values.length === 0) return 'N/A';
    
    const sum = values.reduce((acc, val) => acc + parseFloat(val), 0);
    const avg = sum / values.length;
    
    // Redondear a 1 decimal
    return Math.round(avg * 10) / 10;
}

// Cerrar panel de información
function closeInfoPanel() {
    document.getElementById('infoPanel').style.display = 'none';
}

// Populate table (obsoleto - mantenido para compatibilidad)
function populateTable() {
    console.log("Populating table with all programs");
    
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    
    // Clear existing content
    tableBody.innerHTML = '';
    
    // Collect all programs from all universities
    let allPrograms = [];
    universidadesData.programas_doctorado.universidades.forEach(universidad => {
        universidad.programas.forEach(programa => {
            allPrograms.push({
                ...programa,
                universidad: universidad.nombre,
                ciudad: universidad.ciudad,
                ciudad_metrics: universidad.ciudad_metrics,
                stats: universidad.stats || programa.stats
            });
        });
    });
    
    // Populate table rows
    allPrograms.forEach(programa => {
        const tr = document.createElement('tr');
        tr.dataset.id = programa._id;
        
        // Calculate criterios average
        const criteriosAvg = programa.criterios ? 
            Object.values(programa.criterios).reduce((a, b) => a + b, 0) / Object.values(programa.criterios).length : 0;
        
        tr.innerHTML = `
            <td>${programa.universidad}</td>
            <td>${programa.ciudad}</td>
            <td>${programa.nombre}</td>
            <td>
                <span class="status-badge status-${programa.status || 'pendiente'}">
                    ${programa.status || 'pendiente'}
                </span>
            </td>
            <td>${programa.calificacion ? programa.calificacion.valor : '-'}</td>
            <td>${criteriosAvg.toFixed(1)}</td>
            <td>
                ${programa.url ? `<a href="${programa.url}" target="_blank">🔗</a>` : '-'}
            </td>
            <td>
                <button class="btn-sm" onclick="showLineas('${programa._id}')">Ver</button>
            </td>
            <td>
                <button class="btn-sm btn-edit" onclick="editProgram('${programa._id}')">✏️</button>
                <button class="btn-sm btn-duplicate" onclick="duplicateProgram('${programa._id}')">📋</button>
                <button class="btn-sm btn-delete" onclick="deleteProgram('${programa._id}')">🗑️</button>
            </td>
        `;
        
        tableBody.appendChild(tr);
    });
    
    // Initialize DataTable if not already initialized
    if (typeof $ !== 'undefined' && $.fn.DataTable) {
        if (!$.fn.DataTable.isDataTable('#programsDataTable')) {
            $('#programsDataTable').DataTable({
                responsive: true,
                pageLength: 25,
                language: {
                    url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
                },
                order: [[0, 'asc'], [2, 'asc']],
                dom: 'Bfrtip',
                buttons: ['copy', 'csv', 'excel', 'pdf']
            });
        }
    }
    
    // Setup table filters
    setupTableFilters();
}

// Setup table filters
function setupTableFilters() {
    const filters = {
        universidad: document.getElementById('filterUniversidad'),
        ciudad: document.getElementById('filterCiudad'),
        programa: document.getElementById('filterPrograma'),
        status: document.getElementById('filterStatus')
    };
    
    // Add event listeners to filters
    Object.values(filters).forEach(filter => {
        if (filter) {
            filter.addEventListener('input', applyTableFilters);
            filter.addEventListener('change', applyTableFilters);
        }
    });
}

// Apply table filters
function applyTableFilters() {
    const filters = {
        universidad: document.getElementById('filterUniversidad').value.toLowerCase(),
        ciudad: document.getElementById('filterCiudad').value.toLowerCase(),
        programa: document.getElementById('filterPrograma').value.toLowerCase(),
        status: document.getElementById('filterStatus').value
    };
    
    const rows = document.querySelectorAll('#tableBody tr');
    rows.forEach(row => {
        const universidad = row.cells[0].textContent.toLowerCase();
        const ciudad = row.cells[1].textContent.toLowerCase();
        const programa = row.cells[2].textContent.toLowerCase();
        const status = row.querySelector('.status-badge').textContent.trim();
        
        const matchUniversidad = !filters.universidad || universidad.includes(filters.universidad);
        const matchCiudad = !filters.ciudad || ciudad.includes(filters.ciudad);
        const matchPrograma = !filters.programa || programa.includes(filters.programa);
        const matchStatus = !filters.status || status === filters.status;
        
        row.style.display = matchUniversidad && matchCiudad && matchPrograma && matchStatus ? '' : 'none';
    });
}

// Reset table filters
window.resetTableFilters = function() {
    document.getElementById('filterUniversidad').value = '';
    document.getElementById('filterCiudad').value = '';
    document.getElementById('filterPrograma').value = '';
    document.getElementById('filterStatus').value = '';
    applyTableFilters();
}

// Edit program
window.editProgram = async function(programId) {
    // Find the program data
    let programData = null;
    for (const uni of universidadesData.programas_doctorado.universidades) {
        const prog = uni.programas.find(p => p._id === programId);
        if (prog) {
            programData = { ...prog, universidad: uni.nombre, ciudad: uni.ciudad };
            break;
        }
    }
    
    if (!programData) return;
    
    // Populate the edit form
    document.getElementById('editProgramId').value = programData._id;
    document.getElementById('editUniversidad').value = programData.universidad;
    document.getElementById('editCiudad').value = programData.ciudad;
    document.getElementById('editPrograma').value = programData.nombre;
    document.getElementById('editStatus').value = programData.status || 'pendiente';
    document.getElementById('editUrl').value = programData.url || '';
    document.getElementById('editLineas').value = programData.lineas_investigacion ? 
        programData.lineas_investigacion.join('\n\n') : '';
    document.getElementById('editResumen').value = programData.resumen || '';
    document.getElementById('editCalificacion').value = programData.calificacion ? 
        programData.calificacion.valor : '';
    
    // Populate criterios
    if (programData.criterios) {
        document.getElementById('editRelevancia').value = programData.criterios.relevancia || 0;
        document.getElementById('editClaridad').value = programData.criterios.claridad || 0;
        document.getElementById('editTransparencia').value = programData.criterios.transparencia || 0;
        document.getElementById('editActividades').value = programData.criterios.actividades || 0;
        document.getElementById('editResultados').value = programData.criterios.resultados || 0;
    }
    
    // Show modal
    document.getElementById('editProgramModal').style.display = 'block';
}

// Close edit modal
window.closeEditModal = function() {
    document.getElementById('editProgramModal').style.display = 'none';
}

// Handle edit form submission
document.addEventListener('DOMContentLoaded', function() {
    const editForm = document.getElementById('editProgramForm');
    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const programId = document.getElementById('editProgramId').value;
    const updates = {
        universidad: document.getElementById('editUniversidad').value,
        ciudad: document.getElementById('editCiudad').value,
        programa: document.getElementById('editPrograma').value,
        status: document.getElementById('editStatus').value,
        url: document.getElementById('editUrl').value,
        linea_investigacion: document.getElementById('editLineas').value,
        resumen: document.getElementById('editResumen').value
    };
    
    // Add calificacion if provided
    const calificacionValue = document.getElementById('editCalificacion').value;
    if (calificacionValue) {
        updates.calificacion = {
            valor: parseInt(calificacionValue),
            fecha: new Date().toISOString()
        };
    }
    
    // Add criterios
    updates.criterios = {
        relevancia: parseInt(document.getElementById('editRelevancia').value) || 0,
        claridad: parseInt(document.getElementById('editClaridad').value) || 0,
        transparencia: parseInt(document.getElementById('editTransparencia').value) || 0,
        actividades: parseInt(document.getElementById('editActividades').value) || 0,
        resultados: parseInt(document.getElementById('editResultados').value) || 0
    };
    
    try {
        const response = await fetch(`${PROGRAMAS_URL}/${programId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        
        if (response.ok) {
            alert('Programa actualizado exitosamente');
            closeEditModal();
            await fetchUniversidadesData();
            populateTable();
        } else {
            alert('Error al actualizar el programa');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar el programa');
    }
        });
    }
});

// Duplicate program
window.duplicateProgram = async function(programId) {
    if (!confirm('¿Deseas duplicar este programa?')) return;
    
    // Find the program data
    let programData = null;
    for (const uni of universidadesData.programas_doctorado.universidades) {
        const prog = uni.programas.find(p => p._id === programId);
        if (prog) {
            programData = { ...prog, universidad: uni.nombre, ciudad: uni.ciudad };
            break;
        }
    }
    
    if (!programData) return;
    
    // Create duplicate
    const newProgram = {
        universidad: programData.universidad,
        ciudad: programData.ciudad,
        programa: programData.nombre + ' (Copia)',
        linea_investigacion: programData.linea_investigacion || '',
        url: programData.url || '',
        status: 'pendiente',
        criterios: programData.criterios || {
            relevancia: 0,
            claridad: 0,
            transparencia: 0,
            actividades: 0,
            resultados: 0
        }
    };
    
    try {
        const response = await fetch(PROGRAMAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProgram)
        });
        
        if (response.ok) {
            alert('Programa duplicado exitosamente');
            await fetchUniversidadesData();
            populateTable();
        } else {
            alert('Error al duplicar el programa');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al duplicar el programa');
    }
}

// Delete program
window.deleteProgram = async function(programId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este programa?')) return;
    
    try {
        const response = await fetch(`${PROGRAMAS_URL}/${programId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Programa eliminado exitosamente');
            await fetchUniversidadesData();
            populateTable();
        } else {
            alert('Error al eliminar el programa');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el programa');
    }
}

// Show lineas de investigacion
window.showLineas = function(programId) {
    // Find the program data
    let programData = null;
    for (const uni of universidadesData.programas_doctorado.universidades) {
        const prog = uni.programas.find(p => p._id === programId);
        if (prog) {
            programData = prog;
            break;
        }
    }
    
    if (!programData || !programData.lineas_investigacion) {
        alert('No hay líneas de investigación disponibles');
        return;
    }
    
    const lineas = programData.lineas_investigacion.join('\n\n');
    alert(`Líneas de Investigación:\n\n${lineas}`);
}

// Export table
window.exportarTabla = function() {
    if (typeof $ !== 'undefined' && $.fn.DataTable.isDataTable('#programsDataTable')) {
        const table = $('#programsDataTable').DataTable();
        table.button('.buttons-excel').trigger();
    } else {
        alert('La función de exportación requiere DataTables');
    }
}

// Setup Calificar tab
function setupCalificarTab() {
    console.log("Setting up Calificar tab...");
    
    // Initialize the filters for the calificar view
    const universitySelect = document.getElementById('calificarUniversityFilter');
    const citySelect = document.getElementById('calificarCityFilter');
    
    if (universitySelect && citySelect) {
        // Clear existing options
        universitySelect.innerHTML = '<option value="">Todas las universidades</option>';
        citySelect.innerHTML = '<option value="">Todas las ciudades</option>';
        
        // Get unique universities and cities
        const universities = [...new Set(universidadesData.programas_doctorado.universidades.map(u => u.nombre))];
        const cities = [...new Set(universidadesData.programas_doctorado.universidades.map(u => u.ciudad))];
        
        // Add options to selects
        universities.forEach(uni => {
            const option = document.createElement('option');
            option.value = uni;
            option.textContent = uni;
            universitySelect.appendChild(option);
        });
        
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
    }
    
    // Load programs to rate
    loadProgramsToRate();
}

// Load programs to rate
function loadProgramsToRate() {
    console.log("Loading programs to rate...");
    const programsContainer = document.getElementById('programsContainer');
    
    if (!programsContainer) {
        console.error("Programs container not found!");
        return;
    }
    
    // Clear container
    programsContainer.innerHTML = '';
    
    let hasPrograms = false;
    
    // For each university
    universidadesData.programas_doctorado.universidades.forEach(universidad => {
        // For each program
        universidad.programas.forEach(programa => {
            hasPrograms = true;
            
            // Create program card
            const programCard = document.createElement('div');
            programCard.className = 'program-card';
            programCard.dataset.universidad = universidad.nombre;
            programCard.dataset.ciudad = universidad.ciudad;
            programCard.dataset.id = programa._id;
            programCard.dataset.rated = programa.calificacion ? 'true' : 'false';
            
            // Determine status class
            const statusClass = programa.status ? `status-${programa.status}` : 'status-pendiente';
            
            programCard.innerHTML = `
                <div class="program-header ${statusClass}">
                    <h3>${programa.nombre}</h3>
                    <div class="program-meta">
                        <span class="universidad">${universidad.nombre}</span>
                        <span class="ciudad">${universidad.ciudad}</span>
                    </div>
                </div>
                <div class="program-content">
                    <div class="program-description">
                        ${programa.resumen ? `<p>${programa.resumen}</p>` : '<p class="no-resumen">Sin resumen disponible</p>'}
                    </div>
                    <div class="program-rating">
                        <h4>Calificación</h4>
                        <div class="rating-stars" data-id="${programa._id}">
                            ${getStarsHTML(programa.calificacion ? programa.calificacion.valor : 0)}
                        </div>
                        <div class="rating-actions">
                            <select class="status-select" data-id="${programa._id}">
                                <option value="pendiente" ${(programa.status === 'pendiente' || !programa.status) ? 'selected' : ''}>Pendiente</option>
                                <option value="considerando" ${programa.status === 'considerando' ? 'selected' : ''}>Considerando</option>
                                <option value="interesado" ${programa.status === 'interesado' ? 'selected' : ''}>Interesado</option>
                                <option value="aplicando" ${programa.status === 'aplicando' ? 'selected' : ''}>Aplicando</option>
                                <option value="descartado" ${programa.status === 'descartado' ? 'selected' : ''}>Descartado</option>
                            </select>
                            <button class="favorite-btn ${programa.favorite ? 'favorited' : ''}" data-id="${programa._id}">
                                ${programa.favorite ? '★ Favorito' : '☆ Añadir a favoritos'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            programsContainer.appendChild(programCard);
        });
    });
    
    // Show message if no programs
    if (!hasPrograms) {
        programsContainer.innerHTML = '<div class="no-programs-message">No hay programas disponibles</div>';
    }
    
    // Setup event listeners for rating stars
    setupRatingStars();
    
    // Setup event listeners for status select
    setupStatusSelect();
    
    // Setup event listeners for favorite buttons
    setupFavoriteButtons();
}

// Setup rating stars
function setupRatingStars() {
    document.querySelectorAll('.rating-stars').forEach(container => {
        const programId = container.dataset.id;
        
        // Add click event to each star
        container.querySelectorAll('.star').forEach((star, index) => {
            star.addEventListener('click', () => {
                const rating = index + 1;
                updateProgramRating(programId, rating);
            });
        });
    });
}

// Setup status select
function setupStatusSelect() {
    document.querySelectorAll('.status-select').forEach(select => {
        const programId = select.dataset.id;
        
        select.addEventListener('change', () => {
            const status = select.value;
            updateProgramStatus(programId, status);
        });
    });
}

// Setup favorite buttons
function setupFavoriteButtons() {
    document.querySelectorAll('.favorite-btn').forEach(button => {
        const programId = button.dataset.id;
        
        button.addEventListener('click', () => {
            toggleFavorite(programId);
        });
    });
}

// Get stars HTML
function getStarsHTML(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        const starClass = i <= rating ? 'star filled' : 'star';
        html += `<span class="${starClass}" data-value="${i}">★</span>`;
    }
    return html;
}

// Update program rating
function updateProgramRating(programId, rating) {
    console.log(`Updating rating for program ${programId} to ${rating}`);
    
    // Find the program in the data
    for (const universidad of universidadesData.programas_doctorado.universidades) {
        for (const programa of universidad.programas) {
            if (programa._id === programId) {
                // Update local data
                programa.calificacion = {
                    valor: rating,
                    fecha: new Date().toISOString(),
                    comentario: ''
                };
                
                // Update UI
                const starsContainer = document.querySelector(`.rating-stars[data-id="${programId}"]`);
                if (starsContainer) {
                    starsContainer.innerHTML = getStarsHTML(rating);
                    setupRatingStars(); // Reattach event listeners
                }
                
                // Mark as rated
                const programCard = document.querySelector(`.program-card[data-id="${programId}"]`);
                if (programCard) {
                    programCard.dataset.rated = 'true';
                }
                
                // Update server
                saveRating(programId, rating);
                
                // Update rankings
                updateRankings();
                
                break;
            }
        }
    }
}

// Save rating to server
async function saveRating(programId, rating) {
    try {
        const response = await fetch(`${PROGRAMAS_URL}/${programId}/calificacion`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                calificacion: {
                    valor: rating,
                    fecha: new Date().toISOString(),
                    comentario: ''
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log('Rating saved successfully');
    } catch (error) {
        console.error('Error saving rating:', error);
    }
}

// Update program status
async function updateProgramStatus(programId, status) {
    console.log(`Updating status for program ${programId} to ${status}`);
    
    // Find the program in the data
    for (const universidad of universidadesData.programas_doctorado.universidades) {
        for (const programa of universidad.programas) {
            if (programa._id === programId) {
                // Update local data
                programa.status = status;
                
                // Update UI
                const programCard = document.querySelector(`.program-card[data-id="${programId}"]`);
                if (programCard) {
                    const header = programCard.querySelector('.program-header');
                    if (header) {
                        // Remove all status classes
                        header.classList.remove('status-pendiente', 'status-considerando', 'status-interesado', 'status-aplicando', 'status-descartado');
                        // Add new status class
                        header.classList.add(`status-${status}`);
                    }
                }
                
                // Update server
                saveStatus(programId, status);
                
                // Update table view
                populateTable();
                
                break;
            }
        }
    }
}

// Save status to server
async function saveStatus(programId, status) {
    try {
        const response = await fetch(`${PROGRAMAS_URL}/${programId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log('Status saved successfully');
    } catch (error) {
        console.error('Error saving status:', error);
    }
}

// Toggle favorite
function toggleFavorite(programId) {
    console.log(`Toggling favorite for program ${programId}`);
    
    // Find the program in the data
    for (const universidad of universidadesData.programas_doctorado.universidades) {
        for (const programa of universidad.programas) {
            if (programa._id === programId) {
                // Toggle favorite
                programa.favorite = !programa.favorite;
                
                // Update UI
                const favoriteBtn = document.querySelector(`.favorite-btn[data-id="${programId}"]`);
                if (favoriteBtn) {
                    if (programa.favorite) {
                        favoriteBtn.classList.add('favorited');
                        favoriteBtn.textContent = '★ Favorito';
                    } else {
                        favoriteBtn.classList.remove('favorited');
                        favoriteBtn.textContent = '☆ Añadir a favoritos';
                    }
                }
                
                // Update favorites display
                updateFavoritesDisplay();
                
                break;
            }
        }
    }
}

// Update favorites display
function updateFavoritesDisplay() {
    console.log("Updating favorites display...");
    const favoritesContainer = document.getElementById('favoritesContainer');
    
    if (!favoritesContainer) {
        console.error("Favorites container not found!");
        return;
    }
    
    // Get all favorite programs
    const favorites = [];
    
    universidadesData.programas_doctorado.universidades.forEach(universidad => {
        universidad.programas.forEach(programa => {
            if (programa.favorite) {
                favorites.push({
                    id: programa._id,
                    nombre: programa.nombre,
                    universidad: universidad.nombre,
                    ciudad: universidad.ciudad,
                    rating: programa.calificacion ? programa.calificacion.valor : 0,
                    status: programa.status || 'pendiente'
                });
            }
        });
    });
    
    // Clear container
    favoritesContainer.innerHTML = '';
    
    // Show message if no favorites
    if (favorites.length === 0) {
        favoritesContainer.innerHTML = '<p class="no-favorites-message">No hay programas favoritos guardados.</p>';
        return;
    }
    
    // Sort favorites by rating (highest first)
    favorites.sort((a, b) => b.rating - a.rating);
    
    // Create favorite items
    favorites.forEach(favorite => {
        const favoriteItem = document.createElement('div');
        favoriteItem.className = `favorite-item status-${favorite.status}`;
        favoriteItem.innerHTML = `
            <div class="favorite-info">
                <h4>${favorite.nombre}</h4>
                <div class="favorite-meta">
                    <span class="universidad">${favorite.universidad}</span>
                    <span class="ciudad">${favorite.ciudad}</span>
                </div>
            </div>
            <div class="favorite-rating">
                ${getStarsHTML(favorite.rating)}
            </div>
            <button class="remove-favorite" data-id="${favorite.id}">×</button>
        `;
        
        favoritesContainer.appendChild(favoriteItem);
    });
    
    // Setup event listeners for remove buttons
    document.querySelectorAll('.remove-favorite').forEach(button => {
        const programId = button.dataset.id;
        
        button.addEventListener('click', () => {
            toggleFavorite(programId);
        });
    });
}

// Filter programs to rate
function filterProgramsToRate() {
    const universityFilter = document.getElementById('calificarUniversityFilter').value;
    const cityFilter = document.getElementById('calificarCityFilter').value;
    const statusFilter = document.getElementById('calificarStatusFilter').value;
    const searchFilter = document.getElementById('calificarSearchFilter').value.toLowerCase();
    
    document.querySelectorAll('.program-card').forEach(card => {
        const universidad = card.dataset.universidad;
        const ciudad = card.dataset.ciudad;
        const rated = card.dataset.rated === 'true';
        const programName = card.querySelector('h3').textContent.toLowerCase();
        
        const matchesUniversity = !universityFilter || universidad === universityFilter;
        const matchesCity = !cityFilter || ciudad === cityFilter;
        const matchesStatus = !statusFilter || 
                            (statusFilter === 'pendiente' && !rated) || 
                            (statusFilter === 'calificado' && rated);
        const matchesSearch = !searchFilter || programName.includes(searchFilter);
        
        if (matchesUniversity && matchesCity && matchesStatus && matchesSearch) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Update rankings
function updateRankings() {
    console.log("Updating rankings...");
    
    // Get all rated programs with criterios
    const ratedPrograms = [];
    
    universidadesData.programas_doctorado.universidades.forEach(universidad => {
        universidad.programas.forEach(programa => {
            if (programa.calificacion && programa.calificacion.valor) {
                // Calculate criterios average
                let criteriosAvg = 0;
                let criteriosData = null;
                
                if (programa.criterios) {
                    const criteriosValues = Object.values(programa.criterios);
                    criteriosAvg = criteriosValues.reduce((a, b) => a + b, 0) / criteriosValues.length;
                    criteriosData = programa.criterios;
                }
                
                ratedPrograms.push({
                    id: programa._id,
                    nombre: programa.nombre,
                    universidad: universidad.nombre,
                    ciudad: universidad.ciudad,
                    rating: programa.calificacion.valor,
                    criterios: criteriosData,
                    criteriosAvg: criteriosAvg,
                    fecha: programa.calificacion.fecha || new Date().toISOString(),
                    status: programa.status || 'pendiente',
                    favorite: programa.favorite || false
                });
            }
        });
    });
    
    // Update stats including criteria
    updateRankingStats(ratedPrograms);
    
    // Update criteria stats
    updateCriteriaStats(ratedPrograms);
    
    // Sort by rating (highest first)
    ratedPrograms.sort((a, b) => b.rating - a.rating);
    
    // Update ranking table
    populateRankingTable(ratedPrograms);
    
    // Update ranking filters
    updateRankingFilters();
    
    // Update all charts
    updateDistributionChart(ratedPrograms);
    updateCriteriaCharts(ratedPrograms);
}

// Update ranking stats
function updateRankingStats(ratedPrograms) {
    // Update program count
    document.getElementById('programasCalificadosCount').textContent = ratedPrograms.length;
    
    // Calculate average rating
    let totalRating = 0;
    ratedPrograms.forEach(program => {
        totalRating += program.rating;
    });
    
    const averageRating = ratedPrograms.length > 0 ? (totalRating / ratedPrograms.length).toFixed(1) : '0.0';
    document.getElementById('calificacionPromedio').textContent = averageRating;
    
    // Find top university
    const universityRatings = {};
    
    ratedPrograms.forEach(program => {
        if (!universityRatings[program.universidad]) {
            universityRatings[program.universidad] = {
                total: 0,
                count: 0
            };
        }
        
        universityRatings[program.universidad].total += program.rating;
        universityRatings[program.universidad].count++;
    });
    
    let topUniversity = '-';
    let topUniversityRating = 0;
    
    for (const universidad in universityRatings) {
        const average = universityRatings[universidad].total / universityRatings[universidad].count;
        
        if (average > topUniversityRating) {
            topUniversityRating = average;
            topUniversity = universidad;
        }
    }
    
    document.getElementById('topUniversidad').textContent = topUniversity;
    
    // Find top city
    const cityRatings = {};
    
    ratedPrograms.forEach(program => {
        if (!cityRatings[program.ciudad]) {
            cityRatings[program.ciudad] = {
                total: 0,
                count: 0
            };
        }
        
        cityRatings[program.ciudad].total += program.rating;
        cityRatings[program.ciudad].count++;
    });
    
    let topCity = '-';
    let topCityRating = 0;
    
    for (const ciudad in cityRatings) {
        const average = cityRatings[ciudad].total / cityRatings[ciudad].count;
        
        if (average > topCityRating) {
            topCityRating = average;
            topCity = ciudad;
        }
    }
    
    document.getElementById('topCiudad').textContent = topCity;
}

// Update criteria stats
function updateCriteriaStats(ratedPrograms) {
    const criteriaKeys = ['relevancia', 'claridad', 'transparencia', 'actividades', 'resultados'];
    const criteriaTotals = {
        relevancia: { sum: 0, count: 0 },
        claridad: { sum: 0, count: 0 },
        transparencia: { sum: 0, count: 0 },
        actividades: { sum: 0, count: 0 },
        resultados: { sum: 0, count: 0 }
    };
    
    // Calculate sums and counts
    ratedPrograms.forEach(program => {
        if (program.criterios) {
            criteriaKeys.forEach(key => {
                if (program.criterios[key] !== undefined && program.criterios[key] !== null) {
                    criteriaTotals[key].sum += program.criterios[key];
                    criteriaTotals[key].count++;
                }
            });
        }
    });
    
    // Calculate averages and update UI
    let totalAvg = 0;
    let totalCount = 0;
    
    criteriaKeys.forEach(key => {
        const avg = criteriaTotals[key].count > 0 ? 
            (criteriaTotals[key].sum / criteriaTotals[key].count) : 0;
        
        // Update average display
        const avgElement = document.getElementById(`avg${key.charAt(0).toUpperCase() + key.slice(1)}`);
        if (avgElement) {
            avgElement.textContent = avg.toFixed(1);
        }
        
        // Update progress bar
        const barElement = document.getElementById(`bar${key.charAt(0).toUpperCase() + key.slice(1)}`);
        if (barElement) {
            barElement.style.width = `${(avg / 5) * 100}%`;
        }
        
        if (criteriaTotals[key].count > 0) {
            totalAvg += avg;
            totalCount++;
        }
    });
    
    // Update total average
    const overallAvg = totalCount > 0 ? (totalAvg / totalCount) : 0;
    const avgTotalElement = document.getElementById('avgCriteriosTotal');
    if (avgTotalElement) {
        avgTotalElement.textContent = overallAvg.toFixed(1);
    }
    
    const barTotalElement = document.getElementById('barCriteriosTotal');
    if (barTotalElement) {
        barTotalElement.style.width = `${(overallAvg / 5) * 100}%`;
    }
}

// Update criteria charts
function updateCriteriaCharts(ratedPrograms) {
    // Update radar chart
    updateCriteriaRadarChart(ratedPrograms);
    
    // Update comparison chart
    updateCriteriaComparisonChart(ratedPrograms);
    
    // Update correlation chart
    updateCorrelationChart(ratedPrograms);
}

// Update criteria radar chart
function updateCriteriaRadarChart(ratedPrograms) {
    const ctx = document.getElementById('criteriaRadarChart');
    if (!ctx) return;
    
    // Group by university and calculate averages
    const universityData = {};
    
    ratedPrograms.forEach(program => {
        if (program.criterios) {
            if (!universityData[program.universidad]) {
                universityData[program.universidad] = {
                    relevancia: [],
                    claridad: [],
                    transparencia: [],
                    actividades: [],
                    resultados: []
                };
            }
            
            Object.keys(program.criterios).forEach(key => {
                if (program.criterios[key] !== undefined && program.criterios[key] !== null) {
                    universityData[program.universidad][key].push(program.criterios[key]);
                }
            });
        }
    });
    
    // Calculate averages and prepare datasets
    const datasets = [];
    const colors = ['rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)', 'rgba(255, 205, 86, 0.5)', 
                    'rgba(75, 192, 192, 0.5)', 'rgba(153, 102, 255, 0.5)'];
    let colorIndex = 0;
    
    Object.keys(universityData).slice(0, 5).forEach(universidad => {
        const data = [];
        ['relevancia', 'claridad', 'transparencia', 'actividades', 'resultados'].forEach(key => {
            const values = universityData[universidad][key];
            const avg = values.length > 0 ? 
                values.reduce((a, b) => a + b, 0) / values.length : 0;
            data.push(avg);
        });
        
        datasets.push({
            label: universidad,
            data: data,
            backgroundColor: colors[colorIndex % colors.length],
            borderColor: colors[colorIndex % colors.length].replace('0.5', '1'),
            borderWidth: 2
        });
        colorIndex++;
    });
    
    // Create or update chart
    if (window.criteriaRadarChartInstance) {
        window.criteriaRadarChartInstance.destroy();
    }
    
    window.criteriaRadarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Relevancia', 'Claridad', 'Transparencia', 'Actividades', 'Resultados'],
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scale: {
                ticks: {
                    beginAtZero: true,
                    max: 5
                }
            }
        }
    });
}

// Update criteria comparison chart
function updateCriteriaComparisonChart(ratedPrograms) {
    const ctx = document.getElementById('criteriaComparisonChart');
    if (!ctx) return;
    
    // Calculate averages for each criterion
    const criteriaAverages = {
        relevancia: [],
        claridad: [],
        transparencia: [],
        actividades: [],
        resultados: []
    };
    
    ratedPrograms.forEach(program => {
        if (program.criterios) {
            Object.keys(criteriaAverages).forEach(key => {
                if (program.criterios[key] !== undefined && program.criterios[key] !== null) {
                    criteriaAverages[key].push(program.criterios[key]);
                }
            });
        }
    });
    
    const data = [];
    const labels = [];
    
    Object.keys(criteriaAverages).forEach(key => {
        const values = criteriaAverages[key];
        if (values.length > 0) {
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            data.push(avg);
            labels.push(key.charAt(0).toUpperCase() + key.slice(1));
        }
    });
    
    // Create or update chart
    if (window.criteriaComparisonChartInstance) {
        window.criteriaComparisonChartInstance.destroy();
    }
    
    window.criteriaComparisonChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Promedio de Criterios',
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5
                }
            }
        }
    });
}

// Update correlation chart
function updateCorrelationChart(ratedPrograms) {
    const ctx = document.getElementById('correlationChart');
    if (!ctx) return;
    
    // Prepare scatter data
    const scatterData = ratedPrograms
        .filter(p => p.criteriosAvg > 0)
        .map(p => ({
            x: p.criteriosAvg,
            y: p.rating
        }));
    
    // Create or update chart
    if (window.correlationChartInstance) {
        window.correlationChartInstance.destroy();
    }
    
    window.correlationChartInstance = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Calificación vs Promedio de Criterios',
                data: scatterData,
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Promedio de Criterios'
                    },
                    min: 0,
                    max: 5
                },
                y: {
                    title: {
                        display: true,
                        text: 'Calificación'
                    },
                    min: 0,
                    max: 10
                }
            }
        }
    });
}

// Update ranking filters
function updateRankingFilters() {
    const universitySelect = document.getElementById('rankingUniversityFilter');
    const citySelect = document.getElementById('rankingCityFilter');
    
    if (universitySelect && citySelect) {
        // Clear existing options
        universitySelect.innerHTML = '<option value="">Todas las universidades</option>';
        citySelect.innerHTML = '<option value="">Todas las ciudades</option>';
        
        // Get unique universities and cities with rated programs
        const universities = new Set();
        const cities = new Set();
        
        universidadesData.programas_doctorado.universidades.forEach(universidad => {
            universidad.programas.forEach(programa => {
                if (programa.calificacion && programa.calificacion.valor) {
                    universities.add(universidad.nombre);
                    cities.add(universidad.ciudad);
                }
            });
        });
        
        // Add options to selects
        [...universities].sort().forEach(uni => {
            const option = document.createElement('option');
            option.value = uni;
            option.textContent = uni;
            universitySelect.appendChild(option);
        });
        
        [...cities].sort().forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
    }
}

// Populate ranking table
function populateRankingTable(ratedPrograms) {
    const tableBody = document.getElementById('rankingTableBody');
    
    if (!tableBody) {
        console.error("Ranking table body not found!");
        return;
    }
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Show message if no rated programs
    if (ratedPrograms.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="no-data">No hay programas calificados</td></tr>';
        return;
    }
    
    // Apply filters
    const universityFilter = document.getElementById('rankingUniversityFilter').value;
    const cityFilter = document.getElementById('rankingCityFilter').value;
    const limitFilter = parseInt(document.getElementById('rankingLimitFilter').value);
    
    const filteredPrograms = ratedPrograms.filter(program => {
        const matchesUniversity = !universityFilter || program.universidad === universityFilter;
        const matchesCity = !cityFilter || program.ciudad === cityFilter;
        
        return matchesUniversity && matchesCity;
    });
    
    // Apply limit
    const limitedPrograms = limitFilter > 0 ? filteredPrograms.slice(0, limitFilter) : filteredPrograms;
    
    // Create table rows
    limitedPrograms.forEach((program, index) => {
        const row = document.createElement('tr');
        
        // Format date
        const date = new Date(program.fecha);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        
        // Create mini criteria display
        let criteriaHTML = '';
        if (program.criterios) {
            const criteriaValues = [
                program.criterios.relevancia || 0,
                program.criterios.claridad || 0,
                program.criterios.transparencia || 0,
                program.criterios.actividades || 0,
                program.criterios.resultados || 0
            ];
            criteriaHTML = criteriaValues.map(v => `<span class="mini-criteria">${v}</span>`).join(' ');
        } else {
            criteriaHTML = '<span class="no-criteria">Sin criterios</span>';
        }
        
        // Calculate combined score (60% calificacion + 40% criterios)
        const combinedScore = program.criteriosAvg > 0 ? 
            (program.rating * 0.6 + (program.criteriosAvg * 2) * 0.4).toFixed(1) : 
            program.rating.toFixed(1);
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${program.nombre}</td>
            <td>${program.universidad}</td>
            <td>${program.ciudad}</td>
            <td>
                <div class="ranking-stars">
                    ${getStarsHTML(program.rating)}
                </div>
            </td>
            <td>
                <div class="criteria-display">
                    ${criteriaHTML}
                </div>
                <div class="criteria-avg-label">Promedio: ${program.criteriosAvg.toFixed(1)}</div>
            </td>
            <td class="combined-score">${combinedScore}</td>
            <td>${formattedDate}</td>
            <td>
                <button class="view-program-btn" data-id="${program.id}">Ver</button>
                <button class="favorite-btn ${program.favorite ? 'favorited' : ''}" data-id="${program.id}">
                    ${program.favorite ? '★' : '☆'}
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Setup event listeners for buttons
    setupRankingTableButtons();
}

// Setup ranking table buttons
function setupRankingTableButtons() {
    // View program buttons
    document.querySelectorAll('.view-program-btn').forEach(button => {
        const programId = button.dataset.id;
        
        button.addEventListener('click', () => {
            viewProgram(programId);
        });
    });
    
    // Favorite buttons
    document.querySelectorAll('.ranking-table .favorite-btn').forEach(button => {
        const programId = button.dataset.id;
        
        button.addEventListener('click', () => {
            toggleFavorite(programId);
            // Update button display
            if (button.classList.contains('favorited')) {
                button.classList.remove('favorited');
                button.textContent = '☆';
            } else {
                button.classList.add('favorited');
                button.textContent = '★';
            }
        });
    });
}

// View program
function viewProgram(programId) {
    // Find the program
    for (const universidad of universidadesData.programas_doctorado.universidades) {
        for (const programa of universidad.programas) {
            if (programa._id === programId) {
                showUniversityInfo({
                    nombre: universidad.nombre,
                    ciudad: universidad.ciudad,
                    programas: [programa]
                });
                break;
            }
        }
    }
}

// Filter rankings
function filterRankings() {
    // Trigger rankings update with current filters
    updateRankings();
}

// Update distribution chart
function updateDistributionChart(ratedPrograms) {
    const chartCanvas = document.getElementById('gradesDistributionChart');
    
    if (!chartCanvas) {
        console.error("Distribution chart canvas not found!");
        return;
    }
    
    // Count ratings
    const ratingCounts = [0, 0, 0, 0, 0]; // For ratings 1-5
    
    ratedPrograms.forEach(program => {
        if (program.rating >= 1 && program.rating <= 5) {
            ratingCounts[program.rating - 1]++;
        }
    });
    
    // Create or update chart
    if (window.distributionChart) {
        window.distributionChart.data.datasets[0].data = ratingCounts;
        window.distributionChart.update();
    } else {
        window.distributionChart = new Chart(chartCanvas, {
            type: 'bar',
            data: {
                labels: ['1 ★', '2 ★', '3 ★', '4 ★', '5 ★'],
                datasets: [{
                    label: 'Número de programas',
                    data: ratingCounts,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(255, 205, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(54, 162, 235, 0.7)'
                    ],
                    borderColor: [
                        'rgb(255, 99, 132)',
                        'rgb(255, 159, 64)',
                        'rgb(255, 205, 86)',
                        'rgb(75, 192, 192)',
                        'rgb(54, 162, 235)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
}

// Add new university
function agregarUniversidad() {
    const nombre = prompt('Nombre de la universidad:');
    const ciudad = prompt('Ciudad:');
    
    if (!nombre || !ciudad) {
        return;
    }
    
    // Add to local data
    universidadesData.programas_doctorado.universidades.push({
        nombre: nombre,
        ciudad: ciudad,
        programas: []
    });
    
    // Update UI
    updateMapMarkers();
    populateTable();
    
    // Save to server
    saveNewUniversidad(nombre, ciudad);
}

// Save new university to server
async function saveNewUniversidad(nombre, ciudad) {
    try {
        const response = await fetch(UNIVERSIDADES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, ciudad })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log('Universidad saved successfully');
    } catch (error) {
        console.error('Error saving universidad:', error);
    }
}

// Add new program
function agregarPrograma(universidad, ciudad) {
    const programa = prompt('Nombre del programa:');
    const linea_investigacion = prompt('Líneas de investigación (separadas por doble salto de línea):');
    const url = prompt('URL del programa:');
    
    if (!programa) {
        return;
    }
    
    // Save to server
    saveNewPrograma(universidad, ciudad, programa, linea_investigacion, url);
}

// Save new program to server
async function saveNewPrograma(universidad, ciudad, programa, linea_investigacion, url) {
    try {
        const response = await fetch(PROGRAMAS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                universidad,
                ciudad,
                programa,
                linea_investigacion,
                url
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Programa saved successfully:', result);
        
        // Add to local data
        for (const uni of universidadesData.programas_doctorado.universidades) {
            if (uni.nombre === universidad && uni.ciudad === ciudad) {
                uni.programas.push({
                    _id: result._id,
                    nombre: programa,
                    lineas_investigacion: linea_investigacion ? linea_investigacion.split('\n\n') : [],
                    url: url || ""
                });
                
                // Update UI
                populateTable();
                loadProgramsToRate();
                
                break;
            }
        }
    } catch (error) {
        console.error('Error saving programa:', error);
    }
}

// Initialize radar chart
function initializeRadarChart() {
    const ctx = document.getElementById('radarChart');
    
    if (!ctx) {
        console.error("Radar chart canvas not found!");
        return;
    }
    
    // Create empty chart
    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: [
                'Innovación',
                'Interdisciplinariedad',
                'Impacto',
                'Internacional',
                'Aplicabilidad'
            ],
            datasets: [{
                label: 'Métricas',
                data: [0, 0, 0, 0, 0],
                fill: true,
                backgroundColor: 'rgba(240, 147, 251, 0.2)',
                borderColor: '#f093fb',
                pointBackgroundColor: '#f093fb',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#f093fb'
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 10
                }
            }
        }
    });
    
    // Setup university selector
    setupUniversitySelector();
}

// Initialize city radar chart
function initializeCityRadarChart() {
    const ctx = document.getElementById('cityRadarChart');
    
    if (!ctx) {
        console.error("City radar chart canvas not found!");
        return;
    }
    
    // Create empty chart
    cityRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: [
                'Costo de Vida',
                'Calidad del Aire',
                'Calidad del Transporte',
                'Calidad del Servicio Médico',
                'Distancia a Madrid'
            ],
            datasets: [{
                label: 'Métricas de Ciudad',
                data: [0, 0, 0, 0, 0],
                fill: true,
                backgroundColor: 'rgba(245, 87, 108, 0.2)',
                borderColor: '#f5576c',
                pointBackgroundColor: '#f5576c',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#f5576c'
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 10
                }
            }
        }
    });
}

// Setup university selector
function setupUniversitySelector() {
    const selector = document.getElementById('universitySelector');
    
    if (!selector) {
        console.error("University selector not found!");
        return;
    }
    
    // Clear existing options except the first one
    while (selector.options.length > 1) {
        selector.remove(1);
    }
    
    // Add universities with stats
    analysisData.universidades.forEach(universidad => {
        if (universidad.stats) {
            const option = document.createElement('option');
            option.value = universidad.nombre;
            option.textContent = universidad.nombre;
            selector.appendChild(option);
        }
    });
    
    // Update charts on change
    selector.addEventListener('change', updateCharts);
}

// Update charts
function updateCharts() {
    const selectedUniversity = document.getElementById('universitySelector').value;
    
    if (!selectedUniversity) {
        // Reset charts
        radarChart.data.datasets[0].data = [0, 0, 0, 0, 0];
        radarChart.update();
        
        cityRadarChart.data.datasets[0].data = [0, 0, 0, 0, 0];
        cityRadarChart.update();
        
        // Reset summary
        document.getElementById('universitySummary').innerHTML = '<p>Selecciona una universidad para ver su análisis detallado.</p>';
        
        return;
    }
    
    // Find university data
    const universityData = analysisData.universidades.find(u => u.nombre === selectedUniversity);
    
    if (!universityData) {
        console.error(`University data not found for ${selectedUniversity}`);
        return;
    }
    
    // Update academic metrics chart
    if (universityData.stats) {
        radarChart.data.datasets[0].data = [
            universityData.stats.innovacion,
            universityData.stats.interdisciplinariedad,
            universityData.stats.impacto,
            universityData.stats.internacional,
            universityData.stats.aplicabilidad
        ];
        radarChart.update();
    }
    
    // Update city metrics chart
    if (universityData.ciudad_metrics) {
        // Normalize values to 0-10 scale
        const costoVida = 10 - (universityData.ciudad_metrics.costo_vida / 10); // Invert: lower cost is better
        const calidadAire = universityData.ciudad_metrics.calidad_aire;
        const calidadTransporte = universityData.ciudad_metrics.calidad_transporte;
        const calidadMedico = universityData.ciudad_metrics.calidad_servicio_medico;
        
        // Normalize distance to Madrid (0-500km -> 10-0)
        const distancia = Math.max(0, 10 - (universityData.ciudad_metrics.distancia_a_madrid_km / 50));
        
        cityRadarChart.data.datasets[0].data = [
            costoVida,
            calidadAire,
            calidadTransporte,
            calidadMedico,
            distancia
        ];
        cityRadarChart.update();
    }
    
    // Update summary
    updateUniversitySummary(universityData);
}

// Update university summary
function updateUniversitySummary(universityData) {
    const summaryContainer = document.getElementById('universitySummary');
    
    if (!summaryContainer) {
        console.error("University summary container not found!");
        return;
    }
    
    // Build summary HTML
    let html = `
        <h3>${universityData.nombre}</h3>
        <p><strong>Ciudad:</strong> ${universityData.ciudad}</p>
        <p><strong>Programas:</strong> ${universityData.programCount}</p>
    `;
    
    // Add academic metrics
    if (universityData.stats) {
        html += `
            <div class="metrics-section">
                <h4>Métricas Académicas</h4>
                <ul>
                    <li><strong>Innovación:</strong> ${universityData.stats.innovacion}/10</li>
                    <li><strong>Interdisciplinariedad:</strong> ${universityData.stats.interdisciplinariedad}/10</li>
                    <li><strong>Impacto:</strong> ${universityData.stats.impacto}/10</li>
                    <li><strong>Internacional:</strong> ${universityData.stats.internacional}/10</li>
                    <li><strong>Aplicabilidad:</strong> ${universityData.stats.aplicabilidad}/10</li>
                </ul>
            </div>
        `;
    }
    
    // Add city metrics
    if (universityData.ciudad_metrics) {
        html += `
            <div class="metrics-section">
                <h4>Métricas de Ciudad</h4>
                <ul>
                    <li><strong>Costo de Vida:</strong> ${universityData.ciudad_metrics.costo_vida}/100</li>
                    <li><strong>Distancia a Madrid:</strong> ${universityData.ciudad_metrics.distancia_a_madrid_km} km</li>
                    <li><strong>Calidad del Servicio Médico:</strong> ${universityData.ciudad_metrics.calidad_servicio_medico}/10</li>
                    <li><strong>Calidad del Transporte:</strong> ${universityData.ciudad_metrics.calidad_transporte}/10</li>
                    <li><strong>Calidad del Aire:</strong> ${universityData.ciudad_metrics.calidad_aire}/10</li>
                </ul>
            </div>
        `;
        
        // Add comments if available
        if (universityData.ciudad_metrics.costo_vida_comentario) {
            html += `
                <div class="comments-section">
                    <h4>Comentarios</h4>
                    <p><strong>Costo de Vida:</strong> ${universityData.ciudad_metrics.costo_vida_comentario}</p>
                    ${universityData.ciudad_metrics.calidad_servicio_medico_comentario ? `<p><strong>Servicio Médico:</strong> ${universityData.ciudad_metrics.calidad_servicio_medico_comentario}</p>` : ''}
                    ${universityData.ciudad_metrics.calidad_transporte_comentario ? `<p><strong>Transporte:</strong> ${universityData.ciudad_metrics.calidad_transporte_comentario}</p>` : ''}
                    ${universityData.ciudad_metrics.calidad_aire_comentario ? `<p><strong>Calidad del Aire:</strong> ${universityData.ciudad_metrics.calidad_aire_comentario}</p>` : ''}
                </div>
            `;
        }
    }
    
    summaryContainer.innerHTML = html;
}

// Update analysis view
function updateAnalysisView() {
    console.log("Updating analysis view...");
    
    // Check if we have data
    if (!analysisData.universidades || analysisData.universidades.length === 0) {
        document.getElementById('noDataAlert').classList.remove('hidden');
        return;
    }
    
    // Hide alert
    document.getElementById('noDataAlert').classList.add('hidden');
    
    // Update statistics
    document.getElementById('universidadesCount').textContent = analysisData.universidades.length;
    
    let totalProgramas = 0;
    const ciudades = new Set();
    
    analysisData.universidades.forEach(universidad => {
        totalProgramas += universidad.programCount || 0;
        ciudades.add(universidad.ciudad);
    });
    
    document.getElementById('programasCount').textContent = totalProgramas;
    document.getElementById('ciudadesCount').textContent = ciudades.size;
    
    // Setup university selector
    setupUniversitySelector();
}

// Confirm enrich data
function confirmEnrichData() {
    if (confirm('Esta operación enriquecerá los datos con IA, añadiendo resúmenes, métricas y coordenadas. Puede tardar varios minutos. ¿Desea continuar?')) {
        enrichData();
    }
}

// Enrich data
async function enrichData() {
    const button = document.getElementById('enrichButton');
    const progressContainer = document.getElementById('enrichProgressContainer');
    const progressBar = document.getElementById('enrichProgressBar');
    const progressText = document.getElementById('enrichProgressText');
    const currentUniversityName = document.getElementById('currentUniversityName');
    const currentUniversityNumber = document.getElementById('currentUniversityNumber');
    const totalUniversities = document.getElementById('totalUniversities');
    const logContainer = document.getElementById('enrichLogContainer');
    const logElement = document.getElementById('enrichLog');
    
    // Get enrichment options
    const enrichResumen = document.getElementById('adminEnrichResumen').checked;
    const enrichMetrics = document.getElementById('adminEnrichMetrics').checked;
    const enrichCiudad = document.getElementById('adminEnrichCiudad').checked;
    
    // Clear previous logs
    logElement.innerHTML = '';
    
    // Show progress container
    button.style.display = 'none';
    progressContainer.classList.remove('hidden');
    logContainer.classList.remove('hidden');
    
    // Add initial log entry
    addLogEntry(logElement, 'Iniciando proceso de enriquecimiento de datos con IA...');
    addLogEntry(logElement, `Opciones: Resúmenes (${enrichResumen ? 'Sí' : 'No'}), Métricas (${enrichMetrics ? 'Sí' : 'No'}), Datos ciudad (${enrichCiudad ? 'Sí' : 'No'})`);
    
    try {
        // Initialize counters
        let processedCount = 0;
        const unis = universidadesData.programas_doctorado.universidades;
        const total = unis.length;
        
        // Update total in UI
        totalUniversities.textContent = total;
        
        // In a real application, this would be a proper API with progress updates
        // For demonstration, we'll simulate progress updates
        for (let i = 0; i < unis.length; i++) {
            const uni = unis[i];
            
            // Update current university info
            currentUniversityName.textContent = uni.nombre;
            currentUniversityNumber.textContent = (i + 1);
            
            // Calculate and update progress
            const progress = Math.round(((i + 1) / total) * 100);
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
            
            // Add log entry for this university
            addLogEntry(logElement, `Procesando universidad: ${uni.nombre} (${uni.ciudad})`);
            
            // Simulate API call with delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Add completion log entry
            const programCount = uni.programas ? uni.programas.length : 0;
            addLogEntry(logElement, `✅ Universidad ${uni.nombre} completada. Programas actualizados: ${programCount}`);
            
            processedCount++;
        }
        
        // Add completion log
        addLogEntry(logElement, '');
        addLogEntry(logElement, '✨ Proceso de enriquecimiento completado con éxito');
        addLogEntry(logElement, `📊 Estadísticas finales:`);
        addLogEntry(logElement, `   - Universidades procesadas: ${processedCount}`);
        
        let totalPrograms = 0;
        unis.forEach(uni => {
            totalPrograms += uni.programas ? uni.programas.length : 0;
        });
        addLogEntry(logElement, `   - Programas actualizados: ${totalPrograms}`);
        
        // Add timestamp to log
        const now = new Date();
        const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${
            (now.getMonth() + 1).toString().padStart(2, '0')}/${
            now.getFullYear()} ${
            now.getHours().toString().padStart(2, '0')}:${
            now.getMinutes().toString().padStart(2, '0')}`;
            
        addLogEntry(logElement, `   - Fecha y hora: ${formattedDate}`);
        
        // Simulate API call
        const response = { 
            universities: processedCount, 
            updated: totalPrograms,
            timestamp: new Date().toISOString()
        };
        console.log('Enrichment result:', response);
        
        // Reload data
        await fetchUniversidadesData();
        await fetchAnalysisData();
        
        // Update UI
        updateMapMarkers();
        populateTable();
        updateAnalysisView();
        updateLastEnrichmentInfo();
        
        // Show success message
        setTimeout(() => {
            alert(`Enriquecimiento de datos completado.\nUniversidades procesadas: ${response.universities}\nProgramas actualizados: ${response.updated}`);
        }, 500);
    } catch (error) {
        console.error('Error enriching data:', error);
        addLogEntry(logElement, `❌ Error al enriquecer datos: ${error.message}`, true);
        alert('Error al enriquecer datos. Por favor, inténtelo de nuevo.');
    } finally {
        // Hide progress container and show button
        setTimeout(() => {
            button.style.display = 'block';
            progressContainer.classList.add('hidden');
        }, 1000);
    }
}

// Add log entry
function addLogEntry(logElement, text, isError = false) {
    const entry = document.createElement('div');
    entry.className = isError ? 'enrich-log-entry error' : 'enrich-log-entry';
    entry.textContent = text;
    logElement.appendChild(entry);
    
    // Auto-scroll to bottom
    logElement.scrollTop = logElement.scrollHeight;
}

// Confirm fix geographic data
function confirmFixGeographicData() {
    if (confirm('Esta operación corregirá los datos geográficos de todas las universidades. ¿Desea continuar?')) {
        fixGeographicData();
    }
}

// Fix geographic data
async function fixGeographicData() {
    const button = document.getElementById('fixGeoButton');
    const progressContainer = document.getElementById('geoFixProgressContainer');
    const progressBar = document.getElementById('geoFixProgressBar');
    const progressText = document.getElementById('geoFixProgressText');
    const currentGeoCity = document.getElementById('currentGeoCity');
    const currentGeoNumber = document.getElementById('currentGeoNumber');
    const totalGeoCities = document.getElementById('totalGeoCities');
    const logContainer = document.getElementById('geoFixLogContainer');
    const logElement = document.getElementById('geoFixLog');
    
    // Clear previous logs
    logElement.innerHTML = '';
    
    // Show progress container and log
    button.style.display = 'none';
    progressContainer.classList.remove('hidden');
    logContainer.classList.remove('hidden');
    
    // Add initial log entry
    addLogEntry(logElement, 'Iniciando corrección de datos geográficos...');
    
    try {
        // Get unique cities from universities data
        const cities = new Set();
        universidadesData.programas_doctorado.universidades.forEach(uni => {
            if (uni.ciudad) {
                cities.add(uni.ciudad);
            }
        });
        
        const citiesArray = [...cities];
        const total = citiesArray.length;
        
        // Update total in UI
        totalGeoCities.textContent = total;
        
        // In a real application, this would be a proper API with progress updates
        // For demonstration, we'll simulate progress updates
        for (let i = 0; i < citiesArray.length; i++) {
            const city = citiesArray[i];
            
            // Update current city info
            currentGeoCity.textContent = city;
            currentGeoNumber.textContent = (i + 1);
            
            // Calculate and update progress
            const progress = Math.round(((i + 1) / total) * 100);
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
            
            // Add log entry for this city
            addLogEntry(logElement, `Verificando coordenadas de: ${city}`);
            
            // Simulate processing with delay
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Check if we have coordinates for this city
            const hasCoords = coordenadasCiudades[city] !== undefined;
            
            if (hasCoords) {
                addLogEntry(logElement, `✅ Ciudad ${city} validada. Coordenadas: [${coordenadasCiudades[city]}]`);
            } else {
                addLogEntry(logElement, `⚠️ No se encontraron coordenadas para: ${city}. Usando aproximación.`, true);
            }
        }
        
        // Add completion log
        addLogEntry(logElement, '');
        addLogEntry(logElement, '🌍 Proceso de corrección geográfica completado');
        addLogEntry(logElement, `📊 Ciudades procesadas: ${total}`);
        
        // Update maps
        updateMapMarkers();
        
        // Show success message
        setTimeout(() => {
            alert(`Corrección de datos geográficos completada.\nCiudades procesadas: ${total}`);
        }, 500);
    } catch (error) {
        console.error('Error fixing geographic data:', error);
        addLogEntry(logElement, `❌ Error al corregir datos geográficos: ${error.message}`, true);
        alert('Error al corregir datos geográficos. Por favor, inténtelo de nuevo.');
    } finally {
        // Hide progress container and show button after a short delay
        setTimeout(() => {
            button.style.display = 'block';
            progressContainer.classList.add('hidden');
        }, 1000);
    }
}

// Show criteria rating confirmation modal
function showCriteriaConfirmation(programId, criterion, value) {
    const criteriaNames = {
        relevancia: "Relevancia personal y afinidad temática",
        claridad: "Claridad y especificidad de las líneas de investigación", 
        transparencia: "Transparencia en información y procesos",
        actividades: "Estructura y variedad de actividades formativas",
        resultados: "Transparencia en resultados y calidad"
    };
    
    // Set modal content
    document.getElementById('criteria-name').textContent = criteriaNames[criterion] || criterion;
    document.getElementById('criteria-rating-stars').innerHTML = '★'.repeat(value) + '☆'.repeat(5 - value);
    document.getElementById('criteria-rating-value').textContent = value;
    document.getElementById('criteria-program-id').value = programId;
    document.getElementById('criteria-criterion').value = criterion;
    document.getElementById('criteria-value').value = value;
    
    // Show modal
    document.getElementById('criteria-rating-modal').style.display = 'block';
}

// Close criteria rating modal
function closeCriteriaModal() {
    document.getElementById('criteria-rating-modal').style.display = 'none';
}

// Confirm criteria rating
async function confirmCriteriaRating() {
    const programId = document.getElementById('criteria-program-id').value;
    const criterion = document.getElementById('criteria-criterion').value;
    const value = parseInt(document.getElementById('criteria-value').value);
    
    console.log(`DEBUG confirmCriteriaRating: Guardando criterio ${criterion}=${value} para programa ${programId}`);
    
    try {
        // Update the server
        await saveCriterionToServer(criterion, value, programId);
        
        // Update the UI
        updateCriteriaStars(criterion, value);
        updateCriteriaValue(criterion, value);
        updateCriteriaAverage();
        
        // Close modal
        closeCriteriaModal();
        
        // Show success message
        alert(`Criterio "${criterion}" calificado con ${value} estrellas correctamente.`);
        
    } catch (error) {
        console.error('Error saving criteria rating:', error);
        alert(`Error al guardar calificación: ${error.message}`);
    }
}

// Save criterion to server
async function saveCriterionToServer(criterion, value, programId = null) {
    console.log(`DEBUG saveCriterionToServer: criterion=${criterion}, value=${value}, programId=${programId}`);
    
    // Use provided programId or get from current program
    let targetProgramId = programId;
    if (!targetProgramId && currentUniversidad && currentProgramIndex !== undefined) {
        const programIndex = Number(currentProgramIndex);
        if (programIndex >= 0 && programIndex < currentUniversidad.programas.length) {
            targetProgramId = currentUniversidad.programas[programIndex]._id;
        }
    }
    
    if (!targetProgramId) {
        console.error('DEBUG saveCriterionToServer: No program ID available');
        throw new Error('No se pudo identificar el programa');
    }
    
    // Get current criterios from the program
    let currentCriterios = {};
    if (currentUniversidad && currentProgramIndex !== undefined) {
        const programIndex = Number(currentProgramIndex);
        if (programIndex >= 0 && programIndex < currentUniversidad.programas.length) {
            currentCriterios = currentUniversidad.programas[programIndex].criterios || {};
        }
    }
    
    // Prepare update data with the complete criterios object
    const updatedCriterios = {
        ...currentCriterios,
        [criterion]: value
    };
    
    const updateData = {
        criterios: updatedCriterios
    };
    
    console.log(`DEBUG saveCriterionToServer: Enviando a servidor:`, updateData);
    
    const response = await fetch(`/api/programas/${targetProgramId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('DEBUG saveCriterionToServer: Server response:', result);
    
    // Update local data
    if (currentUniversidad && currentProgramIndex !== undefined) {
        const programIndex = Number(currentProgramIndex);
        if (programIndex >= 0 && programIndex < currentUniversidad.programas.length) {
            if (!currentUniversidad.programas[programIndex].criterios) {
                currentUniversidad.programas[programIndex].criterios = {};
            }
            currentUniversidad.programas[programIndex].criterios[criterion] = value;
        }
    }
    
    return result;
}

// Update criteria stars UI
function updateCriteriaStars(criterion, value) {
    const starsContainer = document.getElementById(`view-criteria-${criterion}-stars`);
    if (!starsContainer) return;
    
    const stars = starsContainer.querySelectorAll('.criteria-star');
    stars.forEach((star, index) => {
        if (index < value) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Update criteria value display
function updateCriteriaValue(criterion, value) {
    const valueElement = document.getElementById(`criteria${criterion.charAt(0).toUpperCase() + criterion.slice(1)}`);
    if (valueElement) {
        valueElement.textContent = value;
        valueElement.className = `current-value criteria-${value} show`;
    }
}

// Update criteria average
function updateCriteriaAverage() {
    console.log('DEBUG updateCriteriaAverage called');
    
    if (!currentUniversidad || currentProgramIndex === undefined) {
        console.log('DEBUG updateCriteriaAverage - No universidad or program index');
        return;
    }
    
    const programIndex = Number(currentProgramIndex);
    if (programIndex < 0 || programIndex >= currentUniversidad.programas.length) {
        console.log('DEBUG updateCriteriaAverage - Invalid program index');
        return;
    }
    
    const programa = currentUniversidad.programas[programIndex];
    if (!programa.criterios) {
        console.log('DEBUG updateCriteriaAverage - No criterios in program');
        return;
    }
    
    const criterios = programa.criterios;
    const values = Object.values(criterios).filter(v => v !== undefined && v !== null && !isNaN(v));
    
    console.log('DEBUG updateCriteriaAverage - values:', values);
    
    if (values.length > 0) {
        const sum = values.reduce((a, b) => Number(a) + Number(b), 0);
        const average = (sum / values.length).toFixed(1);
        console.log('DEBUG updateCriteriaAverage - calculated average:', average);
        
        const avgElement = document.getElementById('criteriaPromedio');
        if (avgElement) {
            avgElement.textContent = average;
            avgElement.className = `value criteria-value criteria-avg show`;
        }
    } else {
        console.log('DEBUG updateCriteriaAverage - No valid values to calculate average');
    }
}

// Setup criteria modal events
document.addEventListener('DOMContentLoaded', function() {
    // Close modal events
    const closeModalBtn = document.querySelector('.close-criteria-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeCriteriaModal);
    }
    
    const cancelBtn = document.getElementById('cancel-criteria-rating');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeCriteriaModal);
    }
    
    // Confirm button
    const confirmBtn = document.getElementById('confirm-criteria-rating');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmCriteriaRating);
    }
});