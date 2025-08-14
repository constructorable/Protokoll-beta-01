// colorselection.js - Farbauswahl mit Checkbox und Input
document.addEventListener('DOMContentLoaded', function () {
    
    // Alle Farb-Auswahl Container finden und initialisieren
    function initializeColorSelections() {
        const colorContainers = document.querySelectorAll('.color-selection-container');
        
        colorContainers.forEach(container => {
            const whiteCheckbox = container.querySelector('.white-checkbox');
            const colorInput = container.querySelector('.farbe-input');
            const whiteOption = container.querySelector('.white-color-option');
            
            if (whiteCheckbox && colorInput && whiteOption) {
                setupColorSelection(whiteCheckbox, colorInput, whiteOption);
            }
        });
    }
    
    // Einzelne Farbauswahl einrichten
    function setupColorSelection(whiteCheckbox, colorInput, whiteOption) {
        // Event Listener für Weiß-Checkbox
        whiteCheckbox.addEventListener('change', function() {
            handleWhiteCheckboxChange(whiteCheckbox, colorInput, whiteOption);
        });
        
        // Event Listener für Color-Input
        colorInput.addEventListener('input', function() {
            handleColorInputChange(whiteCheckbox, colorInput, whiteOption);
        });
        
        // Event Listener für Label-Klick
        whiteOption.addEventListener('click', function(e) {
            if (e.target !== whiteCheckbox) {
                whiteCheckbox.checked = !whiteCheckbox.checked;
                handleWhiteCheckboxChange(whiteCheckbox, colorInput, whiteOption);
            }
        });
        
        // Initialen Zustand setzen
        updateSelectionState(whiteCheckbox, colorInput, whiteOption);
    }
    
    // Weiß-Checkbox Änderung behandeln
    function handleWhiteCheckboxChange(whiteCheckbox, colorInput, whiteOption) {
        if (whiteCheckbox.checked) {
            // Weiß ausgewählt
            colorInput.value = '';
            colorInput.disabled = true;
            colorInput.placeholder = 'weiß ausgewählt';
            whiteOption.classList.add('selected');
        } else {
            // Weiß abgewählt
            colorInput.disabled = false;
            colorInput.placeholder = 'andere Farbe eingeben';
            whiteOption.classList.remove('selected');
            colorInput.focus();
        }
        
        // Change-Event für andere Listener triggern
        colorInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Color-Input Änderung behandeln
    function handleColorInputChange(whiteCheckbox, colorInput, whiteOption) {
        if (colorInput.value.trim() !== '') {
            // Text eingegeben - Weiß-Checkbox deaktivieren
            whiteCheckbox.checked = false;
            whiteOption.classList.remove('selected');
        }
        updateSelectionState(whiteCheckbox, colorInput, whiteOption);
    }
    
    // Auswahl-Status aktualisieren
    function updateSelectionState(whiteCheckbox, colorInput, whiteOption) {
        if (whiteCheckbox.checked) {
            whiteOption.classList.add('selected');
            colorInput.disabled = true;
            colorInput.placeholder = 'weiß ausgewählt';
        } else {
            whiteOption.classList.remove('selected');
            colorInput.disabled = false;
            colorInput.placeholder = 'andere Farbe eingeben';
        }
    }
    
    // Funktion um aktuellen Farbwert zu erhalten
    function getColorValue(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return '';
        
        const whiteCheckbox = container.querySelector('.white-checkbox');
        const colorInput = container.querySelector('.farbe-input');
        
        if (whiteCheckbox && whiteCheckbox.checked) {
            return 'weiß';
        } else if (colorInput && colorInput.value.trim()) {
            return colorInput.value.trim();
        }
        
        return '';
    }
    
    // Funktion um Farbwert zu setzen
    function setColorValue(containerId, value) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const whiteCheckbox = container.querySelector('.white-checkbox');
        const colorInput = container.querySelector('.farbe-input');
        const whiteOption = container.querySelector('.white-color-option');
        
        if (value.toLowerCase() === 'weiß') {
            whiteCheckbox.checked = true;
            colorInput.value = '';
        } else {
            whiteCheckbox.checked = false;
            colorInput.value = value;
        }
        
        updateSelectionState(whiteCheckbox, colorInput, whiteOption);
    }
    
    // Funktionen global verfügbar machen
    window.getColorValue = getColorValue;
    window.setColorValue = setColorValue;
    
    // Initialisierung starten
    initializeColorSelections();
});