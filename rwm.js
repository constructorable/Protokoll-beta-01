document.addEventListener('DOMContentLoaded', function() {
  // Verbesserte Version mit allen Funktionalitäten
  const setupRauchmelderCounter = (inputFeld, minusBtn, plusBtn) => {
    if (!inputFeld) return;

    // Entferne vorhandene Event-Listener zuerst (falls vorhanden)
    const cloneMinus = minusBtn.cloneNode(true);
    const clonePlus = plusBtn.cloneNode(true);
    minusBtn.parentNode.replaceChild(cloneMinus, minusBtn);
    plusBtn.parentNode.replaceChild(clonePlus, plusBtn);
    minusBtn = cloneMinus;
    plusBtn = clonePlus;

    // Hilfsfunktion für korrekte Werte
    const getValidValue = (val) => {
      const num = parseInt(val, 10);
      return isNaN(num) ? 0 : Math.max(0, Math.min(num, 9));
    };

    // Minus-Button
    minusBtn.addEventListener('click', () => {
      const current = getValidValue(inputFeld.value);
      inputFeld.value = current > 0 ? current - 1 : 0;
    });

    // Plus-Button (mit Auto-1 für leere Felder)
    plusBtn.addEventListener('click', () => {
      const current = getValidValue(inputFeld.value);
      inputFeld.value = inputFeld.value === "" ? 1 : Math.min(current + 1, 9);
    });

    // Manuelle Eingabe validieren
    inputFeld.addEventListener('change', () => {
      inputFeld.value = getValidValue(inputFeld.value);
    });
  };

  // Initialisierung für alle Inputs
  const initCounter = (id) => {
    const input = document.getElementById(id);
    if (!input) return;
    
    const container = input.closest('.number-input');
    if (!container) return;
    
    setupRauchmelderCounter(
      input,
      container.querySelector('.minus'),
      container.querySelector('.plus')
    );
  };

  // Nur EINMAL initialisieren
  initCounter('rauchmelder-anzahl');
  initCounter('rauchmelder-anzahlbad');
  initCounter('rauchmelder-anzahl2');
  initCounter('rauchmelder-anzahl3');
});