document.addEventListener('DOMContentLoaded', function () {
    const addKeyButton = document.getElementById('keysbtn');
    const keysContainer = document.getElementById('keys');
    let keyCounter = 1;
    let headersCreated = false; // Flag um zu prüfen ob Überschriften bereits erstellt wurden

    const keyTypes = [
        "Haustür",
        "Wohnungstür",
        "Haustür inkl. Wohnungstür",
        "Briefkasten",
        "Keller",
        "Dachboden",
        "Garage",
        "Doppelparkanlage",
        "Fahrradbereich",
        "Abstellraum",
        "Laden",
        "Büro",
        "Lagerraum",
        "Müllraum",
        "Sonstige"
    ];

    // Erstelle die Überschriften
    function createHeaders() {
        if (headersCreated) return;
        
        const headerContainer = document.createElement('div');
        headerContainer.className = 'key-headers';
        
        // Hauptüberschrift
        const mainHeader = document.createElement('h2');
        /* mainHeader.textContent = 'Schlüssel'; */

        mainHeader.innerHTML = '<i class="fas fa-key" aria-hidden="true"></i> Schlüssel';
        /* mainHeader.innerHTML = '<i class="fas fa-user"></i> ausziehende Mieter'; */
        
        
        headerContainer.appendChild(mainHeader);
        
        // Spaltenüberschriften im Grid-Layout
        const columnHeaders = document.createElement('div');
        columnHeaders.className = 'column-key-headers key-grid';
        
        const headers = ['Art', 'Anzahl', 'Bemerkung', ''];
        headers.forEach((headerText, index) => {
            const header = document.createElement('div');
            header.className = `grid-header grid-col-${index + 1}`;
            header.textContent = headerText;
            columnHeaders.appendChild(header);
        });
        
        headerContainer.appendChild(columnHeaders);
        addKeyButton.insertAdjacentElement('beforebegin', headerContainer);
        
        headersCreated = true;
    }

    // Funktion zur Steuerung der Zähler
    function setupNumberCounter(inputFeld, minusBtn, plusBtn) {
        minusBtn.addEventListener('click', () => {
            let value = parseInt(inputFeld.value);
            if (value > 0) {
                inputFeld.value = value - 1;
            }
        });

        plusBtn.addEventListener('click', () => {
            let value = parseInt(inputFeld.value);
            if (value < 9) {
                inputFeld.value = value + 1;
            }
        });

        inputFeld.addEventListener('change', () => {
            let value = parseInt(inputFeld.value);
            if (isNaN(value) || value < 0) {
                inputFeld.value = 0;
            } else if (value > 99) {
                inputFeld.value = 99;
            }
        });
    }

    // Funktion zum Erstellen eines neuen Schlüssel-Eintrags
function createKeyEntry() {
    // Header-Logik anpassen - statt headersCreated Variable
    if (!document.querySelector('.key-headers')) {
        const button = document.getElementById('keysbtn'); // Ihr Button (anpassen falls andere ID)
        const headerHTML = `
            <div class="key-headers">
                <h2><i class="fas fa-key"></i> Schlüssel</h2>
                <div class="column-key-headers key-grid">
                    <div class="grid-header grid-col-1">Art</div>
                    <div class="grid-header grid-col-2">Anzahl</div>
                    <div class="grid-header grid-col-3">Bemerkung</div>
                    <div class="grid-header grid-col-4"></div>
                </div>
            </div>
        `;
        button.insertAdjacentHTML('beforebegin', headerHTML);
    }

    // Rest der Funktion bleibt EXAKT gleich
    addKeyButton.classList.add('keybtnhide');
    addKeyButton.style.backgroundColor = '#fff';
    addKeyButton.style.color = '#888';
    addKeyButton.style.fontSize = '2.5rem';
    addKeyButton.style.marginTop = '-10px';
    addKeyButton.style.marginBottom = '25px';
    addKeyButton.textContent = '+';
    
    const keyEntry = document.createElement('div');
    keyEntry.className = 'key-entry key-grid';
    keyEntry.id = `key-entry-${keyCounter}`;
    
    const typeCell = document.createElement('div');
    typeCell.className = 'key-type grid-col-1';
    
    const typeSelect = document.createElement('select');
    typeSelect.id = `key-type-select-${keyCounter}`;
    typeSelect.required = true;
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '';
    typeSelect.appendChild(defaultOption);
    
    keyTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
    });
    
    const customContainer = document.createElement('div');
    customContainer.id = `key-custom-container-${keyCounter}`;
    customContainer.style.display = 'none';
    customContainer.style.marginTop = '5px';
    
    const customInput = document.createElement('input');
    customInput.type = 'text';
    customInput.id = `key-custom-type-${keyCounter}`;
    customInput.placeholder = 'Eingabe';
    customInput.className = 'no-spin';
    customContainer.appendChild(customInput);
    
    typeCell.appendChild(typeSelect);
    typeCell.appendChild(customContainer);
    
    const amountCell = document.createElement('div');
    amountCell.className = 'key-amount grid-col-2';
    
    const numberInput = document.createElement('div');
    numberInput.className = 'number-input';
    
    const minusBtn = document.createElement('button');
    minusBtn.type = 'button';
    minusBtn.className = 'number-btn minus';
    minusBtn.id = `key-minus-btn-${keyCounter}`;
    minusBtn.textContent = '-';
    
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.id = `key-amount-input-${keyCounter}`;
    amountInput.min = '0';
    amountInput.max = '99';
    amountInput.value = '0';
    amountInput.className = 'no-spin';
    
    const plusBtn = document.createElement('button');
    plusBtn.type = 'button';
    plusBtn.className = 'number-btn plus';
    plusBtn.id = `key-plus-btn-${keyCounter}`;
    plusBtn.textContent = '+';
    
    numberInput.appendChild(minusBtn);
    numberInput.appendChild(amountInput);
    numberInput.appendChild(plusBtn);
    amountCell.appendChild(numberInput);
    
    const noteCell = document.createElement('div');
    noteCell.className = 'key-note grid-col-3';
    const noteInput = document.createElement('input');
    noteInput.type = 'text';
    noteInput.id = `key-note-input-${keyCounter}`;
    noteInput.className = 'bemerkung-input';
    noteCell.appendChild(noteInput);
    
    const deleteCell = document.createElement('div');
    deleteCell.className = 'key-delete grid-col-4';
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-key-btn';
    deleteBtn.id = `key-delete-btn-${keyCounter}`;
    deleteBtn.dataset.keyId = keyCounter;
    deleteBtn.textContent = '×';
    deleteCell.appendChild(deleteBtn);
    
    keyEntry.appendChild(typeCell);
    keyEntry.appendChild(amountCell);
    keyEntry.appendChild(noteCell);
    keyEntry.appendChild(deleteCell);
    
    addKeyButton.insertAdjacentElement('beforebegin', keyEntry);
    
    typeSelect.addEventListener('change', function() {
        customContainer.style.display = this.value === "Sonstiger Schlüssel" ? "block" : "none";
    });
    
    setupNumberCounter(amountInput, minusBtn, plusBtn);
    
    deleteBtn.addEventListener('click', function() {
        if (confirm('Möchten Sie diesen Schlüssel wirklich löschen?')) {
            keyEntry.remove();
        }
    });
    
    keyCounter++;
}

    // CSS dynamisch hinzufügen
    const style = document.createElement('style');
    style.textContent = `
        .keys {
            width: 100%;
            font-family: Arial, sans-serif;
            margin: 20px 0;
        }
        
        /* Grid-Layout für Schlüsseleinträge */
        .key-grid {
            display: grid;
            grid-template-columns: 1.5fr 0.7fr 2.5fr auto;
            align-items: center;
            margin-bottom: 10px;
        }
        
        /* Spalten-Klassen für individuelle Anpassungen */
        .grid-col-1 {
            /* Art-Spalte */
        }
        
        .grid-col-2 {
            /* Anzahl-Spalte */
        }
        
        .grid-col-3 {
            /* Bemerkung-Spalte */
        }
        
        .grid-col-4 {
            /* Löschen-Spalte */
            justify-self: center;
        }
        
        .column-key-headers {
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        /* Styling für Eingabefelder */
        select, .bemerkung-input, .no-spin {
            width: 100%;
            padding: 5px;
            box-sizing: border-box;
        }
        
        .number-input {
            display: flex;
            align-items: center;
        }
        
        .number-btn {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 1px solid #ccc;
            background: #f5f5f5;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .number-input input {
            width: 40px;
            text-align: center;
            margin: 0 5px;
        }
        
        .delete-key-btn {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: none;
            background: #ff4d4d;
            color: white;
            font-size: 18px;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        #keysbtn {
            transition: background-color 0.3s ease, color 0.3s ease;
        }
    `;
    document.head.appendChild(style);

    // Event Listener für den "Schlüssel hinzufügen"-Button
    addKeyButton.addEventListener('click', createKeyEntry);

    // Funktion zum Sammeln aller Schlüsseldaten
    window.getAllKeysData = function() {
        const keysData = [];
        document.querySelectorAll('.key-entry').forEach(entry => {
            const id = entry.id.split('-')[2];
            const keyTypeSelect = document.getElementById(`key-type-select-${id}`);
            const keyType = keyTypeSelect.value === "Sonstiger Schlüssel"
                ? document.getElementById(`key-custom-type-${id}`).value
                : keyTypeSelect.value;
            const amount = document.getElementById(`key-amount-input-${id}`).value;
            const note = document.getElementById(`key-note-input-${id}`).value;

            if (keyType) {
                keysData.push({
                    id: id,
                    type: keyType,
                    amount: amount,
                    note: note
                });
            }
        });
        return keysData;
    };
});