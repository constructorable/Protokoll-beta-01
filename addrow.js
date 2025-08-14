document.addEventListener('DOMContentLoaded', function () {
    // Counter für Bemerkungszeilen pro Raum
    const bemerkungCounters = {
        kueche: 1,
        bad: 1,
        wc: 1,
        flur: 1,
        abstellraum: 1,
        nebenraum: 1,
        regelungen: 1,
        weitere: 1  // ← HINZUFÜGEN
    };

    window.bemerkungCounters = bemerkungCounters;

    // Event Delegation für alle Tabellen
    document.addEventListener('click', function (e) {

    if (e.target.classList.contains('add-bemerkung-btn')) {
        console.log('🔍 ADD-BUTTON GEKLICKT:', {
            target: e.target,
            isZimmerContainer: !!e.target.closest('[id^="zimmer-container-"]'),
            closestZimmerContainer: e.target.closest('[id^="zimmer-container-"]'),
            closestTableContainer: e.target.closest('.table-container'),
            allClasses: e.target.className,
            parentHTML: e.target.parentElement.outerHTML.substring(0, 100)
        });
        
        // Prüfen ob es ein Zimmer-Button ist
        const zimmerContainer = e.target.closest('[id^="zimmer-container-"]');
        if (zimmerContainer) {
            console.log('🚫 ZIMMER-BEMERKUNG ÜBERSPRUNGEN - wird von addzimmer.js behandelt');
            console.log('Zimmer-Container gefunden:', zimmerContainer.id);
            return; // ← WICHTIG: Zimmer-Buttons überspringen!
        }
        
        console.log('✅ STANDARD-RAUM BEMERKUNG - wird von addrow.js behandelt');
    }

        // Küche
        if (e.target.classList.contains('add-bemerkung-btn') &&
            e.target.closest('.table-container.kueche')) {
            addBemerkungRow(e.target.closest('tr'), 'kueche');
        }
        // Bad
        else if (e.target.classList.contains('add-bemerkung-btn') &&
            e.target.closest('.table-container.bad')) {
            addBemerkungRow(e.target.closest('tr'), 'bad');
        }
        else if (e.target.classList.contains('add-bemerkung-btn') &&
            e.target.closest('.table-container.wc')) {
            addBemerkungRow(e.target.closest('tr'), 'wc');
        }
        else if (e.target.classList.contains('add-bemerkung-btn') &&
            e.target.closest('.table-container.flur')) {
            addBemerkungRow(e.target.closest('tr'), 'flur');
        }
        else if (e.target.classList.contains('add-bemerkung-btn') &&
            e.target.closest('.table-container.abstellraum')) {
            addBemerkungRow(e.target.closest('tr'), 'abstellraum');
        }
        // Nebenräume
        else if (e.target.classList.contains('add-bemerkung-btn') &&
            e.target.closest('.table-container.nebenraum')) {
            addBemerkungRow(e.target.closest('tr'), 'nebenraum');
        }
        // Regelungen
        else if (e.target.classList.contains('add-bemerkung-btn') &&
            e.target.closest('#regelungen')) {
            addBemerkungRow(e.target.closest('tr'), 'regelungen');
        }
        else if (e.target.classList.contains('add-bemerkung-btn') &&
            e.target.closest('#weiterebemerkungen')) {
            addBemerkungRow(e.target.closest('tr'), 'weitere');
        }

        // Löschen für alle
         if (e.target.classList.contains('del-bemerkung-btn')) {
        // Prüfen ob es ein Zimmer-Button ist
        const zimmerContainer = e.target.closest('[id^="zimmer-container-"]');
        if (zimmerContainer) {
            console.log('🚫 ZIMMER-LÖSCHUNG ÜBERSPRUNGEN - wird von addzimmer.js behandelt');
            return; // ← WICHTIG: Zimmer-Buttons überspringen!
        }
        console.log('🗑️ Standard-Raum Löschung');
        deleteBemerkungRow(e.target.closest('tr'));
    }
    });

    function generateBemerkungId(raum) {
        return `bemerkung-${raum}-${bemerkungCounters[raum]++}`;
    }

    function addBemerkungRow(sourceRow, raum) {
        const newRow = document.createElement('tr');
        newRow.className = 'bemerkung-row';
        const bemerkungId = generateBemerkungId(raum);

        // Dynamische colspan-Bestimmung basierend auf dem Raum
        const colspan = (raum === 'regelungen') ? '7' : '6';

        newRow.innerHTML = `
            <td colspan="${colspan}">
                <div class="bemerkung-container" data-bemerkung-id="${bemerkungId}">
                    <input type="text" id="${bemerkungId}" class="bemerkung-input"
                           placeholder="" data-raum="${raum}">
                    <div class="bemerkung-actions">
                        <button type="button" class="add-bemerkung-btn">+</button>
                        <button type="button" class="del-bemerkung-btn" style="display:none;">×</button>
                    </div>
                </div>
            </td>
        `;

        sourceRow.parentNode.insertBefore(newRow, sourceRow.nextSibling);
        updateDeleteButtons(sourceRow.closest('table'));
    }

function deleteBemerkungRow(row) {
    const table = row.closest('table');
    const bemerkungRows = table.querySelectorAll('.bemerkung-row');
    const bemerkungContainers = Array.from(bemerkungRows).filter(r => r.querySelector('.bemerkung-container'));
    
    const currentRowIndex = bemerkungContainers.indexOf(row);
    
    if (bemerkungContainers.length > 1 && currentRowIndex > 0) {
        row.remove();
        updateDeleteButtons(table);
    }
}

function updateDeleteButtons(table) {
    const rows = table.querySelectorAll('.bemerkung-row');
    const bemerkungRows = Array.from(rows).filter(row => row.querySelector('.bemerkung-container'));
    
    bemerkungRows.forEach((row, index) => {
        const delBtn = row.querySelector('.del-bemerkung-btn');
        if (delBtn) {
            delBtn.style.display = (bemerkungRows.length > 1 && index > 0) ? 'block' : 'none';
        }
    });
}
});