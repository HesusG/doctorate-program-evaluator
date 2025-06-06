// Variables para seguimiento de cambios
let changedFields = {};
let currentProgramId = null;

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
    
    // Crear panel para cada universidad
    sortedUniversities.forEach(universidad => {
        const panel = createUniversityPanel(universidad);
        container.appendChild(panel);
    });
    
    // Configurar eventos para los paneles recién creados
    setupPanelEvents();
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
    
    // Añadir programas
    const programsContainer = panel.querySelector('.programs-container');
    
    // Ordenar programas por nombre
    const sortedPrograms = [...universidad.programas]
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    sortedPrograms.forEach(programa => {
        const programCard = createProgramCard(programa, universidad);
        programsContainer.appendChild(programCard);
    });
    
    return panel;
}

// Crear tarjeta para un programa
function createProgramCard(programa, universidad) {
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
    
    // Configurar calificación
    const ratingContainer = card.querySelector('.rating-stars');
    ratingContainer.innerHTML = getStarsHTML(programa.calificacion ? programa.calificacion.valor : 0);
    ratingContainer.dataset.rating = programa.calificacion ? programa.calificacion.valor : 0;
    
    // Configurar resumen
    const resumenField = card.querySelector('.resumen-field .field-content');
    resumenField.textContent = programa.resumen || 'Sin resumen disponible';
    
    // Configurar métricas académicas
    const stats = programa.stats || {};
    card.querySelector('[data-field="innovacion"] .field-content').textContent = 
        stats.innovacion !== undefined ? stats.innovacion : 'N/A';
    card.querySelector('[data-field="interdisciplinariedad"] .field-content').textContent = 
        stats.interdisciplinariedad !== undefined ? stats.interdisciplinariedad : 'N/A';
    card.querySelector('[data-field="impacto"] .field-content').textContent = 
        stats.impacto !== undefined ? stats.impacto : 'N/A';
    card.querySelector('[data-field="internacional"] .field-content').textContent = 
        stats.internacional !== undefined ? stats.internacional : 'N/A';
    card.querySelector('[data-field="aplicabilidad"] .field-content').textContent = 
        stats.aplicabilidad !== undefined ? stats.aplicabilidad : 'N/A';
    
    // Configurar datos de ciudad
    const ciudadMetrics = universidad.ciudad_metrics || {};
    card.querySelector('[data-field="costo_vida"] .field-content').textContent = 
        ciudadMetrics.costo_vida !== undefined ? ciudadMetrics.costo_vida : 'N/A';
    
    // Configurar descripción de ciudad
    const cityDescription = card.querySelector('.city-description-content');
    cityDescription.textContent = ciudadMetrics.costo_vida_comentario || 'Sin descripción disponible';
    
    return card;
}

// Configurar eventos para los paneles de universidad y tarjetas de programa
function setupPanelEvents() {
    // Eventos para botones de añadir programa en cada universidad
    document.querySelectorAll('.add-program-uni-btn').forEach(button => {
        button.addEventListener('click', function() {
            const universityPanel = this.closest('.university-panel');
            const universidad = universityPanel.dataset.universidad;
            
            showAddProgramModal(universidad);
        });
    });
    
    // Eventos para botones de editar universidad
    document.querySelectorAll('.edit-university-btn').forEach(button => {
        button.addEventListener('click', function() {
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
    
    // Eventos para campos editables
    document.querySelectorAll('.editable-field').forEach(field => {
        const editBtn = field.querySelector('.edit-field-btn');
        
        editBtn.addEventListener('click', function() {
            const fieldContent = field.querySelector('.field-content');
            const fieldName = field.dataset.field;
            const programCard = field.closest('.program-card');
            const programId = programCard.dataset.id;
            
            makeFieldEditable(fieldContent, fieldName, programId);
        });
    });
    
    // Eventos para calificación con estrellas
    document.querySelectorAll('.rating-stars .star').forEach(star => {
        star.addEventListener('click', function() {
            const value = parseInt(this.dataset.value);
            const starsContainer = this.closest('.rating-stars');
            const programCard = starsContainer.closest('.program-card');
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
        });
    });
    
    // Eventos para botones de acción en tarjetas de programa
    document.querySelectorAll('.view-program-btn').forEach(button => {
        button.addEventListener('click', function() {
            const programCard = this.closest('.program-card');
            const programId = programCard.dataset.id;
            
            viewProgramDetails(programId);
        });
    });
    
    document.querySelectorAll('.edit-program-btn').forEach(button => {
        button.addEventListener('click', function() {
            const programCard = this.closest('.program-card');
            const programId = programCard.dataset.id;
            
            alert(`Editar programa: ${programId} (Funcionalidad por implementar)`);
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
}

// Hacer un campo editable
function makeFieldEditable(contentElement, fieldName, programId) {
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
    if (contentElement.style.display === 'none') {
        contentElement.style.display = 'flex';
        buttonElement.textContent = '▼';
        buttonElement.classList.remove('collapsed');
    } else {
        contentElement.style.display = 'none';
        buttonElement.textContent = '▶';
        buttonElement.classList.add('collapsed');
    }
}

// Mostrar detalles de un programa
function viewProgramDetails(programId) {
    // Buscar el programa en los datos
    let targetPrograma = null;
    let targetUniversidad = null;
    
    for (const universidad of universidadesData.programas_doctorado.universidades) {
        for (const programa of universidad.programas) {
            if (programa._id === programId) {
                targetPrograma = programa;
                targetUniversidad = universidad;
                break;
            }
        }
        if (targetPrograma) break;
    }
    
    if (!targetPrograma || !targetUniversidad) {
        console.error('Programa no encontrado:', programId);
        return;
    }
    
    // Crear objeto para showUniversityInfo
    const universidadInfo = {
        nombre: targetUniversidad.nombre,
        ciudad: targetUniversidad.ciudad,
        programas: [targetPrograma]
    };
    
    // Mostrar panel de información
    showUniversityInfo(universidadInfo);
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
    console.log('Guardando cambios:', changedFields);
    
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
                const programa = universidad.programas[programIndex];
                
                // Manejar eliminación
                if (changes.deleted) {
                    universidad.programas.splice(programIndex, 1);
                    continue;
                }
                
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
                
                // Actualizar stats
                if (!programa.stats) programa.stats = {};
                
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
                
                // Actualizar costo_vida (a nivel de universidad)
                if (changes.costo_vida !== undefined) {
                    if (!universidad.ciudad_metrics) {
                        universidad.ciudad_metrics = {};
                    }
                    universidad.ciudad_metrics.costo_vida = changes.costo_vida ? parseFloat(changes.costo_vida) : null;
                }
                
                break;
            }
        }
    }
    
    // Actualizar UI
    loadUniversities();
    
    // Limpiar cambios
    changedFields = {};
    
    // Mostrar confirmación
    alert('Cambios guardados correctamente');
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
        status: programaStatus
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