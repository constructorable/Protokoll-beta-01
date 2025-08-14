// Responsive Fix für schmale Bildschirme - Anti-Flicker Version
class ResponsiveFix {
    constructor() {
        this.minWidth = 800;
        this.hysteresis = 50; // Pufferzone um Zucken zu vermeiden
        this.isNarrowScreen = null; // null = uninitialized
        this.originalViewport = null;
        this.debounceTimer = null;
        this.isTransitioning = false;
        this.init();
    }

    init() {
        // Initial check ohne Animation
        this.checkScreenWidthInitial();
        
        // Debounced resize handler
        window.addEventListener('resize', (e) => {
            this.debouncedCheck();
        });
        
        // Orientierungsänderung mit längerer Verzögerung
        window.addEventListener('orientationchange', () => {
            this.isTransitioning = true;
            setTimeout(() => {
                this.checkScreenWidth();
                this.isTransitioning = false;
            }, 800); // Längere Verzögerung für Orientierungsänderung
        });
    }

    checkScreenWidthInitial() {
        const screenWidth = window.innerWidth;
        const shouldApplyFix = screenWidth < this.minWidth;

        if (shouldApplyFix) {
            this.isNarrowScreen = true;
            this.applyNarrowScreenFix(true); // true = initial load
        } else {
            this.isNarrowScreen = false;
        }
    }

    debouncedCheck() {
        if (this.isTransitioning) return;
        
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.checkScreenWidth();
        }, 500); // Längere Debounce-Zeit
    }

    checkScreenWidth() {
        if (this.isTransitioning) return;

        const screenWidth = window.innerWidth;
        
        // Hysterese-Logik um Zucken zu vermeiden
        let shouldApplyFix;
        
        if (this.isNarrowScreen === true) {
            // Wenn bereits im narrow mode, erst bei minWidth + hysteresis ausschalten
            shouldApplyFix = screenWidth < (this.minWidth + this.hysteresis);
        } else if (this.isNarrowScreen === false) {
            // Wenn nicht im narrow mode, erst bei minWidth - hysteresis einschalten
            shouldApplyFix = screenWidth < (this.minWidth - this.hysteresis);
        } else {
            // Initial state
            shouldApplyFix = screenWidth < this.minWidth;
        }

        // Nur ändern wenn sich der Zustand wirklich ändert
        if (shouldApplyFix !== this.isNarrowScreen) {
            console.log(`📱 Bildschirmbreite: ${screenWidth}px, Schwellenwert: ${this.minWidth}px, Applying fix: ${shouldApplyFix}`);
            
            if (shouldApplyFix) {
                this.applyNarrowScreenFix(false);
            } else {
                this.removeNarrowScreenFix();
            }
        }
    }

    applyNarrowScreenFix(isInitial = false) {
        if (this.isNarrowScreen === true && !isInitial) return; // Bereits angewendet
        
        console.log('📱 Wende Responsive Fix an');
        this.isNarrowScreen = true;

        // Smooth transition
        if (!isInitial) {
            document.body.style.transition = 'all 0.3s ease';
        }

        // CSS-Klasse hinzufügen
        document.body.classList.add('narrow-screen-fix');

        // Viewport nur beim ersten Mal anpassen
        if (!this.originalViewport) {
            this.adjustViewport();
        }

        // Tabellen und Container anpassen
        this.makeTablesResponsive();
        this.addResponsiveStyles();

        // Transition nach Animation entfernen
        if (!isInitial) {
            setTimeout(() => {
                document.body.style.transition = '';
            }, 300);
        }
    }

    removeNarrowScreenFix() {
        if (this.isNarrowScreen === false) return; // Bereits entfernt
        
        console.log('🖥️ Entferne Responsive Fix');
        this.isNarrowScreen = false;

        // Smooth transition
        document.body.style.transition = 'all 0.3s ease';
        
        document.body.classList.remove('narrow-screen-fix');
        this.removeScrollWrappers();

        // Transition entfernen
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    adjustViewport() {
        const currentViewport = document.querySelector('meta[name="viewport"]');
        if (currentViewport && !this.originalViewport) {
            this.originalViewport = currentViewport.content;
            currentViewport.content = 'width=device-width, initial-scale=0.79, maximum-scale=3.0, user-scalable=yes';
        }
    }

    makeTablesResponsive() {
        const tables = document.querySelectorAll('table:not(.table-scroll-wrapper table)');
        
        tables.forEach(table => {
            if (!table.closest('.table-scroll-wrapper')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'table-scroll-wrapper';
                
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            }
        });
    }

    addResponsiveStyles() {
        if (!document.getElementById('narrow-screen-styles')) {
            const style = document.createElement('style');
            style.id = 'narrow-screen-styles';
            style.textContent = `
                .narrow-screen-fix {
                    overflow-x: auto !important;
                    transition: none !important;
                }
                
                .narrow-screen-fix .container {
                    min-width: ${this.minWidth}px !important;
                    overflow-x: visible !important;
                    transition: none !important;
                }
                
                .table-scroll-wrapper {
                    overflow-x: auto !important;
                    overflow-y: visible !important;
                    -webkit-overflow-scrolling: touch !important;
                    margin: 5px 0 !important;
                    border: 1px solid #e0e0e0 !important;
                    border-radius: 6px !important;
                    background: #fafafa !important;
                    transition: none !important;
                }
                
                .table-scroll-wrapper table {
                    min-width: 100% !important;
                    margin: 0 !important;
                    transition: none !important;
                }
                
                .narrow-screen-fix .room-navigation {
                    overflow-x: auto !important;
                    -webkit-overflow-scrolling: touch !important;
                    transition: none !important;
                }
                
                .narrow-screen-fix .room-nav-container {
                    flex-wrap: nowrap !important;
                    min-width: max-content !important;
                    transition: none !important;
                }
                
                .narrow-screen-fix .sticky {
                    overflow-x: auto !important;
                    -webkit-overflow-scrolling: touch !important;
                    transition: none !important;
                }
                
                /* Subtile Scroll-Hinweise */
                .table-scroll-wrapper::before {
                    content: "↔" !important;
                    position: absolute !important;
                    right: 10px !important;
                    top: 10px !important;
                    background: rgba(0,0,0,0.1) !important;
                    color: #666 !important;
                    padding: 2px 6px !important;
                    border-radius: 3px !important;
                    font-size: 0.79rem !important;
                    z-index: 10 !important;
                }
                
                .table-scroll-wrapper {
                    position: relative !important;
                }
                
                /* Optimierte Scrollbars */
                .table-scroll-wrapper::-webkit-scrollbar {
                    height: 8px !important;
                }
                
                .table-scroll-wrapper::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.1) !important;
                    border-radius: 4px !important;
                }
                
                .table-scroll-wrapper::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.3) !important;
                    border-radius: 4px !important;
                }
                
                .table-scroll-wrapper::-webkit-scrollbar-thumb:hover {
                    background: rgba(0,0,0,0.5) !important;
                }
                
                /* Verhindert Layout-Shifts */
                .narrow-screen-fix * {
                    box-sizing: border-box !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    removeScrollWrappers() {
        const wrappers = document.querySelectorAll('.table-scroll-wrapper');
        wrappers.forEach(wrapper => {
            const table = wrapper.querySelector('table');
            if (table) {
                wrapper.parentNode.insertBefore(table, wrapper);
                wrapper.remove();
            }
        });

        const styles = document.getElementById('narrow-screen-styles');
        if (styles) {
            styles.remove();
        }
    }

    // Öffentliche Methoden
    refresh() {
        this.isTransitioning = true;
        setTimeout(() => {
            this.checkScreenWidth();
            this.isTransitioning = false;
        }, 100);
    }

    getStatus() {
        return {
            isNarrowScreen: this.isNarrowScreen,
            screenWidth: window.innerWidth,
            minWidth: this.minWidth,
            hysteresis: this.hysteresis,
            isTransitioning: this.isTransitioning
        };
    }

    // Manuelle Schwellenwert-Anpassung
    setThreshold(minWidth, hysteresis = 50) {
        this.minWidth = minWidth;
        this.hysteresis = hysteresis;
        this.refresh();
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    window.responsiveFix = new ResponsiveFix();
    console.log('📱 Anti-Flicker Responsive Fix initialisiert');
});

window.ResponsiveFix = ResponsiveFix;