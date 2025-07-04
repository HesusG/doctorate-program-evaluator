// Variables para seguimiento de cambios
let changedFields = {};
let currentProgramId = null;
let programsInEditMode = {};
const UNIVERSITIES_PER_PAGE = 5; // Número de universidades por página
let currentPage = 1;
let totalPages = 1;

// Inicialización al cargar el documento
document.addEventListener('DOMContentLoaded', function() {
    // Configurar eventos para la vista de tabla
    setupTableEvents();
});

// Configurar eventos de tabla
function setupTableEvents() {
    // Configurar evento para cambiar a la pestaña de tabla
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            if (this.dataset.tab === 'tabla') {
                // Cargar universidades cuando se selecciona la pestaña
                setTimeout(() => loadUniversities(), 100);
            }
        });
    });
    
    // Configurar botón de guardar cambios
    document.getElementById('saveTableChanges').addEventListener('click', function() {
        showSaveConfirmModal();
    });
    
    // Configurar botones de modal de guardar
    document.getElementById('confirmSaveBtn').addEventListener('click', function() {
        saveAllChanges();
        hideSaveConfirmModal();
    });
    
    document.getElementById('cancelSaveBtn').addEventListener('click', function() {
        hideSaveConfirmModal();
    });
    
    // Configurar botón para mostrar modal de agregar programa
    document.querySelector('.add-program-btn').addEventListener('click', function() {
        showAddProgramModal();
    });
    
    // Configurar botones de modal de agregar programa
    document.getElementById('saveProgramBtn').addEventListener('click', function() {
        saveNewProgram();
    });
    
    document.getElementById('cancelProgramBtn').addEventListener('click', function() {
        hideAddProgramModal();
    });
}

// Cargar todas las universidades en la vista
function loadUniversities() {
    const container = document.querySelector('.universities-container');
    container.innerHTML = '';
    
    if (!universidadesData || !universidadesData.programas_doctorado || !universidadesData.programas_doctorado.universidades) {
        container.innerHTML = '<p class="no-data-message">No hay datos disponibles</p>';
        return;
    }
    
    // Ordenar universidades por nombre
    const sortedUniversities = [...universidadesData.programas_doctorado.universidades]
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    // Calcular páginas totales
    totalPages = Math.ceil(sortedUniversities.length / UNIVERSITIES_PER_PAGE);
    
    // Calcular índices para paginación a nivel de universidad
    const startIndex = (currentPage - 1) * UNIVERSITIES_PER_PAGE;
    const endIndex = Math.min(startIndex + UNIVERSITIES_PER_PAGE, sortedUniversities.length);
    
    // Mostrar solo las universidades de la página actual
    for (let i = startIndex; i < endIndex; i++) {
        const panel = createUniversityPanel(sortedUniversities[i]);
        container.appendChild(panel);
    }
    
    // Configurar eventos para los paneles recién creados
    setupPanelEvents();
    
    // Actualizar UI de paginación
    updatePaginationUI();
}

// Crear panel para una universidad
function createUniversityPanel(universidad) {
    // Clonar la plantilla
    const template = document.getElementById('university-panel-template');
    const panel = template.content.cloneNode(true);
    
    // Configurar datos de la universidad
    panel.querySelector('.university-name').textContent = universidad.nombre;
    panel.querySelector('.university-city').textContent = universidad.ciudad;
    panel.querySelector('.program-count').textContent = `${universidad.programas.length} programas`;
    
    // Añadir atributos de datos
    const universityPanel = panel.querySelector('.university-panel');
    universityPanel.dataset.universidad = universidad.nombre;
    universityPanel.dataset.ciudad = universidad.ciudad;
    
    // Configurar botón de colapso
    panel.querySelector('.toggle-university-btn').classList.add('collapsed');
    
    // Añadir todos los programas (sin paginación a nivel de programa)
    loadAllUniversityPrograms(universidad, universityPanel);
    
    return panel;
}

// Cargar todos los programas de una universidad (sin paginación)
function loadAllUniversityPrograms(universidad, universityPanel) {
    const programsContainer = universityPanel.querySelector('.programs-container');
    programsContainer.innerHTML = '';
    
    // Debug: Verificar datos de universidad antes de cargar programas
    console.log(`Cargando programas para universidad: ${universidad.nombre}`);
    console.log(`- ciudad_metrics presente: ${!!universidad.ciudad_metrics}`);
    if (universidad.ciudad_metrics) {
        console.log(`- ciudad_metrics.costo_vida: ${universidad.ciudad_metrics.costo_vida}`);
    }
    console.log(`- stats presente: ${!!universidad.stats}`);
    
    // Ordenar programas por nombre
    const sortedPrograms = [...universidad.programas]
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    // Mostrar todos los programas
    sortedPrograms.forEach((programa, index) => {
        // Debug: Verificar datos de programa
        if (index === 0) {
            console.log(`Primer programa: ${programa.nombre}`);
            console.log(`- stats presente: ${!!programa.stats}`);
            if (programa.stats) {
                console.log(`- stats.innovacion: ${programa.stats.innovacion}`);
            }
            console.log(`- ciudad_metrics presente: ${!!programa.ciudad_metrics}`);
            if (programa.ciudad_metrics) {
                console.log(`- ciudad_metrics.costo_vida: ${programa.ciudad_metrics.costo_vida}`);
            }
        }
        
        const programCard = createProgramCard(programa, universidad);
        programsContainer.appendChild(programCard);
    });
}

// Actualizar UI de paginación (ahora para universidades)
function updatePaginationUI() {
    const paginationContainer = document.querySelector('.universities-pagination');
    if (!paginationContainer) return;
    
    const prevBtn = paginationContainer.querySelector('.pagination-prev');
    const nextBtn = paginationContainer.querySelector('.pagination-next');
    const currentPageEl = paginationContainer.querySelector('.current-page');
    const totalPagesEl = paginationContainer.querySelector('.total-pages');
    
    // Actualizar texto
    currentPageEl.textContent = currentPage;
    totalPagesEl.textContent = totalPages;
    
    // Habilitar/deshabilitar botones según corresponda
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
}

// Crear tarjeta para un programa
function createProgramCard(programa, universidad) {
    // Debug: Verificar datos antes de crear la tarjeta
    console.log(`Creando tarjeta para programa: ${programa.nombre}`);
    console.log(`- Stats en programa: ${!!programa.stats}`);
    console.log(`- Stats en universidad: ${!!universidad.stats}`);
    console.log(`- Ciudad metrics en programa: ${!!programa.ciudad_metrics}`);
    console.log(`- Ciudad metrics en universidad: ${!!universidad.ciudad_metrics}`);
    
    // Debugging exhaustivo para entender la estructura de los datos
    console.log('=== DEBUGGING PROGRAMA Y UNIVERSIDAD ===');
    console.log('PROGRAMA COMPLETO:', JSON.stringify(programa, null, 2).substring(0, 500) + '...');
    console.log('UNIVERSIDAD COMPLETO:', JSON.stringify(universidad, null, 2).substring(0, 500) + '...');
    console.log(`- Programa tiene linea_investigacion? ${!!programa.linea_investigacion}`);
    console.log(`- Las keys del objeto programa son: ${Object.keys(programa)}`);
    
    // Verificar todos los campos clave para ver qué está disponible
    const camposImportantes = ['_id', 'nombre', 'url', 'linea_investigacion', 'resumen', 'status', 'calificacion'];
    camposImportantes.forEach(campo => {
        console.log(`- Programa tiene '${campo}'? ${!!programa[campo]}`);
    });
    
    if (programa.linea_investigacion) {
        console.log(`- linea_investigacion valor: "${programa.linea_investigacion.substring(0, 50)}..."`);
    }
    
    // Clonar la plantilla
    const template = document.getElementById('program-card-template');
    const card = template.content.cloneNode(true);
    
    // Configurar datos básicos del programa
    card.querySelector('.program-name').textContent = programa.nombre;
    
    // Configurar enlace
    const linkElement = card.querySelector('.program-link');
    if (programa.url) {
        linkElement.href = programa.url;
        linkElement.style.display = 'inline';
    } else {
        linkElement.style.display = 'none';
    }
    
    // Configurar estado
    const statusSelect = card.querySelector('.status-select');
    statusSelect.value = programa.status || 'pendiente';
    
    // Configurar clase de estado
    const programCard = card.querySelector('.program-card');
    programCard.classList.add(`status-${programa.status || 'pendiente'}`);
    
    // Configurar ID del programa
    programCard.dataset.id = programa._id;
    programCard.dataset.universidad = universidad.nombre;
    
    // Configurar calificación
    const ratingContainer = card.querySelector('.rating-stars');
    ratingContainer.innerHTML = getStarsHTML(programa.calificacion ? programa.calificacion.valor : 0);
    ratingContainer.dataset.rating = programa.calificacion ? programa.calificacion.valor : 0;
    
    // Configurar resumen
    const resumenField = card.querySelector('.resumen-field .field-content');
    resumenField.textContent = programa.resumen || 'Sin resumen disponible';
    
    // Configurar líneas de investigación
    const lineasField = card.querySelector('.lines-field .field-content');
    const linesContent = card.querySelector('.lines-content');
    const toggleLinesBtn = card.querySelector('.toggle-lines-btn');
    
    // Comprobar tanto lineas_investigacion (API) como linea_investigacion (DB)
    if (lineasField && (programa.lineas_investigacion || programa.linea_investigacion)) {
        let contenidoLineas = '';
        
        if (programa.lineas_investigacion) {
            // Si es un array, unirlo con saltos de línea
            if (Array.isArray(programa.lineas_investigacion)) {
                contenidoLineas = programa.lineas_investigacion.join('<br><br>');
            } else {
                contenidoLineas = programa.lineas_investigacion;
            }
        } else if (programa.linea_investigacion) {
            // Procesar el texto para preservar saltos de línea
            contenidoLineas = programa.linea_investigacion
                .replace(/\n\n/g, '<br><br>')  // Doble salto de línea
                .replace(/\n/g, '<br>');       // Salto de línea simple
        }
        
        lineasField.innerHTML = contenidoLineas;
        
        // Mostrar la sección de líneas automáticamente
        if (linesContent) {
            linesContent.classList.remove('hidden');
        }
        
        // Actualizar botón de toggle
        if (toggleLinesBtn) {
            toggleLinesBtn.textContent = '▼';
            toggleLinesBtn.classList.remove('collapsed');
        }
    } else if (lineasField) {
        lineasField.textContent = 'Sin líneas de investigación disponibles';
    }
    
    // Configurar métricas académicas - siguiendo el modelo de la sección de análisis
    // Buscar en universidad
    if (universidad.stats) {
        console.log(`Stats encontrados en universidad: ${JSON.stringify(universidad.stats)}`);
        
        // Verificar si hay datos para mostrar
        const tieneMetricas = universidad.stats.innovacion !== undefined || 
                            universidad.stats.interdisciplinariedad !== undefined ||
                            universidad.stats.impacto !== undefined ||
                            universidad.stats.internacional !== undefined ||
                            universidad.stats.aplicabilidad !== undefined;
        
        if (tieneMetricas) {
            // Asignar los valores a los elementos correspondientes
            if (universidad.stats.innovacion !== undefined) {
                card.querySelector('[data-field="innovacion"] .field-content').textContent = universidad.stats.innovacion;
            }
            if (universidad.stats.interdisciplinariedad !== undefined) {
                card.querySelector('[data-field="interdisciplinariedad"] .field-content').textContent = universidad.stats.interdisciplinariedad;
            }
            if (universidad.stats.impacto !== undefined) {
                card.querySelector('[data-field="impacto"] .field-content').textContent = universidad.stats.impacto;
            }
            if (universidad.stats.internacional !== undefined) {
                card.querySelector('[data-field="internacional"] .field-content').textContent = universidad.stats.internacional;
            }
            if (universidad.stats.aplicabilidad !== undefined) {
                card.querySelector('[data-field="aplicabilidad"] .field-content').textContent = universidad.stats.aplicabilidad;
            }
            
            // Mostrar sección
            const metricsContent = card.querySelector('.metrics-content');
            const toggleMetricsBtn = card.querySelector('.toggle-metrics-btn');
            metricsContent.classList.remove('hidden');
            toggleMetricsBtn.textContent = '▼';
            toggleMetricsBtn.classList.remove('collapsed');
        }
    } else {
        console.log(`No se encontraron stats en universidad: ${universidad.nombre}`);
    }
    
    // Configurar datos de ciudad - siguiendo el modelo de la sección de análisis
    // Buscar en universidad
    if (universidad.ciudad_metrics) {
        console.log(`Ciudad metrics encontrados en universidad: ${JSON.stringify(universidad.ciudad_metrics)}`);
        
        // Mostrar sección
        const cityContent = card.querySelector('.city-content');
        const toggleCityBtn = card.querySelector('.toggle-city-btn');
        let hasAnyMetric = false;
        
        // Mostrar costo de vida
        const costoVidaElement = card.querySelector('[data-field="costo_vida"] .field-content');
        if (costoVidaElement && universidad.ciudad_metrics.costo_vida !== undefined) {
            costoVidaElement.textContent = universidad.ciudad_metrics.costo_vida;
            hasAnyMetric = true;
            
            // Añadir tooltip con comentario si existe
            if (universidad.ciudad_metrics.costo_vida_comentario) {
                costoVidaElement.title = universidad.ciudad_metrics.costo_vida_comentario;
                costoVidaElement.classList.add('has-tooltip');
            }
        }
        
        // Mostrar calidad del aire
        const calidadAireElement = card.querySelector('[data-field="calidad_aire"] .field-content');
        if (calidadAireElement && universidad.ciudad_metrics.calidad_aire !== undefined) {
            calidadAireElement.textContent = universidad.ciudad_metrics.calidad_aire;
            hasAnyMetric = true;
            
            // Añadir tooltip con comentario si existe
            if (universidad.ciudad_metrics.calidad_aire_comentario) {
                calidadAireElement.title = universidad.ciudad_metrics.calidad_aire_comentario;
                calidadAireElement.classList.add('has-tooltip');
            }
        }
        
        // Mostrar calidad del transporte
        const calidadTransporteElement = card.querySelector('[data-field="calidad_transporte"] .field-content');
        if (calidadTransporteElement && universidad.ciudad_metrics.calidad_transporte !== undefined) {
            calidadTransporteElement.textContent = universidad.ciudad_metrics.calidad_transporte;
            hasAnyMetric = true;
            
            // Añadir tooltip con comentario si existe
            if (universidad.ciudad_metrics.calidad_transporte_comentario) {
                calidadTransporteElement.title = universidad.ciudad_metrics.calidad_transporte_comentario;
                calidadTransporteElement.classList.add('has-tooltip');
            }
        }
        
        // Mostrar calidad del servicio médico
        const calidadServicioMedicoElement = card.querySelector('[data-field="calidad_servicio_medico"] .field-content');
        if (calidadServicioMedicoElement && universidad.ciudad_metrics.calidad_servicio_medico !== undefined) {
            calidadServicioMedicoElement.textContent = universidad.ciudad_metrics.calidad_servicio_medico;
            hasAnyMetric = true;
            
            // Añadir tooltip con comentario si existe
            if (universidad.ciudad_metrics.calidad_servicio_medico_comentario) {
                calidadServicioMedicoElement.title = universidad.ciudad_metrics.calidad_servicio_medico_comentario;
                calidadServicioMedicoElement.classList.add('has-tooltip');
            }
        }
        
        // Verificar si es una ciudad portuguesa para mostrar la distancia adecuada
        const portugueseCities = ['Lisboa', 'Porto', 'Coimbra', 'Braga', 'Aveiro', 'Faro'];
        const isPortugueseCity = (universidad.ciudad && 
                                (portugueseCities.includes(universidad.ciudad) || 
                                portugueseCities.some(pc => universidad.ciudad.includes(pc)) ||
                                universidad.ciudad.includes('Portugal')));
        
        // Mostrar distancia a Madrid o Lisboa según corresponda
        const distanciaElement = card.querySelector('[data-field="distancia_a_madrid_km"] .field-content');
        if (distanciaElement) {
            if (isPortugueseCity && universidad.ciudad_metrics.distancia_a_lisboa_km !== undefined) {
                // Para ciudades portuguesas, mostrar distancia a Lisboa
                distanciaElement.textContent = universidad.ciudad_metrics.distancia_a_lisboa_km + ' km a Lisboa';
                hasAnyMetric = true;
            } else if (!isPortugueseCity && universidad.ciudad_metrics.distancia_a_madrid_km !== undefined) {
                // Para ciudades españolas, mostrar distancia a Madrid
                distanciaElement.textContent = universidad.ciudad_metrics.distancia_a_madrid_km + ' km a Madrid';
                hasAnyMetric = true;
            } else {
                // Fallback si no hay distancia definida
                distanciaElement.textContent = 'No disponible';
            }
        }
        
        // Concatenar todos los campos _comentario para mostrarlos como descripción
        const cityDescription = card.querySelector('.city-description-content');
        if (cityDescription) {
            // Crear un array con todos los comentarios disponibles
            const comentarios = [];
            
            // Añadir cada comentario disponible al array
            if (universidad.ciudad_metrics.costo_vida_comentario) {
                comentarios.push(universidad.ciudad_metrics.costo_vida_comentario);
            }

            if (universidad.ciudad_metrics.calidad_aire_comentario) {
                comentarios.push(universidad.ciudad_metrics.calidad_aire_comentario);
            }

            if (universidad.ciudad_metrics.calidad_transporte_comentario) {
                comentarios.push(universidad.ciudad_metrics.calidad_transporte_comentario);
            }

            if (universidad.ciudad_metrics.calidad_servicio_medico_comentario) {
                comentarios.push(universidad.ciudad_metrics.calidad_servicio_medico_comentario);
            }
            

            // Si hay comentarios, mostrarlos
            if (comentarios.length > 0) {
                const formattedDesc = comentarios.join('<br><br>');
                cityDescription.innerHTML = formattedDesc;
                hasAnyMetric = true;
            } 
            // Si hay descripción, mostrarla (como fallback)
            else if (universidad.ciudad_metrics.descripcion) {
                // Procesar markdown: formato bold con ** y convertir bullets con *
                let formattedDesc = universidad.ciudad_metrics.descripcion
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold text
                    .replace(/^\* (.*?)$/gm, '<span>$1</span>');       // Bullet points
                
                cityDescription.innerHTML = formattedDesc;
                hasAnyMetric = true;
            }
        }
        
        // Mostrar sección si hay alguna métrica disponible
        if (hasAnyMetric) {
            cityContent.classList.remove('hidden');
            toggleCityBtn.textContent = '▼';
            toggleCityBtn.classList.remove('collapsed');
        }
    } else {
        console.log(`No se encontraron ciudad_metrics en universidad: ${universidad.nombre}`);
    }
    
    return card;
}

// Configurar eventos para los paneles de universidad y tarjetas de programa
function setupPanelEvents() {
    // Eventos para cabeceras de universidad (colapsar/expandir)
    document.querySelectorAll('.university-header').forEach(header => {
        header.addEventListener('click', function(e) {
            // Evitar que el clic en botones dentro del encabezado active el colapso
            if (e.target.closest('.university-actions')) {
                return;
            }
            
            const universityPanel = this.closest('.university-panel');
            const programsContainer = universityPanel.querySelector('.programs-container');
            const toggleBtn = universityPanel.querySelector('.toggle-university-btn');
            
            // Alternar visibilidad
            if (programsContainer.classList.contains('hidden')) {
                programsContainer.classList.remove('hidden');
                toggleBtn.classList.remove('collapsed');
                toggleBtn.textContent = '▼';
            } else {
                programsContainer.classList.add('hidden');
                toggleBtn.classList.add('collapsed');
                toggleBtn.textContent = '▶';
            }
        });
    });
    
    // Eventos para botones de añadir programa en cada universidad
    document.querySelectorAll('.add-program-uni-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Evitar que se propague al header
            const universityPanel = this.closest('.university-panel');
            const universidad = universityPanel.dataset.universidad;
            
            showAddProgramModal(universidad);
        });
    });
    
    // Eventos para botones de editar universidad
    document.querySelectorAll('.edit-university-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Evitar que se propague al header
            const universityPanel = this.closest('.university-panel');
            const universidad = universityPanel.dataset.universidad;
            
            alert(`Editar universidad: ${universidad} (Funcionalidad por implementar)`);
        });
    });
    
    // Eventos para secciones colapsables
    document.querySelectorAll('.toggle-metrics-btn').forEach(button => {
        button.addEventListener('click', function() {
            const section = this.closest('.program-metrics-section');
            const content = section.querySelector('.metrics-content');
            
            toggleSection(content, this);
        });
    });
    
    document.querySelectorAll('.toggle-city-btn').forEach(button => {
        button.addEventListener('click', function() {
            const section = this.closest('.program-city-section');
            const content = section.querySelector('.city-content');
            
            toggleSection(content, this);
        });
    });
    
    document.querySelectorAll('.toggle-lines-btn').forEach(button => {
        button.addEventListener('click', function() {
            const section = this.closest('.program-lines-section');
            const content = section.querySelector('.lines-content');
            
            toggleSection(content, this);
        });
    });
    
    // Eventos para calificación con estrellas
    document.querySelectorAll('.rating-stars .star').forEach(star => {
        star.addEventListener('click', function() {
            const programCard = this.closest('.program-card');
            // Solo permitir cambios si el programa está en modo edición
            if (!programCard.classList.contains('edit-mode')) return;
            
            const value = parseInt(this.dataset.value);
            const starsContainer = this.closest('.rating-stars');
            const programId = programCard.dataset.id;
            
            // Actualizar visualización
            starsContainer.querySelectorAll('.star').forEach((s, index) => {
                if (index < value) {
                    s.classList.add('filled');
                } else {
                    s.classList.remove('filled');
                }
            });
            
            // Registrar cambio
            if (!changedFields[programId]) {
                changedFields[programId] = {};
            }
            
            changedFields[programId].rating = value;
            
            // Habilitar botón de guardar
            programCard.querySelector('.save-program-btn').disabled = false;
        });
    });
    
    // Eventos para cambio de estado
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', function() {
            const programCard = this.closest('.program-card');
            const programId = programCard.dataset.id;
            const newStatus = this.value;
            
            // Actualizar clase de la tarjeta
            programCard.className = programCard.className.replace(/status-\\w+/, '');
            programCard.classList.add(`status-${newStatus}`);
            
            // Registrar cambio
            if (!changedFields[programId]) {
                changedFields[programId] = {};
            }
            
            changedFields[programId].status = newStatus;
            
            // Habilitar botón de guardar
            programCard.querySelector('.save-program-btn').disabled = false;
        });
    });
    
    // Eventos para botones de acción en tarjetas de programa
    document.querySelectorAll('.edit-program-btn').forEach(button => {
        button.addEventListener('click', function() {
            const programCard = this.closest('.program-card');
            const programId = programCard.dataset.id;
            
            // Activar modo edición
            toggleEditMode(programId, true);
        });
    });
    
    document.querySelectorAll('.save-program-btn').forEach(button => {
        button.addEventListener('click', function() {
            const programCard = this.closest('.program-card');
            const programId = programCard.dataset.id;
            
            // Guardar cambios y desactivar modo edición
            saveProgramChanges(programId);
            toggleEditMode(programId, false);
        });
    });
    
    document.querySelectorAll('.delete-program-btn').forEach(button => {
        button.addEventListener('click', function() {
            const programCard = this.closest('.program-card');
            const programId = programCard.dataset.id;
            
            if (confirm('¿Estás seguro de que deseas eliminar este programa? Esta acción no se puede deshacer.')) {
                // Registrar programa para eliminación
                if (!changedFields[programId]) {
                    changedFields[programId] = {};
                }
                
                changedFields[programId].deleted = true;
                
                // Ocultar tarjeta (se eliminará al guardar)
                programCard.style.display = 'none';
            }
        });
    });
    
    document.querySelectorAll('.duplicate-program-btn').forEach(button => {
        button.addEventListener('click', function() {
            const programCard = this.closest('.program-card');
            const programId = programCard.dataset.id;
            
            duplicateProgram(programId);
        });
    });
    
    
    // Eventos para paginación a nivel de universidad
    document.querySelectorAll('.universities-pagination .pagination-prev').forEach(button => {
        button.addEventListener('click', function() {
            // Calcular página anterior
            if (currentPage > 1) {
                currentPage--;
                loadUniversities();
            }
        });
    });
    
    document.querySelectorAll('.universities-pagination .pagination-next').forEach(button => {
        button.addEventListener('click', function() {
            // Calcular página siguiente
            if (currentPage < totalPages) {
                currentPage++;
                loadUniversities();
            }
        });
    });
}

// Activar/desactivar modo edición para un programa
function toggleEditMode(programId, activate) {
    const programCard = document.querySelector(`.program-card[data-id="${programId}"]`);
    if (!programCard) return;
    
    if (activate) {
        // Activar modo edición
        programCard.classList.add('edit-mode');
        programsInEditMode[programId] = true;
        
        // Configurar eventos para campos editables
        programCard.querySelectorAll('.editable-field').forEach(field => {
            field.addEventListener('click', function() {
                const fieldContent = this.querySelector('.field-content');
                const fieldName = this.dataset.field;
                makeFieldEditable(fieldContent, fieldName, programId);
            });
            
            // Añadir cursor pointer
            field.style.cursor = 'pointer';
        });
    } else {
        // Desactivar modo edición
        programCard.classList.remove('edit-mode');
        delete programsInEditMode[programId];
        
        // Quitar eventos de campos editables
        programCard.querySelectorAll('.editable-field').forEach(field => {
            field.removeEventListener('click', null);
            field.style.cursor = 'default';
        });
        
        // Desactivar botón de guardar
        programCard.querySelector('.save-program-btn').disabled = true;
    }
}

// Hacer un campo editable
function makeFieldEditable(contentElement, fieldName, programId) {
    // Solo permitir edición si el programa está en modo edición
    const programCard = document.querySelector(`.program-card[data-id="${programId}"]`);
    if (!programCard || !programCard.classList.contains('edit-mode')) return;
    
    // Guardar valor actual
    const currentValue = contentElement.textContent.trim();
    const displayValue = currentValue === 'N/A' || currentValue === 'Sin resumen disponible' ? '' : currentValue;
    
    // Crear el input adecuado según el tipo de campo
    let inputElement;
    
    if (fieldName === 'resumen') {
        inputElement = document.createElement('textarea');
        inputElement.className = 'editable-textarea';
        inputElement.value = displayValue;
    } else {
        inputElement = document.createElement('input');
        inputElement.type = fieldName.includes('innovacion') || 
                        fieldName.includes('interdisciplinariedad') || 
                        fieldName.includes('impacto') || 
                        fieldName.includes('internacional') || 
                        fieldName.includes('aplicabilidad') || 
                        fieldName.includes('costo_vida') ? 'number' : 'text';
        inputElement.className = 'editable-input';
        inputElement.value = displayValue;
        
        if (inputElement.type === 'number') {
            inputElement.min = 0;
            inputElement.max = 10;
            inputElement.step = 0.1;
        }
    }
    
    // Reemplazar el contenido con el input
    contentElement.innerHTML = '';
    contentElement.appendChild(inputElement);
    
    // Enfocar el input
    inputElement.focus();
    
    // Guardar al perder el foco
    inputElement.addEventListener('blur', function() {
        const newValue = this.value.trim();
        
        // Actualizar la vista
        if (newValue === '') {
            if (fieldName === 'resumen') {
                contentElement.textContent = 'Sin resumen disponible';
            } else {
                contentElement.textContent = 'N/A';
            }
        } else {
            contentElement.textContent = newValue;
        }
        
        // Registrar cambio
        if (!changedFields[programId]) {
            changedFields[programId] = {};
        }
        
        changedFields[programId][fieldName] = newValue;
        
        // Habilitar botón de guardar
        programCard.querySelector('.save-program-btn').disabled = false;
    });
    
    // Manejar tecla Enter
    inputElement.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey && fieldName !== 'resumen') {
            e.preventDefault();
            this.blur();
        }
    });
}

// Alternar sección colapsable
function toggleSection(contentElement, buttonElement) {
    if (contentElement.classList.contains('hidden')) {
        contentElement.classList.remove('hidden');
        buttonElement.textContent = '▼';
        buttonElement.classList.remove('collapsed');
    } else {
        contentElement.classList.add('hidden');
        buttonElement.textContent = '▶';
        buttonElement.classList.add('collapsed');
    }
}

// Guardar cambios de un programa individual
function saveProgramChanges(programId) {
    if (!changedFields[programId]) {
        console.log('No hay cambios para guardar');
        return;
    }
    
    console.log('Guardando cambios para programa:', programId);
    
    // Aplicar cambios a los datos
    applyProgramChanges(programId, changedFields[programId]);
    
    // Actualizar UI (opcional, ya que los cambios ya se ven)
    const programCard = document.querySelector(`.program-card[data-id="${programId}"]`);
    if (programCard) {
        // Desactivar botón de guardar
        programCard.querySelector('.save-program-btn').disabled = true;
    }
    
    // Limpiar cambios para este programa
    delete changedFields[programId];
    
    // Mostrar confirmación
    console.log('Cambios guardados correctamente para programa:', programId);
}

// Aplicar cambios a un programa en los datos
function applyProgramChanges(programId, changes) {
    // Buscar el programa en los datos
    for (const universidad of universidadesData.programas_doctorado.universidades) {
        for (let i = 0; i < universidad.programas.length; i++) {
            const programa = universidad.programas[i];
            
            if (programa._id === programId) {
                // Actualizar campos
                if (changes.status) programa.status = changes.status;
                if (changes.resumen !== undefined) programa.resumen = changes.resumen || null;
                
                // Actualizar calificación
                if (changes.rating !== undefined) {
                    if (!programa.calificacion) {
                        programa.calificacion = {
                            valor: changes.rating,
                            fecha: new Date().toISOString()
                        };
                    } else {
                        programa.calificacion.valor = changes.rating;
                        programa.calificacion.fecha = new Date().toISOString();
                    }
                }
                
                // Actualizar stats (primero aseguramos que existan)
                if (!programa.stats) {
                    // Usar stats de la universidad si están disponibles
                    programa.stats = universidad.stats ? JSON.parse(JSON.stringify(universidad.stats)) : {};
                }
                
                if (changes.innovacion !== undefined) {
                    programa.stats.innovacion = changes.innovacion ? parseFloat(changes.innovacion) : null;
                }
                if (changes.interdisciplinariedad !== undefined) {
                    programa.stats.interdisciplinariedad = changes.interdisciplinariedad ? parseFloat(changes.interdisciplinariedad) : null;
                }
                if (changes.impacto !== undefined) {
                    programa.stats.impacto = changes.impacto ? parseFloat(changes.impacto) : null;
                }
                if (changes.internacional !== undefined) {
                    programa.stats.internacional = changes.internacional ? parseFloat(changes.internacional) : null;
                }
                if (changes.aplicabilidad !== undefined) {
                    programa.stats.aplicabilidad = changes.aplicabilidad ? parseFloat(changes.aplicabilidad) : null;
                }
                
                // Actualizar costo_vida (a nivel de programa y también universidad)
                if (changes.costo_vida !== undefined) {
                    // Actualizar a nivel de programa
                    if (!programa.ciudad_metrics) {
                        // Usar ciudad_metrics de la universidad si están disponibles
                        programa.ciudad_metrics = universidad.ciudad_metrics ? 
                            JSON.parse(JSON.stringify(universidad.ciudad_metrics)) : {};
                    }
                    programa.ciudad_metrics.costo_vida = changes.costo_vida ? parseFloat(changes.costo_vida) : null;
                    
                    // Actualizar también a nivel de universidad para futuros programas
                    if (!universidad.ciudad_metrics) {
                        universidad.ciudad_metrics = {};
                    }
                    universidad.ciudad_metrics.costo_vida = changes.costo_vida ? parseFloat(changes.costo_vida) : null;
                }
                
                break;
            }
        }
    }
}

// Mostrar modal de confirmación para guardar
function showSaveConfirmModal() {
    if (Object.keys(changedFields).length === 0) {
        alert('No hay cambios para guardar');
        return;
    }
    
    document.getElementById('saveConfirmModal').style.display = 'flex';
}

// Ocultar modal de confirmación
function hideSaveConfirmModal() {
    document.getElementById('saveConfirmModal').style.display = 'none';
}

// Guardar todos los cambios
async function saveAllChanges() {
    console.log('Guardando todos los cambios:', changedFields);
    
    // Contador para éxitos y errores
    let successCount = 0;
    let errorCount = 0;
    
    // Procesar cada programa con cambios
    for (const programId in changedFields) {
        const changes = changedFields[programId];
        
        try {
            // Si el programa está marcado para eliminación
            if (changes.deleted) {
                await deleteProgram(programId);
                successCount++;
                continue;
            }
            
            // Guardar cambios en el programa
            await updateProgram(programId, changes);
            successCount++;
        } catch (error) {
            console.error(`Error al guardar cambios para programa ${programId}:`, error);
            errorCount++;
        }
    }
    
    // Aplicar cambios a los datos locales para mantener sincronía
    for (const programId in changedFields) {
        const changes = changedFields[programId];
        
        // Buscar el programa en los datos
        for (const universidad of universidadesData.programas_doctorado.universidades) {
            let programIndex = -1;
            
            for (let i = 0; i < universidad.programas.length; i++) {
                if (universidad.programas[i]._id === programId) {
                    programIndex = i;
                    break;
                }
            }
            
            if (programIndex !== -1) {
                // Manejar eliminación
                if (changes.deleted) {
                    universidad.programas.splice(programIndex, 1);
                    continue;
                }
                
                // Aplicar cambios
                applyProgramChanges(programId, changes);
                break;
            }
        }
    }
    
    // Actualizar UI
    loadUniversities();
    
    // Limpiar cambios
    changedFields = {};
    programsInEditMode = {};
    
    // Mostrar confirmación
    if (errorCount > 0) {
        alert(`Cambios guardados con algunos problemas: ${successCount} éxitos, ${errorCount} errores`);
    } else {
        alert('Todos los cambios guardados correctamente');
    }
}

// Función para actualizar un programa en el servidor
async function updateProgram(programId, changes) {
    // Verificar si el ID es temporal (nuevo programa)
    if (programId.startsWith('temp_') || programId.startsWith('duplicate_')) {
        // Para nuevos programas, debemos hacer un POST
        // Buscar el programa completo en los datos para enviarlo completo
        let programData = null;
        let universidadData = null;
        
        for (const universidad of universidadesData.programas_doctorado.universidades) {
            for (const programa of universidad.programas) {
                if (programa._id === programId) {
                    programData = programa;
                    universidadData = universidad;
                    break;
                }
            }
            if (programData) break;
        }
        
        if (!programData) {
            throw new Error('Programa no encontrado en los datos locales');
        }
        
        // Crear objeto con datos para la API
        const nuevoPrograma = {
            universidad: universidadData.nombre,
            ciudad: universidadData.ciudad,
            programa: programData.nombre,
            linea_investigacion: programData.linea_investigacion || '',
            url: programData.url || '',
            resumen: programData.resumen || '',
            status: programData.status || 'pendiente'
        };
        
        // Si tiene calificación, añadirla
        if (programData.calificacion) {
            nuevoPrograma.calificacion = programData.calificacion;
        }
        
        // Enviar petición al servidor
        const response = await fetch('/api/programas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevoPrograma)
        });
        
        if (!response.ok) {
            throw new Error('Error al crear nuevo programa');
        }
        
        return await response.json();
    } else {
        // Para programas existentes, usamos PATCH o PUT según los cambios
        
        // Si solo hay cambio de estado, usamos el endpoint específico
        if (Object.keys(changes).length === 1 && changes.status) {
            const response = await fetch(`/api/programas/${programId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: changes.status })
            });
            
            if (!response.ok) {
                throw new Error('Error al actualizar estado del programa');
            }
            
            return await response.json();
        }
        
        // Si hay cambio de calificación, usamos el endpoint específico
        if (Object.keys(changes).length === 1 && changes.rating) {
            const response = await fetch(`/api/programas/${programId}/calificacion`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    calificacion: {
                        valor: changes.rating,
                        fecha: new Date().toISOString()
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error('Error al actualizar calificación del programa');
            }
            
            return await response.json();
        }
        
        // Para otros cambios más complejos, usar el nuevo endpoint PUT /api/programas/:id
        try {
            // Convertir los cambios al formato esperado por el servidor
            const updateData = {};
            
            // Convertir cada campo al formato esperado
            if (changes.resumen !== undefined) {
                updateData.resumen = changes.resumen;
            }
            
            if (changes.status !== undefined) {
                updateData.status = changes.status;
            }
            
            // Si hay cambios en stats, añadirlos como campos individuales
            if (changes.innovacion !== undefined ||
                changes.interdisciplinariedad !== undefined ||
                changes.impacto !== undefined ||
                changes.internacional !== undefined ||
                changes.aplicabilidad !== undefined) {
                
                // Inicializar stats si no existe
                if (!updateData.stats) updateData.stats = {};
                
                if (changes.innovacion !== undefined) {
                    updateData.stats.innovacion = parseFloat(changes.innovacion);
                }
                
                if (changes.interdisciplinariedad !== undefined) {
                    updateData.stats.interdisciplinariedad = parseFloat(changes.interdisciplinariedad);
                }
                
                if (changes.impacto !== undefined) {
                    updateData.stats.impacto = parseFloat(changes.impacto);
                }
                
                if (changes.internacional !== undefined) {
                    updateData.stats.internacional = parseFloat(changes.internacional);
                }
                
                if (changes.aplicabilidad !== undefined) {
                    updateData.stats.aplicabilidad = parseFloat(changes.aplicabilidad);
                }
            }
            
            // Si hay cambios en las métricas de ciudad
            if (changes.costo_vida !== undefined) {
                // Inicializar ciudad_metrics si no existe
                if (!updateData.ciudad_metrics) updateData.ciudad_metrics = {};
                
                updateData.ciudad_metrics.costo_vida = parseFloat(changes.costo_vida);
            }
            
            console.log('Enviando actualización al servidor:', updateData);
            
            // Enviar actualización al servidor
            const response = await fetch(`/api/programas/${programId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error del servidor: ${errorData.message || response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Respuesta del servidor:', result);
            
            return result;
        } catch (error) {
            console.error('Error al actualizar múltiples campos:', error);
            // Seguir permitiendo la actualización local, pero mostrar un aviso
            alert(`Error al actualizar en el servidor: ${error.message}. Los cambios se aplicarán solo localmente.`);
            return { message: 'Cambios aplicados solo localmente', error: error.message };
        }
    }
}

// Función para eliminar un programa en el servidor
async function deleteProgram(programId) {
    // Verificar si el ID es temporal (no existe en la BD)
    if (programId.startsWith('temp_') || programId.startsWith('duplicate_')) {
        // No necesitamos hacer nada en el servidor para programas temporales
        return { message: 'Programa temporal eliminado' };
    }
    
    // Para programas existentes, enviar petición de eliminación
    const response = await fetch(`/api/programas/${programId}`, {
        method: 'DELETE'
    });
    
    if (!response.ok) {
        throw new Error('Error al eliminar programa');
    }
    
    return await response.json();
}

// Mostrar modal para agregar programa
function showAddProgramModal(universidadNombre) {
    // Cargar lista de universidades
    const universidadSelect = document.getElementById('universidadSelect');
    universidadSelect.innerHTML = '';
    
    universidadesData.programas_doctorado.universidades.forEach(universidad => {
        const option = document.createElement('option');
        option.value = universidad.nombre;
        option.textContent = `${universidad.nombre} (${universidad.ciudad})`;
        universidadSelect.appendChild(option);
    });
    
    // Preseleccionar universidad si se proporciona
    if (universidadNombre) {
        universidadSelect.value = universidadNombre;
    }
    
    // Limpiar otros campos
    document.getElementById('programaNombre').value = '';
    document.getElementById('programaURL').value = '';
    document.getElementById('programaResumen').value = '';
    document.getElementById('programaStatus').value = 'pendiente';
    
    // Mostrar modal
    document.getElementById('addProgramModal').style.display = 'flex';
}

// Ocultar modal para agregar programa
function hideAddProgramModal() {
    document.getElementById('addProgramModal').style.display = 'none';
}

// Guardar nuevo programa
function saveNewProgram() {
    const universidadNombre = document.getElementById('universidadSelect').value;
    const programaNombre = document.getElementById('programaNombre').value.trim();
    const programaURL = document.getElementById('programaURL').value.trim();
    const programaResumen = document.getElementById('programaResumen').value.trim();
    const programaStatus = document.getElementById('programaStatus').value;
    
    // Validación básica
    if (!programaNombre) {
        alert('El nombre del programa es obligatorio');
        return;
    }
    
    // Buscar la universidad
    let targetUniversidad = null;
    
    for (const universidad of universidadesData.programas_doctorado.universidades) {
        if (universidad.nombre === universidadNombre) {
            targetUniversidad = universidad;
            break;
        }
    }
    
    if (!targetUniversidad) {
        console.error('Universidad no encontrada:', universidadNombre);
        return;
    }
    
    // Crear nuevo programa
    const nuevoPrograma = {
        _id: 'temp_' + Date.now(), // ID temporal
        nombre: programaNombre,
        url: programaURL || null,
        resumen: programaResumen || null,
        status: programaStatus,
        // Asegurarnos de que el nuevo programa hereda stats y ciudad_metrics
        stats: targetUniversidad.stats ? {...targetUniversidad.stats} : null,
        ciudad_metrics: targetUniversidad.ciudad_metrics ? {...targetUniversidad.ciudad_metrics} : null
    };
    
    // Añadir a la universidad
    targetUniversidad.programas.push(nuevoPrograma);
    
    // Actualizar UI
    loadUniversities();
    
    // Ocultar modal
    hideAddProgramModal();
    
    // Mostrar confirmación
    alert('Programa añadido correctamente');
}

// Mostrar modal para enriquecer programa
function showEnrichProgramModal(programId) {
    // Guardar ID del programa actual
    currentProgramId = programId;
    
    // Mostrar modal
    document.getElementById('enrichProgramModal').style.display = 'flex';
    
    // Configurar botones
    document.getElementById('startEnrichBtn').addEventListener('click', startProgramEnrichment);
    document.getElementById('cancelEnrichBtn').addEventListener('click', hideEnrichProgramModal);
}

// Ocultar modal para enriquecer programa
function hideEnrichProgramModal() {
    document.getElementById('enrichProgramModal').style.display = 'none';
    currentProgramId = null;
}

// Iniciar enriquecimiento de programa
function startProgramEnrichment() {
    if (!currentProgramId) {
        console.error('No hay programa seleccionado para enriquecer');
        return;
    }
    
    const modeloIA = document.getElementById('aiModelSelect').value;
    const generarResumen = document.getElementById('enrichResumen').checked;
    const calcularMetricas = document.getElementById('enrichMetrics').checked;
    const datosCiudad = document.getElementById('enrichCiudad').checked;
    
    console.log('Enriqueciendo programa:', currentProgramId);
    console.log('Modelo IA:', modeloIA);
    console.log('Opciones:', { generarResumen, calcularMetricas, datosCiudad });
    
    // Simular enriquecimiento
    setTimeout(() => {
        // Buscar el programa
        let targetPrograma = null;
        let targetUniversidad = null;
        
        for (const universidad of universidadesData.programas_doctorado.universidades) {
            for (const programa of universidad.programas) {
                if (programa._id === currentProgramId) {
                    targetPrograma = programa;
                    targetUniversidad = universidad;
                    break;
                }
            }
            if (targetPrograma) break;
        }
        
        if (!targetPrograma) {
            console.error('Programa no encontrado:', currentProgramId);
            hideEnrichProgramModal();
            return;
        }
        
        // Aplicar enriquecimiento
        if (generarResumen) {
            targetPrograma.resumen = "Este es un resumen de ejemplo generado por IA. Describe las características principales del programa de doctorado, incluyendo líneas de investigación, metodología y posibles salidas profesionales.";
        }
        
        if (calcularMetricas) {
            if (!targetPrograma.stats) targetPrograma.stats = {};
            targetPrograma.stats.innovacion = Math.floor(Math.random() * 4) + 7; // 7-10
            targetPrograma.stats.interdisciplinariedad = Math.floor(Math.random() * 4) + 6; // 6-9
            targetPrograma.stats.impacto = Math.floor(Math.random() * 3) + 7; // 7-9
            targetPrograma.stats.internacional = Math.floor(Math.random() * 5) + 5; // 5-9
            targetPrograma.stats.aplicabilidad = Math.floor(Math.random() * 4) + 6; // 6-9
        }
        
        if (datosCiudad) {
            if (!targetUniversidad.ciudad_metrics) targetUniversidad.ciudad_metrics = {};
            targetUniversidad.ciudad_metrics.costo_vida = Math.floor(Math.random() * 50) + 20; // 20-69
            targetUniversidad.ciudad_metrics.costo_vida_comentario = "Este es un comentario generado por IA sobre el costo de vida en esta ciudad. Incluye información sobre alojamiento, transporte, alimentación y ocio en comparación con otras ciudades españolas.";
        }
        
        // Actualizar UI
        loadUniversities();
        
        // Cerrar modal
        hideEnrichProgramModal();
        
        // Mostrar confirmación
        alert('Programa enriquecido correctamente');
    }, 2000);
}

// Función para duplicar un programa
async function duplicateProgram(programId) {
    // Buscar el programa original en los datos
    let originalPrograma = null;
    let originalUniversidad = null;
    
    for (const universidad of universidadesData.programas_doctorado.universidades) {
        for (const programa of universidad.programas) {
            if (programa._id === programId) {
                originalPrograma = programa;
                originalUniversidad = universidad;
                break;
            }
        }
        if (originalPrograma) break;
    }
    
    if (!originalPrograma) {
        console.error('Programa no encontrado para duplicar:', programId);
        return;
    }
    
    // Crear copia del programa con nuevo ID
    const nuevoPrograma = JSON.parse(JSON.stringify(originalPrograma));
    nuevoPrograma._id = 'duplicate_' + Date.now();
    nuevoPrograma.nombre = `${nuevoPrograma.nombre} (Copia)`;
    nuevoPrograma.ultimo_enriquecimiento = new Date().toISOString();
    
    if (nuevoPrograma.calificacion) {
        nuevoPrograma.calificacion.fecha = new Date().toISOString();
    }
    
    // Añadir programa duplicado a la misma universidad
    originalUniversidad.programas.push(nuevoPrograma);
    
    try {
        // Crear objeto con datos para la API
        const nuevoProgramaData = {
            universidad: originalUniversidad.nombre,
            ciudad: originalUniversidad.ciudad,
            programa: nuevoPrograma.nombre,
            linea_investigacion: nuevoPrograma.linea_investigacion || originalPrograma.linea_investigacion || '',
            url: nuevoPrograma.url || originalPrograma.url || '',
            resumen: nuevoPrograma.resumen || originalPrograma.resumen || '',
            status: nuevoPrograma.status || 'pendiente'
        };
        
        // Si tiene calificación, añadirla
        if (nuevoPrograma.calificacion) {
            nuevoProgramaData.calificacion = nuevoPrograma.calificacion;
        }
        
        // Enviar petición al servidor
        const response = await fetch('/api/programas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevoProgramaData)
        });
        
        if (response.ok) {
            // Obtener la respuesta con el ID real asignado por la BD
            const result = await response.json();
            
            // Actualizar el ID temporal con el real
            nuevoPrograma._id = result._id;
            
            // Mostrar confirmación
            alert(`Programa duplicado correctamente: ${nuevoPrograma.nombre}`);
        } else {
            // Si falla, mantener el ID temporal y mostrar error
            console.error('Error al guardar el programa duplicado en la base de datos');
            alert(`Programa duplicado localmente, pero no se pudo guardar en la base de datos: ${nuevoPrograma.nombre}`);
        }
    } catch (error) {
        console.error('Error al duplicar programa:', error);
        alert(`Error al duplicar programa: ${error.message}`);
    }
    
    // Actualizar UI
    loadUniversities();
}