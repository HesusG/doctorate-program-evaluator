// DataTable y funcionalidad de edición para vista tabla
let dataTable;
let editedCells = {};
let originalData = {};

// Inicializar la tabla una vez que los datos se hayan cargado
function initializeDataTable() {
    if (!universidadesData || !universidadesData.programas_doctorado || !universidadesData.programas_doctorado.universidades) {
        console.error('No hay datos disponibles para inicializar la tabla');
        return;
    }

    // Preparar los datos para la tabla
    const tableData = prepareTableData(universidadesData);
    
    // Guardar una copia de los datos originales para comparar al guardar
    originalData = JSON.parse(JSON.stringify(tableData));
    
    // Inicializar DataTable
    dataTable = $('#programsDataTable').DataTable({
        data: tableData,
        responsive: true,
        rowGroup: {
            dataSrc: 'universidad'
        },
        select: {
            style: 'multi',
            selector: 'td:not(.editable-cell)'
        },
        columns: [
            { 
                data: 'universidad',
                visible: false  // Oculto porque lo usamos para agrupar
            },
            { 
                data: 'programa',
                render: function(data, type, row) {
                    if (type === 'display') {
                        return `<div class="editable-cell" data-field="programa" data-id="${row.id}">${data}</div>`;
                    }
                    return data;
                }
            },
            { 
                data: 'url',
                render: function(data, type, row) {
                    if (type === 'display') {
                        if (data) {
                            return `<a href="${data}" target="_blank" class="program-link">Link</a>`;
                        } else {
                            return `<div class="editable-cell" data-field="url" data-id="${row.id}">Sin enlace</div>`;
                        }
                    }
                    return data;
                }
            },
            { 
                data: 'rating',
                render: function(data, type, row) {
                    if (type === 'display') {
                        const starsHtml = getStarsHTML(data || 0);
                        return `<div class="rating-stars-container" data-id="${row.id}">${starsHtml}</div>`;
                    }
                    return data;
                },
                searchable: false
            },
            { 
                data: 'status',
                render: function(data, type, row) {
                    if (type === 'display') {
                        const statusOptions = [
                            'pendiente',
                            'considerando',
                            'interesado',
                            'aplicando',
                            'descartado'
                        ];
                        
                        let optionsHtml = '';
                        statusOptions.forEach(status => {
                            const selected = status === data ? 'selected' : '';
                            optionsHtml += `<option value="${status}" ${selected}>${capitalizeFirstLetter(status)}</option>`;
                        });
                        
                        return `<select class="status-select" data-id="${row.id}">${optionsHtml}</select>`;
                    }
                    return data;
                }
            },
            { 
                data: 'resumen',
                render: function(data, type, row) {
                    if (type === 'display') {
                        const displayText = data ? (data.length > 50 ? data.substring(0, 50) + '...' : data) : 'Sin resumen';
                        return `<div class="editable-cell" data-field="resumen" data-id="${row.id}" data-fulltext="${data || ''}">${displayText}</div>`;
                    }
                    return data;
                }
            },
            { 
                data: 'innovacion',
                render: function(data, type, row) {
                    if (type === 'display') {
                        return `<div class="editable-cell" data-field="innovacion" data-id="${row.id}">${data || 'N/A'}</div>`;
                    }
                    return data;
                },
                searchable: false
            },
            { 
                data: 'interdisciplinariedad',
                render: function(data, type, row) {
                    if (type === 'display') {
                        return `<div class="editable-cell" data-field="interdisciplinariedad" data-id="${row.id}">${data || 'N/A'}</div>`;
                    }
                    return data;
                },
                searchable: false
            },
            { 
                data: 'impacto',
                render: function(data, type, row) {
                    if (type === 'display') {
                        return `<div class="editable-cell" data-field="impacto" data-id="${row.id}">${data || 'N/A'}</div>`;
                    }
                    return data;
                },
                searchable: false
            },
            { 
                data: 'internacional',
                render: function(data, type, row) {
                    if (type === 'display') {
                        return `<div class="editable-cell" data-field="internacional" data-id="${row.id}">${data || 'N/A'}</div>`;
                    }
                    return data;
                },
                searchable: false
            },
            { 
                data: 'aplicabilidad',
                render: function(data, type, row) {
                    if (type === 'display') {
                        return `<div class="editable-cell" data-field="aplicabilidad" data-id="${row.id}">${data || 'N/A'}</div>`;
                    }
                    return data;
                },
                searchable: false
            },
            { 
                data: 'costo_vida',
                render: function(data, type, row) {
                    if (type === 'display') {
                        const costoData = row.ciudad_metrics && row.ciudad_metrics.costo_vida !== undefined ? 
                            row.ciudad_metrics.costo_vida : 'N/A';
                        
                        const costoComentario = row.ciudad_metrics && row.ciudad_metrics.costo_vida_comentario ?
                            row.ciudad_metrics.costo_vida_comentario : '';
                            
                        const tooltipAttr = costoComentario ? `data-tooltip="${costoComentario}"` : '';
                        
                        let costoClass = '';
                        if (costoData !== 'N/A') {
                            if (costoData >= 50) costoClass = 'costo-alto';
                            else if (costoData >= 30) costoClass = 'costo-medio';
                            else costoClass = 'costo-bajo';
                        }
                        
                        return `
                            <div class="costo-container">
                                <div class="editable-cell ${costoClass}" data-field="costo_vida" data-id="${row.id}" ${tooltipAttr}>${costoData}</div>
                                <span class="info-icon" data-field="costo_vida_comentario" data-id="${row.id}">ℹ️</span>
                            </div>
                        `;
                    }
                    return data;
                },
                searchable: false
            },
            { 
                data: 'calidad_aire',
                render: function(data, type, row) {
                    if (type === 'display') {
                        const calidadData = row.ciudad_metrics && row.ciudad_metrics.calidad_aire !== undefined ? 
                            row.ciudad_metrics.calidad_aire : 'N/A';
                        
                        const calidadComentario = row.ciudad_metrics && row.ciudad_metrics.calidad_aire_comentario ?
                            row.ciudad_metrics.calidad_aire_comentario : '';
                            
                        const tooltipAttr = calidadComentario ? `data-tooltip="${calidadComentario}"` : '';
                        
                        let calidadClass = '';
                        if (calidadData !== 'N/A') {
                            if (calidadData >= 7) calidadClass = 'calidad-alta';
                            else if (calidadData >= 4) calidadClass = 'calidad-media';
                            else calidadClass = 'calidad-baja';
                        }
                        
                        return `
                            <div class="calidad-container">
                                <div class="editable-cell ${calidadClass}" data-field="calidad_aire" data-id="${row.id}" ${tooltipAttr}>${calidadData}</div>
                                <span class="info-icon" data-field="calidad_aire_comentario" data-id="${row.id}">ℹ️</span>
                            </div>
                        `;
                    }
                    return data;
                },
                searchable: false
            },
            { 
                data: 'calidad_transporte',
                render: function(data, type, row) {
                    if (type === 'display') {
                        const transporteData = row.ciudad_metrics && row.ciudad_metrics.calidad_transporte !== undefined ? 
                            row.ciudad_metrics.calidad_transporte : 'N/A';
                        
                        const transporteComentario = row.ciudad_metrics && row.ciudad_metrics.calidad_transporte_comentario ?
                            row.ciudad_metrics.calidad_transporte_comentario : '';
                            
                        const tooltipAttr = transporteComentario ? `data-tooltip="${transporteComentario}"` : '';
                        
                        let transporteClass = '';
                        if (transporteData !== 'N/A') {
                            if (transporteData >= 7) transporteClass = 'calidad-alta';
                            else if (transporteData >= 4) transporteClass = 'calidad-media';
                            else transporteClass = 'calidad-baja';
                        }
                        
                        return `
                            <div class="calidad-container">
                                <div class="editable-cell ${transporteClass}" data-field="calidad_transporte" data-id="${row.id}" ${tooltipAttr}>${transporteData}</div>
                                <span class="info-icon" data-field="calidad_transporte_comentario" data-id="${row.id}">ℹ️</span>
                            </div>
                        `;
                    }
                    return data;
                },
                searchable: false
            },
            { 
                data: 'calidad_servicio_medico',
                render: function(data, type, row) {
                    if (type === 'display') {
                        const medicoData = row.ciudad_metrics && row.ciudad_metrics.calidad_servicio_medico !== undefined ? 
                            row.ciudad_metrics.calidad_servicio_medico : 'N/A';
                        
                        const medicoComentario = row.ciudad_metrics && row.ciudad_metrics.calidad_servicio_medico_comentario ?
                            row.ciudad_metrics.calidad_servicio_medico_comentario : '';
                            
                        const tooltipAttr = medicoComentario ? `data-tooltip="${medicoComentario}"` : '';
                        
                        let medicoClass = '';
                        if (medicoData !== 'N/A') {
                            if (medicoData >= 7) medicoClass = 'calidad-alta';
                            else if (medicoData >= 4) medicoClass = 'calidad-media';
                            else medicoClass = 'calidad-baja';
                        }
                        
                        return `
                            <div class="calidad-container">
                                <div class="editable-cell ${medicoClass}" data-field="calidad_servicio_medico" data-id="${row.id}" ${tooltipAttr}>${medicoData}</div>
                                <span class="info-icon" data-field="calidad_servicio_medico_comentario" data-id="${row.id}">ℹ️</span>
                            </div>
                        `;
                    }
                    return data;
                },
                searchable: false
            },
            { 
                data: 'distancia_capital',
                render: function(data, type, row) {
                    if (type === 'display') {
                        // Determine which distance field to use based on reference city
                        const isPortuguese = row.ciudad_metrics && row.ciudad_metrics.ciudad_referencia === 'Lisboa';
                        const distanciaField = isPortuguese ? 'distancia_a_lisboa_km' : 'distancia_a_madrid_km';
                        const refCity = isPortuguese ? 'Lisboa' : 'Madrid';
                        
                        const distanciaData = row.ciudad_metrics && row.ciudad_metrics[distanciaField] !== undefined ? 
                            row.ciudad_metrics[distanciaField] : 'N/A';
                        
                        let distanciaClass = '';
                        if (distanciaData !== 'N/A') {
                            if (distanciaData < 100) distanciaClass = 'distancia-cerca';
                            else if (distanciaData < 300) distanciaClass = 'distancia-media';
                            else distanciaClass = 'distancia-lejos';
                        }
                        
                        return `
                            <div class="distancia-container">
                                <div class="editable-cell ${distanciaClass}" data-field="${distanciaField}" data-id="${row.id}">
                                    ${distanciaData !== 'N/A' ? `${distanciaData} km a ${refCity}` : 'N/A'}
                                </div>
                            </div>
                        `;
                    }
                    return data;
                },
                searchable: false
            },
            { 
                data: null,
                render: function(data, type, row) {
                    return `
                        <div class="action-buttons">
                            <button class="action-btn view" data-id="${row.id}" title="Ver detalles"><i class="far fa-eye"></i>👁️</button>
                            <button class="action-btn edit" data-id="${row.id}" title="Editar programa"><i class="far fa-edit"></i>✏️</button>
                            <button class="action-btn delete" data-id="${row.id}" title="Eliminar programa"><i class="far fa-trash-alt"></i>🗑️</button>
                        </div>
                    `;
                },
                orderable: false,
                searchable: false
            }
        ],
        order: [[1, 'asc']],  // Ordenar por nombre de programa
        language: {
            "decimal":        "",
            "emptyTable":     "No hay datos disponibles",
            "info":           "Mostrando _START_ a _END_ de _TOTAL_ programas",
            "infoEmpty":      "Mostrando 0 a 0 de 0 programas",
            "infoFiltered":   "(filtrado de _MAX_ programas totales)",
            "infoPostFix":    "",
            "thousands":      ",",
            "lengthMenu":     "Mostrar _MENU_ programas",
            "loadingRecords": "Cargando...",
            "processing":     "Procesando...",
            "search":         "Buscar:",
            "zeroRecords":    "No se encontraron programas coincidentes",
            "paginate": {
                "first":      "Primero",
                "last":       "Último",
                "next":       "Siguiente",
                "previous":   "Anterior"
            },
            "aria": {
                "sortAscending":  ": activar para ordenar columna ascendente",
                "sortDescending": ": activar para ordenar columna descendente"
            },
            "select": {
                "rows": {
                    "_": "%d filas seleccionadas",
                    "0": "",
                    "1": "1 fila seleccionada"
                }
            }
        },
        drawCallback: function() {
            // Configurar eventos para celdas editables después de cada redibujado
            setupEditableCells();
            
            // Configurar eventos para cambio de status
            setupStatusSelects();
            
            // Configurar eventos para rating con estrellas
            setupRatingStars();
            
            // Configurar eventos para botones de acción
            setupActionButtons();
            
            // Configurar tooltips para información adicional
            setupInfoTooltips();
        }
    });
}

// Preparar datos para la tabla
function prepareTableData(data) {
    const tableData = [];
    
    // Recorrer universidades y programas
    data.programas_doctorado.universidades.forEach(universidad => {
        if (universidad.programas && universidad.programas.length) {
            universidad.programas.forEach(programa => {
                // Obtener métricas
                const stats = programa.stats || universidad.stats || {};
                
                // Crear objeto de fila para la tabla
                const rowData = {
                    id: programa._id,
                    universidad: universidad.nombre,
                    ciudad: universidad.ciudad,
                    programa: programa.nombre,
                    url: programa.url || '',
                    rating: programa.calificacion ? programa.calificacion.valor : 0,
                    status: programa.status || 'pendiente',
                    resumen: programa.resumen || '',
                    lineas: programa.lineas_investigacion || [],
                    // Métricas académicas
                    innovacion: stats.innovacion || null,
                    interdisciplinariedad: stats.interdisciplinariedad || null,
                    impacto: stats.impacto || null,
                    internacional: stats.internacional || null,
                    aplicabilidad: stats.aplicabilidad || null,
                    // Datos de ciudad
                    ciudad_metrics: universidad.ciudad_metrics || {},
                    costo_vida: universidad.ciudad_metrics && universidad.ciudad_metrics.costo_vida !== undefined ? 
                        universidad.ciudad_metrics.costo_vida : null,
                    calidad_aire: universidad.ciudad_metrics && universidad.ciudad_metrics.calidad_aire !== undefined ?
                        universidad.ciudad_metrics.calidad_aire : null,
                    calidad_transporte: universidad.ciudad_metrics && universidad.ciudad_metrics.calidad_transporte !== undefined ?
                        universidad.ciudad_metrics.calidad_transporte : null,
                    calidad_servicio_medico: universidad.ciudad_metrics && universidad.ciudad_metrics.calidad_servicio_medico !== undefined ?
                        universidad.ciudad_metrics.calidad_servicio_medico : null,
                    distancia_capital: universidad.ciudad_metrics && (
                        universidad.ciudad_metrics.distancia_a_madrid_km !== undefined || 
                        universidad.ciudad_metrics.distancia_a_lisboa_km !== undefined
                    ) ? (
                        universidad.ciudad_metrics.ciudad_referencia === 'Lisboa' ? 
                        universidad.ciudad_metrics.distancia_a_lisboa_km : 
                        universidad.ciudad_metrics.distancia_a_madrid_km
                    ) : null,
                    ultimo_enriquecimiento: universidad.ultimo_enriquecimiento || null
                };
                
                tableData.push(rowData);
            });
        }
    });
    
    return tableData;
}

// Configurar eventos para celdas editables
function setupEditableCells() {
    $('.editable-cell').off('click').on('click', function() {
        const cell = $(this);
        if (cell.hasClass('editing')) return;
        
        const field = cell.data('field');
        const id = cell.data('id');
        const currentValue = cell.data('fulltext') || cell.text();
        
        // Crear input adecuado según el tipo de campo
        let inputHtml;
        if (field === 'resumen') {
            inputHtml = `<textarea class="editable-textarea">${currentValue}</textarea>`;
        } else if (field === 'innovacion' || field === 'interdisciplinariedad' || 
                  field === 'impacto' || field === 'internacional' || 
                  field === 'aplicabilidad' || field === 'costo_vida') {
            // Para campos numéricos
            inputHtml = `<input type="number" min="0" max="10" step="0.1" class="editable-input" value="${currentValue !== 'N/A' ? currentValue : ''}">`;
        } else {
            // Para campos de texto
            inputHtml = `<input type="text" class="editable-input" value="${currentValue !== 'Sin enlace' ? currentValue : ''}">`;
        }
        
        // Reemplazar contenido con input
        cell.html(inputHtml);
        cell.addClass('editing');
        
        // Enfocar el input
        const input = field === 'resumen' ? cell.find('textarea') : cell.find('input');
        input.focus();
        
        // Guardar cambio al perder el foco
        input.on('blur', function() {
            const newValue = $(this).val();
            
            // Actualizar celda visualmente
            if (field === 'resumen') {
                const displayText = newValue.length > 50 ? newValue.substring(0, 50) + '...' : newValue;
                cell.html(displayText || 'Sin resumen');
                cell.attr('data-fulltext', newValue);
            } else if (field === 'url') {
                cell.html(newValue || 'Sin enlace');
            } else {
                cell.text(newValue || 'N/A');
            }
            
            // Registrar cambio
            if (!editedCells[id]) {
                editedCells[id] = {};
            }
            editedCells[id][field] = newValue;
            
            cell.removeClass('editing');
        });
        
        // Guardar con Enter (excepto en textarea)
        if (field !== 'resumen') {
            input.on('keypress', function(e) {
                if (e.which === 13) {
                    input.blur();
                }
            });
        }
    });
}

// Configurar eventos para selects de status
function setupStatusSelects() {
    $('.status-select').off('change').on('change', function() {
        const select = $(this);
        const id = select.data('id');
        const newStatus = select.val();
        
        // Registrar cambio
        if (!editedCells[id]) {
            editedCells[id] = {};
        }
        editedCells[id]['status'] = newStatus;
    });
}

// Configurar eventos para rating con estrellas
function setupRatingStars() {
    $('.rating-stars-container .star').off('click').on('click', function() {
        const star = $(this);
        const value = parseInt(star.data('value'));
        const container = star.closest('.rating-stars-container');
        const id = container.data('id');
        
        // Actualizar estrellas visualmente
        container.find('.star').each(function(index) {
            if (index < value) {
                $(this).addClass('filled');
            } else {
                $(this).removeClass('filled');
            }
        });
        
        // Registrar cambio
        if (!editedCells[id]) {
            editedCells[id] = {};
        }
        editedCells[id]['rating'] = value;
    });
}

// Configurar eventos para botones de acción
function setupActionButtons() {
    // Ver detalles
    $('.action-btn.view').off('click').on('click', function() {
        const id = $(this).data('id');
        
        // Buscar el programa correspondiente
        const rowData = dataTable.row($(this).closest('tr')).data();
        
        // Crear objeto universidad para mostrar en el panel de información
        const universidad = {
            nombre: rowData.universidad,
            ciudad: rowData.ciudad,
            programas: [{
                _id: rowData.id,
                nombre: rowData.programa,
                url: rowData.url,
                status: rowData.status,
                resumen: rowData.resumen,
                lineas_investigacion: rowData.lineas,
                calificacion: {
                    valor: rowData.rating
                }
            }]
        };
        
        // Mostrar panel de información
        showUniversityInfo(universidad);
    });
    
    // Editar programa (abrir modal o panel de edición completa)
    $('.action-btn.edit').off('click').on('click', function() {
        const id = $(this).data('id');
        alert('Funcionalidad de edición completa aún no implementada');
    });
    
    // Eliminar programa
    $('.action-btn.delete').off('click').on('click', function() {
        const id = $(this).data('id');
        
        if (confirm('¿Estás seguro de que deseas eliminar este programa? Esta acción no se puede deshacer.')) {
            // Eliminar programa de la tabla
            dataTable.row($(this).closest('tr')).remove().draw();
            
            // Registrar eliminación para cuando se guarden los cambios
            if (!editedCells[id]) {
                editedCells[id] = {};
            }
            editedCells[id]['deleted'] = true;
        }
    });
}

// Configurar tooltips para información adicional
function setupInfoTooltips() {
    $('.info-icon').off('click').on('click', function() {
        const id = $(this).data('id');
        const field = $(this).data('field');
        
        // Encontrar la fila correspondiente
        const rowData = findRowDataById(id);
        if (!rowData) return;
        
        // Obtener comentario según el campo
        let title, content;
        if (field === 'costo_vida_comentario') {
            title = 'Costo de Vida';
            content = rowData.ciudad_metrics && rowData.ciudad_metrics.costo_vida_comentario 
                ? rowData.ciudad_metrics.costo_vida_comentario 
                : 'No hay información disponible sobre el costo de vida.';
        } else if (field === 'calidad_aire_comentario') {
            title = 'Calidad del Aire';
            content = rowData.ciudad_metrics && rowData.ciudad_metrics.calidad_aire_comentario 
                ? rowData.ciudad_metrics.calidad_aire_comentario 
                : 'No hay información disponible sobre la calidad del aire.';
        } else if (field === 'calidad_transporte_comentario') {
            title = 'Calidad del Transporte';
            content = rowData.ciudad_metrics && rowData.ciudad_metrics.calidad_transporte_comentario 
                ? rowData.ciudad_metrics.calidad_transporte_comentario 
                : 'No hay información disponible sobre la calidad del transporte.';
        } else if (field === 'calidad_servicio_medico_comentario') {
            title = 'Calidad del Servicio Médico';
            content = rowData.ciudad_metrics && rowData.ciudad_metrics.calidad_servicio_medico_comentario 
                ? rowData.ciudad_metrics.calidad_servicio_medico_comentario 
                : 'No hay información disponible sobre la calidad del servicio médico.';
        }
        
        // Mostrar modal con la información
        showInfoModal(title, content);
    });
}

// Mostrar modal de información
function showInfoModal(title, content) {
    // Crear modal dinámicamente
    const modalHtml = `
        <div id="infoModal" class="modal show">
            <div class="modal-content">
                <h4>${title}</h4>
                <div class="info-content">
                    <p>${content}</p>
                </div>
                <div class="modal-actions">
                    <button class="confirm-btn close-info-modal">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    // Añadir al DOM
    $('body').append(modalHtml);
    
    // Configurar evento para cerrar
    $('.close-info-modal').on('click', function() {
        $('#infoModal').remove();
    });
}

// Encontrar datos de fila por ID
function findRowDataById(id) {
    const data = dataTable.data();
    for (let i = 0; i < data.length; i++) {
        if (data[i].id === id) {
            return data[i];
        }
    }
    return null;
}

// Capitalizar primera letra
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Guardar cambios
function saveChanges() {
    // Verificar si hay cambios
    if (Object.keys(editedCells).length === 0) {
        alert('No hay cambios para guardar');
        return;
    }
    
    // Mostrar modal de confirmación
    $('#saveConfirmModal').addClass('show');
}

// Confirmar guardado de cambios
function confirmSaveChanges() {
    // Aquí implementaríamos la lógica para guardar los cambios en el servidor
    console.log('Guardando cambios:', editedCells);
    
    // Simulación de guardado
    Object.keys(editedCells).forEach(id => {
        const changes = editedCells[id];
        
        // Buscar el programa en los datos originales
        for (const universidad of universidadesData.programas_doctorado.universidades) {
            for (let i = 0; i < universidad.programas.length; i++) {
                const programa = universidad.programas[i];
                
                if (programa._id === id) {
                    // Aplicar cambios
                    if (changes.deleted) {
                        // Eliminar programa
                        universidad.programas.splice(i, 1);
                    } else {
                        // Actualizar campos
                        if (changes.programa) programa.nombre = changes.programa;
                        if (changes.url) programa.url = changes.url;
                        if (changes.resumen) programa.resumen = changes.resumen;
                        if (changes.status) programa.status = changes.status;
                        
                        // Actualizar calificación
                        if (changes.rating) {
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
                        if (changes.innovacion) programa.stats.innovacion = parseFloat(changes.innovacion);
                        if (changes.interdisciplinariedad) programa.stats.interdisciplinariedad = parseFloat(changes.interdisciplinariedad);
                        if (changes.impacto) programa.stats.impacto = parseFloat(changes.impacto);
                        if (changes.internacional) programa.stats.internacional = parseFloat(changes.internacional);
                        if (changes.aplicabilidad) programa.stats.aplicabilidad = parseFloat(changes.aplicabilidad);
                    }
                    
                    break;
                }
            }
        }
    });
    
    // Actualizar tabla
    dataTable.clear();
    dataTable.rows.add(prepareTableData(universidadesData)).draw();
    
    // Limpiar cambios
    editedCells = {};
    
    // Cerrar modal
    $('#saveConfirmModal').removeClass('show');
    
    // Mostrar mensaje de éxito
    alert('Cambios guardados correctamente');
}

// Cancelar guardado de cambios
function cancelSaveChanges() {
    $('#saveConfirmModal').removeClass('show');
}

// Mostrar modal de enriquecimiento con IA
function showEnrichModal() {
    $('#enrichModal').addClass('show');
}

// Iniciar enriquecimiento con IA
function startEnrichment() {
    const model = $('#aiModelSelect').val();
    const enrichResumen = $('#enrichResumen').is(':checked');
    const enrichMetrics = $('#enrichMetrics').is(':checked');
    const enrichCiudad = $('#enrichCiudad').is(':checked');
    const target = $('#enrichTarget').val();
    
    // Obtener programas seleccionados si es necesario
    let selectedPrograms = [];
    if (target === 'selected') {
        const selectedRows = dataTable.rows({ selected: true }).data();
        selectedPrograms = Array.from(selectedRows).map(row => row.id);
        
        if (selectedPrograms.length === 0) {
            alert('No hay programas seleccionados. Por favor, selecciona al menos un programa.');
            return;
        }
    }
    
    // Mostrar indicador de progreso
    $('#enrichModal').removeClass('show');
    
    // Aquí llamaríamos al endpoint de enriquecimiento con IA
    enrichData(model, enrichResumen, enrichMetrics, enrichCiudad, target, selectedPrograms);
}

// Función para enriquecer datos (simulada)
function enrichData(model, enrichResumen, enrichMetrics, enrichCiudad, target, selectedPrograms) {
    // Simulación de enriquecimiento (en un caso real esto sería una llamada API)
    setTimeout(function() {
        alert(`Enriquecimiento completado usando modelo ${model}`);
        
        // Actualizar tabla
        dataTable.clear();
        dataTable.rows.add(prepareTableData(universidadesData)).draw();
    }, 2000);
}

// Inicializar eventos de modal
function setupModalEvents() {
    // Botones de guardar cambios
    $('#saveTableChanges').on('click', saveChanges);
    $('#confirmSaveBtn').on('click', confirmSaveChanges);
    $('#cancelSaveBtn').on('click', cancelSaveChanges);
    
    // Botones de enriquecimiento con IA
    $('#openEnrichModal').on('click', showEnrichModal);
    $('#startEnrichBtn').on('click', startEnrichment);
    $('#cancelEnrichBtn').on('click', function() {
        $('#enrichModal').removeClass('show');
    });
}

// Inicialización cuando se carga la página
$(document).ready(function() {
    // Configurar eventos de los modales
    setupModalEvents();
    
    // Inicializar DataTable cuando se cambie a la pestaña tabla
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            if (this.dataset.tab === 'tabla') {
                // Inicializar la tabla después de un breve retraso
                // para asegurarnos de que el contenedor sea visible
                setTimeout(function() {
                    if (!dataTable) {
                        initializeDataTable();
                    } else {
                        dataTable.columns.adjust().responsive.recalc();
                    }
                }, 100);
            }
        });
    });
});