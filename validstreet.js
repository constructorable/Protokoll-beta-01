// validstreet.js - Validierung für ausziehende Mieter Straßennamen
document.addEventListener('DOMContentLoaded', function () {
    
    // CSS-Styles dynamisch hinzufügen
    const streetValidationStyles = document.createElement('style');
    streetValidationStyles.id = 'street-validation-styles';
    streetValidationStyles.textContent = `
        /* Straßennamen-Bestätigungs-Modal */
        .street-confirmation-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1200;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        }

        .street-confirmation-modal.active {
            opacity: 1;
            pointer-events: auto;
        }

        .street-confirmation-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
        }

        .street-confirmation-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.9);
            background: white;
            border-radius: 8px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            transition: transform 0.3s ease;
        }

        .street-confirmation-modal.active .street-confirmation-content {
            transform: translate(-50%, -50%) scale(1);
        }

        .street-confirmation-header {
            padding: 1.5rem 1.5rem 0 1.5rem;
            border-bottom: 1px solid #e9ecef;
        }

        .street-confirmation-header h3 {
            margin: 0 0 1rem 0;
            font-size: 1.4rem;
            color: #335d92;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .street-confirmation-body {
            padding: 1.5rem;
        }

        .street-confirmation-body p {
            margin: 0 0 1rem 0;
            line-height: 1.5;
            color: #333;
        }

        .tenant-list {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 6px;
            margin: 1rem 0;
            border-left: 4px solid #d63384;
        }

        .street-confirmation-buttons {
            padding: 0 1.5rem 1.5rem 1.5rem;
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }

        .street-confirmation-buttons button {
            padding: 12px 20px;
            border: none;
            border-radius: 6px;
            font-size: 1rem;
            font-weight: 300;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .btn-cancel-street {
            background: #6c757d;
            color: white;
        }

        .btn-cancel-street:hover {
            background: #5a6268;
        }

        .btn-confirm-street {
            background: #335d92;
            color: white;
        }

        .btn-confirm-street:hover {
            background:rgb(50, 55, 93);
        }

        /* Highlight-Animation für Eingabefelder */
        .street-input-highlight {
            animation: streetFieldPulse 2s ease-in-out;
            border: 3px solid #d63384 !important;
            box-shadow: 0 0 10px rgba(214, 51, 132, 0.3) !important;
        }

        @keyframes streetFieldPulse {
            0% { 
                border-color: #d63384;
                box-shadow: 0 0 5px rgba(214, 51, 132, 0.3);
            }
            50% { 
                border-color: #b02a5b;
                box-shadow: 0 0 15px rgba(214, 51, 132, 0.6);
            }
            100% { 
                border-color: #d63384;
                box-shadow: 0 0 5px rgba(214, 51, 132, 0.3);
            }
        }

        /* Mobile Anpassungen */
        @media (max-width: 768px) {
            .street-confirmation-content {
                width: 95%;
                margin: 20px;
            }
            
            .street-confirmation-buttons {
                flex-direction: column;
            }
            
            .street-confirmation-buttons button {
                width: 100%;
                justify-content: center;
            }
        }
    `;
    document.head.appendChild(streetValidationStyles);

    // HTML-Template für das Modal
    function createStreetValidationModalHTML(tenantsWithoutStreet) {
        const tenantNames = tenantsWithoutStreet.map(t => t.name).join(', ');
        
        return `
            <div class="street-confirmation-modal">
                <div class="street-confirmation-overlay"></div>
                <div class="street-confirmation-content">
                    <div class="street-confirmation-header">
                        <h3><i class="fas fa-exclamation-triangle"></i> Fehlende Straßennamen</h3>
                    </div>
                    <div class="street-confirmation-body">
                        <p>Für folgende ausziehende Mieter wurde keine neue Straße eingegeben:</p>
                        <div class="tenant-list">
                            <strong>${tenantNames}</strong>
                        </div>
                        <p>Möchten Sie wirklich ohne Straßennamen fortfahren?</p>
                    </div>
                    <div class="street-confirmation-buttons">
                        <button class="btn-cancel-street" type="button">
                            <i class="fas fa-edit"></i> Straße eingeben
                        </button>
                        <button class="btn-confirm-street" type="button">
                            <i class="fas fa-check"></i> Ohne Straße fortfahren
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Smooth Scroll zu den Straßenfeldern mit Highlight
    function scrollToStreetFields(tenantsWithoutStreet) {
        if (tenantsWithoutStreet.length === 0) return;

        // Erstes Feld als Scroll-Ziel verwenden
        const firstStreetInput = tenantsWithoutStreet[0].streetInput;
        
        if (firstStreetInput) {
            // Zu dem ersten leeren Straßenfeld scrollen
            firstStreetInput.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });

            // Alle leeren Straßenfelder highlighten
            setTimeout(() => {
                tenantsWithoutStreet.forEach(tenant => {
                    if (tenant.streetInput) {
                        tenant.streetInput.classList.add('street-input-highlight');
                        
                        // Focus auf das erste Feld setzen
                        if (tenant === tenantsWithoutStreet[0]) {
                            tenant.streetInput.focus();
                        }
                        
                        // Highlight nach 3 Sekunden entfernen
                        setTimeout(() => {
                            tenant.streetInput.classList.remove('street-input-highlight');
                        }, 7000);
                    }
                });
            }, 500); // Kurze Verzögerung nach dem Scrollen
        }
    }

    // Hauptvalidierungsfunktion für ausziehende Mieter
    function validateMoveOutTenants() {
        return new Promise((resolve) => {
            const moveoutEntries = document.querySelectorAll('.moveout-entry');
            const tenantsWithoutStreet = [];
            
            moveoutEntries.forEach(entry => {
                const tenantId = entry.id.split('-')[2];
                const nameInput = document.getElementById(`moveout-name-${tenantId}`);
                const streetInput = document.getElementById(`moveout-firstname-${tenantId}`);
                
                // Prüfen ob Name ausgefüllt aber Straße leer ist
                if (nameInput && nameInput.value.trim() && 
                    streetInput && !streetInput.value.trim()) {
                    tenantsWithoutStreet.push({
                        id: tenantId,
                        name: nameInput.value.trim(),
                        streetInput: streetInput
                    });
                }
            });
            
            if (tenantsWithoutStreet.length > 0) {
                showStreetConfirmationModal(tenantsWithoutStreet, resolve);
            } else {
                resolve(true); // Keine Probleme gefunden
            }
        });
    }

    // Modal anzeigen und Event Handler einrichten
    function showStreetConfirmationModal(tenantsWithoutStreet, callback) {
        // Bestehende Modals entfernen
        const existingModal = document.querySelector('.street-confirmation-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Modal HTML erstellen und einfügen
        const modalHTML = createStreetValidationModalHTML(tenantsWithoutStreet);
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.querySelector('.street-confirmation-modal');
        const overlay = modal.querySelector('.street-confirmation-overlay');
        const cancelButton = modal.querySelector('.btn-cancel-street');
        const confirmButton = modal.querySelector('.btn-confirm-street');
        
        // Animation einblenden
        setTimeout(() => modal.classList.add('active'), 10);
        
        // Cleanup-Funktion
        const cleanupModal = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                if (modal.parentNode) {
                    document.body.removeChild(modal);
                }
            }, 300);
        };
        
        // Event Handler für "Straße eingeben" Button - MIT SCROLL-FUNKTIONALITÄT
        const handleCancelAction = () => {
            cleanupModal();
            
            // Nach dem Schließen des Modals zu den Feldern scrollen
            setTimeout(() => {
                scrollToStreetFields(tenantsWithoutStreet);
            }, 400); // Warten bis Modal-Animation beendet ist
            
            callback(false); // PDF-Erstellung abbrechen
        };
        
        // Event Handler für "Ohne Straße fortfahren" Button
        const handleConfirmAction = () => {
            cleanupModal();
            callback(true); // PDF-Erstellung fortsetzen
        };
        
        // Event Listener einrichten
        cancelButton.addEventListener('click', handleCancelAction);
        confirmButton.addEventListener('click', handleConfirmAction);
        
        // Modal schließen bei Overlay-Klick
        overlay.addEventListener('click', handleCancelAction);
        
        // ESC-Taste Handler
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                handleCancelAction();
                document.removeEventListener('keydown', handleEscapeKey);
            }
        };
        document.addEventListener('keydown', handleEscapeKey);
    }

    // Funktion global verfügbar machen
    window.validateMoveOutTenants = validateMoveOutTenants;
});