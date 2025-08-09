document.addEventListener('DOMContentLoaded', function () {

    // Canvas-Funktionen hinzufügen
    function collectCanvasData() {
        const canvasData = {};
        const canvasElements = document.querySelectorAll('canvas[id*="signature-canvas"]');

        canvasElements.forEach(canvas => {
            if (canvas.id) {
                try {
                    const dataURL = canvas.toDataURL('image/png');
                    if (!isCanvasEmpty(canvas)) {
                        canvasData[canvas.id] = dataURL;
                    }
                } catch (error) {
                    console.error(`Fehler beim Speichern von Canvas ${canvas.id}:`, error);
                }
            }
        });

        return canvasData;
    }

    function isCanvasEmpty(canvas) {
        const context = canvas.getContext('2d');
        const pixelBuffer = new Uint32Array(
            context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
        );
        return !pixelBuffer.some(color => color !== 0);
    }

    function restoreCanvasData(canvasData) {
        for (const [canvasId, dataURL] of Object.entries(canvasData)) {
            const canvas = document.getElementById(canvasId);
            if (canvas) {
                const context = canvas.getContext('2d');
                const image = new Image();

                image.onload = function () {
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    context.drawImage(image, 0, 0);
                };

                image.src = dataURL;
            }
        }
    }

    function clearAllCanvases() {
        const canvasElements = document.querySelectorAll('canvas[id*="signature-canvas"]');
        canvasElements.forEach(canvas => {
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
        });
    }


    function getAllSaves() { }
    function generateAutoSaveName() { }
    function saveFormData() { }
    function limitAutosaves() { }

    function getAllSaves() {
        try {
            const saves = localStorage.getItem('formSaves');

            return saves ? JSON.parse(saves) : {};
        } catch (e) {
            console.error('Fehler beim Zugriff auf localStorage:', e);
            return {};
        }
    }

    if (!window.html2canvas) {
        const script = document.createElement('script');
        script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
        document.head.appendChild(script);
    }
    if (!window.jspdf) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(script);
    }

    const pdfSections = [
        {
            name: 'Allgemein',
            selector: '#allgemein',
            type: 'main'
        },
        {
            name: 'Küche',
            selector: '.room-toggle[data-room="kueche"]',
            type: 'room'
        },
        {
            name: 'Bad',
            selector: '.room-toggle[data-room="bad"]',
            type: 'room'
        },
        {
            name: 'WC',
            selector: '.room-toggle[data-room="wc"]',
            type: 'room'
        },
        {
            name: 'Flur',
            selector: '.room-toggle[data-room="flur"]',
            type: 'room'
        },
        {
            name: 'Abstellraum',
            selector: '.room-toggle[data-room="abstellraum"]',
            type: 'room'
        },
        {
            name: 'Nebenraum',
            selector: '.room-toggle[data-room="nebenraum"]',
            type: 'room'
        },

        {
            name: 'Zimmer',
            selector: '.zimmer-n .zimmer-section',
            type: 'zimmer',
            processIndividually: true
        },

        {
            name: 'Restliche Informationen',
            selector: '#rest1, #regelungen, #weiterebemerkungen, .room-toggle[data-room]',
            type: 'combined',
            combinedSections: [
                { name: 'Restliche Informationen', selector: '#rest1' },
                {
                    name: 'Nicht vorhandene Räume',
                    selector: '.room-toggle[data-room]',
                    process: (element) => {
                        const toggleOptions = element.querySelector('.toggle-options');
                        if (toggleOptions && toggleOptions.getAttribute('data-active-option') === '0') {

                            let roomName = element.querySelector('.toggle-header')?.textContent || '';

                            roomName = roomName
                                .replace(/ vorhanden\?/gi, '')
                                .replace(/:\s*(Ja|Nein)/gi, '')
                                .replace(/\s*(Ja|Nein)\s*/gi, '')
                                .trim();

                            if (!roomName) {
                                roomName = element.getAttribute('data-room');
                            }

                            roomName = roomName
                                .replace(/^./, c => c.toUpperCase())
                                .replace(/-/g, ' ');

                            return `${roomName}: Nicht vorhanden`;
                        }
                        return null;
                    }
                },
                { name: 'Regelungen', selector: '#regelungen' },
                { name: 'Weitere Bemerkungen', selector: '#weiterebemerkungen' }
            ]
        },
        {
            name: 'Unterschriften',
            selector: '#sign',
            type: 'signatures'
        },
        {
            name: 'Bildergalerie',
            selector: '.bildergalerie-container',
            type: 'gallery',
            processIndividually: true
        }
    ];

    document.getElementById('screenshot').addEventListener('click', async function () {

        const button = this;

        const canProceed = await validateMoveOutTenants();
        if (!canProceed) {
            return;
        }

        try {

            const saveName = generateAutoSaveName();
            saveFormData(saveName);
        } catch (e) {
            console.error('Automatische Speicherung fehlgeschlagen:', e);
        }

        try {

            const saveName = generateAutoSaveName();
            saveFormData(saveName);
        } catch (e) {
            console.error('Automatische Speicherung fehlgeschlagen:', e);

        }

        const saveName = generateAutoSaveName();
        saveFormData(saveName);

        const cssProfiles = [
            {
                id: 'desktop',
                name: 'Desktop Design',
                description: 'Optimiert für Desktop-Ansicht und Bildschirmdarstellung',
                cssFile: 'stylesdesktop.css'
            },
            {
                id: 'pdf',
                name: 'PDF erstellen (hier klicken)',
                description: '',
                cssFile: 'stylespdf.css'
            },
            {
                id: 'mobile',
                name: 'Mobile Design',
                description: 'Responsive Design für mobile Geräte',
                cssFile: 'stylestablet.css'
            }
        ];

        const selectedProfile = await showDesignSelectionModal(cssProfiles);

        button.disabled = false;

        button.textContent = `PDF erstellen`;

        const pdfStyleLink = document.createElement('link');
        pdfStyleLink.rel = 'stylesheet';
        pdfStyleLink.href = selectedProfile.cssFile + '?v=' + Date.now();
        pdfStyleLink.id = 'pdf-styles';

        await new Promise((resolve) => {
            pdfStyleLink.onload = resolve;
            document.head.appendChild(pdfStyleLink);
            setTimeout(resolve, 2000);
        });

        document.body.style.display = 'none';
        document.body.offsetHeight;
        document.body.style.display = '';
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log("Aktuelles CSS:", document.getElementById('pdf-styles')?.href);
        console.log("Aktive Stylesheets:",
            Array.from(document.styleSheets)
                .map(sheet => sheet.href)
                .filter(Boolean)
        );

        localStorage.setItem('currentStyle', selectedProfile.cssFile);
        applyStyle(selectedProfile.cssFile);
        await new Promise(resolve => setTimeout(resolve, 500));

        const keysBtn = document.getElementById('keysbtn');
        if (keysBtn && keysBtn.textContent.trim() === '+ Schlüssel') {
            keysBtn.textContent = 'Schlüssel: nicht angegeben';
        }

        const zaehlerBtn = document.getElementById('addzaehlerbtn');
        if (zaehlerBtn && zaehlerBtn.textContent.trim() === '+ Zähler') {
            zaehlerBtn.textContent = 'Zähler: nicht angegeben';
        }

        const einzugBtn = document.getElementById('einzugtenant');
        if (einzugBtn && einzugBtn.textContent.trim() === '+ Mieter Einzug') {
            einzugBtn.textContent = 'einziehende Mieter: nicht zutreffend';
        }

        const auszugBtn = document.getElementById('auszugtenant');
        if (auszugBtn && auszugBtn.textContent.trim() === '+ Mieter Auszug') {
            auszugBtn.textContent = 'ausziehender Mieter: nicht zutreffend';
        }

        const modal = document.getElementById('pdf-modal-overlay');
        const closeButton = modal.querySelector('.pdf-modal-close');
        const progressBar = document.getElementById('pdf-progress-bar');
        const statusMessage = document.getElementById('pdf-status-message');

        const modalTitle = document.querySelector('.pdf-modal-title');

        progressBar.style.width = '0%';
        progressBar.textContent = '0%';
        statusMessage.textContent = '';
        statusMessage.className = 'pdf-status-message';

        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);

        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.style.display = 'none', 300);

            const existingPdfEmailButtons = document.querySelector('.pdf-modal')?.querySelectorAll('.email-button');
            if (existingPdfEmailButtons) {
                existingPdfEmailButtons.forEach(button => button.remove());
            }

            const pdfStyles = document.getElementById('pdf-styles');
            if (pdfStyles) {
                pdfStyles.remove();
            }

            applyStyle('stylestablet.css');
            localStorage.setItem('currentStyle', 'stylestablet.css');
        };

        const pdfStyles = document.getElementById('pdf-styles');
        if (pdfStyles) {
            pdfStyles.remove();
        }

        closeButton.onclick = function () {

            const existingModal = document.querySelector('.confirmation-modal');
            if (existingModal) {
                existingModal.remove();
            }

            const existingStyle = document.querySelector('#confirmation-modal-styles');
            if (existingStyle) {
                existingStyle.remove();
            }

            const confirmationModal = document.createElement('div');
            confirmationModal.className = 'confirmation-modal';
            confirmationModal.innerHTML = `
        <div class="confirmation-content">
            <h3>Modal schließen?</h3>
            <p>Hiermit wird das Popup-Fenster geschlossen</p>
            <div class="confirmation-buttons">
                <button class="btn-cancel">Abbrechen</button>
                <button class="btn-confirm">Schließen</button>
            </div>
        </div>
    `;

            const style = document.createElement('style');
            style.id = 'confirmation-modal-styles';
            style.textContent = `
        .confirmation-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1100;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .confirmation-content {
            background: white;
            padding: 2rem;
            border-radius: 6px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
            max-width: 400px;
            width: 90%;
            text-align: center;
            transform: scale(0.9);
            transition: transform 0.3s ease;
        }
        .confirmation-content h3 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #333;
            margin-bottom: 1rem;
        }
        .confirmation-content p {
            color: #666;
            line-height: 1.5;
            margin-bottom: 2rem;
        }
        .confirmation-buttons {
            display: flex;
            gap: 12px;
            justify-content: center;
        }
        .confirmation-buttons button {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 100px;
        }
        .btn-cancel {
            background: #f8f9fa;
            color: #666;
            border: 1px solid #e9ecef;
        }
        .btn-cancel:hover {
            background: #e9ecef;
        }
        .btn-confirm {
            background:rgb(36, 92, 148);
            color: white;
        }

        @media (max-width: 768px) {
            .confirmation-content {
                margin: 20px;
                width: calc(100% - 40px);
            }
            .confirmation-buttons {
                flex-direction: column;
            }
            .confirmation-buttons button {
                width: 100%;
            }
        }
    `;

            document.head.appendChild(style);
            document.body.appendChild(confirmationModal);

            requestAnimationFrame(() => {
                confirmationModal.style.opacity = '1';
                confirmationModal.querySelector('.confirmation-content').style.transform = 'scale(1)';
            });

            const cleanup = () => {
                if (confirmationModal && confirmationModal.parentNode) {
                    confirmationModal.style.opacity = '0';
                    setTimeout(() => {
                        if (confirmationModal.parentNode) {
                            document.body.removeChild(confirmationModal);
                        }
                        if (style && style.parentNode) {
                            document.head.removeChild(style);
                        }
                    }, 300);
                }
            };

            const cancelBtn = confirmationModal.querySelector('.btn-cancel');
            const confirmBtn = confirmationModal.querySelector('.btn-confirm');

            const handleCancel = () => {
                cleanup();
            };

            const handleConfirm = () => {
                cleanup();

                setTimeout(() => {
                    closeModal();
                }, 100);
            };

            cancelBtn.onclick = handleCancel;
            confirmBtn.onclick = handleConfirm;

            const handleOverlayClick = (event) => {
                if (event.target === confirmationModal) {
                    handleCancel();
                }
            };

            confirmationModal.onclick = handleOverlayClick;

            const handleEscKey = (event) => {
                if (event.key === 'Escape') {
                    handleCancel();

                    document.removeEventListener('keydown', handleEscKey);
                }
            };

            document.addEventListener('keydown', handleEscKey);
        };

        const startTime = Date.now();

        document.querySelectorAll('[placeholder]').forEach(el => {
            const originalColor = el.style.color;
            el.style.color = '#333';
            setTimeout(() => {
                el.style.color = originalColor;
            }, 5000);
        });

        try {

            await new Promise(resolve => {
                const checkJSPDF = () => window.jspdf ? resolve() : setTimeout(checkJSPDF, 100);
                checkJSPDF();
            });

            const phase1Text = `Abschnitte werden ermittelt...`;
            statusMessage.textContent = phase1Text;

            button.textContent = "PDF wird erstellt...";
            if (modalTitle) modalTitle.textContent = phase1Text;

            const availableSections = [];
            let totalProgress = 0;
            const progressStep = 30 / pdfSections.length;

            for (const section of pdfSections) {
                const element = section.selector ? document.querySelector(section.selector) : null;

                if (section.type === 'zimmer' && section.processIndividually) {
                    const zimmerElements = document.querySelectorAll(section.selector);

                    zimmerElements.forEach((zimmerElement, index) => {
                        const zimmerHeader = zimmerElement.querySelector('.zimmer-header');
                        const zimmerName = zimmerHeader ? zimmerHeader.textContent.trim() : `Zimmer ${index + 1}`;

                        availableSections.push({
                            name: zimmerName,
                            selector: null,
                            type: 'zimmer',
                            element: zimmerElement,
                            isDynamic: true
                        });
                    });
                    continue;
                }

                if (element && element.offsetHeight > 0) {
                    const computedStyle = window.getComputedStyle(element);
                    if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {

                        if (section.type === 'gallery' && section.processIndividually) {
                            const galleryImages = element.querySelectorAll('.galerie-bild');

                            galleryImages.forEach((imageElement, index) => {
                                const imgElement = imageElement.querySelector('img');
                                const titleElement = imageElement.querySelector('.bild-info span, div');

                                if (imgElement && imgElement.src) {
                                    let imageName = 'Bild';

                                    if (titleElement) {
                                        imageName = titleElement.textContent.trim();
                                    } else {
                                        const textNodes = Array.from(imageElement.childNodes)
                                            .filter(node => node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE);

                                        if (textNodes.length > 0) {
                                            imageName = textNodes[0].textContent?.trim() || `Galeriebild ${index + 1}`;
                                        }
                                    }

                                    availableSections.push({
                                        name: imageName,
                                        selector: null,
                                        type: 'gallery_image',
                                        element: imageElement,
                                        imageElement: imgElement
                                    });
                                }
                            });
                        } else {
                            availableSections.push({
                                ...section,
                                element: element
                            });
                        }
                    }
                }

                totalProgress += progressStep;
                progressBar.style.width = Math.round(totalProgress) + '%';
                progressBar.textContent = Math.round(totalProgress) + '%';
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            if (availableSections.length === 0) {
                throw new Error('Keine PDF-Abschnitte gefunden');
            }

            const phase2Text = `Abschnitt ${availableSections.length} wird erstellt...`;
            statusMessage.textContent = phase2Text;

            button.textContent = "PDF wird erstellt...";
            if (modalTitle) modalTitle.textContent = phase2Text;

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm'
            });

            const pageWidth = 210;
            const pageHeight = 297;
            const marginLeft = 10;
            const marginRight = 10;
            const marginTop = 10;
            const marginBottom = 10;
            const usableWidth = pageWidth - marginLeft - marginRight;
            const usableHeight = pageHeight - marginTop - marginBottom;

            let isFirstPage = true;
            const sectionProgressStep = 40 / availableSections.length;

            for (let i = 0; i < availableSections.length; i++) {
                const section = availableSections[i];

                if (section.type === 'room') {
                    const element = document.querySelector(section.selector);
                    const toggleOptions = element?.querySelector('.toggle-options');
                    if (toggleOptions && toggleOptions.getAttribute('data-active-option') === '0') {
                        continue;
                    }
                }

                const sectionText = `Abschnitt "${section.name}" wird verarbeitet... (${i + 1}/${availableSections.length})`;
                statusMessage.textContent = sectionText;

                button.textContent = "PDF wird erstellt...";
                if (modalTitle) modalTitle.textContent = sectionText;

                let canvas;

                if (section.type === 'combined') {
                    const tempContainer = document.createElement('div');
                    tempContainer.style.position = 'absolute';
                    tempContainer.style.left = '-9999px';
                    tempContainer.style.width = '800px';
                    tempContainer.style.padding = '20px';
                    tempContainer.style.boxSizing = 'border-box';
                    tempContainer.style.backgroundColor = '#ffffff';

                    let hasContent = false;

                    for (const combinedSection of section.combinedSections) {
                        if (combinedSection.process) {
                            const roomElements = Array.from(document.querySelectorAll(combinedSection.selector));
                            const nonExistingRooms = roomElements
                                .map(element => combinedSection.process(element))
                                .filter(text => text !== null);

                            if (nonExistingRooms.length > 0) {
                                hasContent = true;
                                const heading = document.createElement('h2');
                                heading.textContent = combinedSection.name;
                                heading.style.marginTop = '20px';
                                heading.style.marginBottom = '10px';
                                tempContainer.appendChild(heading);

                                const list = document.createElement('ul');
                                list.style.listStyleType = 'none';
                                list.style.padding = '0';
                                list.style.margin = '0 0 20px 0';

                                nonExistingRooms.forEach(roomText => {
                                    const listItem = document.createElement('li');
                                    listItem.style.padding = '5px 0';
                                    listItem.style.borderBottom = '1px solid #eee';
                                    listItem.textContent = roomText;
                                    list.appendChild(listItem);
                                });

                                tempContainer.appendChild(list);
                            }
                        } else {
                            const element = document.querySelector(combinedSection.selector);
                            if (element && element.innerHTML.trim() !== '') {
                                hasContent = true;
                                const clone = element.cloneNode(true);
                                const heading = document.createElement('h2');
                                heading.textContent = combinedSection.name;
                                heading.style.marginTop = '20px';
                                heading.style.marginBottom = '10px';
                                tempContainer.appendChild(heading);
                                tempContainer.appendChild(clone);
                            }
                        }
                    }

                    if (!hasContent) {
                        continue;
                    }

                    document.body.appendChild(tempContainer);

                    try {

                        const checkboxReplacements = replaceCheckboxesForPDF(tempContainer);

                        canvas = await html2canvas(tempContainer, {
                            scale: 1,
                            logging: false,
                            useCORS: true,
                            allowTaint: true,
                            backgroundColor: '#ffffff'
                        });

                        restoreCheckboxes(checkboxReplacements);

                    } finally {
                        document.body.removeChild(tempContainer);
                    }
                }
                else if (section.type === 'zimmer') {
                    const removeButtons = section.element.querySelectorAll('.remove-zimmer-btn');
                    removeButtons.forEach(btn => btn.style.display = 'none');

                    const checkboxReplacements = replaceCheckboxesForPDF(section.element);

                    canvas = await html2canvas(section.element, {
                        scale: 1,
                        logging: false,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        width: section.element.offsetWidth,
                        height: section.element.offsetHeight,
                        imageTimeout: 0,
                        removeContainer: false
                    });

                    restoreCheckboxes(checkboxReplacements);
                    removeButtons.forEach(btn => btn.style.display = '');
                }
                else if (section.type === 'gallery_image') {

                    const checkboxReplacements = replaceCheckboxesForPDF(section.element);

                    canvas = await html2canvas(section.element, {
                        scale: 1,
                        logging: false,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        width: section.element.offsetWidth,
                        height: section.element.offsetHeight,
                        imageTimeout: 0,
                        removeContainer: false
                    });

                    restoreCheckboxes(checkboxReplacements);

                } else {

                    const checkboxReplacements = replaceCheckboxesForPDF(section.element);

                    canvas = await html2canvas(section.element, {
                        scale: 1,
                        logging: false,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff'
                    });

                    restoreCheckboxes(checkboxReplacements);

                }

                if (!isFirstPage) {
                    pdf.addPage();
                } else {
                    isFirstPage = false;
                }

                const imgWidth = canvas.width;
                const imgHeight = canvas.height;

                let scale, finalWidth, finalHeight, xOffset, yOffset;

                if (section.type === 'gallery_image') {
                    const scaleWidth = usableWidth / (imgWidth * 0.264583);
                    const scaleHeight = usableHeight / (imgHeight * 0.264583);
                    scale = Math.min(scaleWidth, scaleHeight);
                    finalWidth = (imgWidth * 0.264583) * scale;
                    finalHeight = (imgHeight * 0.264583) * scale;
                    xOffset = marginLeft + (usableWidth - finalWidth) / 2;
                    yOffset = marginTop + 5;
                } else {
                    const scaleWidth = usableWidth / (imgWidth * 0.264583);
                    const scaleHeight = usableHeight / (imgHeight * 0.264583);
                    scale = Math.min(scaleWidth, scaleHeight, 1);
                    finalWidth = (imgWidth * 0.264583) * scale;
                    finalHeight = (imgHeight * 0.264583) * scale;
                    xOffset = marginLeft + (usableWidth - finalWidth) / 2;
                    yOffset = marginTop + 5;
                }

                const imgData = canvas.toDataURL('image/jpeg',
                    section.type === 'gallery_image' ? 0.95 :
                        section.type === 'combined' ? 0.9 : 0.85);

                pdf.addImage(
                    imgData,
                    'JPEG',
                    xOffset,
                    yOffset,
                    finalWidth,
                    finalHeight,
                    `section_${i}`,
                    'FAST'
                );

                pdf.setFontSize(8);
                pdf.setTextColor(128, 128, 128);

                const pageNumberText = `Seite ${i + 1}`;
                const sectionName = section.name.replace(/\s*\([^)]*\)/, '');

                const rightPadding = 10;
                const bottomPadding = 10;

                const headerText = section.type === 'gallery_image'
                    ? `${section.name}`
                    : `${section.name} (Seite ${i + 1})`;

                const textWidth = pdf.getStringUnitWidth(headerText) * pdf.getFontSize() / 2.5;

                const textX = pageWidth - marginRight - textWidth;
                const textY = pageHeight - marginBottom + 5;

                pdf.text(sectionName, marginLeft, pageHeight - bottomPadding + 5);

                const pageNumWidth = pdf.getStringUnitWidth(pageNumberText) * pdf.getFontSize() / 2.5;
                pdf.text(pageNumberText, pageWidth - marginRight - pageNumWidth, pageHeight - bottomPadding + 5);

                const currentProgress = 30 + ((i + 1) * sectionProgressStep);
                progressBar.style.width = Math.round(currentProgress) + '%';
                progressBar.textContent = Math.round(currentProgress) + '%';

                await new Promise(resolve => setTimeout(resolve, section.type === 'gallery_image' ? 200 : 100));
            }

            const phase3Text = ``;

            statusMessage.textContent = "";

            button.textContent = "PDF wird erstellt...";
            if (modalTitle) modalTitle.textContent = phase3Text;

            for (let i = 71; i <= 95; i++) {
                await new Promise(resolve => setTimeout(resolve, 30));
                progressBar.style.width = i + '%';
                progressBar.textContent = i + '%';
            }

            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 2000 - elapsedTime);

            if (remainingTime > 0) {
                const steps = 4;
                const stepTime = remainingTime / steps;
                for (let i = 96; i <= 100; i++) {
                    await new Promise(resolve => setTimeout(resolve, stepTime));
                    progressBar.style.width = i + '%';
                    progressBar.textContent = i + '%';
                }
            } else {
                progressBar.style.width = '100%';
                progressBar.textContent = '100%';
            }

            statusMessage.textContent = `PDF erfolgreich erstellt!`;
            statusMessage.classList.add('success');

            const existingPdfEmailButtons = document.querySelector('.pdf-modal')?.querySelectorAll('.email-button');
            if (existingPdfEmailButtons) {
                existingPdfEmailButtons.forEach(button => button.remove());
            }

            const emailButton = document.createElement('button');
            /*  emailButton.id = 'mail'; */
            emailButton.className = 'email-button';
            emailButton.style.marginTop = '15px';
            emailButton.style.padding = '10px 15px 10px 40px';
            emailButton.style.backgroundColor = '#466c9c';
            emailButton.style.color = 'white';
            emailButton.style.border = 'none';
            emailButton.style.borderRadius = '4px';
            emailButton.style.cursor = 'pointer';
            emailButton.style.fontSize = '1.4rem';
            emailButton.style.position = 'relative';

            emailButton.innerHTML = `
            <i class="fas fa-envelope" style="
                position: absolute;
                left: 15px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 1.2em;
            "></i>
            E-Mail erstellen
            `;

            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
            const pdfFileName = `Wohnungsprotokoll_${selectedProfile.id}_${timestamp}.pdf`;
            pdf.save(`Wohnungsprotokoll_${selectedProfile.id}_${timestamp}.pdf`);
            localStorage.setItem('lastGeneratedPdfName', pdfFileName);

            statusMessage.insertAdjacentElement('afterend', emailButton);

            function handleEmailButtonClick() {
                closeModal();
                setTimeout(() => {
                    showEmailMenu(pdfFileName);
                }, 300);
            }

            emailButton.addEventListener('click', handleEmailButtonClick);

            function showEmailMenu(fileName) {
                const validEmails = findValidEmails();
                closeEmailMenu();
                // Nur PDF-Modal E-Mail-Buttons entfernen
                const pdfModalEmailButtons = document.querySelector('.pdf-modal')?.querySelectorAll('.email-button');
                if (pdfModalEmailButtons) {
                    pdfModalEmailButtons.forEach(button => button.remove());
                }

                const overlay = document.createElement('div');
                overlay.id = 'emailMenuOverlay';

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
                <button id="defaultMailClient2" class="button">E-Mail öffnen</button>
                <button id="cancel" class="button">← zurück</button>
            </div>
        </div>
    `;

                document.body.appendChild(overlay);
                document.body.appendChild(emailMenu);

                const setupListeners = () => {
                    const closeModal = () => closeEmailMenu();

                    const closeBtn = document.getElementById('closeModal');
                    const mailBtn = document.getElementById('defaultMailClient2');
                    const cancelBtn = document.getElementById('cancel');

                    if (closeBtn) closeBtn.addEventListener('click', closeModal);
                    if (mailBtn) mailBtn.addEventListener('click', () => {
                        sendEmail(fileName, validEmails, 'default');
                        closeModal();
                    });
                    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

                    overlay.addEventListener('click', closeModal);
                    emailMenu.addEventListener('click', e => e.stopPropagation());
                };

                setTimeout(setupListeners, 50);
            }

            if (!document.getElementById('emailButtonStyle')) {
                const style = document.createElement('style');
                style.id = 'emailButtonStyle';
                style.textContent = `
        #mail:hover {
            background-color: #476c9c !important;
        }
        #mail:active {
            background-color: #476c9c !important;
        }
    `;
                document.head.appendChild(style);
            }

        } catch (error) {
            console.error('Fehler:', error);
            statusMessage.textContent = 'Fehler beim Erstellen des PDFs: ' + error.message;
            statusMessage.classList.add('error');
        } finally {
            button.disabled = false;
            button.textContent = 'PDF erstellen';
            setTimeout(closeModal, 60000);
        }

        button.disabled = false;
        button.textContent = `PDF erstellen`;

    });

    document.getElementById('screenshot')?.addEventListener('click', async () => {
        try {
            const formData = {};
            let hasData = false;

            // Formularelemente sammeln
            document.querySelectorAll('input, select, textarea').forEach(element => {
                if (element.type === 'button' || element.type === 'submit') return;
                const identifier = element.name || element.id;
                if (!identifier) return;

                if (element.type === 'checkbox' || element.type === 'radio') {
                    formData[identifier] = element.checked;
                    if (element.checked) hasData = true;
                } else {
                    formData[identifier] = element.value;
                    if (element.value) hasData = true;
                }
            });

            // Radio-Gruppen sammeln
            const radioGroups = {};
            document.querySelectorAll('input[type="radio"]').forEach(radio => {
                if (!radioGroups[radio.name]) {
                    const checkedRadio = document.querySelector(`input[name="${radio.name}"]:checked`);
                    radioGroups[radio.name] = checkedRadio ? checkedRadio.value : '';
                    if (checkedRadio) hasData = true;
                }
            });
            formData.radioGroups = radioGroups;

            // Room-Toggle Status sammeln
            document.querySelectorAll('.room-toggle .toggle-option').forEach(option => {
                const room = option.closest('.room-toggle').dataset.room;
                const identifier = `room_${room}_toggle`;
                if (option.classList.contains('active')) {
                    formData[identifier] = option.dataset.value;
                    hasData = true;
                }
            });

            // Canvas-Daten sammeln
            const canvasData = collectCanvasData();
            if (Object.keys(canvasData).length > 0) {
                hasData = true;
            }

            if (!hasData) {
                showFeedback("Keine Daten zum Export gefunden", false);
                return;
            }

            const straßenname = document.getElementById('strasseeinzug').value || 'UnbekannteStrasse';
            const now = new Date();
            const datumZeit = now.toISOString()
                .replace(/[:.]/g, '-')
                .replace('T', '_')
                .slice(0, 19);

            const cleanStraßenname = straßenname
                .replace(/[^a-zA-Z0-9äöüÄÖÜß\- ]/g, '')
                .trim()
                .replace(/\s+/g, '_');

            const dateiname = `Export_automatisch_nach_PDF-Erstellung_${cleanStraßenname}_${datumZeit}.json`;

            // Export-Datenstruktur erstellen (gleich wie in importexport.js)
            const exportData = {
                formData: formData,
                canvasData: canvasData,
                exportMetadata: {
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    source: 'PDF-Creation-Export',
                    canvasCount: Object.keys(canvasData).length,
                    formFieldCount: Object.keys(formData).length
                }
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = dateiname;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => URL.revokeObjectURL(url), 100);

            const signatureInfo = Object.keys(canvasData).length > 0 ? ` (inkl. ${Object.keys(canvasData).length} Signaturen)` : '';
            showFeedback(`Daten erfolgreich exportiert${signatureInfo}`, true);

        } catch (error) {
            console.error("Export-Fehler:", error);
            showFeedback("Fehler beim Export: " + error.message, false);
        }
    });

    function generateAutoSaveName() {
        try {
            const strasse = document.getElementById('strasseeinzug')?.value.trim() || 'Protokoll';
            const now = new Date();
            const dateStr = now.toLocaleDateString('de-DE') || now.toISOString().slice(0, 10);
            const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) ||
                now.toTimeString().slice(0, 5);

            return `AutoSave_nach_PDF-Erstellung_${strasse}_${dateStr}_${timeStr}`.replace(/[/\\?%*:|"<>]/g, '_');
        } catch (e) {
            console.error('Fehler bei der Namensgenerierung:', e);
            return `AutoSave_nach_PDF-Erstellung_${Date.now()}`;
        }
    }

    function saveFormData(saveName, isAutosave = true) {
        try {
            const formData = {};

            document.querySelectorAll('input, select, textarea').forEach(element => {
                if (element.id) {
                    if (element.type === 'checkbox' || element.type === 'radio') {
                        formData[element.id] = element.checked;
                    } else if (element.type === 'select-one') {
                        formData[element.id] = element.value;
                    } else {
                        formData[element.id] = element.value;
                    }
                }
            });

            const radioGroups = {};
            document.querySelectorAll('input[type="radio"]').forEach(radio => {
                if (!radioGroups[radio.name]) {
                    radioGroups[radio.name] = document.querySelector(`input[name="${radio.name}"]:checked`)?.value || '';
                }
            });
            formData.radioGroups = radioGroups;

            // Canvas-Daten sammeln
            const canvasData = collectCanvasData();

            const allSaves = getAllSaves() || {};

            allSaves[saveName] = {
                data: formData,
                canvasData: canvasData, // Canvas-Daten hinzufügen
                timestamp: new Date().toISOString(),
                isAutosave: isAutosave
            };

            localStorage.setItem('formSaves', JSON.stringify(allSaves));

            if (isAutosave) {
                limitAutosaves(allSaves);
            }
        } catch (e) {
            console.error('Speicherung fehlgeschlagen:', e);
            throw e;
        }
    }

    function loadSpecificState(saveName) {
        try {
            const allSaves = getAllSaves();
            const saveData = allSaves[saveName];
            if (!saveData) return false;

            // Formulardaten laden
            const formData = saveData.data;
            for (const [id, value] of Object.entries(formData)) {
                const element = document.getElementById(id);
                if (element) {
                    if (element.type === 'checkbox' || element.type === 'radio') {
                        element.checked = value;
                    } else {
                        element.value = value;
                    }
                }
            }

            // Radio-Gruppen wiederherstellen
            if (saveData.data.radioGroups) {
                for (const [groupName, value] of Object.entries(saveData.data.radioGroups)) {
                    const radio = document.querySelector(`input[name="${groupName}"][value="${value}"]`);
                    if (radio) {
                        radio.checked = true;
                    }
                }
            }

            // Canvas-Daten laden (falls vorhanden)
            if (saveData.canvasData) {
                restoreCanvasData(saveData.canvasData);
            }

            showFeedback('Speicherstand erfolgreich geladen!', true);
            return true;
        } catch (error) {
            console.error('Fehler beim Laden:', error);
            return false;
        }
    }

    function limitAutosaves(allSaves) {
        try {
            if (!allSaves) return;

            const autosaves = Object.entries(allSaves)
                .filter(([name, data]) => data && data.isAutosave)
                .sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp));

            if (autosaves.length > 5) {
                autosaves.slice(5).forEach(([name]) => {
                    if (allSaves[name]) {
                        delete allSaves[name];
                    }
                });
                localStorage.setItem('formSaves', JSON.stringify(allSaves));
            }
        } catch (e) {
            console.error('Fehler beim Begrenzen der Autosaves:', e);
        }
    }

    function showSavedStates() {
        const saves = getAllSaves();

        if (Object.keys(saves).length === 0) {
            showMobileAlert('Keine gespeicherten Zustände gefunden!');
            return;
        }

        let html = `
    <div class="saved-states-container">
        <h3>Gespeicherte Zustände:</h3>
        <button class="close-dialog">×</button>
        <ul class="saved-states-list">`;

        const sortedSaves = Object.entries(saves).sort((a, b) => {
            if (a[1].isAutosave === b[1].isAutosave) {
                return new Date(b[1].timestamp) - new Date(a[1].timestamp);
            }
            return a[1].isAutosave ? 1 : -1;
        });

        for (const [name, data] of sortedSaves) {
            const timestamp = new Date(data.timestamp).toLocaleString();
            const isAutosave = data.isAutosave ? ' (Automatisch)' : '';
            const hasSignatures = data.canvasData && Object.keys(data.canvasData).length > 0;
            const signatureIndicator = hasSignatures ? ' 📝' : '';

            html += `
    <li class="saved-state-item ${data.isAutosave ? 'autosave' : ''}">
        <div class="saved-state-row">
            <span class="saved-state-name">${name}${isAutosave}${signatureIndicator}</span>
            <span class="saved-state-date">${timestamp}</span>
            <div class="saved-state-buttons">
                <button class="button load-btn" data-name="${name}">Laden</button>
                <button class="delete-btn2" data-name="${name}">x</button>
            </div>
        </div>
    </li>`;
        }

        html += '</ul></div>';

        const additionalStyles = `
<style>
    .saved-state-item.autosave {
        opacity: 0.9;
        background-color: #f9f9f9;
    }

    .saved-state-item.autosave .saved-state-name {
        font-style: italic;
    }

    .saved-state-item.autosave .saved-state-date {
        color: #888;
    }
</style>
`;

        document.head.insertAdjacentHTML('beforeend', additionalStyles);

    }

    function deleteState(saveName) {
        try {
            const allSaves = getAllSaves();
            delete allSaves[saveName];
            localStorage.setItem('formSaves', JSON.stringify(allSaves));
            return true;
        } catch (error) {
            console.error('Fehler beim Löschen:', error);
            return false;
        }
    }

    function showFeedback(message, isSuccess) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${isSuccess ? '#4CAF50' : '#f44336'};
        color: white;
        border-radius: 6px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
        feedback.textContent = message;

        document.body.appendChild(feedback);

        setTimeout(() => {
            feedback.style.opacity = '0';
            feedback.style.transition = 'opacity 0.3s';
            setTimeout(() => document.body.removeChild(feedback), 300);
        }, 3000);
    }


    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('load-btn')) {
            const saveName = e.target.dataset.name;
            if (saveName) {
                loadSpecificState(saveName);
            }
        }

        if (e.target.classList.contains('delete-btn2')) {
            const saveName = e.target.dataset.name;
            if (saveName && confirm(`Speicherstand "${saveName}" wirklich löschen?`)) {
                deleteState(saveName);
                // Modal neu laden
                setTimeout(() => showSavedStates(), 100);
            }
        }
    });


    function showDesignSelectionModal(cssProfiles) {
        return new Promise((resolve) => {

            const modalHTML = `
            <div id="design-selection-overlay" class="design-modal-overlay">
                <div class="design-modal-container">
                    <div class="design-modal-header">

                        <button class="design-modal-close" type="button">&times;</button>
                    </div>
                    <div class="design-modal-content">

                        <div class="design-profiles-grid">
                            ${cssProfiles.map(profile => `
                                <div class="design-profile-card" data-profile-id="${profile.id}">
                                    <div class="design-profile-preview">
                                        <div class="design-preview-placeholder ${profile.id}">
                                            <span>${profile.name}</span>
                                        </div>
                                    </div>

                                </div>
                            `).join('')}
                        </div>
                    </div>

                </div>
            </div>
        `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);

            const modal = document.getElementById('design-selection-overlay');
            const closeBtn = modal.querySelector('.design-modal-close');

            const selectBtns = modal.querySelectorAll('.design-select-btn');
            const profileCards = modal.querySelectorAll('.design-profile-card');

            setTimeout(() => modal.classList.add('active'), 10);

            const closeModal = (selectedProfile = null) => {
                modal.classList.remove('active');
                setTimeout(() => {
                    document.body.removeChild(modal);
                    resolve(selectedProfile);
                }, 300);
            };

            closeBtn.addEventListener('click', () => closeModal());

            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });

            selectBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const profileId = btn.dataset.profileId;
                    const selectedProfile = cssProfiles.find(p => p.id === profileId);
                    closeModal(selectedProfile);
                });
            });

            profileCards.forEach(card => {
                card.addEventListener('click', () => {
                    const profileId = card.dataset.profileId;
                    const selectedProfile = cssProfiles.find(p => p.id === profileId);
                    closeModal(selectedProfile);
                });
            });
        });
    }

    function replaceCheckboxesForPDF(container) {
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        const replacements = [];

        checkboxes.forEach((checkbox, index) => {

            const originalCheckbox = checkbox.cloneNode(true);

            const wrapper = document.createElement('div');
            wrapper.style.cssText = `
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
        `;

            const replacement = document.createElement('div');
            replacement.style.cssText = `
            width: 15px !important;
            height: 15px !important;
            border: 1px solid rgb(180, 180, 180) !important;
            border-radius: 3px !important;
            background-color: #ffffff !important;
            background: #ffffff !important;
            display: block !important;
            position: relative !important;
            margin: 0 !important;
            transform: scale(1.5) !important;
            flex-shrink: 0 !important;
            margin-right:12px !important;
        `;

            if (checkbox.checked) {
                const checkmark = document.createElement('span');
                checkmark.style.cssText = `
               position: absolute !important;
                top: 2px !important;
                left: 2px !important;
                font-size: 14px !important;
                font-weight: bold !important;
                color:rgb(36, 36, 36) !important;
                line-height: 1 !important;
            `;
                checkmark.textContent = '✓';
                replacement.appendChild(checkmark);
            }

            wrapper.appendChild(replacement);

            checkbox.parentNode.replaceChild(wrapper, checkbox);

            replacements.push({
                replacement: wrapper,
                original: originalCheckbox
            });
        });

        return replacements;
    }

    function restoreCheckboxes(replacements) {
        replacements.forEach(({ replacement, original }) => {
            if (replacement.parentNode) {
                replacement.parentNode.replaceChild(original, replacement);
            }
        });
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

});