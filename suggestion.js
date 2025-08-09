document.addEventListener('DOMContentLoaded', function () {
    // Erweiterte Vorschlagsliste
    const zimmerVorschlaege = [
        'links', 'rechts', 'hinten', 'vorne', 'mitte',
        'links (hofseitig)', 'rechts (hofseitig)',
        'vorne (hofseitig)', 'hinten (hofseitig)', 'mitte (hofseitig)',
        'links (straßenseitig)', 'rechts (straßenseitig)',
        'vorne (straßenseitig)', 'hinten (straßenseitig)', 'mitte (straßenseitig)',
        'straßenseitig', 'hofseitig',
        'Wohnzimmer', 'Arbeitszimmer', 'Kinderzimmer',
        'Schlafzimmer', 'Abstellraum', 'Esszimmer', 'Hobbyraum'
    ];

    // Set für bereits initialisierte Inputs (verhindert doppelte Event Listener)
    const initializedInputs = new Set();

    // Debounce-Funktion um Performance zu verbessern
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Hauptfunktion für Autovervollständigung
    function initAutocomplete() {
        // Finde alle relevanten Input-Felder (erweitert für alle lageinput-Felder)
        const inputs = document.querySelectorAll('input[id^="lageinput"]');
        
        inputs.forEach(input => {
            // Überspringe bereits initialisierte Inputs
            if (initializedInputs.has(input.id)) {
                return;
            }

            const id = input.id;
            let container = null;

            // Bestimme Container basierend auf Input-ID
            if (id.startsWith('lageinputzimm')) {
                const zimmerNr = id.replace('lageinputzimm', '');
                container = document.getElementById(`lagecontainerzimm${zimmerNr}`);
            } else if (id === 'lageinputabstell') {
                container = document.getElementById('lagecontainerabstell');
            } else {
                // Fallback: ersetze lageinput mit lagecontainer
                const containerId = id.replace('lageinput', 'lagecontainer');
                container = document.getElementById(containerId);
            }

            if (!container) {
                console.warn(`Container für ${id} nicht gefunden`);
                return;
            }

            // Markiere als initialisiert
            initializedInputs.add(input.id);

            // Debounced Input Handler für bessere Performance
            const debouncedHandler = debounce(function(value) {
                const normalizedValue = value.toLowerCase();
                container.innerHTML = '';
                
                if (normalizedValue.length === 0) {
                    container.style.display = 'none';
                    return;
                }
                
                // Filtere Vorschläge (limitiert auf 10 für Performance)
                const suggestions = zimmerVorschlaege
                    .filter(item => item.toLowerCase().includes(normalizedValue))
                    .slice(0, 10);
                
                if (suggestions.length === 0) {
                    container.style.display = 'none';
                    return;
                }
                
                // Erstelle Vorschlags-Elemente mit Document Fragment (Performance)
                const fragment = document.createDocumentFragment();
                suggestions.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'suggestion-item';
                    div.textContent = item;
                    
                    // Verwende mousedown statt click für besseres Timing
                    div.addEventListener('mousedown', (e) => {
                        e.preventDefault(); // Verhindert blur-Event
                        input.value = item;
                        container.style.display = 'none';
                    });
                    
                    fragment.appendChild(div);
                });
                container.appendChild(fragment);
                
                // Positioniere und zeige die Liste
                container.style.width = `${input.offsetWidth}px`;
                container.style.top = `${input.offsetTop + input.offsetHeight}px`;
                container.style.left = `${input.offsetLeft}px`;
                container.style.display = 'contents'; // Geändert von 'contents' zu 'block'
            }, 150);

            // Input-Event Listener mit Debounce
            input.addEventListener('input', function () {
                debouncedHandler(this.value);
            });

            // Blur-Event mit Verzögerung für mousedown-Events
            input.addEventListener('blur', function() {
                setTimeout(() => {
                    container.style.display = 'none';
                }, 200);
            });
        });
    }

    // Globaler Click-Handler (nur einmal registrieren)
    let globalClickHandlerAdded = false;
    function addGlobalClickHandler() {
        if (globalClickHandlerAdded) return;
        
        document.addEventListener('click', function (e) {
            // Verstecke alle Container wenn außerhalb geklickt wird
            const allContainers = document.querySelectorAll('[id^="lagecontainer"]');
            allContainers.forEach(container => {
                let inputId = '';
                const containerId = container.id;
                
                if (containerId.startsWith('lagecontainerzimm')) {
                    const zimmerNr = containerId.replace('lagecontainerzimm', '');
                    inputId = `lageinputzimm${zimmerNr}`;
                } else if (containerId === 'lagecontainerabstell') {
                    inputId = 'lageinputabstell';
                } else {
                    inputId = containerId.replace('lagecontainer', 'lageinput');
                }
                
                const input = document.getElementById(inputId);
                if (input && e.target !== input && !container.contains(e.target)) {
                    container.style.display = 'none';
                }
            });
        });
        
        globalClickHandlerAdded = true;
    }

    // Initialisierung
    initAutocomplete();
    addGlobalClickHandler();

    // Optimierter MutationObserver (verhindert Endlosschleifen)
    const observer = new MutationObserver(debounce(function (mutations) {
        let shouldReinit = false;
        
        mutations.forEach(function (mutation) {
            // Prüfe nur auf hinzugefügte Input-Nodes
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Direkt ein Input-Element
                        if (node.matches && node.matches('input[id^="lageinput"]')) {
                            shouldReinit = true;
                        }
                        // Oder Container mit Input-Elementen
                        else if (node.querySelectorAll) {
                            const newInputs = node.querySelectorAll('input[id^="lageinput"]');
                            if (newInputs.length > 0) {
                                shouldReinit = true;
                            }
                        }
                    }
                });
            }
        });
        
        if (shouldReinit) {
            console.log('Neue Input-Felder erkannt, initialisiere Autocomplete...');
            initAutocomplete();
        }
    }, 200)); // Längere Debounce-Zeit für Observer

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Cleanup bei Page Unload
    window.addEventListener('beforeunload', function() {
        observer.disconnect();
        initializedInputs.clear();
    });
});