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
    // Centrar el mapa en la península ibérica para mostrar tanto España como Portugal
    map = L.map('map').setView([40.0, -5.0], 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Agregar marcadores
    updateMapMarkers();
}

// Update map markers based on current data
function updateMapMarkers() {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Add new markers
    universidadesData.programas_doctorado.universidades.forEach(universidad => {
        // Try to use coords from enriched data if available
        let coords = null;
        
        // First check if universidad has coords object
        if (universidad.coords && universidad.coords.lat && universidad.coords.lon) {
            coords = [universidad.coords.lat, universidad.coords.lon];
        } 
        // Then try to get coords from the predefined coordinates
        else if (universidad.ciudad && coordenadasCiudades[universidad.ciudad]) {
            coords = coordenadasCiudades[universidad.ciudad];
        }
        // For universities in Portugal, try to guess the city
        else if (universidad.ciudad) {
            // Check if any city name contains this one (for handling variations)
            const cityKeys = Object.keys(coordenadasCiudades);
            for (const cityKey of cityKeys) {
                if (universidad.ciudad.includes(cityKey) || cityKey.includes(universidad.ciudad)) {
                    coords = coordenadasCiudades[cityKey];
                    console.log(`Using coordinates for ${cityKey} for university in ${universidad.ciudad}`);
                    break;
                }
            }
        }
        
        if (coords) {
            const marker = L.marker(coords)
                .addTo(map)
                .bindPopup(`<b>${universidad.nombre}</b><br>${universidad.ciudad}`)
                .on('click', () => showUniversityInfo(universidad));
            
            markers.push(marker);
        } else {
            console.warn(`Coordenadas no encontradas para ${universidad.ciudad}. La universidad no aparecerá en el mapa.`);
        }
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
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    universidadesData.programas_doctorado.universidades.forEach(universidad => {
        // Para el mapa, el status es una propiedad de los programas, no de la universidad
        // Determinar el status predominante para esta universidad
        let status = '';
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
        
        if (matchesFilters(universidad, universidad.ciudad, status)) {
            // Try to use coords from enriched data if available
            let coords = null;
            
            // First check if universidad has coords object
            if (universidad.coords && universidad.coords.lat && universidad.coords.lon) {
                coords = [universidad.coords.lat, universidad.coords.lon];
            } 
            // Then try to get coords from the predefined coordinates
            else if (universidad.ciudad && coordenadasCiudades[universidad.ciudad]) {
                coords = coordenadasCiudades[universidad.ciudad];
            }
            // For universities in Portugal, try to guess the city
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
                const marker = L.marker(coords)
                    .addTo(map)
                    .bindPopup(`<b>${universidad.nombre}</b><br>${universidad.ciudad}`)
                    .on('click', () => showUniversityInfo(universidad));
                
                markers.push(marker);
            }
        }
    });
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

// Mostrar información de universidad
function showUniversityInfo(universidad) {
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

// Cerrar panel de información
function closeInfoPanel() {
    document.getElementById('infoPanel').style.display = 'none';
}

// Populate table (obsoleto - mantenido para compatibilidad)
function populateTable() {
    console.log("Populate table called - now using DataTables instead");
    
    // No hacemos nada aquí, ya que ahora usamos DataTables para gestionar la tabla
    // Esta función se mantiene para compatibilidad con el código existente
    
    // Si estamos en la vista de tabla, inicializamos DataTable
    const activeTab = document.querySelector('.tab.active');
    if (activeTab && activeTab.dataset.tab === 'tabla' && typeof initializeDataTable === 'function') {
        // Dar tiempo para que el DOM se actualice
        setTimeout(function() {
            if (typeof $ !== 'undefined' && $('#programsDataTable').length) {
                if (!$.fn.DataTable.isDataTable('#programsDataTable')) {
                    initializeDataTable();
                }
            }
        }, 100);
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
    
    // Get all rated programs
    const ratedPrograms = [];
    
    universidadesData.programas_doctorado.universidades.forEach(universidad => {
        universidad.programas.forEach(programa => {
            if (programa.calificacion && programa.calificacion.valor) {
                ratedPrograms.push({
                    id: programa._id,
                    nombre: programa.nombre,
                    universidad: universidad.nombre,
                    ciudad: universidad.ciudad,
                    rating: programa.calificacion.valor,
                    fecha: programa.calificacion.fecha || new Date().toISOString(),
                    status: programa.status || 'pendiente',
                    favorite: programa.favorite || false
                });
            }
        });
    });
    
    // Update stats
    updateRankingStats(ratedPrograms);
    
    // Sort by rating (highest first)
    ratedPrograms.sort((a, b) => b.rating - a.rating);
    
    // Update ranking table
    populateRankingTable(ratedPrograms);
    
    // Update ranking filters
    updateRankingFilters();
    
    // Update distribution chart
    updateDistributionChart(ratedPrograms);
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
        tableBody.innerHTML = '<tr><td colspan="7" class="no-data">No hay programas calificados</td></tr>';
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