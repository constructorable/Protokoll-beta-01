document.addEventListener('DOMContentLoaded', function () {
    const addZaehlerBtn = document.getElementById('addzaehlerbtn');
    const zaehlerContainer = document.getElementById('addzaehler');
    let zaehlerCounter = 1;
    let headersCreated = false;

    const zaehlerTypes = [
        "Stromzähler",
        "Gaszähler",
        "Wärmezähler",
        "Wasserzähler (kalt)",
        "Wasserzähler (warm)",
        "Heizkostenverteiler",
        "Fernwärmezähler",
        "Sonstiger Zähler"
    ];

    // Erstelle die Überschriften
    function createHeaders() {
        if (headersCreated) return;

        const headerContainer = document.createElement('div');
        headerContainer.className = 'zaehler-headers';

        // Hauptüberschrift
        const mainHeader = document.createElement('h2');
        mainHeader.innerHTML = '<i class="fas fa-tachometer-alt"></i> Zähler';



        // Spaltenüberschriften
        const columnHeaders = document.createElement('div');
        columnHeaders.className = 'column-zaehler-headers';

        const headers = ['Typ', 'Zählernummer', 'Einbaulage / Bemerkung', 'Zählerstand', ''];
        headers.forEach(headerText => {
            const header = document.createElement('span');
            header.textContent = headerText;
            columnHeaders.appendChild(header);
        });

        headerContainer.appendChild(mainHeader);
        headerContainer.appendChild(columnHeaders);
        addZaehlerBtn.insertAdjacentElement('beforebegin', headerContainer);

        headersCreated = true;
    }

    // Funktion zum Erstellen eines neuen Zähler-Eintrags
function createZaehlerEntry() {
   // Header-Logik anpassen - statt headersCreated Variable
   if (!document.querySelector('.zaehler-headers')) {
       const button = document.getElementById('addzaehlerbtn'); // Ihr Button (anpassen falls andere ID)
       const headerHTML = `
       <div class="zaehler-headers">
           <h2><i class="fas fa-tachometer-alt"></i> Zähler</h2>
           <div class="column-zaehler-headers">
               <span>Typ</span>
               <span>Zählernummer</span>
               <span>Einbaulage / Bemerkung</span>
               <span>Zählerstand</span>
               <span></span>
           </div>
       </div>
   `;
       button.insertAdjacentHTML('beforebegin', headerHTML);
   }

   // Rest der Funktion bleibt EXAKT gleich
   addZaehlerBtn.classList.add('keybtnhide');
   addZaehlerBtn.style.backgroundColor = '#fff';
   addZaehlerBtn.style.color = '#888';
   addZaehlerBtn.style.fontSize = '2.5rem';
   addZaehlerBtn.style.marginTop = '-10px';
   addZaehlerBtn.style.marginBottom = '25px';
   addZaehlerBtn.textContent = '+';

   if (addZaehlerBtn.textContent.trim() === '+ Zähler hinzufügen') {
       addZaehlerBtn.textContent = '+';
       addZaehlerBtn.classList.add('zaehleraddhide');
   }

   const zaehlerEntry = document.createElement('div');
   zaehlerEntry.className = 'zaehler-entry';
   zaehlerEntry.id = `zaehler-entry-${zaehlerCounter}`;

   const typeCell = document.createElement('div');
   typeCell.className = 'zaehler-type';

   const typeSelect = document.createElement('select');
   typeSelect.id = `zaehler-type-select-${zaehlerCounter}`;
   typeSelect.required = true;

   const defaultOption = document.createElement('option');
   defaultOption.value = '';
   defaultOption.textContent = '';
   typeSelect.appendChild(defaultOption);

   zaehlerTypes.forEach(type => {
       if (type !== "Sonstiger Zähler") {
           const option = document.createElement('option');
           option.value = type;
           option.textContent = type;
           typeSelect.appendChild(option);
       }
   });

   const customOption = document.createElement('option');
   customOption.value = "custom";
   customOption.textContent = "Sonstiger Zähler";
   typeSelect.appendChild(customOption);

   const customContainer = document.createElement('div');
   customContainer.id = `zaehler-custom-container-${zaehlerCounter}`;
   customContainer.style.display = 'none';
   customContainer.style.marginTop = '5px';

   const customInput = document.createElement('input');
   customInput.type = 'text';
   customInput.id = `zaehler-custom-type-${zaehlerCounter}`;
   customInput.placeholder = 'Zählertyp eingeben';
   customContainer.appendChild(customInput);

   typeCell.appendChild(typeSelect);
   typeCell.appendChild(customContainer);

   const numberCell = document.createElement('div');
   numberCell.className = 'zaehler-number';
   const numberInput = document.createElement('input');
   numberInput.type = 'text';
   numberInput.id = `zaehler-number-input-${zaehlerCounter}`;
   numberInput.required = true;
   numberCell.appendChild(numberInput);

   const locationCell = document.createElement('div');
   locationCell.className = 'zaehler-location';
   const locationInput = document.createElement('input');
   locationInput.type = 'text';
   locationInput.id = `zaehler-location-input-${zaehlerCounter}`;
   locationInput.required = true;
   locationCell.appendChild(locationInput);

   const valueCell = document.createElement('div');
   valueCell.className = 'zaehler-value';
   const valueInput = document.createElement('input');
   valueInput.type = 'text';
   valueInput.id = `zaehler-value-input-${zaehlerCounter}`;
   valueInput.maxLength = 14;
   valueInput.required = true;
   valueCell.appendChild(valueInput);

   // NEU: 14-Zeichen-Warnung
   valueInput.addEventListener('input', function() {
       if (this.value.length >= 14) {
           showZaehlerWarning();
       }
   });

   // NEU: Warnung bei Paste-Events
   valueInput.addEventListener('paste', function(e) {
       setTimeout(() => {
           if (this.value.length >= 14) {
               showZaehlerWarning();
           }
       }, 10);
   });

   const deleteCell = document.createElement('div');
   deleteCell.className = 'zaehler-delete';
   const deleteBtn = document.createElement('button');
   deleteBtn.type = 'button';
   deleteBtn.className = 'delete-zaehler-btn';
   deleteBtn.id = `zaehler-delete-btn-${zaehlerCounter}`;
   deleteBtn.dataset.zaehlerId = zaehlerCounter;
   deleteBtn.textContent = '×';
   deleteCell.appendChild(deleteBtn);

   zaehlerEntry.appendChild(typeCell);
   zaehlerEntry.appendChild(numberCell);
   zaehlerEntry.appendChild(locationCell);
   zaehlerEntry.appendChild(valueCell);
   zaehlerEntry.appendChild(deleteCell);

   addZaehlerBtn.insertAdjacentElement('beforebegin', zaehlerEntry);

   typeSelect.addEventListener('change', function () {
       customContainer.style.display = this.value === "custom" ? "block" : "none";
   });

   deleteBtn.addEventListener('click', function () {
       if (confirm('Möchten Sie diesen Zähler wirklich löschen?')) {
           zaehlerEntry.remove();
       }
   });

   zaehlerCounter++;
}

// NEU: Warnung für 14-Zeichen-Limit (Weiß & gedecktes Blau Design)
function showZaehlerWarning() {
    // Verhindere mehrfache Anzeige
    if (document.querySelector('.zaehler-warning-modal')) return;
    
    const modal = document.createElement('div');
    modal.className = 'zaehler-warning-modal';
    modal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0,0,0,0.7) !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        z-index: 99999 !important;
        padding: 20px !important;
        box-sizing: border-box !important;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white !important;
            border-radius: 12px !important;
            padding: 30px !important;
            max-width: 400px !important;
            width: 100% !important;
            text-align: center !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important;
            border-top: 4px solid #4a6fa5 !important;
        ">
            <div style="font-size: 3rem !important; color: #4a6fa5 !important; margin-bottom: 15px !important;"></div>
            <h3 style="margin: 0 0 15px 0 !important; color: #2c3e50 !important; font-size: 1.3rem !important;">
                Maximale Zeichenanzahl erreicht
            </h3>
            <p style="margin: 0 0 25px 0 !important; color: #5a6c7d !important; line-height: 1.4 !important;">
                Der Zählerstand ist auf <strong>14 Zeichen</strong> begrenzt.<br>
               
            </p>
            <button id="zaehler-warning-ok" style="
                background: #4a6fa5 !important;
                color: white !important;
                border: none !important;
                padding: 12px 25px !important;
                border-radius: 6px !important;
                cursor: pointer !important;
                font-size: 1rem !important;
                font-weight: 500 !important;
                transition: background-color 0.2s ease !important;
            " onmouseover="this.style.backgroundColor='#3d5a8c'" onmouseout="this.style.backgroundColor='#4a6fa5'">OK</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event Listener für OK-Button
    document.getElementById('zaehler-warning-ok').addEventListener('click', () => {
        modal.remove();
    });
    
    // Schließen bei Klick außerhalb
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Auto-Schließen nach 4 Sekunden
    setTimeout(() => {
        if (document.body.contains(modal)) {
            modal.remove();
        }
    }, 8000);
}
    // CSS dynamisch hinzufügen
    const style = document.createElement('style');
    style.textContent = `
        .addzaehler {
            width: 100%;
            font-family: Arial, sans-serif;
            margin: 20px 0;
        }
        
        .zaehler-headers {
            margin-bottom: 10px;
        }
        
        .zaehler-headers h2 {
            font-size: 1.4rem;
            margin: 0 0 5px 0;
            color: #333;
        }
        
        .column-zaehler-headers {
            display: grid;
            grid-template-columns: 1.3fr 1.3fr 1.3fr .8fr;
            gap: 10px;
            font-weight: bold;
            padding: 5px 0;
           
        }
        
        .zaehler-entry {
            display: grid;
            grid-template-columns: 1.8fr 1.8fr 2.2fr 1.2fr auto;
            gap: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
            align-items: center;
        }
        
        select, input[type="text"], input[type="number"] {
            width: 100%;
            padding: 6px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }
        
        .delete-zaehler-btn {
            background: none;
            border: none;
            color: #ff4444;
            font-size: 18px;
            cursor: pointer;
            padding: 0 8px;
        }
        
        #addzaehlerbtn {
            margin-top: 10px;
            padding: 8px 15px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);

    // Event Listener für den "Zähler hinzufügen"-Button
    addZaehlerBtn.addEventListener('click', createZaehlerEntry);

    // Funktion zum Sammeln aller Zählerdaten
    window.getAllZaehlerData = function () {
        const zaehlerData = [];
        document.querySelectorAll('.zaehler-entry').forEach(entry => {
            const id = entry.id.split('-')[2];
            const typeSelect = document.getElementById(`zaehler-type-select-${id}`);
            const type = typeSelect.value === "custom"
                ? document.getElementById(`zaehler-custom-type-${id}`).value
                : typeSelect.value;
            const number = document.getElementById(`zaehler-number-input-${id}`).value;
            const location = document.getElementById(`zaehler-location-input-${id}`).value;
            const value = document.getElementById(`zaehler-value-input-${id}`).value;

            if (type && number && location && value) {
                zaehlerData.push({
                    id: id,
                    type: type,
                    number: number,
                    location: location,
                    value: value
                });
            }
        });
        return zaehlerData;
    };
});