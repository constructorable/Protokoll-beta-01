function adjustRoomNavigationPosition() {
    const stickyContainer = document.querySelector('.sticky');
    const roomNavigation = document.querySelector('.room-navigation');
    
    if (stickyContainer && roomNavigation) {
        // Höhe des sticky Containers messen
        const stickyHeight = stickyContainer.offsetHeight;
        
        // Top-Position der Room-Navigation anpassen
        roomNavigation.style.top = `${stickyHeight}px`;
        
        console.log(`Room Navigation Position angepasst: ${stickyHeight}px`);
    }
}

// Funktion für Scroll-Position Anpassung in scrollToSection
function scrollToSection(sectionId) {
    let targetElement = null;
    
    // Spezielle Behandlung für Räume mit room-toggle Struktur
    const roomMappings = {
        'kueche': '.room-toggle[data-room="kueche"] .toggle-header',
        'bad': '.room-toggle[data-room="bad"] .toggle-header', 
        'wc': '.room-toggle[data-room="wc"] .toggle-header',
        'flur': '.room-toggle[data-room="flur"] .toggle-header',
        'abstellraum': '.room-toggle[data-room="abstellraum"] .toggle-header',
        'nebenraum': '.room-toggle[data-room="nebenraum"] .toggle-header',
        'regelungen': 'th.header-regel',
        'unterschriften': '#sign th.header-further'
    };
    
    if (roomMappings[sectionId]) {
        targetElement = document.querySelector(roomMappings[sectionId]);
    } else {
        targetElement = document.getElementById(sectionId);
    }
    
    if (targetElement) {
        // Dynamische Offset-Berechnung basierend auf sticky Container Höhen
        const stickyContainer = document.querySelector('.sticky');
        const roomNavigation = document.querySelector('.room-navigation');
        
        let totalOffset = 20; // Basis-Offset
        
        if (stickyContainer) {
            totalOffset += stickyContainer.offsetHeight;
        }
        if (roomNavigation) {
            totalOffset += roomNavigation.offsetHeight;
        }
        
        const offsetTop = targetElement.getBoundingClientRect().top + window.pageYOffset - totalOffset;
        
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
        
        updateActiveButton(sectionId);
    } else {
        console.error(`Element nicht gefunden für: ${sectionId}`);
    }
}


// Event Listener für Fenstergrößenänderungen
window.addEventListener('resize', () => {
    adjustRoomNavigationPosition();
});

// Event Listener für Orientierungsänderungen (Tablets)
window.addEventListener('orientationchange', () => {
    setTimeout(adjustRoomNavigationPosition, 300);
});

function adjustButtonSizes() {
    const zimmerButtons = document.querySelectorAll('.zimmer-nav-btn');
    if (zimmerButtons.length === 0) return;

    zimmerButtons.forEach(btn => {
        btn.style.fontSize = '0.9rem';
        btn.style.padding = '8px 12px';
        btn.style.minHeight = '40px';
        btn.style.whiteSpace = 'nowrap';
        btn.style.overflow = 'hidden';
        btn.style.textOverflow = 'ellipsis';
    });
}

// Aktualisierte Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    updateZimmerNavigation();
    optimizeTabletNavigation();
    adjustRoomNavigationPosition(); // Position initial setzen
});

// Zusätzliche Anpassung nach dem vollständigen Laden
window.addEventListener('load', () => {
    setTimeout(() => {
        adjustRoomNavigationPosition();
    }, 500);
});

// Observer für Änderungen am sticky Container
const stickyObserver = new ResizeObserver(() => {
    adjustRoomNavigationPosition();
});

// Sticky Container beobachten
const stickyContainer = document.querySelector('.sticky');
if (stickyContainer) {
    stickyObserver.observe(stickyContainer);
}



function updateActiveButton(activeSectionId) {
    const buttons = document.querySelectorAll('.room-nav-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    const activeBtn = document.querySelector(`[onclick="scrollToSection('${activeSectionId}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// Dynamisch Zimmer-Buttons hinzufügen/entfernen basierend auf vorhandenen Zimmern
function updateZimmerNavigation() {
    const navContainer = document.querySelector('.room-nav-container');
    if (!navContainer) return;
    
    // Entferne alle bestehenden Zimmer-Buttons
    const existingZimmerBtns = navContainer.querySelectorAll('[onclick*="zimmer-container-"]');
    existingZimmerBtns.forEach(btn => btn.remove());
    
    // Finde alle tatsächlich vorhandenen Zimmer (durch zimmer-header erkennbar)
    const zimmerHeaders = document.querySelectorAll('.zimmer-header .zimmer-verfuegbar');
    const vorhandeneZimmer = [];
    
    zimmerHeaders.forEach(header => {
        const zimmerText = header.textContent.trim();
        const zimmerMatch = zimmerText.match(/Zimmer Nr\. (\d+)/);
        if (zimmerMatch) {
            const zimmerNr = parseInt(zimmerMatch[1]);
            vorhandeneZimmer.push(zimmerNr);
        }
    });
    
    // Sortiere Zimmer-Nummern aufsteigend
    vorhandeneZimmer.sort((a, b) => a - b);
    
    // Erstelle Buttons für vorhandene Zimmer
    const regelungenBtn = navContainer.querySelector('[onclick*="regelungen"]');
    
    vorhandeneZimmer.forEach(zimmerNr => {
        const zimmerBtn = document.createElement('button');
        zimmerBtn.className = 'room-nav-btn';
        zimmerBtn.setAttribute('onclick', `scrollToSection('zimmer-container-${zimmerNr}')`);
        zimmerBtn.innerHTML = `
            <i class="fas fa-bed"></i>
            Zimmer ${zimmerNr}
        `;
        
        // Vor dem "Regelungen" Button einfügen
        if (regelungenBtn) {
            navContainer.insertBefore(zimmerBtn, regelungenBtn);
        } else {
            // Fallback: vor "Bemerkungen" einfügen
            const bemerkungenBtn = navContainer.querySelector('[onclick*="weiterebemerkungen"]');
            if (bemerkungenBtn) {
                navContainer.insertBefore(zimmerBtn, bemerkungenBtn);
            } else {
                navContainer.appendChild(zimmerBtn);
            }
        }
    });
    
    // Dynamische Button-Größenanpassung
    setTimeout(adjustButtonSizes, 100);
}

// Verbessertes Scroll-Tracking für die verschiedenen Bereiche
function updateScrollTracking() {
    const sections = [
        { id: 'allgemein', element: document.getElementById('allgemein') },
        { id: 'kueche', element: document.querySelector('.room-toggle[data-room="kueche"]') },
        { id: 'bad', element: document.querySelector('.room-toggle[data-room="bad"]') },
        { id: 'wc', element: document.querySelector('.room-toggle[data-room="wc"]') },
        { id: 'flur', element: document.querySelector('.room-toggle[data-room="flur"]') },
        { id: 'abstellraum', element: document.querySelector('.room-toggle[data-room="abstellraum"]') },
        { id: 'nebenraum', element: document.querySelector('.room-toggle[data-room="nebenraum"]') },
        { id: 'regelungen', element: document.querySelector('th.header-regel') },  // Korrekte Selektor
        { id: 'weiterebemerkungen', element: document.getElementById('weiterebemerkungen') },
        { id: 'unterschriften', element: document.querySelector('#sign th.header-further') }  // Korrekte Selektor
    ];
    
    // Dynamisch vorhandene Zimmer hinzufügen
    const zimmerHeaders = document.querySelectorAll('.zimmer-header .zimmer-verfuegbar');
    zimmerHeaders.forEach(header => {
        const zimmerText = header.textContent.trim();
        const zimmerMatch = zimmerText.match(/Zimmer Nr\. (\d+)/);
        if (zimmerMatch) {
            const zimmerNr = parseInt(zimmerMatch[1]);
            const zimmerElement = document.getElementById(`zimmer-container-${zimmerNr}`);
            if (zimmerElement) {
                sections.push({
                    id: `zimmer-container-${zimmerNr}`,
                    element: zimmerElement
                });
            }
        }
    });
    
  let currentSection = 'allgemein';

sections.forEach(section => {
    if (section.element) {
        const rect = section.element.getBoundingClientRect();
        
        // Berechne dynamischen Offset wie in scrollToSection
        const stickyContainer = document.querySelector('.sticky');
        const roomNavigation = document.querySelector('.room-navigation');
        
        let detectionOffset = 20;
        if (stickyContainer) {
            detectionOffset += stickyContainer.offsetHeight;
        }
        if (roomNavigation) {
            detectionOffset += roomNavigation.offsetHeight;
        }
        
        if (rect.top <= detectionOffset && rect.bottom > detectionOffset) {
            currentSection = section.id;
        }
    }
});

updateActiveButton(currentSection);
}

// Event Listener für Scroll
window.addEventListener('scroll', updateScrollTracking);

// Observer für DOM-Änderungen (Zimmer hinzufügen/entfernen)
const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    
    mutations.forEach(mutation => {
        // Prüfe auf hinzugefügte/entfernte Zimmer
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && 
                    (node.classList?.contains('zimmer-verfuegbar') || 
                     node.querySelector?.('.zimmer-verfuegbar'))) {
                    shouldUpdate = true;
                }
            });
            
            mutation.removedNodes.forEach(node => {
                if (node.nodeType === 1 && 
                    (node.classList?.contains('zimmer-verfuegbar') || 
                     node.querySelector?.('.zimmer-verfuegbar'))) {
                    shouldUpdate = true;
                }
            });
        }
        
        // Prüfe auf Änderungen in Zimmer-Containern
        if (mutation.target?.id?.startsWith('zimmer-container-') ||
            mutation.target?.classList?.contains('zimmer-verfuegbar')) {
            shouldUpdate = true;
        }
    });
    
    if (shouldUpdate) {
        // Kleine Verzögerung für DOM-Updates
        setTimeout(updateZimmerNavigation, 100);
    }
});

// Überwache das gesamte Dokument für Zimmer-Änderungen
observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false
});

// Initial-Setup
document.addEventListener('DOMContentLoaded', () => {
    updateZimmerNavigation();
});

// Zusätzlicher Trigger für den Fall, dass Zimmer später geladen werden
window.addEventListener('load', () => {
    setTimeout(updateZimmerNavigation, 500);
});

// Optimierung für Tablet-Navigation
function optimizeTabletNavigation() {
    const navigation = document.querySelector('.room-navigation');
    const container = document.querySelector('.room-nav-container');
    
    if (!navigation || !container) return;
    
    // Touch-Optimierungen für Tablets
    container.addEventListener('touchstart', function(e) {
        // Verhindert versehentliches Scrollen beim Button-Touch
        if (e.target.classList.contains('room-nav-btn')) {
            e.stopPropagation();
        }
    }, { passive: true });
    
    // Responsives Verhalten bei Orientierungsänderung
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            // Neuberechnung der Button-Größen nach Orientierungsänderung
            const buttons = container.querySelectorAll('.room-nav-btn');
            buttons.forEach(btn => {
                btn.style.transition = 'none';
                setTimeout(() => {
                    btn.style.transition = 'all 0.3s ease';
                }, 100);
            });
        }, 300);
    });
}

// In das bestehende DOMContentLoaded Event einfügen:
document.addEventListener('DOMContentLoaded', () => {
    updateZimmerNavigation();
    optimizeTabletNavigation(); // Diese Zeile hinzufügen
});