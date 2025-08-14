document.addEventListener('DOMContentLoaded', function() {
    // Erweiterte Warnfunktion für beforeunload
    window.addEventListener('beforeunload', function(e) {
        if (shouldWarnUser()) {
            // Für maximale Browserkompatibilität
            const confirmationMessage = 'Sie haben nicht gespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?';
            
            // Für ältere Browser
            e.returnValue = confirmationMessage;
            
            // Für moderne Browser
            return confirmationMessage;
        }
    });

    // Verbesserte shouldWarnUser Funktion
    function shouldWarnUser() {
        // Prüfen auf hochgeladene Bilder
        const hasImages = document.querySelectorAll('.bilder-thumbnails .thumbnail').length > 0;
        
        // Erweiterte Prüfung auf Formulareingaben
        let hasTextInput = false;
        const inputsToCheck = [
            'input[type="text"]',
            'textarea',
            'input[type="email"]',
            'input[type="number"]',
            'input[type="date"]',
            'input[type="time"]',
            'select'
        ];
        
        inputsToCheck.forEach(selector => {
            document.querySelectorAll(selector).forEach(input => {
                if (input.value && input.value.trim() !== '') {
                    hasTextInput = true;
                }
            });
        });
        
        return hasImages || hasTextInput;
    }

    // Verbesserte Initialwarnung mit Zeitverzögerung
    function showInitialWarning() {
        if (!localStorage.getItem('dismissedPageWarning')) {
            // Kurze Verzögerung für bessere UX
            setTimeout(() => {
                const warning = confirm('Wichtiger Hinweis:\n\nBitte speichern Sie Ihre Daten regelmäßig, da nicht gespeicherte Änderungen beim Verlassen der Seite verloren gehen können.\n\nDiese Meldung erscheint nur einmal.');
                
                if (warning) {
                    localStorage.setItem('dismissedPageWarning', 'true');
                }
            }, 1000);
        }
    }

    // Erweiterung für Seitenneuladungen (auch F5/Ctrl+R)
    window.addEventListener('keydown', function(e) {
        // Erkennung von F5 oder Strg/Cmd + R
        if (e.key === 'F5' || (e.key.toLowerCase() === 'r' && (e.ctrlKey || e.metaKey))) {
            if (shouldWarnUser()) {
                if (!confirm('Sie haben nicht gespeicherte Änderungen. Möchten Sie die Seite wirklich neu laden?')) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    return false;
                }
            }
        }
    });

    // Initiale Warnung anzeigen
    showInitialWarning();

    // Mobile-spezifische Handhabung (optional)
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // Zusätzliche mobile-spezifische Logik kann hier eingefügt werden
        console.log('Mobile Gerät erkannt - Warnsystem aktiv');
    }
});