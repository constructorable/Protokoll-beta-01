// Warten, bis das DOM vollständig geladen ist
document.addEventListener('DOMContentLoaded', function() {
    // Event Delegation für den Mail-Button (funktioniert auch für dynamisch hinzugefügte Elemente)
    document.addEventListener('click', function(event) {
        if (event.target && event.target.id === 'mail') {
            const fileName = localStorage.getItem('lastGeneratedPdfName') || 'Protokoll.pdf';
            showEmailMenu(fileName);
        }
    });

    // Styling für das E-Mail-Menü (mobile-optimiert)
    const style = document.createElement('style');
    style.textContent = `
        #emailMenu {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            z-index: 1001;
            width: 90%;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }
        
        #emailMenu h3 {
            margin-top: 0;
            color: #333;
            font-size: 1.2rem;
        }
        
        #emailMenu ul {
            list-style-type: none;
            padding: 0;
            margin: 10px 0;
            max-height: 200px;
            overflow-y: auto;
        }
        
        #emailMenu li {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
            word-break: break-all;
        }
        
        .pdf-hinweis {
            background-color: #fff3cd;
            color: #856404;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
            font-size: 1rem;
        }
        
        #emailMenuOverlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
        }
        
        #emailMenu .button {
            width: 100%;
            padding: 12px;
            margin-bottom: 10px;
            font-size: 1rem;
        }
    `;
    document.head.appendChild(style);
});

// Hauptfunktion zum Senden der E-Mail (mobile-optimiert)
function sendEmail(fileName, emails, client) {
    // Daten sammeln
    const objekt = document.getElementById('strasseeinzug')?.value || '';
    const lage = document.getElementById('lageeinzug2')?.value || '';
    const plzOrt = document.getElementById('plzeinzug')?.value || '';
    const datum = document.getElementById('datum')?.value || '';
    const mietid = document.getElementById('mieterid')?.value || '';

    // Protokolltyp bestimmen
    const protokollSelect = document.getElementById('protokollart1');
    let protokollTyp = "";
    switch(protokollSelect?.value) {
        case "Abnahme (Auszug)": protokollTyp = "Abnahmeprotokoll"; break;
        case "Übergabe (Einzug)": protokollTyp = "Übergabeprotokoll"; break;
        case "Abnahme- & Übergabe (Ein- und Auszug)": 
            protokollTyp = "Abnahme- und Übergabeprotokoll"; break;
        default: protokollTyp = "Protokoll";
    }

    // Mieterdaten sammeln
    const einziehendeMieter = getMieterDaten('einzugtenantcontainer', 'tenant-display-', 'einziehender');
    const ausziehendeMieter = getMieterDaten('auszugtenantconatainer', 'moveout-display-', 'ausziehender');

    // Betreff und E-Mail-Text erstellen
    const subject = encodeURIComponent(`${objekt}, ${lage} - ${protokollTyp} / ${mietid}`);

    let bodyText = `Sehr geehrte Damen und Herren,\n\n` +
        `anbei erhalten Sie das erstellte Dokument (${protokollTyp}).\n\n` +
        `Objekt / Straße: ${objekt}\n` +
        `PLZ / Ort: ${plzOrt}\n` +
        `Lage / Stockwerk: ${lage}\n` +
        `Mieternummer: ${mietid}\n` +
        `Datum: ${formatDateForEmail(datum)}\n\n`;

    bodyText += `Mit freundlichen Grüßen\n\n` +
        `Sauer Immobilien GmbH\n` +
        `Königstr. 25- 27\n` +
        `90402 Nürnberg\n` +
        `Tel.: 0911 / 21491-0\n` +
        `E-Mail: hausverwaltung@sauer-immobilien.de`;

    // E-Mail-Link erstellen
    const body = encodeURIComponent(bodyText);
    const emailList = [...new Set(emails)].join(','); // Doppelte entfernen
    const ccEmail = "hausverwaltung@sauer-immobilien.de";

    // Für mobile Geräte bevorzugen wir den standardmäßigen mailto-Link
    const mailtoLink = `mailto:${emailList}?cc=${ccEmail}&subject=${subject}&body=${body}`;
    
    // Link öffnen
    const newWindow = window.open(mailtoLink, '_blank');
    
    // Fallback für mobile Geräte, falls Popup blockiert wird
    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        window.location.href = mailtoLink;
    }

    // E-Mail-Adressen in Zwischenablage kopieren (nur wenn unterstützt)
    if (navigator.clipboard) {
        navigator.clipboard.writeText(emailList).catch(err => {
            console.error("Fehler beim Kopieren:", err);
        });
    }
}

// Hilfsfunktionen
function getMieterDaten(containerId, prefix, typ) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    
    return Array.from(container.querySelectorAll(`[id^="${prefix}"]`)).map(table => {
        const id = table.id.match(/\d+$/)?.[0] || '';
        if (typ === 'einziehender') {
            return {
                name: document.getElementById(`${prefix}name-${id}`)?.value || '',
                vorname: document.getElementById(`${prefix}firstname-${id}`)?.value || '',
                email: document.getElementById(`${prefix}email-${id}`)?.value || ''
            };
        } else {
            return {
                name: document.getElementById(`${prefix}name-${id}`)?.value || '',
                strasse: document.getElementById(`${prefix}street-${id}`)?.value || '',
                plzOrt: document.getElementById(`${prefix}zipcity-${id}`)?.value || '',
                email: document.getElementById(`${prefix}email-${id}`)?.value || ''
            };
        }
    }).filter(mieter => mieter.name || mieter.email);
}

function formatMieterListe(mieter, typ) {
    return mieter.map(m => {
        let line = typ === 'einziehend' ? 
            `- ${m.name} ${m.vorname}` : 
            `- ${m.name}`;
            
        if (m.email) line += ` (${m.email})`;
        if (typ === 'ausziehend' && (m.strasse || m.plzOrt)) {
            line += `, neue Adresse: ${m.strasse}, ${m.plzOrt}`;
        }
        return line;
    }).join('\n');
}

function formatDateForEmail(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function findValidEmails() {
    const emailInputs = document.querySelectorAll('input[type="email"]');
    const validEmails = [];
    
    emailInputs.forEach(input => {
        const email = input.value.trim();
        if (validateEmail(email)) {
            validEmails.push(email);
        }
    });
    
    return [...new Set(validEmails)]; // Doppelte entfernen
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showEmailMenu(fileName) {
    const validEmails = findValidEmails();
    
    // Overlay erstellen
    const overlay = document.createElement('div');
    overlay.id = 'emailMenuOverlay';
    
    // Modal erstellen (mobile-optimiert)
    const emailMenu = document.createElement('div');
    emailMenu.id = 'emailMenu';
    emailMenu.innerHTML = `
        <button id="closeModal" aria-label="Schließen" style="
            position: absolute;
            top: 10px;
            right: 10px;
            background: transparent;
            border: none;
            font-size: 24px;
            cursor: pointer;
            padding: 5px;
        ">×</button>
        <div style="padding: 15px;">
            <div class="pdf-hinweis">
                Hinweis: Bitte PDF-Datei manuell im E-Mail-Client anhängen
            </div>
            <h3>Gültige E-Mail-Adressen:</h3>
            <ul>
                ${validEmails.map(email => `<li>${email}</li>`).join('')}
            </ul>
            <div style="margin-top: 20px;">
                <button id="defaultMailClient1" class="button">E-Mail öffnen</button>
                <button id="cancel" class="button">← zurück</button>
            </div>
        </div>
    `;
    
    // Elemente einfügen
    document.body.appendChild(overlay);
    document.body.appendChild(emailMenu);
    
    // Event-Listener (mit Touch-Optimierung)
    const closeModal = () => closeEmailMenu();
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('defaultMailClient1').addEventListener('click', () => {
        sendEmail(fileName, validEmails, 'default');
        closeModal();
    });
    document.getElementById('cancel').addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    
    // Für Touch-Geräte: Verhindern, dass Klicks durch das Modal gehen
    emailMenu.addEventListener('click', e => e.stopPropagation());
}

function closeEmailMenu() {
    const overlay = document.getElementById('emailMenuOverlay');
    const menu = document.getElementById('emailMenu');
    
    if (overlay) overlay.remove();
    if (menu) menu.remove();
    
    // NUR PDF-Modal E-Mail-Buttons entfernen, nicht alle
    const pdfModalEmailButtons = document.querySelector('.pdf-modal')?.querySelectorAll('.email-button');
    if (pdfModalEmailButtons) {
        pdfModalEmailButtons.forEach(button => button.remove());
    }
}