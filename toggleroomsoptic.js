/**
 * toggleroomsoptic.js
 * Visuelles Zu-/Aufklappen aller Räume ohne Änderung der Toggle-Werte
 * Für Tablet-optimierte Immobilienverwaltung
 */

document.addEventListener('DOMContentLoaded', function () {
  console.log('👁️ toggleroomsoptic.js geladen');
  
  // Globale Variablen
  let allRoomsCollapsed = false;
  let roomStates = new Map(); // Speichert ursprüngliche Zustände
  
  // CSS Animationen hinzufügen
  function addRoomToggleStyles() {
    if (document.getElementById('roomToggleStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'roomToggleStyles';
    style.textContent = `
      @keyframes fadeIn {
        from { 
          opacity: 0; 
          transform: translateY(-10px); 
          max-height: 0;
        }
        to { 
          opacity: 1; 
          transform: translateY(0); 
          max-height: 2000px;
        }
      }
      
      @keyframes fadeOut {
        from { 
          opacity: 1; 
          transform: translateY(0); 
          max-height: 2000px;
        }
        to { 
          opacity: 0; 
          transform: translateY(-10px); 
          max-height: 0;
        }
      }
      
      .room-container {
        transition: all 0.3s ease-in-out;
        overflow: hidden;
      }
      
      .room-container.collapsing {
        opacity: 0;
        transform: translateY(-10px);
        max-height: 0 !important;
      }
      
      .room-container.expanding {
        opacity: 1;
        transform: translateY(0);
        max-height: 2000px;
      }
    `;
    document.head.appendChild(style);
    console.log('🎨 CSS-Stile für Raum-Animationen hinzugefügt');
  }

  // Ursprüngliche Zustände der Räume erfassen
  function captureInitialRoomStates() {
    const roomToggles = document.querySelectorAll('.room-toggle');
    
    roomToggles.forEach(roomToggle => {
      const roomName = roomToggle.dataset.room;
      const container = document.getElementById(`${roomName}-container`);
      const toggleOptions = roomToggle.querySelector('.toggle-options');
      const activeOption = toggleOptions?.querySelector('.toggle-option.active');
      
      if (roomName && container) {
        const shouldBeVisible = activeOption?.dataset.value === 'ja';
        const currentlyVisible = container.style.display !== 'none';
        
        roomStates.set(roomName, {
          shouldBeVisible: shouldBeVisible,
          currentlyVisible: currentlyVisible,
          container: container,
          roomToggle: roomToggle
        });
      }
    });
    
    console.log(`📊 ${roomStates.size} Raum-Zustände erfasst:`, 
      Array.from(roomStates.entries()).map(([name, state]) => 
        `${name}: ${state.shouldBeVisible ? 'aktiv' : 'inaktiv'}`
      )
    );
  }

  // Alle Räume zuklappen (visuell)
  function collapseAllRooms() {
    console.log('🙈 Klappt alle Räume zu...');
    
    roomStates.forEach((state, roomName) => {
      const container = state.container;
      
      if (container && container.style.display !== 'none') {
        // Sanfte Animation
        container.classList.add('collapsing');
        
        setTimeout(() => {
          container.style.display = 'none';
          container.classList.remove('collapsing');
        }, 300);
      }
    });
    
    // Button-Status aktualisieren
    updateButtonState(true);
    allRoomsCollapsed = true;
  }

  // Alle Räume aufklappen (entsprechend Toggle-Status)
  function expandAllRooms() {
    console.log('👁️ Klappt Räume auf (entsprechend Toggle-Status)...');
    
    roomStates.forEach((state, roomName) => {
      const container = state.container;
      
      // Nur aufklappen wenn Toggle auf "ja" steht
      if (container && state.shouldBeVisible) {
        container.style.display = 'block';
        container.classList.add('expanding');
        
        setTimeout(() => {
          container.classList.remove('expanding');
        }, 300);
      }
    });
    
    // Button-Status aktualisieren
    updateButtonState(false);
    allRoomsCollapsed = false;
  }

  // Button-Darstellung aktualisieren
  function updateButtonState(collapsed) {
    const icon = document.getElementById('collapseAllIcon');
    const text = document.getElementById('collapseAllText');
    
    if (icon && text) {
      if (collapsed) {
        icon.className = 'fas fa-eye';
        text.textContent = 'Alle aufklappen';
      } else {
        icon.className = 'fas fa-eye-slash';
        text.textContent = 'Alle zuklappen';
      }
    }
  }

  // Hauptfunktion: Toggle zwischen zu-/aufklappen
  function toggleAllRooms() {
    // Aktuelle Zustände neu erfassen (falls sich Toggle-Werte geändert haben)
    captureInitialRoomStates();
    
    if (!allRoomsCollapsed) {
      collapseAllRooms();
    } else {
      expandAllRooms();
    }
  }

  // Bestimmte Räume ein-/ausblenden
  function toggleSpecificRooms(roomNames, show = true) {
    if (!Array.isArray(roomNames)) {
      roomNames = [roomNames];
    }
    
    roomNames.forEach(roomName => {
      const state = roomStates.get(roomName);
      
      if (state && state.container) {
        const container = state.container;
        
        if (show) {
          container.style.display = 'block';
          container.classList.add('expanding');
          setTimeout(() => container.classList.remove('expanding'), 300);
        } else {
          container.classList.add('collapsing');
          setTimeout(() => {
            container.style.display = 'none';
            container.classList.remove('collapsing');
          }, 300);
        }
      }
    });
    
    console.log(`🏠 Räume ${show ? 'eingeblendet' : 'ausgeblendet'}:`, roomNames);
  }

  // Aktuellen Status der Räume prüfen
  function checkCurrentRoomStates() {
    const states = [];
    
    roomStates.forEach((state, roomName) => {
      const isVisible = state.container.style.display !== 'none';
      states.push({
        room: roomName,
        shouldBeVisible: state.shouldBeVisible,
        currentlyVisible: isVisible,
        status: state.shouldBeVisible === isVisible ? '✅' : '⚠️'
      });
    });
    
    console.table(states);
    return states;
  }

  // Toggle-Änderungen überwachen (optional)
  function observeToggleChanges() {
    const toggleOptions = document.querySelectorAll('.toggle-options');
    
    toggleOptions.forEach(toggleOption => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'data-active-option') {
            console.log('🔄 Toggle-Änderung erkannt, aktualisiere Raum-Zustände...');
            captureInitialRoomStates();
          }
        });
      });
      
      observer.observe(toggleOption, {
        attributes: true,
        attributeFilter: ['data-active-option']
      });
    });
    
    console.log('👀 Toggle-Änderungen werden überwacht');
  }

  // Raum-Status zurücksetzen
  function resetRoomStates() {
    console.log('🔄 Setze Raum-Zustände zurück...');
    
    roomStates.forEach((state, roomName) => {
      const container = state.container;
      
      if (state.shouldBeVisible) {
        container.style.display = 'block';
      } else {
        container.style.display = 'none';
      }
      
      // Alle Animationsklassen entfernen
      container.classList.remove('collapsing', 'expanding');
    });
    
    allRoomsCollapsed = false;
    updateButtonState(false);
  }

  // Debug-Informationen
  function showDebugInfo() {
    console.log('🐛 === TOGGLE ROOMS DEBUG INFO ===');
    console.log('Alle Räume zugeklappt:', allRoomsCollapsed);
    console.log('Anzahl erfasster Räume:', roomStates.size);
    
    checkCurrentRoomStates();
    
    console.log('🐛 === DEBUG INFO ENDE ===');
  }

  // Initialisierung
  function init() {
    addRoomToggleStyles();
    
    // Warte kurz, bis alle DOM-Elemente geladen sind
    setTimeout(() => {
      captureInitialRoomStates();
      observeToggleChanges();
      
      console.log('✅ toggleroomsoptic.js initialisiert');
    }, 500);
  }

  // Auto-Start
  init();

  // Funktionen global verfügbar machen
  window.toggleAllRooms = toggleAllRooms;
  window.toggleSpecificRooms = toggleSpecificRooms;
  window.checkCurrentRoomStates = checkCurrentRoomStates;
  window.resetRoomStates = resetRoomStates;
  window.showRoomToggleDebugInfo = showDebugInfo;

  // Event-Listener für manuelle Initialisierung
  window.initRoomToggle = init;
});