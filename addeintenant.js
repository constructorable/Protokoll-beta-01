document.addEventListener('DOMContentLoaded', function () {
    const tenantButton = document.getElementById('einzugtenant');
    const signatureContainer = document.getElementById('signtenant1');
    let tenantCounter = 1;
    let headersCreated = false;

    // Erstelle die Überschriften
    function createHeaders() {
        if (headersCreated) return;

        const headerContainer = document.createElement('div');
        headerContainer.className = 'tenant-headers';

        // Hauptüberschrift
        const mainHeader = document.createElement('h2');
        mainHeader.innerHTML = '<i class="fas fa-user"></i> einziehende Mieter';

        // Spaltenüberschriften
        const columnHeaders = document.createElement('div');
        columnHeaders.className = 'column-headers';

        const headers = ['', '', '', '', ''];
        headers.forEach(headerText => {
            const header = document.createElement('span');
            header.textContent = headerText;
            columnHeaders.appendChild(header);
        });

        headerContainer.appendChild(mainHeader);
        headerContainer.appendChild(columnHeaders);
        tenantButton.insertAdjacentElement('beforebegin', headerContainer);

        headersCreated = true;
    }

    // Funktion zum Erstellen eines neuen Mieter-Eintrags
    function createTenantEntry() {
         if (!document.querySelector('.tenant-headers')) {
        createHeaders();
    }

        tenantButton.classList.add('keybtnhide');
        tenantButton.style.backgroundColor = '#fff';
        tenantButton.style.color = '#888';
        tenantButton.style.fontSize = '2.5rem';
        tenantButton.style.marginTop = '-10px';
        tenantButton.style.marginBottom = '25px';
        tenantButton.textContent = '+';

        // Button-Text ändern, wenn noch nicht geschehen
        if (tenantButton.textContent.trim() === '+ einziehenden Mieter hinzufügen') {
            tenantButton.textContent = '+';
        }

        const tenantEntry = document.createElement('div');
        tenantEntry.className = 'tenant-entry';
        tenantEntry.id = `tenant-entry-${tenantCounter}`;

        // Name
        const nameCell = document.createElement('div');
        nameCell.className = 'tenant-name';
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = `tenant-name-${tenantCounter}`;
        nameInput.className = 'bemerkung-input';
        nameInput.placeholder = 'Nachname';
        nameCell.appendChild(nameInput);

        // Vorname
        const firstnameCell = document.createElement('div');
        firstnameCell.className = 'tenant-firstname';
        const firstnameInput = document.createElement('input');
        firstnameInput.type = 'text';
        firstnameInput.id = `tenant-firstname-${tenantCounter}`;
        firstnameInput.className = 'bemerkung-input';
        firstnameInput.placeholder = 'Vorname';
        firstnameCell.appendChild(firstnameInput);

        // Telefon
        const phoneCell = document.createElement('div');
        phoneCell.className = 'tenant-phone';
        const phoneInput = document.createElement('input');
        phoneInput.type = 'tel';
        phoneInput.id = `tenant-phone-${tenantCounter}`;
        phoneInput.className = 'bemerkung-input';
        phoneInput.placeholder = 'Telefonnummer';
        phoneCell.appendChild(phoneInput);

        // E-Mail
        const emailCell = document.createElement('div');
        emailCell.className = 'tenant-email';
        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.id = `tenant-email-${tenantCounter}`;
        emailInput.className = 'bemerkung-input';
        emailInput.placeholder = 'E-Mail-Adresse';
        emailCell.appendChild(emailInput);

        // Löschen-Button
        const deleteCell = document.createElement('div');
        deleteCell.className = 'tenant-delete';
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-tenant-btn';
        deleteBtn.id = `tenant-delete-btn-${tenantCounter}`;
        deleteBtn.dataset.tenantId = tenantCounter;
        deleteBtn.textContent = '×';
        deleteCell.appendChild(deleteBtn);

        // Alles zusammenfügen
        tenantEntry.appendChild(nameCell);
        tenantEntry.appendChild(firstnameCell);
        tenantEntry.appendChild(phoneCell);
        tenantEntry.appendChild(emailCell);
        tenantEntry.appendChild(deleteCell);

        // Einfügen in DOM
        tenantButton.insertAdjacentElement('beforebegin', tenantEntry);

        // Event Listener
        nameInput.addEventListener('change', updateSignatureName);
        firstnameInput.addEventListener('change', updateSignatureName);
        emailInput.addEventListener('input', validateEmail);

        deleteBtn.addEventListener('click', function () {
            if (confirm('Möchten Sie diesen Mieter wirklich löschen?')) {
                tenantEntry.remove();
                const signatureContainer = document.getElementById(`tenant-signature-container-${tenantCounter}`);
                if (signatureContainer) signatureContainer.remove();
            }
        });

        // Unterschriftenfeld erstellen
        createSignatureField(tenantCounter, '');

        tenantCounter++;
    }

    // CSS dynamisch hinzufügen
    const style = document.createElement('style');
    style.textContent = `
        .tenant-headers {
            margin-bottom: 10px;
        }
        
        .tenant-headers h2 {
            font-size: 1.4rem;
            margin: 0 0 5px 0;
            color: #fff;
        }
        
        .column-headers {
            display: grid;
            grid-template-columns: 2fr 2fr 1.5fr 2fr auto;
            gap: 10px;
            font-weight: bold;
            padding: 5px 0;
            
        }
        
        .tenant-entry {
            display: grid;
            grid-template-columns: 2fr 2fr 1.5fr 2fr auto;
            gap: 10px;
            padding: 1px 0;
            align-items: center;
            border-bottom: 2px solid #ccc;
        }
        
        .tenant-entry input {
            width: 100%;
            padding: 1px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }
        
        .delete-tenant-btn {
            background: none;
            border: none;
            color: #ff4444;
            font-size: 18px;
            cursor: pointer;
            padding: 0 8px;
        }
        
        .signature-block {
            margin-top: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .signature-block canvas {
            background-color: #f9f9f9;
        }
        
        /* Anpassung für zweispaltige Ansicht */
        @media (max-width: 2140px) {
            .column-headers {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-top: 10px;
            }
            
            .tenant-entry {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                grid-template-rows: repeat(2, auto);
                gap: 10px;
                margin-bottom: 15px;
                 border-bottom: 2px solid #ccc;
                position: relative;
            }
            
            /* Erstes Feld (Name) */
            .tenant-name {
                grid-column: 1;
                grid-row: 1;
            }
            
            /* Zweites Feld (Vorname) */
            .tenant-firstname {
                grid-column: 2;
                grid-row: 1;
            }
            
            /* Drittes Feld (Telefon) */
            .tenant-phone {
                grid-column: 1;
                grid-row: 2;
            }
            
            /* Viertes Feld (E-Mail) */
            .tenant-email {
                grid-column: 2;
                grid-row: 2;
            }
            
            /* Löschen-Button rechts neben dem Formular platzieren */
            .tenant-delete {
                position: absolute;
                left: 0px;
                top: 105px;
            }
        }
    `;
    document.head.appendChild(style);

    // Event Listener für den "Mieter hinzufügen"-Button
    tenantButton.addEventListener('click', createTenantEntry);

    // Funktion zur E-Mail-Validierung
    function validateEmail(e) {
        const emailInput = e.target;
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (email === '') {
            emailInput.style.border = '';
        } else if (!emailRegex.test(email)) {
            emailInput.style.border = '3px solid red';
        } else {
            emailInput.style.border = '1px solid #ddd';
        }
    }

    function updateSignatureName(e) {
        const tenantId = e.target.id.split('-')[2];
        const name = document.getElementById(`tenant-name-${tenantId}`).value;
        const firstname = document.getElementById(`tenant-firstname-${tenantId}`).value;

        const signatureName = document.getElementById(`tenant-signature-name-${tenantId}`);
        if (signatureName) {
            signatureName.textContent = `${firstname} ${name}`;
        }
    }

    function createSignatureField(tenantId, fullName) {
        const signatureContainer = document.createElement('div');
        signatureContainer.className = 'signature-block';
        signatureContainer.id = `tenant-signature-container-${tenantId}`;
        signatureContainer.innerHTML = `
            <canvas id="tenant-signature-canvas-${tenantId}" width="666" height="222" style="border:1px solid #000; touch-action: none;"></canvas>
            <p><strong>einziehender Mieter: <span class="signature-name" id="tenant-signature-name-${tenantId}">${fullName}</span></strong></p>
            <div>
                <button type="button" id="tenant-clear-signature-${tenantId}" class="delete-key-btn">x</button>
            </div>
        `;

        document.getElementById('signtenant1').appendChild(signatureContainer);

        // Canvas initialisieren
        const canvas = document.getElementById(`tenant-signature-canvas-${tenantId}`);
        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 7;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#373d41';

        let drawing = false;
        let lastX = 0;
        let lastY = 0;

        function startDrawing(e) {
            drawing = true;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX ? e.clientX : e.touches[0].clientX;
            const y = e.clientY ? e.clientY : e.touches[0].clientY;
            ctx.beginPath();
            ctx.moveTo(x - rect.left, y - rect.top);
            e.preventDefault();
        }

        function draw(e) {
            if (!drawing) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX ? e.clientX : e.touches[0].clientX;
            const y = e.clientY ? e.clientY : e.touches[0].clientY;
            ctx.lineTo(x - rect.left, y - rect.top);
            ctx.stroke();
            e.preventDefault();
        }

        function stopDrawing() {
            drawing = false;
        }

        // Event Listeners
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);
        canvas.addEventListener('touchstart', startDrawing);
        canvas.addEventListener('touchmove', draw);
        canvas.addEventListener('touchend', stopDrawing);

        // Löschen-Button
        document.getElementById(`tenant-clear-signature-${tenantId}`).addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
    }

    // Falls bereits ein Input-Feld existiert, füge Placeholder hinzu
    const initialTenantEntry = document.getElementById('tenant-entry-1');
    if (initialTenantEntry) {
        document.getElementById('tenant-name-1').placeholder = 'Nachname';
        document.getElementById('tenant-firstname-1').placeholder = 'Vorname';
        document.getElementById('tenant-phone-1').placeholder = 'Telefonnummer';
        document.getElementById('tenant-email-1').placeholder = 'E-Mail-Adresse';
    }
});