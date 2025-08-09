
// script1.js
setTimeout(function () {
    const heute = new Date();
    document.getElementById('datum').valueAsDate = heute;
}, 100);


document.addEventListener('DOMContentLoaded', function () {
    // Funktion zum Kopieren der Werte
    function copyInputValues() {
        // Kopiere Straße/Objekt zu Objekt
        const strasseInput = document.getElementById('strasseeinzug');
        const objektClon = document.getElementById('objektclon');
        if (strasseInput && objektClon) {
            objektClon.value = strasseInput.value;
        }

        // Kopiere PLZ/Ort zu Ort
        const plzInput = document.getElementById('plzeinzug');
        const ortClon = document.getElementById('ortclon');
        if (plzInput && ortClon) {
            ortClon.value = plzInput.value;
        }

        // Kopiere Lage zu Lage
        const lageInput = document.getElementById('lageeinzug2');
        const lageClon = document.getElementById('lageclon');
        if (lageInput && lageClon) {
            lageClon.value = lageInput.value;
        }

        // Kopiere Mieternummer zu Mieternummer
        const mieterInput = document.getElementById('mieterid');
        const mieterClon = document.getElementById('mietidtclon');
        if (mieterInput && mieterClon) {
            mieterClon.value = mieterInput.value;
        }
    }

    // Observer für Änderungen am Mieternummer-Feld
    const inputFields = ['strasseeinzug', 'plzeinzug', 'lageeinzug2', 'mieterid'];
    inputFields.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', copyInputValues);
            input.addEventListener('change', copyInputValues);
        }
    });

    // Spezieller Observer für die Mieternummer
    const mieterInput = document.getElementById('mieterid');
    if (mieterInput) {
        // Observer für direkte Wertänderungen
        const observer = new MutationObserver(copyInputValues);
        observer.observe(mieterInput, {
            attributes: true,
            attributeFilter: ['value']
        });

        // Fallback: Periodische Prüfung (falls nötig)
        let lastValue = mieterInput.value;
        setInterval(() => {
            if (mieterInput.value !== lastValue) {
                lastValue = mieterInput.value;
                copyInputValues();
            }
        }, 500);
    }

    // Initialer Aufruf
    copyInputValues();
});







document.addEventListener('DOMContentLoaded', function () {
    // Heutiges Datum ermitteln
    const today = new Date();

    // Datum im Format YYYY-MM-DD für date-Input vorbereiten
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Monat ist 0-basiert
    const day = String(today.getDate()).padStart(2, '0');

    const todayFormatted = `${year}-${month}-${day}`;

    // Datum in das Feld eintragen
    const dateInput = document.getElementById('datum2');
    if (dateInput) {
        dateInput.value = todayFormatted;
    }
});






document.addEventListener('DOMContentLoaded', function () {
    // 1. Namensvorschläge definieren
    const nameSuggestions = [
        "Christian Adler",
        "Oliver Acker",
        "Manfred Launicke",
        "Claus Zechmeister",
        "Marli Smith",
        "Darius Andörfer",
        "Stefanie Muscat"
    ];

    // 2. Input-Feld und Container finden
    const inputField = document.getElementById('firma1');
    if (!inputField) {
        console.error('Input-Feld mit ID "firma" nicht gefunden!');
        return;
    }

    const bemerkungContainer = inputField.closest('.bemerkung-container');
    if (!bemerkungContainer) {
        console.error('Eltern-Container ".bemerkung-container" nicht gefunden!');
        return;
    }

    // 3. Vorschlagsliste erstellen
    const suggestionContainer = document.getElementById('name-suggestions-container');


    // 4. Funktionen für die Vorschlagsanzeige
    function showSuggestions(suggestions) {
        suggestionContainer.innerHTML = '';

        if (suggestions.length === 0) {
            suggestionContainer.style.display = 'none';
            return;
        }

        suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = suggestion;
            item.addEventListener('click', () => {
                inputField.value = suggestion;
                hideSuggestions();
            });
            suggestionContainer.appendChild(item);
        });

        suggestionContainer.style.display = 'contents';
    }

    function hideSuggestions() {
        suggestionContainer.style.display = 'none';
    }

    function getFilteredSuggestions() {
        const input = inputField.value.toLowerCase();
        return input === ''
            ? nameSuggestions
            : nameSuggestions.filter(name => name.toLowerCase().includes(input));
    }

    // 5. Event-Handler
    inputField.addEventListener('focus', () => showSuggestions(getFilteredSuggestions()));
    inputField.addEventListener('input', () => showSuggestions(getFilteredSuggestions()));

    document.addEventListener('click', (e) => {
        if (!bemerkungContainer.contains(e.target)) {
            hideSuggestions();
        }
    });

    // 6. CSS sicher einbinden
    if (!document.getElementById('suggestion-styles')) {
        const style = document.createElement('style');
        style.id = 'suggestion-styles';
        style.textContent = `
            .bemerkung-container {
                position: relative !important;
            }
            #name-suggestions-container {
                position: absolute !important;
                top: calc(100% + 2px) !important;
                left: 0 !important;
                right: 0 !important;
                border: 1px solid #ccc !important;
                border-radius: 4px !important;
                background: white !important;
                z-index: 1000 !important;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
                max-height: 200px !important;
                overflow-y: auto !important;
            }
            .suggestion-item {
                padding: 8px 12px !important;
                cursor: pointer !important;
                border-bottom: 1px solid #eee !important;
            }
            .suggestion-item:hover {
                background-color: #f5f5f5 !important;
            }
            .suggestion-item:last-child {
                border-bottom: none !important;
            }
        `;
        document.head.appendChild(style);
    }
});





document.addEventListener('DOMContentLoaded', function () {
    // Canvas und Kontext initialisieren
    const landlordCanvas = document.getElementById('landlord-signature-canvas');
    const landlordCtx = landlordCanvas.getContext('2d');

    // Canvas-Einstellungen
    landlordCtx.lineWidth = 7;
    landlordCtx.lineJoin = 'round';
    landlordCtx.lineCap = 'round';
    landlordCtx.strokeStyle = '#373d41';

    // Zeichnen-Variablen
    let landlordDrawing = false;

    // Zeichnen starten
    function startLandlordDrawing(e) {
        landlordDrawing = true;
        const rect = landlordCanvas.getBoundingClientRect();
        const x = e.clientX ? e.clientX : e.touches[0].clientX;
        const y = e.clientY ? e.clientY : e.touches[0].clientY;
        landlordCtx.beginPath();
        landlordCtx.moveTo(x - rect.left, y - rect.top);
        e.preventDefault();
    }

    // Zeichnen
    function drawLandlord(e) {
        if (!landlordDrawing) return;
        const rect = landlordCanvas.getBoundingClientRect();
        const x = e.clientX ? e.clientX : e.touches[0].clientX;
        const y = e.clientY ? e.clientY : e.touches[0].clientY;
        landlordCtx.lineTo(x - rect.left, y - rect.top);
        landlordCtx.stroke();
        e.preventDefault();
    }

    // Zeichnen beenden
    function stopLandlordDrawing() {
        landlordDrawing = false;
    }

    // Event Listeners für Canvas
    landlordCanvas.addEventListener('mousedown', startLandlordDrawing);
    landlordCanvas.addEventListener('mousemove', drawLandlord);
    landlordCanvas.addEventListener('mouseup', stopLandlordDrawing);
    landlordCanvas.addEventListener('mouseout', stopLandlordDrawing);
    landlordCanvas.addEventListener('touchstart', startLandlordDrawing);
    landlordCanvas.addEventListener('touchmove', drawLandlord);
    landlordCanvas.addEventListener('touchend', stopLandlordDrawing);

    // Löschen-Button
    document.getElementById('landlord-clear-signature').addEventListener('click', () => {
        landlordCtx.clearRect(0, 0, landlordCanvas.width, landlordCanvas.height);
    });
});









// Vereinfachte Modal Funktionalität
function initializeMenuModal() {
    const modal = document.getElementById('menuModal');
    const openButton = document.getElementById('openMenuModal');
    const closeButton = document.getElementById('closeMenuModal');

    // Modal öffnen
    openButton.addEventListener('click', function () {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    });

    // Modal schließen
    function closeModal() {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    closeButton.addEventListener('click', closeModal);

    // Modal schließen bei Klick außerhalb
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Modal schließen mit ESC-Taste
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });

    // Menu-Item-Buttons Event Listener - ERWEITERT
    const menuButtons = document.querySelectorAll('.menu-item-button');
    menuButtons.forEach(button => {
        button.addEventListener('click', function () {
            console.log(`Button clicked: ${this.id}`);

            // Spezifische Aktionen für jeden Button
            switch (this.id) {
                case 'savelocal':
                    if (window.promptSaveName) {
                        window.promptSaveName();
                    }
                    break;
                case 'loadlocal':
                    if (window.showSavedStates) {
                        window.showSavedStates();
                    }
                    break;
                case 'delete':
                    if (window.clearAllInputs) {
                        window.clearAllInputs();
                    }
                    break;
                case 'screenshot':
                    handlePDFCreation();
                    closeModal(); // Nur bei diesen Buttons Modal schließen
                    break;
                case 'mail':
                    handleEmailFunction();
                    closeModal();
                    break;
                case 'export':
                    handleExportFunction();
                    closeModal();
                    break;
                case 'import':
                    handleImportFunction();
                    closeModal();
                    break;
                default:
                    console.log(`Unbekannte Aktion: ${this.id}`);
                    closeModal();
                    break;
            }

            // Modal NICHT automatisch schließen für save/load/delete
            // (diese schließen sich selbst nach erfolgreicher Aktion)
        });
    });

    // Funktionen für die Buttons definieren
    function handlePDFCreation() {
        console.log('PDF wird erstellt...');
        // Hier deine PDF-Funktion implementieren
    }

    function handleEmailFunction() {
        console.log('E-Mail wird geöffnet...');

        // Prüfen ob die showEmailMenu Funktion verfügbar ist
        if (typeof showEmailMenu === 'function') {
            // Dateiname generieren (optional)
            const fileName = `Protokoll_${new Date().toLocaleDateString('de-DE').replace(/\./g, '_')}.pdf`;

            // E-Mail Menu aus email.js aufrufen
            showEmailMenu(fileName);
        } else {
            console.error('showEmailMenu Funktion nicht gefunden. Ist email.js geladen?');
            alert('E-Mail-Funktion nicht verfügbar. Bitte stellen Sie sicher, dass email.js geladen ist.');
        }
    }

    function handleExportFunction() {
        console.log('Export wird durchgeführt...');
        // Hier deine Export-Funktion implementieren

    }

    function handleImportFunction() {
        console.log('Import wird durchgeführt...');
        // Hier deine Import-Funktion implementieren

    }
}

// Load Button Event Listener reparieren
const loadBtn = document.getElementById('loadlocal');
if (loadBtn) {
    // Entferne alte Event Listener
    loadBtn.replaceWith(loadBtn.cloneNode(true));
    const newBtn = document.getElementById('loadlocal');

    // Neuen korrekten Event Listener hinzufügen
    newBtn.addEventListener('click', () => {
        console.log("Load button clicked");
        showSavedStates();
    });
}

// Modal initialisieren
document.addEventListener('DOMContentLoaded', initializeMenuModal);

// Load Button Event Listener Fix
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const loadBtn = document.getElementById('loadlocal');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                console.log("Load button clicked");
                showSavedStates();
            });
            console.log("✅ Load button event listener hinzugefügt");
        }
    }, 500); // Kurz warten bis DOM bereit ist
});


document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        const toggleOptions = document.querySelector('.room-toggle[data-room="nebenraum"] .toggle-options');
        if (toggleOptions) {
            // Setze aktive Option auf "Ja" (Index 1)
            toggleOptions.setAttribute('data-active-option', '1');

            // Aktualisiere die Klassen der Optionen
            const options = toggleOptions.querySelectorAll('.toggle-option');
            options.forEach((option, index) => {
                if (index === 1) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });

            // Zeige den Container an
            const container = document.getElementById('nebenraum-container');
            if (container) {
                container.style.display = 'block';
                container.style.animation = '0.3s ease-in-out fadeIn';
            }
        }
    }, 500); // 500ms Verzögerung


});

// Development Dropdown Funktionalität
function toggleDevelopmentDropdown() {
    const dropdown = document.getElementById('developmentDropdown');
    const toggle = document.querySelector('.development-toggle');
    
    if (dropdown && toggle) {
        if (dropdown.classList.contains('show')) {
            closeDevelopmentDropdown();
        } else {
            dropdown.classList.add('show');
            toggle.classList.add('active');
            
            // Schließen bei Klick außerhalb
            setTimeout(() => {
                document.addEventListener('click', handleOutsideClick);
            }, 10);
        }
    }
}

function closeDevelopmentDropdown() {
    const dropdown = document.getElementById('developmentDropdown');
    const toggle = document.querySelector('.development-toggle');
    
    if (dropdown && toggle) {
        dropdown.classList.remove('show');
        toggle.classList.remove('active');
        document.removeEventListener('click', handleOutsideClick);
    }
}

function handleOutsideClick(event) {
    const development = document.querySelector('.development');
    if (development && !development.contains(event.target)) {
        closeDevelopmentDropdown();
    }
}

// Development Dropdown ESC-Taste zum Schließen
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeDevelopmentDropdown();
    }
});