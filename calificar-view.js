// Variables for program data and statistics
let allPrograms = [];
let programStats = {
    totalCount: 0,
    universityCount: 0,
    statusCounts: []
};
let currentRatingFilter = 'not-rated'; // Default to showing unrated programs

// Initialize the calificar view when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Setup event listeners for the calificar tab
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            if (this.dataset.tab === 'calificar') {
                // Load programs when the calificar tab is selected
                initializeCalificarView();
            }
        });
    });

    // Setup the status filter
    document.getElementById('simpleStatusFilter').addEventListener('change', filterProgramsByStatus);
    
    // Setup rating filter buttons
    document.getElementById('filter-not-rated').addEventListener('click', () => filterByRating('not-rated'));
    document.getElementById('filter-rated').addEventListener('click', () => filterByRating('rated'));
    document.getElementById('filter-all-ratings').addEventListener('click', () => filterByRating('all'));

    // Setup export buttons
    document.getElementById('export-json').addEventListener('click', exportToJSON);
    document.getElementById('export-csv').addEventListener('click', exportToCSV);

    // Setup edit modal events
    setupProgramEditModal();
    
    // Setup rating confirmation modal events
    setupRatingConfirmationModal();
});

// Initialize the calificar view
async function initializeCalificarView() {
    try {
        // Show loading state
        document.getElementById('programs-table-body').innerHTML = `
            <tr>
                <td colspan="4" class="loading-cell">Cargando programas...</td>
            </tr>
        `;

        // Load program statistics
        await loadProgramStats();
        
        // Load all programs
        await loadAllPrograms();
        
        // Apply the current rating filter
        const filteredPrograms = applyRatingFilter(allPrograms);
        
        // Update filter button states based on current filter
        updateRatingFilterButtons();
        
        // Display filtered programs in the table
        displayPrograms(filteredPrograms);
        
        // Update statistics display
        updateStatsDisplay();
    } catch (error) {
        console.error('Error initializing calificar view:', error);
        document.getElementById('programs-table-body').innerHTML = `
            <tr>
                <td colspan="4" class="loading-cell">Error al cargar programas: ${error.message}</td>
            </tr>
        `;
    }
}

// Update rating filter button states based on currentRatingFilter
function updateRatingFilterButtons() {
    const notRatedBtn = document.getElementById('filter-not-rated');
    const ratedBtn = document.getElementById('filter-rated');
    const allRatingsBtn = document.getElementById('filter-all-ratings');
    
    notRatedBtn.classList.remove('active');
    ratedBtn.classList.remove('active');
    allRatingsBtn.classList.remove('active');
    
    if (currentRatingFilter === 'not-rated') {
        notRatedBtn.classList.add('active');
    } else if (currentRatingFilter === 'rated') {
        ratedBtn.classList.add('active');
    } else {
        allRatingsBtn.classList.add('active');
    }
}

// Load program statistics from the API
async function loadProgramStats() {
    try {
        const response = await fetch('/api/programas/stats');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        programStats = await response.json();
        console.log('Program stats loaded:', programStats);
    } catch (error) {
        console.error('Error loading program stats:', error);
        throw error;
    }
}

// Load all programs from the API
async function loadAllPrograms() {
    try {
        const response = await fetch('/api/programas');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        allPrograms = await response.json();
        console.log('All programs loaded:', allPrograms);
    } catch (error) {
        console.error('Error loading programs:', error);
        throw error;
    }
}

// Display programs in the table
function displayPrograms(programs) {
    const tableBody = document.getElementById('programs-table-body');
    
    if (!programs || programs.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="loading-cell">No hay programas disponibles</td>
            </tr>
        `;
        return;
    }
    
    // Sort programs by name
    const sortedPrograms = [...programs].sort((a, b) => {
        return a.programa.localeCompare(b.programa);
    });
    
    // Generate table rows
    let tableHtml = '';
    
    sortedPrograms.forEach(program => {
        // Get rating stars HTML
        const ratingValue = program.calificacion ? program.calificacion.valor : 0;
        const ratingHtml = getStarsHTML(ratingValue, program._id);
        
        // Get status class and text
        const statusClass = `status-${program.status || 'pendiente'}`;
        const statusText = program.statusText || (program.status ? program.status.charAt(0).toUpperCase() + program.status.slice(1) : 'Pendiente');
        
        // Generate table row HTML
        tableHtml += `
            <tr data-id="${program._id}">
                <td>${program.displayName || program.programa}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="rating-stars" data-rating="${ratingValue}" data-id="${program._id}">
                        ${ratingHtml}
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-btn" onclick="editProgram('${program._id}')">Editar</button>
                        <button class="duplicate-btn" onclick="duplicateProgram('${program._id}')">Duplicar</button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = tableHtml;
    
    // Add click event listeners to stars
    setupRatingStars();
}

// Update statistics display
function updateStatsDisplay() {
    // Update university and document counts
    document.getElementById('university-count').textContent = programStats.universityCount || 0;
    document.getElementById('document-count').textContent = programStats.totalCount || 0;
    
    // Update status distribution
    const statusDistribution = document.getElementById('status-distribution');
    
    if (!programStats.statusCounts || programStats.statusCounts.length === 0) {
        statusDistribution.innerHTML = '<div class="no-data">No hay datos de estado disponibles</div>';
        return;
    }
    
    let statusHtml = '';
    
    programStats.statusCounts.forEach(item => {
        statusHtml += `
            <div class="status-badge status-${item.status}">
                ${item.statusText}
                <span class="status-count">${item.count}</span>
            </div>
        `;
    });
    
    statusDistribution.innerHTML = statusHtml;
}

// Filter programs by status
function filterProgramsByStatus() {
    const statusFilter = document.getElementById('simpleStatusFilter').value;
    
    // First apply rating filter
    let filteredPrograms = applyRatingFilter(allPrograms);
    
    // If no status filter, just show the rating-filtered programs
    if (!statusFilter) {
        displayPrograms(filteredPrograms);
        return;
    }
    
    // Apply status filter on top of rating filter
    filteredPrograms = filteredPrograms.filter(program => {
        return program.status === statusFilter;
    });
    
    // Display filtered programs
    displayPrograms(filteredPrograms);
}

// Filter programs by rating (rated vs not rated)
function filterByRating(filterType) {
    // Update current filter
    currentRatingFilter = filterType;
    
    // Update button active states
    const notRatedBtn = document.getElementById('filter-not-rated');
    const ratedBtn = document.getElementById('filter-rated');
    const allRatingsBtn = document.getElementById('filter-all-ratings');
    
    notRatedBtn.classList.remove('active');
    ratedBtn.classList.remove('active');
    allRatingsBtn.classList.remove('active');
    
    if (filterType === 'not-rated') {
        notRatedBtn.classList.add('active');
    } else if (filterType === 'rated') {
        ratedBtn.classList.add('active');
    } else {
        allRatingsBtn.classList.add('active');
    }
    
    // Apply filters (both rating and status if applicable)
    const statusFilter = document.getElementById('simpleStatusFilter').value;
    
    // First apply rating filter
    let filteredPrograms = applyRatingFilter(allPrograms);
    
    // Then apply status filter if set
    if (statusFilter) {
        filteredPrograms = filteredPrograms.filter(program => {
            return program.status === statusFilter;
        });
    }
    
    // Display filtered programs
    displayPrograms(filteredPrograms);
}

// Helper function to apply rating filter based on currentRatingFilter
function applyRatingFilter(programs) {
    if (currentRatingFilter === 'all') {
        // Show all programs regardless of rating
        return programs;
    } else if (currentRatingFilter === 'rated') {
        // Show only programs with a rating
        return programs.filter(program => {
            return program.calificacion && program.calificacion.valor > 0;
        });
    } else {
        // Show only programs without a rating (not-rated is default)
        return programs.filter(program => {
            return !program.calificacion || program.calificacion.valor === 0;
        });
    }
}

// Setup program edit modal
function setupProgramEditModal() {
    // Close button
    document.querySelector('#program-edit-modal .close-modal').addEventListener('click', closeEditModal);
    
    // Cancel button
    document.getElementById('cancel-program-edit').addEventListener('click', closeEditModal);
    
    // Save button
    document.getElementById('save-program-changes').addEventListener('click', saveProgram);
    
    // Duplicate button
    document.getElementById('duplicate-program').addEventListener('click', duplicateProgramFromModal);
    
    // Rating stars
    const stars = document.querySelectorAll('#edit-program-rating .star');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const value = parseInt(this.dataset.value);
            
            // Update stars visual state
            stars.forEach((s, index) => {
                if (index < value) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });
}

// Open the edit modal for a program
function editProgram(programId) {
    // Find the program in the data
    const program = findProgramById(programId);
    
    if (!program) {
        console.error('Program not found:', programId);
        return;
    }
    
    // Fill form with program data
    document.getElementById('edit-program-id').value = program._id;
    document.getElementById('edit-program-name').value = program.programa || '';
    document.getElementById('edit-program-university').value = program.universidad || '';
    document.getElementById('edit-program-city').value = program.ciudad || '';
    document.getElementById('edit-program-status').value = program.status || 'pendiente';
    document.getElementById('edit-program-url').value = program.url || '';
    
    // Set the lines of investigation field
    let lineasContent = '';
    if (program.linea_investigacion) {
        lineasContent = program.linea_investigacion;
    } else if (program.lineas_investigacion) {
        // Handle both formats
        if (Array.isArray(program.lineas_investigacion)) {
            lineasContent = program.lineas_investigacion.join('\\n\\n');
        } else {
            lineasContent = program.lineas_investigacion;
        }
    }
    
    document.getElementById('edit-program-lines').value = lineasContent;
    
    // Set rating stars
    const ratingValue = program.calificacion ? program.calificacion.valor : 0;
    const stars = document.querySelectorAll('#edit-program-rating .star');
    
    stars.forEach((star, index) => {
        if (index < ratingValue) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
    
    // Open modal
    document.getElementById('program-edit-modal').style.display = 'block';
}

// Close the edit modal
function closeEditModal() {
    document.getElementById('program-edit-modal').style.display = 'none';
}

// Save the program changes
async function saveProgram() {
    const programId = document.getElementById('edit-program-id').value;
    
    // Collect form data
    const status = document.getElementById('edit-program-status').value;
    const url = document.getElementById('edit-program-url').value;
    const lineasInvestigacion = document.getElementById('edit-program-lines').value;
    
    // Get rating value
    const activeStars = document.querySelectorAll('#edit-program-rating .star.active');
    const rating = activeStars.length;
    
    // Prepare update data
    const updateData = {
        status,
        url,
        linea_investigacion: lineasInvestigacion
    };
    
    // Add rating if set
    if (rating > 0) {
        updateData.calificacion = {
            valor: rating,
            fecha: new Date().toISOString()
        };
    }
    
    try {
        // Send update to server
        const response = await fetch(`/api/programas/${programId}`, {
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
        console.log('Program updated:', result);
        
        // Close modal
        closeEditModal();
        
        // Refresh data
        await initializeCalificarView();
        
        // Show success message
        alert('Programa actualizado correctamente');
    } catch (error) {
        console.error('Error updating program:', error);
        alert(`Error al actualizar programa: ${error.message}`);
    }
}

// Duplicate program from the table
async function duplicateProgram(programId) {
    try {
        const originalProgram = findProgramById(programId);
        
        if (!originalProgram) {
            throw new Error('Programa no encontrado');
        }
        
        // Create a copy with a new name
        const newProgram = {
            universidad: originalProgram.universidad,
            ciudad: originalProgram.ciudad,
            programa: `${originalProgram.programa} (Copia)`,
            linea_investigacion: originalProgram.linea_investigacion || '',
            url: originalProgram.url || '',
            status: originalProgram.status || 'pendiente'
        };
        
        // Add rating if available
        if (originalProgram.calificacion) {
            newProgram.calificacion = {
                valor: originalProgram.calificacion.valor,
                fecha: new Date().toISOString()
            };
        }
        
        // Send to server
        const response = await fetch('/api/programas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newProgram)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Refresh data
        await initializeCalificarView();
        
        // Show success message
        alert('Programa duplicado correctamente');
    } catch (error) {
        console.error('Error duplicating program:', error);
        alert(`Error al duplicar programa: ${error.message}`);
    }
}

// Duplicate program from the modal
function duplicateProgramFromModal() {
    const programId = document.getElementById('edit-program-id').value;
    closeEditModal();
    duplicateProgram(programId);
}

// Find a program by ID
function findProgramById(programId) {
    return allPrograms.find(program => program._id === programId);
}

// Get stars HTML based on rating value
function getStarsHTML(rating, programId) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        const starClass = i <= rating ? 'star filled' : 'star';
        html += `<span class="${starClass}" data-value="${i}" data-program-id="${programId}">★</span>`;
    }
    return html;
}

// Setup click events for rating stars in the table
function setupRatingStars() {
    const stars = document.querySelectorAll('.rating-stars .star');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const value = parseInt(this.dataset.value);
            const programId = this.dataset.programId;
            
            // Show confirmation modal
            showRatingConfirmation(programId, value);
        });
    });
}

// Show rating confirmation modal
function showRatingConfirmation(programId, value) {
    // Set values in the modal
    document.getElementById('rating-program-id').value = programId;
    document.getElementById('rating-value').value = value;
    document.getElementById('rating-value-text').textContent = value;
    
    // Show modal
    const modal = document.getElementById('rating-confirm-modal');
    modal.style.display = 'block';
}

// Setup rating confirmation modal
function setupRatingConfirmationModal() {
    // Close button
    const closeBtn = document.querySelector('.close-rating-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeRatingModal);
    }
    
    // Confirm button
    const confirmBtn = document.getElementById('confirm-rating');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async function() {
            const programId = document.getElementById('rating-program-id').value;
            const rating = parseInt(document.getElementById('rating-value').value);
            
            try {
                await updateRating(programId, rating);
                closeRatingModal();
                
                // Show success message
                alert(`Calificación actualizada correctamente a ${rating} estrellas`);
            } catch (error) {
                // Error is already handled in updateRating
            }
        });
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('cancel-rating');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeRatingModal);
    }
}

// Close rating confirmation modal
function closeRatingModal() {
    const modal = document.getElementById('rating-confirm-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Update rating for a program
async function updateRating(programId, rating) {
    try {
        // Prepare update data
        const updateData = {
            calificacion: {
                valor: rating,
                fecha: new Date().toISOString()
            }
        };
        
        // Send update to server
        const response = await fetch(`/api/programas/${programId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Get the updated program data
        const result = await response.json();
        
        // Update the program in our local data
        const programIndex = allPrograms.findIndex(p => p._id === programId);
        if (programIndex !== -1) {
            allPrograms[programIndex].calificacion = updateData.calificacion;
        }
        
        // Re-apply filters and update display
        const statusFilter = document.getElementById('simpleStatusFilter').value;
        let filteredPrograms = applyRatingFilter(allPrograms);
        
        if (statusFilter) {
            filteredPrograms = filteredPrograms.filter(program => {
                return program.status === statusFilter;
            });
        }
        
        // Display filtered programs
        displayPrograms(filteredPrograms);
        
        return result;
    } catch (error) {
        console.error('Error updating rating:', error);
        alert(`Error al actualizar calificación: ${error.message}`);
        throw error;
    }
}

// Export all programs to JSON file
function exportToJSON() {
    try {
        // Create a simplified version of the data for export
        const exportData = allPrograms.map(program => {
            return {
                _id: program._id,
                programa: program.programa,
                universidad: program.universidad,
                ciudad: program.ciudad,
                status: program.status || 'pendiente',
                calificacion: program.calificacion || { valor: 0, fecha: null },
                url: program.url || '',
                linea_investigacion: program.linea_investigacion || program.lineas_investigacion || ''
            };
        });
        
        // Convert to JSON string with pretty formatting
        const jsonString = JSON.stringify(exportData, null, 2);
        
        // Create a Blob with the data
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        // Create a download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `programas_doctorado_${formatDate(new Date())}.json`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('JSON export successful');
    } catch (error) {
        console.error('Error exporting to JSON:', error);
        alert(`Error al exportar a JSON: ${error.message}`);
    }
}

// Export all programs to CSV file
function exportToCSV() {
    try {
        // Define CSV headers
        const headers = [
            'ID', 
            'Programa', 
            'Universidad', 
            'Ciudad', 
            'Estado', 
            'Calificación',
            'Fecha Calificación',
            'URL',
            'Líneas de Investigación'
        ];
        
        // Create CSV rows
        const rows = allPrograms.map(program => {
            // Format values properly for CSV
            const calificacion = program.calificacion ? program.calificacion.valor : 0;
            const fechaCalificacion = program.calificacion && program.calificacion.fecha 
                ? formatDate(new Date(program.calificacion.fecha)) 
                : '';
            
            // Get lines of investigation from either field
            let lineas = '';
            if (program.linea_investigacion) {
                lineas = program.linea_investigacion;
            } else if (program.lineas_investigacion) {
                if (Array.isArray(program.lineas_investigacion)) {
                    lineas = program.lineas_investigacion.join('; ');
                } else {
                    lineas = program.lineas_investigacion;
                }
            }
            
            // Escape values for CSV format
            return [
                program._id,
                escapeCsvValue(program.programa),
                escapeCsvValue(program.universidad),
                escapeCsvValue(program.ciudad),
                program.status || 'pendiente',
                calificacion,
                fechaCalificacion,
                program.url || '',
                escapeCsvValue(lineas)
            ];
        });
        
        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        // Create a Blob with the data
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // Create a download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `programas_doctorado_${formatDate(new Date())}.csv`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('CSV export successful');
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        alert(`Error al exportar a CSV: ${error.message}`);
    }
}

// Helper function to format dates as YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Helper function to escape values for CSV
function escapeCsvValue(value) {
    if (value === null || value === undefined) {
        return '';
    }
    
    // Convert to string and replace newlines with spaces
    const stringValue = String(value).replace(/\n/g, ' ').replace(/\r/g, '');
    
    // Check if value contains commas, double quotes, or newlines
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        // Escape double quotes by doubling them and wrap in quotes
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
}