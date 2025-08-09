// limittextfields.js - Text Input Field Character Limit Monitor für Bemerkungsfelder
// Überwacht alle .bemerkung-input Felder auf 80-Zeichen-Limit

class BemerkungTextLimitMonitor {
    constructor() {
        this.characterLimit = 80;
        this.warningThreshold = 75;
        this.monitoredFields = new Set();
        this.activeField = null;
        this.isInitialized = false;
        
        console.log('🚀 BemerkungTextLimitMonitor wird initialisiert...');
        
        // Warte bis DOM geladen ist
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    // Initialisierung nach DOM-Load
    initialize() {
        console.log('📋 Initialize gestartet');
        
        // WICHTIG: Modal sofort verstecken bei Initialisierung
        this.forceHideModal();
        
        this.setupModalEventListeners();
        this.initializeMonitoring();
        this.setupDynamicFieldObserver();
        
        this.isInitialized = true;
        console.log('✅ Initialize abgeschlossen');
    }

    // Modal zwangsweise verstecken
    forceHideModal() {
        const modal = document.getElementById('bemerkungLimitModal');
        if (modal) {
            console.log(`🔒 Modal gefunden - erzwinge Verstecken`);
            console.log(`Modal aktueller Display-Wert: "${modal.style.display}"`);
            console.log(`Modal computed Display-Wert: "${window.getComputedStyle(modal).display}"`);
            
            // Mehrere Methoden um sicherzustellen dass Modal versteckt ist
            modal.style.display = 'none !important';
            modal.style.visibility = 'hidden';
            modal.classList.remove('show');
            modal.setAttribute('style', 'display: none !important; visibility: hidden;');
            
            document.body.classList.remove('bemerkung-modal-open');
            
            console.log(`🔒 Modal versteckt - neuer Display-Wert: "${modal.style.display}"`);
        } else {
            console.error('❌ Modal Element "bemerkungLimitModal" nicht im HTML gefunden!');
        }
    }

    // Initialisierung für alle existierenden Bemerkungsfelder
    initializeMonitoring() {
        const bemerkungFields = document.querySelectorAll('.bemerkung-input');
        console.log(`🔍 Gefundene Bemerkungsfelder: ${bemerkungFields.length}`);
        
        bemerkungFields.forEach((field, index) => {
            const fieldValue = field.value || '';
            const fieldLength = fieldValue.length;
            
       
            
            // Warnmeldung wenn Feld bereits über Limit
            if (fieldLength > this.characterLimit) {
                console.warn(`⚠️⚠️⚠️ FELD BEREITS ÜBER LIMIT BEI INITIALISIERUNG!`);

            }
            
            this.addFieldMonitoring(field);
        });
        
        if (bemerkungFields.length === 0) {
            console.log('ℹ️ Keine Bemerkungsfelder gefunden - das ist normal wenn noch keine erstellt wurden');
        }
    }

    // Überwachung für ein Bemerkungsfeld hinzufügen
    addFieldMonitoring(inputField) {
        if (this.monitoredFields.has(inputField)) {
            console.log(`♻️ Feld bereits überwacht: ${inputField.id}`);
            return;
        }
        
        this.monitoredFields.add(inputField);
   
        
        // Event Listeners
        inputField.addEventListener('focus', (event) => this.handleFieldFocus(event));
        inputField.addEventListener('blur', (event) => this.handleFieldBlur(event));
        inputField.addEventListener('input', (event) => this.handleBemerkungInput(event));
        inputField.addEventListener('paste', (event) => this.handlePasteEvent(event));
        inputField.addEventListener('keydown', (event) => this.handleKeyDown(event));
    }

    // Focus Event Handler
    handleFieldFocus(event) {
        this.activeField = event.target;
        const fieldValue = event.target.value || '';
        
        console.log(`🎯 Feld fokussiert: ${event.target.id}`);
        console.log(`   - Wert: "${fieldValue}"`);
        console.log(`   - Länge: ${fieldValue.length} Zeichen`);
        
        // NUR Modal anzeigen wenn bereits über Limit UND das System initialisiert ist
        if (this.isInitialized && fieldValue.length > this.characterLimit) {
            console.warn(`🚨 FELD ÜBER LIMIT BEI FOCUS!`);
            console.warn(`   - Feld: ${event.target.id}`);
            console.warn(`   - Länge: ${fieldValue.length} Zeichen`);
            console.warn(`   - System initialisiert: ${this.isInitialized}`);
            console.warn(`   ➡️ ZEIGE MODAL AN`);
            this.showLimitExceededModal();
        } else {
            console.log(`✅ Feld OK bei Focus (${fieldValue.length} Zeichen)`);
        }
    }

    // Blur Event Handler
    handleFieldBlur(event) {
        console.log(`🔄 Feld verlassen: ${event.target.id}`);
        this.activeField = null;
        this.closeLimitModal();
    }

    // Input Event Handler für Bemerkungsfelder
    handleBemerkungInput(event) {
        const inputField = event.target;
        const currentLength = inputField.value.length;
        
        console.log(`⌨️ Input Event:`);
        console.log(`   - Feld: ${inputField.id}`);
        console.log(`   - Länge: ${currentLength}`);
        console.log(`   - Aktives Feld: ${this.activeField?.id || 'null'}`);
        console.log(`   - System initialisiert: ${this.isInitialized}`);
        
        // Nur verarbeiten wenn das Feld aktiv ist UND System initialisiert
        if (!this.isInitialized) {
            console.log(`❌ System noch nicht initialisiert - ignoriere Input`);
            return;
        }
        
        if (this.activeField !== inputField) {
            console.log(`❌ Feld nicht aktiv - ignoriere Input`);
            return;
        }
        
        if (currentLength > this.characterLimit) {
            console.warn(`🚨🚨🚨 LIMIT ÜBERSCHRITTEN DURCH EINGABE!`);
            console.warn(`   - Feld: ${inputField.id}`);
            console.warn(`   - Wert: "${inputField.value}"`);
            console.warn(`   - Länge: ${currentLength} (Limit: ${this.characterLimit})`);
            console.warn(`   ➡️ KÜRZE TEXT UND ZEIGE MODAL`);
            
            this.truncateFieldContent(inputField);
            this.showLimitExceededModal();
        } else if (currentLength >= this.warningThreshold) {
            console.log(`⚠️ Warnung: ${inputField.id} hat ${currentLength} Zeichen`);
            this.showWarningState(inputField);
        } else {
            console.log(`✅ OK: ${inputField.id} hat ${currentLength} Zeichen`);
            this.clearWarningState(inputField);
            this.closeLimitModal();
        }
    }

    // Paste Event Handler
    handlePasteEvent(event) {
        const inputField = event.target;
        
        if (!this.isInitialized || this.activeField !== inputField) {
            return;
        }
        
        const pastedText = (event.clipboardData || window.clipboardData).getData('text');
        const currentText = inputField.value;
        const selectionStart = inputField.selectionStart || 0;
        const selectionEnd = inputField.selectionEnd || 0;
        
        const beforeSelection = currentText.substring(0, selectionStart);
        const afterSelection = currentText.substring(selectionEnd);
        const resultingText = beforeSelection + pastedText + afterSelection;
        
        console.log(`📋 Paste Event:`);
        console.log(`   - Eingefügter Text: "${pastedText}"`);
        console.log(`   - Resultierende Länge: ${resultingText.length}`);
        
        if (resultingText.length > this.characterLimit) {
            console.warn(`🚨 PASTE WÜRDE LIMIT ÜBERSCHREITEN!`);
            event.preventDefault();
            this.showLimitExceededModal();
        }
    }

    // Keyboard Event Handler
    handleKeyDown(event) {
        const inputField = event.target;
        
        if (!this.isInitialized || this.activeField !== inputField) {
            return;
        }
        
        const currentLength = inputField.value.length;
        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter'];
        
        if (currentLength >= this.characterLimit && !allowedKeys.includes(event.key) && !event.ctrlKey && !event.metaKey) {
            console.warn(`🚨 TASTENDRUCK BLOCKIERT! Taste: ${event.key}, Länge: ${currentLength}`);
            event.preventDefault();
            this.showLimitExceededModal();
        }
    }

    // Feld-Inhalt kürzen
    truncateFieldContent(inputField) {
        const originalLength = inputField.value.length;
        if (originalLength > this.characterLimit) {
            const originalValue = inputField.value;
            inputField.value = inputField.value.substring(0, this.characterLimit);
            console.log(`✂️ Text gekürzt von ${originalLength} auf ${this.characterLimit} Zeichen`);
        }
    }

    // Warning State
    showWarningState(inputField) {
        inputField.classList.add('bemerkung-character-warning');
    }

    clearWarningState(inputField) {
        inputField.classList.remove('bemerkung-character-warning');
    }

    // Modal Event Listeners einrichten
    setupModalEventListeners() {
        const modal = document.getElementById('bemerkungLimitModal');
        const closeBtn = document.getElementById('bemerkungModalCloseBtn');
        const okBtn = document.getElementById('bemerkungModalOkBtn');
        
        console.log(`🔧 Modal Setup - Modal gefunden: ${!!modal}`);
        
        if (!modal) {
            console.error('❌❌❌ KRITISCHER FEHLER: Modal "bemerkungLimitModal" nicht gefunden!');
            console.error('Stellen Sie sicher, dass das Modal im HTML vorhanden ist!');
            return;
        }
        
        // Buttons prüfen
        if (!closeBtn) console.warn('⚠️ Close Button nicht gefunden');
        if (!okBtn) console.warn('⚠️ OK Button nicht gefunden');
        
        // Close Button
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                console.log('🔘 Close Button geklickt');
                e.preventDefault();
                e.stopPropagation();
                this.closeLimitModal();
            });
        }
        
        // OK Button  
        if (okBtn) {
            okBtn.addEventListener('click', (e) => {
                console.log('🔘 OK Button geklickt');
                e.preventDefault();
                e.stopPropagation();
                this.closeLimitModal();
            });
        }
        
        // Overlay Click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                console.log('🔘 Modal Overlay geklickt');
                this.closeLimitModal();
            }
        });
        
        // ESC-Taste
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                console.log('🔘 ESC-Taste gedrückt');
                this.closeLimitModal();
            }
        });
    }

    // Modal anzeigen
    showLimitExceededModal() {
        console.log(`📱📱📱 showLimitExceededModal aufgerufen`);
        console.log(`   - Aktives Feld: ${this.activeField?.id || 'KEIN AKTIVES FELD'}`);
        console.log(`   - System initialisiert: ${this.isInitialized}`);
        
        if (!this.isInitialized) {
            console.log(`❌ System noch nicht initialisiert - Modal wird NICHT angezeigt`);
            return;
        }
        
        if (!this.activeField) {
            console.log(`❌ Kein aktives Feld - Modal wird NICHT angezeigt`);
            return;
        }
        
        const modal = document.getElementById('bemerkungLimitModal');
        if (modal) {
            console.log(`✅ Zeige Modal an`);
            modal.style.display = 'flex';
            modal.style.visibility = 'visible';
            document.body.classList.add('bemerkung-modal-open');
        } else {
            console.error(`❌ Modal Element nicht gefunden!`);
        }
    }

    // Modal schließen
    closeLimitModal() {
        console.log(`🔒 closeLimitModal aufgerufen`);
        const modal = document.getElementById('bemerkungLimitModal');
        if (modal) {
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            document.body.classList.remove('bemerkung-modal-open');
            console.log(`✅ Modal geschlossen`);
        }
    }

    // Observer für dynamisch hinzugefügte Bemerkungsfelder
    setupDynamicFieldObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const newBemerkungFields = node.querySelectorAll ? 
                            node.querySelectorAll('.bemerkung-input') : [];
                        
                        newBemerkungFields.forEach(field => {
                            if (!this.monitoredFields.has(field)) {
                               
                                this.addFieldMonitoring(field);
                            }
                        });
                        
                        if (node.matches && node.matches('.bemerkung-input')) {
                            if (!this.monitoredFields.has(node)) {
                              
                                this.addFieldMonitoring(node);
                            }
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Cleanup
    destroy() {
        console.log('🧹 Cleanup durchgeführt');
        this.forceHideModal();
        this.monitoredFields.clear();
        this.activeField = null;
        this.isInitialized = false;
    }
}

// Globale Instanz erstellen
let bemerkungLimitMonitor;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        bemerkungLimitMonitor = new BemerkungTextLimitMonitor();
    });
} else {
    bemerkungLimitMonitor = new BemerkungTextLimitMonitor();
}