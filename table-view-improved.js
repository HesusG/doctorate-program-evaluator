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
    
    // NOTA: Secciones de métricas académicas y datos de ciudad removidas temporalmente
    // para simplificar y solucionar problemas
    
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
    
    document.querySelectorAll('.enrich-program-btn').forEach(button => {
        button.addEventListener('click', function() {
            const programCard = this.closest('.program-card');
            const programId = programCard.dataset.id;
            
            showEnrichProgramModal(programId);
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
function saveAllChanges() {
    console.log('Guardando todos los cambios:', changedFields);
    
    // Aplicar cambios a los datos
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
    alert('Todos los cambios guardados correctamente');
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