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
        if (table.querySelectorAll('.bemerkung-row').length > 1) {
            row.remove();
            updateDeleteButtons(table);
        }
    }

    function updateDeleteButtons(table) {
        const rows = table.querySelectorAll('.bemerkung-row');
        rows.forEach((row, index) => {
            const delBtn = row.querySelector('.del-bemerkung-btn');
            if (delBtn) {
                delBtn.style.display = rows.length > 1 ? 'block' : 'none';
            }
        });
    }
});