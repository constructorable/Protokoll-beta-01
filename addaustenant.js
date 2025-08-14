document.addEventListener('DOMContentLoaded', function () {
    const moveOutButton = document.getElementById('auszugtenant');
    const signatureContainer = document.getElementById('signtenant1');
    let moveOutTenantCounter = 1;
    let headersCreated = false;

    // Erstelle die Überschriften
    function createHeaders() {
        if (headersCreated) return;

        const headerContainer = document.createElement('div');
        headerContainer.className = 'moveout-headers';

        // Hauptüberschrift
        const mainHeader = document.createElement('h2');
        mainHeader.innerHTML = '<i class="fas fa-user"></i> ausziehende Mieter';
        /*     mainHeader.innerHTML = '<i class="fas fa-user"></i> einziehende Mieter';
    */


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
        moveOutButton.insertAdjacentElement('beforebegin', headerContainer);

        headersCreated = true;
    }

    // Funktion zum Erstellen eines neuen ausziehenden Mieter-Eintrags
    function createMoveOutEntry() {
        // Überschriften erstellen beim ersten Klick
        if (!document.querySelector('.moveout-headers')) {
            const button = document.getElementById('auszugtenant');
            const headerHTML = `
        <div class="moveout-headers">
            <h2><i class="fas fa-user"></i> ausziehende Mieter</h2>
            <div class="column-headers">
                <span>Vor-/Nachname</span>
                <span>neue Straße</span>
                <span>PLZ/Ort</span>
                <span>E-Mail</span>
                <span></span>
            </div>
        </div>
    `;
            button.insertAdjacentHTML('beforebegin', headerHTML);
        } // Ihre bestehende Header-Funktion



        moveOutButton.classList.add('keybtnhide');
        moveOutButton.style.backgroundColor = '#fff';
        moveOutButton.style.color = '#888';
        moveOutButton.style.fontSize = '2.5rem';
        moveOutButton.style.marginTop = '-10px';
        moveOutButton.style.marginBottom = '25px';
        moveOutButton.textContent = '+';


        // Button-Text ändern, wenn noch nicht geschehen
        if (moveOutButton.textContent.trim() === '+ ausziehenden Mieter hinzufügen') {
            moveOutButton.textContent = '+';
        }

        const moveOutEntry = document.createElement('div');
        moveOutEntry.className = 'tenant-entry moveout-entry';
        moveOutEntry.id = `moveout-entry-${moveOutTenantCounter}`;

        // Name
        const nameCell = document.createElement('div');
        nameCell.className = 'moveout-name';
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = `moveout-name-${moveOutTenantCounter}`;
        nameInput.className = 'bemerkung-input';
        nameInput.placeholder = 'Vor- / Nachname';
        nameCell.appendChild(nameInput);

        // Vorname
        const firstnameCell = document.createElement('div');
        firstnameCell.className = 'moveout-firstname';
        const firstnameInput = document.createElement('input');
        firstnameInput.type = 'text';
        firstnameInput.id = `moveout-firstname-${moveOutTenantCounter}`;
        firstnameInput.className = 'bemerkung-input';
        firstnameInput.placeholder = 'neue Straße';
        firstnameCell.appendChild(firstnameInput);

        // Telefon
        const phoneCell = document.createElement('div');
        phoneCell.className = 'moveout-addr';
        const phoneInput = document.createElement('input');
        phoneInput.type = 'text';
        phoneInput.id = `moveout-addr-${moveOutTenantCounter}`;
        phoneInput.className = 'bemerkung-input';
        phoneInput.placeholder = 'PLZ / Ort';
        phoneCell.appendChild(phoneInput);

        // E-Mail
        const emailCell = document.createElement('div');
        emailCell.className = 'moveout-email';
        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.id = `moveout-email-${moveOutTenantCounter}`;
        emailInput.className = 'bemerkung-input';
        emailInput.placeholder = 'E-Mail-Adresse';
        emailCell.appendChild(emailInput);

        // Löschen-Button
        const deleteCell = document.createElement('div');
        deleteCell.className = 'moveout-delete';
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-moveout-btn';
        deleteBtn.id = `moveout-delete-btn-${moveOutTenantCounter}`;
        deleteBtn.dataset.tenantId = moveOutTenantCounter;
        deleteBtn.textContent = '×';
        deleteCell.appendChild(deleteBtn);

        // Alles zusammenfügen
        moveOutEntry.appendChild(nameCell);
        moveOutEntry.appendChild(firstnameCell);
        moveOutEntry.appendChild(phoneCell);
        moveOutEntry.appendChild(emailCell);
        moveOutEntry.appendChild(deleteCell);

        // Einfügen in DOM
        moveOutButton.insertAdjacentElement('beforebegin', moveOutEntry);

        // Event Listener
        nameInput.addEventListener('change', updateMoveOutSignatureName);
        firstnameInput.addEventListener('change', updateMoveOutSignatureName);
        emailInput.addEventListener('input', validateMoveOutEmail);

        deleteBtn.addEventListener('click', function () {
            if (confirm('Möchten Sie diesen Mieter wirklich löschen?')) {
                moveOutEntry.remove();
                const signatureContainer = document.getElementById(`moveout-signature-container-${moveOutTenantCounter}`);
                if (signatureContainer) signatureContainer.remove();
            }
        });

        // Unterschriftenfeld erstellen
        createMoveOutSignatureField(moveOutTenantCounter, '');

        moveOutTenantCounter++;
    }

    // CSS dynamisch hinzufügen
    const style = document.createElement('style');
    style.textContent = `
        .moveout-headers {
            margin-bottom: 10px;
        }
        
        .moveout-headers h2 {
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
        
        .moveout-entry {
            display: grid;
            grid-template-columns: 2fr 2fr 1.5fr 2fr auto;
            gap: 10px;
            padding: 1px 0;
            align-items: center;
            border-bottom: 2px solid #ccc;
        }
        
        .moveout-entry input {
            width: 100%;
            padding: 1px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }

        .moveout-entry input::placeholder {
            color: #aaa;
            font-style: italic;
        }
        
        .delete-moveout-btn {
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
            
            .moveout-entry {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                grid-template-rows: repeat(2, auto);
                gap: 10px;
                margin-bottom: 15px;
                border-bottom: 2px solid #ccc;
                position: relative;
            }
            
            /* Erstes Feld (Name) */
            .moveout-name {
                grid-column: 1;
                grid-row: 1;
            }
            
            /* Zweites Feld (Vorname) */
            .moveout-firstname {
                grid-column: 2;
                grid-row: 1;
            }
            
            /* Drittes Feld (Telefon) */
            .moveout-addr {
                grid-column: 1;
                grid-row: 2;
            }
            
            /* Viertes Feld (E-Mail) */
            .moveout-email {
                grid-column: 2;
                grid-row: 2;
            }
            
            /* Löschen-Button rechts neben dem Formular platzieren */
            .moveout-delete {
                position: absolute;
                left: 0px;
                top: 105px;
            }
        }
    `;
    document.head.appendChild(style);

    // Event Listener für den "Ausziehenden Mieter hinzufügen"-Button
    moveOutButton.addEventListener('click', createMoveOutEntry);

    // Funktion zur E-Mail-Validierung
    function validateMoveOutEmail(e) {
        const emailInput = e.target;
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (email === '') {
            emailInput.style.border = '';
        } else if (!emailRegex.test(email)) {
            emailInput.style.border = '3px solid red';
        } else {
            emailInput.style.border = '0px solid green';
        }
    }

    /*   function updateMoveOutSignatureName(e) {
          const tenantId = e.target.id.split('-')[2];
          const name = document.getElementById(`moveout-name-${tenantId}`).value;
          const firstname = "";
  
          const signatureName = document.getElementById(`moveout-signature-name-${tenantId}`);
          if (signatureName) {
              signatureName.textContent = `${firstname} ${name}`;
          }
      } */

    function updateMoveOutSignatureName(e) {
        const tenantId = e.target.id.split('-')[2];
        const name = document.getElementById(`moveout-name-${tenantId}`).value;

        const signatureName = document.getElementById(`moveout-signature-name-${tenantId}`);
        if (signatureName) {
            signatureName.textContent = name;
        }
    }

    function createMoveOutSignatureField(tenantId, fullName) {
        const signatureContainer = document.createElement('div');
        signatureContainer.className = 'signature-block';
        signatureContainer.id = `moveout-signature-container-${tenantId}`;
        signatureContainer.innerHTML = `
            <canvas id="moveout-signature-canvas-${tenantId}" width="666" height="222" style="border:1px solid #000; touch-action: none;"></canvas>
            <p><strong>ausziehender Mieter: <span class="signature-name" id="moveout-signature-name-${tenantId}">${fullName}</span></strong></p>
            <div>
                <button type="button" id="moveout-clear-signature-${tenantId}" class="delete-key-btn">x</button>
            </div>
        `;

        document.getElementById('signtenant1').appendChild(signatureContainer);

        // Canvas initialisieren
        const canvas = document.getElementById(`moveout-signature-canvas-${tenantId}`);
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
        document.getElementById(`moveout-clear-signature-${tenantId}`).addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
    }

    // Falls bereits ein Input-Feld existiert, füge Placeholder hinzu
    const initialMoveOutEntry = document.getElementById('moveout-entry-1');
    if (initialMoveOutEntry) {
        document.getElementById('moveout-name-1').placeholder = 'Nachname';
        document.getElementById('moveout-firstname-1').placeholder = 'Vorname';
        document.getElementById('moveout-addr-1').placeholder = 'Straße';
        document.getElementById('moveout-email-1').placeholder = 'E-Mail-Adresse';
    }
});