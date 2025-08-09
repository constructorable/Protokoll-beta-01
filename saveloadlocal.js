document.addEventListener('DOMContentLoaded', function () {
    let isProcessing = false;
    let autosaveInterval = null;
    let autosaveCounter = 0;

    const removeExistingDialogs = (className) => {
        document.querySelectorAll(`.${className}`).forEach(dialog => dialog.remove());
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    const closeAnyModal = () => {
        const modal = document.getElementById('menuModal');
        if (modal && modal.classList.contains('show')) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    };

    function getAllSaves() {
        try {
            return JSON.parse(localStorage.getItem('formSaves')) || {};
        } catch (e) {
            return {};
        }
    }

    function isCanvasEmpty(canvas) {
        try {
            const context = canvas.getContext('2d');
            const pixelBuffer = new Uint32Array(
                context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
            );
            return !pixelBuffer.some(color => color !== 0);
        } catch (error) {
            return true;
        }
    }

    function collectCanvasData() {
        const canvasData = {};
        document.querySelectorAll('canvas[id*="signature-canvas"]').forEach(canvas => {
            if (canvas.id) {
                try {
                    const dataURL = canvas.toDataURL('image/png');
                    if (!isCanvasEmpty(canvas)) {
                        canvasData[canvas.id] = dataURL;
                    }
                } catch (error) { }
            }
        });
        return canvasData;
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
        document.querySelectorAll('canvas[id*="signature-canvas"]').forEach(canvas => {
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        });
    }

    function showMobileAlert(message, type = 'info') {
        const icon = type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ';
        const color = type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3';

        const dialog = document.createElement('div');
        dialog.style.cssText = `position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;background:rgba(0,0,0,0.8)!important;display:flex!important;justify-content:center!important;align-items:center!important;z-index:99999!important;padding:15px!important;box-sizing:border-box!important;`;

        dialog.innerHTML = `
      <div style="background:white!important;border-radius:12px!important;padding:30px!important;text-align:center!important;box-shadow:0 10px 30px rgba(0,0,0,0.3)!important;border-top:4px solid ${color}!important;">
        <p style="font-size:1.3rem!important;margin:0 0 20px 0!important;color:${color}!important;">${icon} ${escapeHtml(message)}</p>
        <button class="alert-ok" style="padding:12px 25px!important;border:none!important;border-radius:6px!important;cursor:pointer!important;font-size:1rem!important;background-color:${color}!important;color:white!important;">OK</button>
      </div>
    `;

        document.body.appendChild(dialog);
        dialog.querySelector('.alert-ok').addEventListener('click', () => dialog.remove());
        if (type === 'success') {
            setTimeout(() => dialog.remove(), 3000);
        }
    }

    function showOverwriteModal(saveName) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'overwrite-warning-modal';
            modal.style.cssText = `position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;background:rgba(0,0,0,0.7)!important;display:flex!important;justify-content:center!important;align-items:center!important;z-index:99999!important;padding:20px!important;box-sizing:border-box!important;`;

            modal.innerHTML = `
        <div style="background:white!important;border-radius:12px!important;padding:30px!important;max-width:450px!important;width:100%!important;text-align:center!important;box-shadow:0 10px 30px rgba(0,0,0,0.3)!important;border-top:4px solid #4a6fa5!important;">
          <div style="font-size:3rem!important;color:#4a6fa5!important;margin-bottom:15px!important;">⚠️</div>
          <h3 style="margin:0 0 15px 0!important;color:#2c3e50!important;font-size:1.3rem!important;">Speicherstand bereits vorhanden</h3>
          <p style="margin:0 0 25px 0!important;color:#5a6c7d!important;line-height:1.4!important;">Ein Speicherstand mit dem Namen <strong>"${escapeHtml(saveName)}"</strong> existiert bereits.<br><br>Möchten Sie ihn überschreiben?</p>
          <div style="display:flex!important;gap:15px!important;justify-content:center!important;">
            <button id="overwrite-cancel" style="background:#6c757d!important;color:white!important;border:none!important;padding:12px 25px!important;border-radius:6px!important;cursor:pointer!important;font-size:1rem!important;font-weight:500!important;">Abbrechen</button>
            <button id="overwrite-confirm" style="background:#4a6fa5!important;color:white!important;border:none!important;padding:12px 25px!important;border-radius:6px!important;cursor:pointer!important;font-size:1rem!important;font-weight:500!important;">Überschreiben</button>
          </div>
        </div>
      `;

            document.body.appendChild(modal);

            document.getElementById('overwrite-confirm').addEventListener('click', () => {
                modal.remove();
                resolve(true);
            });

            document.getElementById('overwrite-cancel').addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    resolve(false);
                }
            });
        });
    }

    function showCancelModal() {
        const modal = document.createElement('div');
        modal.style.cssText = `position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;background:rgba(0,0,0,0.6)!important;display:flex!important;justify-content:center!important;align-items:center!important;z-index:99999!important;padding:20px!important;box-sizing:border-box!important;`;

        modal.innerHTML = `
      <div style="background:white!important;border-radius:12px!important;padding:25px!important;max-width:350px!important;width:100%!important;text-align:center!important;box-shadow:0 10px 30px rgba(0,0,0,0.3)!important;border-top:4px solid #6c757d!important;">
        <div style="font-size:2.5rem!important;color:#6c757d!important;margin-bottom:15px!important;">ℹ️</div>
        <h3 style="margin:0 0 15px 0!important;color:#2c3e50!important;font-size:1.2rem!important;">Speichervorgang abgebrochen</h3>
        <button id="cancel-ok" style="background:#6c757d!important;color:white!important;border:none!important;padding:10px 20px!important;border-radius:6px!important;cursor:pointer!important;font-size:0.95rem!important;font-weight:500!important;">OK</button>
      </div>
    `;

        document.body.appendChild(modal);
        document.getElementById('cancel-ok').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        setTimeout(() => {
            if (document.body.contains(modal)) modal.remove();
        }, 3000);
    }

    function showZaehlerWarning() {
        if (document.querySelector('.zaehler-warning-modal')) return;

        const modal = document.createElement('div');
        modal.className = 'zaehler-warning-modal';
        modal.style.cssText = `position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;background:rgba(0,0,0,0.7)!important;display:flex!important;justify-content:center!important;align-items:center!important;z-index:99999!important;padding:20px!important;box-sizing:border-box!important;`;

        modal.innerHTML = `
      <div style="background:white!important;border-radius:12px!important;padding:30px!important;max-width:400px!important;width:100%!important;text-align:center!important;box-shadow:0 10px 30px rgba(0,0,0,0.3)!important;border-top:4px solid #4a6fa5!important;">
        <div style="font-size:3rem!important;color:#4a6fa5!important;margin-bottom:15px!important;">⚠️</div>
        <h3 style="margin:0 0 15px 0!important;color:#2c3e50!important;font-size:1.3rem!important;">Maximale Zeichenanzahl erreicht</h3>
        <p style="margin:0 0 25px 0!important;color:#5a6c7d!important;line-height:1.4!important;">Der Zählerstand ist auf <strong>14 Zeichen</strong> begrenzt.<br>Sie haben das Maximum erreicht.</p>
        <button id="zaehler-warning-ok" style="background:#4a6fa5!important;color:white!important;border:none!important;padding:12px 25px!important;border-radius:6px!important;cursor:pointer!important;font-size:1rem!important;font-weight:500!important;">OK, verstanden</button>
      </div>
    `;

        document.body.appendChild(modal);
        document.getElementById('zaehler-warning-ok').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        setTimeout(() => {
            if (document.body.contains(modal)) modal.remove();
        }, 4000);
    }

    function collectFormData() {
        const formData = {};
        document.querySelectorAll('input, select, textarea').forEach(element => {
            if (element.id) {
                formData[element.id] = element.type === 'checkbox' || element.type === 'radio' ? element.checked : element.value;
            }
        });
        return formData;
    }

    function collectToggleData() {
        const toggleData = {};
        document.querySelectorAll('.toggle-options').forEach(toggle => {
            const activeElement = toggle.querySelector('.toggle-option.active');
            if (activeElement) {
                const toggleHeader = toggle.closest('.toggle-header');
                const toggleText = toggleHeader ? toggleHeader.textContent.trim().split('\n')[0] : 'unknown';
                toggleData[toggleText] = {
                    activeOption: toggle.dataset.activeOption,
                    activeValue: activeElement.dataset.value
                };
            }
        });
        return toggleData;
    }

    function collectBemerkungsData() {
        const bemerkungsData = {};

        // Standard-Räume Bemerkungen
        const containers = document.querySelectorAll('.bemerkung-container[data-bemerkung-id]');
        containers.forEach(container => {
            const bemerkungId = container.getAttribute('data-bemerkung-id');
            const input = container.querySelector('.bemerkung-input');
            const raum = input ? input.getAttribute('data-raum') : '';

            if (input && input.value.trim()) {
                bemerkungsData[bemerkungId] = {
                    value: input.value.trim(),
                    raum: raum
                };
            }
        });

        // Zimmer-Bemerkungen
        const zimmerSections = document.querySelectorAll('.zimmer-section');
        zimmerSections.forEach(section => {
            const zimmerContainer = section.querySelector('[id^="zimmer-container-"]');
            if (zimmerContainer) {
                const zimmerMatch = zimmerContainer.id.match(/zimmer-container-(\d+)/);
                if (zimmerMatch) {
                    const zimmerNr = zimmerMatch[1];
                    const zimmerBemerkungRows = section.querySelectorAll('tr.bemerkung-row');
                    zimmerBemerkungRows.forEach((row, index) => {
                        const bemerkungContainer = row.querySelector('.bemerkung-container');
                        if (bemerkungContainer) {
                            const input = bemerkungContainer.querySelector('.bemerkung-input');
                            if (input && input.value.trim()) {
                                const bemerkungId = `bemerkung-zimmer-${zimmerNr}-${index}`;
                                bemerkungsData[bemerkungId] = {
                                    value: input.value.trim(),
                                    raum: `zimmer-${zimmerNr}`
                                };
                            }
                        }
                    });
                }
            }
        });

        return bemerkungsData;
    }

    function collectDynamicData() {
        const collectEntryData = (selector, idExtractor, dataExtractor) => {
            const data = {};
            document.querySelectorAll(selector).forEach(entry => {
                const id = idExtractor(entry);
                const extractedData = dataExtractor(entry);
                if (Object.values(extractedData).some(v => v)) {
                    data[id] = extractedData;
                }
            });
            return data;
        };

        return {
            mieterData: collectEntryData('.tenant-entry', entry => entry.id, entry => ({
                name: entry.querySelector('[id^="tenant-name-"]')?.value || '',
                firstname: entry.querySelector('[id^="tenant-firstname-"]')?.value || '',
                phone: entry.querySelector('[id^="tenant-phone-"]')?.value || '',
                email: entry.querySelector('[id^="tenant-email-"]')?.value || ''
            })),
            auszugMieterData: collectEntryData('.moveout-entry', entry => entry.id, entry => ({
                name: entry.querySelector('[id^="moveout-name-"]')?.value || '',
                firstname: entry.querySelector('[id^="moveout-firstname-"]')?.value || '',
                phone: entry.querySelector('[id^="moveout-addr-"]')?.value || '',
                email: entry.querySelector('[id^="moveout-email-"]')?.value || ''
            })),
            schluesselData: collectEntryData('.key-entry', entry => entry.id, entry => ({
                type: entry.querySelector('[id^="key-type-select-"]')?.value || '',
                customType: entry.querySelector('[id^="key-custom-type-"]')?.value || '',
                amount: entry.querySelector('[id^="key-amount-input-"]')?.value || '1',
                note: entry.querySelector('[id^="key-note-input-"]')?.value || ''
            })),
            zaehlerData: collectEntryData('.zaehler-entry', entry => entry.id, entry => ({
                type: entry.querySelector('[id^="zaehler-type-select-"]')?.value || '',
                customType: entry.querySelector('[id^="zaehler-custom-type-"]')?.value || '',
                number: entry.querySelector('[id^="zaehler-number-input-"]')?.value || '',
                location: entry.querySelector('[id^="zaehler-location-input-"]')?.value || '',
                value: entry.querySelector('[id^="zaehler-value-input-"]')?.value || ''
            }))
        };
    }

    function collectZimmerData() {
        const zimmerData = {};
        const zimmerSections = document.querySelectorAll('.zimmer-section');

        zimmerSections.forEach((section) => {
            const zimmerContainer = section.querySelector('[id^="zimmer-container-"]');
            if (zimmerContainer) {
                const zimmerNr = zimmerContainer.id.replace('zimmer-container-', '');

                // NEUE BEMERKUNGSSTRUKTUR - Alle bemerkung-row Zeilen in diesem Zimmer finden
                const zimmerBemerkungen = [];
                const bemerkungRows = section.querySelectorAll('tr.bemerkung-row');

                bemerkungRows.forEach((row, rowIndex) => {
                    const bemerkungContainer = row.querySelector('.bemerkung-container');
                    if (bemerkungContainer) {
                        const input = bemerkungContainer.querySelector('.bemerkung-input');
                        if (input && input.value.trim()) {
                            const bemerkung = {
                                id: input.id, // z.B. "bemerkung-zimmer-1-0"
                                value: input.value.trim(),
                                index: rowIndex,
                                raum: `zimmer-${zimmerNr}`
                            };
                            zimmerBemerkungen.push(bemerkung);
                        }
                    }
                });

                // Weitere Zimmer-Daten sammeln
                const lageInput = section.querySelector(`#lageinputzimm${zimmerNr}`);
                const rauchmelderInput = section.querySelector(`#rauchmelder-anzahl-${zimmerNr}`);
                const wandfarbeInput = section.querySelector(`#wandfarbe-${zimmerNr}`);
                const fussbodenInput = section.querySelector(`#fussbodenzimm${zimmerNr}`);

                // Checkbox-Zustände sammeln
                const checkboxData = {};
                const checkboxes = section.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(checkbox => {
                    if (checkbox.id) {
                        checkboxData[checkbox.id] = checkbox.checked;
                    }
                });

                // Select-Zustände sammeln
                const selectData = {};
                const selects = section.querySelectorAll('select');
                selects.forEach(select => {
                    if (select.id) {
                        selectData[select.id] = select.value;
                    }
                });

                zimmerData[zimmerNr] = {
                    nummer: zimmerNr,
                    lage: lageInput ? lageInput.value : '',
                    rauchmelderAnzahl: rauchmelderInput ? rauchmelderInput.value : '0',
                    wandfarbe: wandfarbeInput ? wandfarbeInput.value : '',
                    fussboden: fussbodenInput ? fussbodenInput.value : '',
                    bemerkungen: zimmerBemerkungen,
                    checkboxes: checkboxData,
                    selects: selectData
                };
            }
        });

        return zimmerData;
    }

    function collectUnterschriftenData() {
        const unterschriftenData = {};
        try {
            document.querySelectorAll('canvas[id*="signature-canvas"]').forEach(canvas => {
                const canvasId = canvas.id;

                if (canvasId.includes('tenant-signature-canvas-')) {
                    const number = canvasId.replace('tenant-signature-canvas-', '');
                    const nameSpan = document.getElementById(`tenant-signature-name-${number}`);
                    try {
                        if (!isCanvasEmpty(canvas)) {
                            unterschriftenData[`tenant-${number}`] = {
                                type: 'tenant',
                                number: number,
                                signature: canvas.toDataURL('image/png'),
                                name: nameSpan?.textContent?.trim() || ''
                            };
                        }
                    } catch (e) { }
                } else if (canvasId.includes('moveout-signature-canvas-')) {
                    const number = canvasId.replace('moveout-signature-canvas-', '');
                    const nameSpan = document.getElementById(`moveout-signature-name-${number}`);
                    try {
                        if (!isCanvasEmpty(canvas)) {
                            unterschriftenData[`moveout-${number}`] = {
                                type: 'moveout',
                                number: number,
                                signature: canvas.toDataURL('image/png'),
                                name: nameSpan?.textContent?.trim() || ''
                            };
                        }
                    } catch (e) { }
                } else if (canvasId === 'landlord-signature-canvas') {
                    const nameSpan = document.getElementById('landlord-signature-name');
                    try {
                        if (!isCanvasEmpty(canvas)) {
                            unterschriftenData['landlord'] = {
                                type: 'landlord',
                                signature: canvas.toDataURL('image/png'),
                                name: nameSpan?.textContent?.trim() || ''
                            };
                        }
                    } catch (e) { }
                }
            });
        } catch (error) { }
        return unterschriftenData;
    }

    async function saveFormData(saveName) {
        try {
            console.log('🔍 Speicherplatz vor dem Sammeln der Daten:');
            checkLocalStorageSize();

            const allSaves = getAllSaves();
            if (allSaves[saveName]) {
                const confirmed = await showOverwriteModal(saveName);
                if (!confirmed) return false;
            }

            const dynamicData = collectDynamicData();
            const zimmerData = collectZimmerData(); // Sammelt Zimmer-Daten
            const bemerkungsData = collectBemerkungsData(); // Sammelt alle Bemerkungen

            // DEBUG: Zimmer-Bemerkungen anzeigen
            console.log('🏠 Gesammelte Zimmer-Daten:', zimmerData);
            console.log('💬 Gesammelte Bemerkungsdaten:', bemerkungsData);

            const saveData = {
                data: collectFormData(),
                toggleData: collectToggleData(),
                bemerkungsData: bemerkungsData,
                ...dynamicData,
                zimmerData: zimmerData,
                unterschriftenData: collectUnterschriftenData(),
                canvasData: collectCanvasData(),
                timestamp: new Date().toISOString()
            };

            allSaves[saveName] = saveData;

            try {
                localStorage.setItem('formSaves', JSON.stringify(allSaves));

                // NEUE ZEILEN: Bilder separat speichern
                if (window.saveImageDataToDB) {
                    const imageData = await window.collectImageData();
                    await window.saveImageDataToDB(saveName, imageData);
                }

                console.log('✅ Erfolgreich gespeichert:', saveName);
                return true;

            } catch (quotaError) {
                if (quotaError.name === 'QuotaExceededError' || quotaError.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                    console.log('📦 LocalStorage voll - versuche Cleanup...');
                    cleanupOldEntries(10);

                    try {
                        const cleanedSaves = getAllSaves();
                        cleanedSaves[saveName] = saveData;
                        localStorage.setItem('formSaves', JSON.stringify(cleanedSaves));
                        showMobileAlert('Alte Einträge gelöscht - erfolgreich gespeichert', 'success');
                        return true;
                    } catch (finalError) {
                        console.error('💥 Speichern komplett fehlgeschlagen:', finalError);
                        return false;
                    }
                } else {
                    console.error('💥 Unbekannter Speicherfehler:', quotaError);
                    return false;
                }
            }

        } catch (error) {
            console.error('💥 Allgemeiner Fehler beim Sammeln der Daten:', error);
            return false;
        }
    }

    function checkLocalStorageSize() {
        try {
            const saves = getAllSaves();
            const dataStr = JSON.stringify(saves);
            const sizeInMB = (new Blob([dataStr]).size / 1024 / 1024).toFixed(2);
            console.log(`📊 LocalStorage Größe: ${sizeInMB} MB`);

            if (parseFloat(sizeInMB) > 4) {
                console.warn('⚠️ LocalStorage wird knapp (>4MB)');
            }

            return sizeInMB;
        } catch (error) {
            return 'Fehler';
        }
    }

 function promptSaveName() {
    if (isProcessing) return;
    isProcessing = true;

    try {
        const storageSize = checkLocalStorageSize();
        console.log(`💾 Aktueller Speicherverbrauch vor Speichern: ${storageSize} MB`);

        removeExistingDialogs('save-name-dialog');
        const strasseField = document.getElementById('strasseeinzug');
        const defaultName = strasseField?.value.trim() ? `${strasseField.value.trim()}_` : `Speicherstand_${new Date().toLocaleDateString('de-DE')}`;

        const dialog = document.createElement('div');
        dialog.className = 'modal-overlay save-name-dialog';
        dialog.style.cssText = `position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;background:rgba(0,0,0,0.8)!important;display:flex!important;justify-content:center!important;align-items:center!important;z-index:99999!important;padding:15px!important;box-sizing:border-box!important;visibility:visible!important;opacity:1!important;`;

        dialog.innerHTML = `
        <div style="background:white!important;border-radius:12px!important;width:100%!important;max-width:500px!important;padding:30px!important;box-shadow:0 10px 30px rgba(0,0,0,0.3)!important;position:relative!important;z-index:100000!important;">
          <h3 style="margin:0 0 20px 0!important;font-size:1.5rem!important;color:#333!important;text-align:center!important;">Speicherstand benennen</h3>
          <input type="text" id="saveNameInput" placeholder="Name eingeben" value="${escapeHtml(defaultName)}" maxlength="50" autocomplete="off" style="width:100%!important;padding:15px!important;border:2px solid #ddd!important;border-radius:8px!important;font-size:1.1rem!important;margin:15px 0!important;box-sizing:border-box!important;outline:none!important;">
          <div style="display:flex!important;gap:15px!important;justify-content:flex-end!important;margin-top:25px!important;">
            <button id="cancelSave" style="padding:12px 25px!important;border:none!important;border-radius:6px!important;cursor:pointer!important;font-size:1rem!important;background-color:#6c757d!important;color:white!important;transition:all 0.2s!important;">Abbrechen</button>
            <button id="confirmSave" style="padding:12px 25px!important;border:none!important;border-radius:6px!important;cursor:pointer!important;font-size:1rem!important;background-color:#335d92!important;color:white!important;transition:all 0.2s!important;">Speichern</button>
          </div>
        </div>
      `;

        document.body.appendChild(dialog);

        setTimeout(() => {
            const inputField = document.getElementById('saveNameInput');
            if (inputField) {
                inputField.focus();
                inputField.selectionStart = inputField.selectionEnd = defaultName.length;
            }
        }, 100);

        const showCountdownModal = () => {
            const inputField = document.getElementById('saveNameInput');
            const name = inputField.value.trim();
            
            if (!name) {
                inputField.focus();
                inputField.style.borderColor = '#f44336!important';
                return;
            }

            dialog.remove();

            const countdownDialog = document.createElement('div');
            countdownDialog.className = 'modal-overlay countdown-dialog';
            countdownDialog.style.cssText = `position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;background:rgba(0,0,0,0.8)!important;display:flex!important;justify-content:center!important;align-items:center!important;z-index:99999!important;padding:15px!important;box-sizing:border-box!important;visibility:visible!important;opacity:1!important;`;

            countdownDialog.innerHTML = `
                <div style="background:white!important;border-radius:12px!important;width:100%!important;max-width:400px!important;padding:40px!important;box-shadow:0 10px 30px rgba(0,0,0,0.3)!important;position:relative!important;z-index:100000!important;text-align:center!important;">
                  <h3 style="margin:0 0 30px 0!important;font-size:1.5rem!important;color:#333!important;">Speichervorgang startet in:</h3>
                  <div id="countdownNumber" style="font-size:4rem!important;font-weight:bold!important;color:#335d92!important;margin:20px 0!important;line-height:1!important;">3</div>
                  <div style="margin-top:30px!important;">
                    <button id="cancelCountdown" style="padding:12px 25px!important;border:none!important;border-radius:6px!important;cursor:pointer!important;font-size:1rem!important;background-color:#6c757d!important;color:white!important;transition:all 0.2s!important;">Abbrechen</button>
                  </div>
                </div>
            `;

            document.body.appendChild(countdownDialog);

            let countdown = 3;
            const countdownElement = document.getElementById('countdownNumber');
            
            const countdownInterval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    countdownElement.textContent = countdown;
                } else {
                    clearInterval(countdownInterval);
                    countdownDialog.remove();
                    performSave(name);
                }
            }, 1000);

            document.getElementById('cancelCountdown').addEventListener('click', () => {
                clearInterval(countdownInterval);
                countdownDialog.remove();
                showCancelModal();
                isProcessing = false;
            });

            countdownDialog.addEventListener('click', (e) => {
                if (e.target === countdownDialog) {
                    clearInterval(countdownInterval);
                    countdownDialog.remove();
                    showCancelModal();
                    isProcessing = false;
                }
            });

            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    clearInterval(countdownInterval);
                    countdownDialog.remove();
                    showCancelModal();
                    isProcessing = false;
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        };

        const performSave = async (name) => {
            console.log('🔍 Prüfe Speicherplatz vor dem Speichern...');
            checkLocalStorageSize();

            const saveResult = await saveFormData(name);
            if (saveResult) {
                showMobileAlert('Speicherstand erfolgreich gespeichert!', 'success');
                closeAnyModal();
            } else {
                const allSaves = getAllSaves();
                if (!allSaves[name]) {
                    showMobileAlert('Fehler beim Speichern!', 'error');
                }
            }
            isProcessing = false;
        };

        const handleCancel = () => {
            dialog.remove();
            showCancelModal();
            isProcessing = false;
        };

        document.getElementById('confirmSave').addEventListener('click', showCountdownModal);
        document.getElementById('cancelSave').addEventListener('click', handleCancel);
        document.getElementById('saveNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                showCountdownModal();
            }
        });

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) handleCancel();
        });

    } catch (error) {
        isProcessing = false;
    }
}











    async function exportFormData() {
        try {
            const dynamicData = collectDynamicData();
            const exportData = {
                data: collectFormData(),
                toggleData: collectToggleData(),
                bemerkungsData: collectBemerkungsData(),
                ...dynamicData,
                zimmerData: collectZimmerData(),
                unterschriftenData: collectUnterschriftenData(),
                canvasData: collectCanvasData(),
                timestamp: new Date().toISOString(),
                exportMetadata: {
                    version: '3.0',
                    source: 'optimized-saveloadlocal.js'
                }
            };
            const hasData = Object.values(exportData).some(data =>
                typeof data === 'object' && data !== null && Object.keys(data).length > 0
            );
            if (!hasData) {
                showMobileAlert("Keine Daten zum Export gefunden", false);
                return;
            }
            const straßenname = document.getElementById('strasseeinzug')?.value || 'UnbekannteStrasse';
            const now = new Date();
            const datumZeit = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
            const cleanStraßenname = straßenname.replace(/[^a-zA-Z0-9äöüÄÖÜß\- ]/g, '').trim().replace(/\s+/g, '_');
            const defaultFilename = `Export_${cleanStraßenname}_${datumZeit}.json`;
            showFilenameModal(defaultFilename, async (finalFilename) => {
                const dataStr = JSON.stringify(exportData, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = finalFilename;
                link.click();
                showMobileAlert('Export erfolgreich gespeichert!', 'success');
                setTimeout(() => URL.revokeObjectURL(url), 100);
            }, () => {
                showMobileAlert("Export abgebrochen", false);
            });
        } catch (error) {
            showMobileAlert("Fehler beim Export: " + error.message, false);
        }
    }

    function importFormData() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const importData = JSON.parse(e.target.result);

                    // NEUE ZEILEN: Legacy imageData behandeln
                    if (importData.imageData && window.importImageData) {
                        await window.importImageData(importData, 'imported_' + Date.now());
                    }

                    await loadImportedData(importData);
                    showMobileAlert('Import erfolgreich!', 'success');
                } catch (error) {
                    showMobileAlert("Fehler beim Import: " + error.message, false);
                }
            };
            reader.readAsText(file);
        });
        fileInput.click();
    }




    async function loadImportedData(saveData) {
        resetDynamicElements();

        if (saveData.toggleData) {
            restoreToggleData(saveData.toggleData);
        }

        const delays = {
            zimmer: 200,
            mieter: 300,
            auszugMieter: 400,
            schluessel: 500,
            zaehler: 600,
            form: 700,
            bemerkungen: 800,
            unterschriften: 900
        };

        // Zimmer-Daten laden
        if (saveData.zimmerData) {
            setTimeout(() => {
                console.log('🏠 Lade Zimmer-Daten...');
                Object.entries(saveData.zimmerData).forEach(([zimmerNr, zimmerInfo]) => {
                    createZimmerFromSave(zimmerNr, zimmerInfo);
                });
            }, delays.zimmer);
        }

        const restoreElements = (data, createFunc, delay) => {
            if (data) {
                setTimeout(() => {
                    Object.entries(data).forEach(([key, info]) => {
                        const number = key.replace(/\D+/g, '');
                        createFunc(number, info);
                    });
                }, delay);
            }
        };

        restoreElements(saveData.mieterData, createMieterFromSave, delays.mieter);
        restoreElements(saveData.auszugMieterData, createAuszugMieterFromSave, delays.auszugMieter);
        restoreElements(saveData.schluesselData, createSchluesselFromSave, delays.schluessel);
        restoreElements(saveData.zaehlerData, createZaehlerFromSave, delays.zaehler);

        // Formular-Daten laden
        setTimeout(() => {
            const formData = saveData.data || saveData.formData;
            if (formData) {
                Object.entries(formData).forEach(([id, value]) => {
                    const element = document.getElementById(id);
                    if (element) {
                        if (element.type === 'checkbox' || element.type === 'radio') {
                            element.checked = value;
                        } else {
                            element.value = value;
                        }
                    }
                });
            }
        }, delays.form);

        // NEUE BEMERKUNGSLOGIK FÜR BEIDE STRUKTUREN























        if (saveData.bemerkungsData) {
            setTimeout(() => {
                console.log('📝 Lade Bemerkungsdaten...');

                loadBemerkungsDataAdvanced(saveData.bemerkungsData);

                // Neue erweiterte Logik für Standard-Räume
                const standardRooms = ['kueche', 'bad', 'wc', 'flur', 'abstellraum', 'nebenraum', 'regelungen'];
                const roomBemerkungen = {};

                // Sammle alle Bemerkungen nach Räumen
                Object.entries(saveData.bemerkungsData).forEach(([bemerkungId, bemerkungData]) => {
                    if (typeof bemerkungData === 'object' && bemerkungData.value) {

                        // Zimmer-Bemerkungen direkt setzen
                        if (bemerkungId.startsWith('bemerkung-zimmer-')) {
                            const input = document.getElementById(bemerkungId);
                            if (input) {
                                input.value = bemerkungData.value;
                                console.log(`✅ Zimmer-Bemerkung: ${bemerkungId} = "${bemerkungData.value}"`);
                            }
                        }
                        // Standard-Räume sammeln
                        else {
                            const parts = bemerkungId.split('-');
                            if (parts.length >= 3 && parts[0] === 'bemerkung') {
                                const raum = parts[1];
                                const index = parseInt(parts[2]) || 0;

                                if (standardRooms.includes(raum)) {
                                    if (!roomBemerkungen[raum]) roomBemerkungen[raum] = [];
                                    roomBemerkungen[raum][index] = {
                                        id: bemerkungId,
                                        value: bemerkungData.value
                                    };
                                }
                            }
                        }
                    }
                    // Legacy Array-Struktur (falls noch vorhanden)
                    else if (Array.isArray(bemerkungData)) {
                        const raum = bemerkungId;
                        bemerkungData.forEach(bemerkung => {
                            const existingContainer = document.querySelector(`[data-bemerkung-id="${bemerkung.id}"]`);
                            if (!existingContainer) {
                                createBemerkungRow(raum, bemerkung.id, bemerkung.value);
                            } else {
                                const input = existingContainer.querySelector('.bemerkung-input');
                                if (input) {
                                    input.value = bemerkung.value;
                                    console.log(`✅ Legacy-Struktur: ${bemerkung.id} = "${bemerkung.value}"`);
                                }
                            }
                        });
                    }
                });

                // Standard-Räume verarbeiten - fehlende Zeilen erstellen
                standardRooms.forEach(raum => {
                    if (roomBemerkungen[raum]) {
                        roomBemerkungen[raum].forEach((bemerkung, index) => {
                            if (!bemerkung) return;

                            let input = document.getElementById(bemerkung.id);

                            // Wenn Input nicht existiert, neue Zeile erstellen
                            if (!input) {
                                if (createBemerkungRowForStandardRoom(raum, bemerkung.id, bemerkung.value)) {
                                    input = document.getElementById(bemerkung.id);
                                    console.log(`🆕 Neue Bemerkungszeile erstellt: ${bemerkung.id}`);
                                }
                            }

                            // Wert setzen (falls noch nicht gesetzt)
                            if (input && !input.value) {
                                input.value = bemerkung.value;
                                console.log(`✅ Standard-Raum-Bemerkung: ${bemerkung.id} = "${bemerkung.value}"`);
                            }
                        });

                        // Counter aktualisieren
                        if (window.bemerkungCounters && roomBemerkungen[raum].length > 0) {
                            const maxIndex = Math.max(...roomBemerkungen[raum].map((b, i) => b ? i : -1));
                            window.bemerkungCounters[raum] = Math.max(window.bemerkungCounters[raum] || 1, maxIndex + 1);
                            console.log(`🔧 Counter für ${raum} aktualisiert: ${window.bemerkungCounters[raum]}`);
                        }
                    }
                });

                // Zimmer-Bemerkungen aus zimmerData (Fallback)
                if (saveData.zimmerData) {
                    Object.entries(saveData.zimmerData).forEach(([zimmerNr, zimmerInfo]) => {
                        if (zimmerInfo.bemerkungen && zimmerInfo.bemerkungen.length > 0) {
                            zimmerInfo.bemerkungen.forEach((bemerkung, index) => {
                                const bemerkungId = `bemerkung-zimmer-${zimmerNr}-${index}`;
                                const input = document.getElementById(bemerkungId);
                                if (input && bemerkung.value) {
                                    input.value = bemerkung.value;
                                    console.log(`✅ Zimmer-Bemerkung aus zimmerData: ${bemerkungId} = "${bemerkung.value}"`);
                                }
                            });
                        }
                    });
                }

            }, delays.bemerkungen);
        }












        // Unterschriften laden
        if (saveData.unterschriftenData) {
            setTimeout(() => {
                Object.entries(saveData.unterschriftenData).forEach(([key, signatureInfo]) => {
                    restoreSignature(key, signatureInfo);
                });
            }, delays.unterschriften);
        }

        // Finale Initialisierungen
        setTimeout(() => {
            if (saveData.canvasData) restoreCanvasData(saveData.canvasData);

            if (window.loadImageDataFromDB) {
                const currentSaveName = window.currentLoadedSaveName || saveData.saveName || 'imported_' + Date.now();
                window.loadImageDataFromDB(currentSaveName);
            }

            setupTenantNameListeners();
            restoreAddButtonListeners();
            resetBemerkungCounters();

            if (typeof initAutocomplete === 'function') {
                initAutocomplete();
            }

            if (typeof initColorSuggestions === 'function') {
                document.querySelectorAll('[id^="wandfarbe-"]').forEach(input => {
                    const zimmerNr = input.id.replace('wandfarbe-', '');
                    if (zimmerNr) {
                        initColorSuggestions(zimmerNr);
                    }
                });
            }

            if (typeof window.initBodenForZimmer === 'function') {
                document.querySelectorAll('[id^="fussbodenzimm"]').forEach(input => {
                    const zimmerNr = input.id.replace('fussbodenzimm', '');
                    if (zimmerNr) {
                        window.initBodenForZimmer(zimmerNr);
                    }
                });
            }

            if (typeof window.initBemerkungen === 'function') {
                document.querySelectorAll('[id^="zimmer-container-"]').forEach(container => {
                    const zimmerNr = container.id.replace('zimmer-container-', '');
                    if (zimmerNr) {
                        window.initBemerkungen(zimmerNr);
                        console.log(`Bemerkungen-Listener für Zimmer ${zimmerNr} initialisiert`);
                    }
                });
            }

            // DIESE ZEILEN HINZUFÜGEN:
            // Zimmer-Counter nach dem Laden aktualisieren
            const existingZimmer = document.querySelectorAll('[id^="zimmer-container-"]');
            let maxZimmerNr = 0;
            existingZimmer.forEach(container => {
                const zimmerNr = parseInt(container.id.replace('zimmer-container-', ''));
                if (zimmerNr > maxZimmerNr) maxZimmerNr = zimmerNr;
            });

            // zimmerCount Variable aktualisieren (falls sie global verfügbar ist)
            if (typeof zimmerCount !== 'undefined') {
                zimmerCount = maxZimmerNr;
            }
            if (typeof window.zimmerCount !== 'undefined') {
                window.zimmerCount = maxZimmerNr;
            }

            console.log(`🔧 Zimmer-Counter nach Laden aktualisiert: ${maxZimmerNr}`);

            console.log('Alle Daten und Event-Listener geladen');

        }, delays.unterschriften + 300);
    }





    function resetDynamicElements() {
        const tenantButton = document.getElementById('einzugtenant');
        if (tenantButton) {
            tenantButton.className = '';
            tenantButton.style.cssText = '';
            tenantButton.innerHTML = '<i class="fas fa-user"></i>+ Mieter Einzug';
        }

        const auszugButton = document.getElementById('auszugtenant');
        if (auszugButton) {
            auszugButton.className = '';
            auszugButton.style.cssText = '';
            auszugButton.innerHTML = '<i class="fas fa-user"></i>+ Mieter Auszug';
        }

        document.querySelectorAll('.tenant-entry').forEach(entry => entry.remove());
        document.querySelectorAll('.moveout-entry').forEach(entry => entry.remove());
        document.querySelectorAll('.zimmer-section').forEach(section => section.remove());
        document.querySelectorAll('.key-entry').forEach(entry => entry.remove());
        document.querySelectorAll('.zaehler-entry').forEach(entry => entry.remove());
    }

    function restoreToggleData(toggleData) {
        Object.entries(toggleData).forEach(([toggleText, toggleInfo]) => {
            document.querySelectorAll('.toggle-header').forEach(header => {
                if (header.textContent.trim().split('\n')[0] === toggleText) {
                    const toggleOptions = header.querySelector('.toggle-options');
                    if (toggleOptions) {
                        toggleOptions.querySelectorAll('.toggle-option').forEach(opt => opt.classList.remove('active'));
                        const targetOption = toggleOptions.querySelector(`[data-value="${toggleInfo.activeValue}"]`);
                        if (targetOption) {
                            targetOption.classList.add('active');
                            toggleOptions.dataset.activeOption = toggleInfo.activeOption;
                            const roomToggle = header.closest('.room-toggle');
                            if (roomToggle) {
                                const container = document.getElementById(roomToggle.dataset.room + '-container');
                                if (container) {
                                    container.style.display = toggleInfo.activeValue === 'ja' ? 'block' : 'none';
                                }
                            }
                        }
                    }
                }
            });
        });
    }

    function restoreSignature(key, signatureInfo) {
        let canvasId, nameSpanId;

        if (key === 'landlord') {
            canvasId = 'landlord-signature-canvas';
            nameSpanId = 'landlord-signature-name';
        } else if (signatureInfo.type === 'tenant') {
            canvasId = `tenant-signature-canvas-${signatureInfo.number}`;
            nameSpanId = `tenant-signature-name-${signatureInfo.number}`;
        } else if (signatureInfo.type === 'moveout') {
            canvasId = `moveout-signature-canvas-${signatureInfo.number}`;
            nameSpanId = `moveout-signature-name-${signatureInfo.number}`;
        }

        if (canvasId) {
            const canvas = document.getElementById(canvasId);
            const nameSpan = document.getElementById(nameSpanId);

            if (canvas) {
                const context = canvas.getContext('2d');
                const image = new Image();
                image.onload = function () {
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    context.drawImage(image, 0, 0);
                };
                image.src = signatureInfo.signature;
            }

            if (nameSpan) {
                nameSpan.textContent = signatureInfo.name;
            }
        }
    }

    function showFilenameModal(defaultFilename, onConfirm, onCancel) {
        const modal = document.createElement('div');
        modal.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.6);display:flex;justify-content:center;align-items:center;z-index:999999;padding:20px;box-sizing:border-box;`;

        modal.innerHTML = `
          <div style="background:#ffffff;border-radius:12px;max-width:500px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,0.3);animation:fadeIn 0.3s ease-out;">
            <div style="padding:24px 24px 16px 24px;border-bottom:1px solid #e0e0e0;display:flex;justify-content:space-between;align-items:center;">
              <h3 style="margin:0;color:#333;font-size:1.3em;font-weight:600;">Export-Datei speichern</h3>
              <button class="close-btn" style="background:none;border:none;font-size:28px;cursor:pointer;color:#999;padding:4px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:50%;">&times;</button>
            </div>
            <div style="padding:24px;">
              <label style="display:block;margin-bottom:8px;color:#555;font-weight:500;">Dateiname:</label>
              <input type="text" id="filenameInput" placeholder="Dateiname eingeben" style="width:100%;padding:12px 16px;border:2px solid #ddd;border-radius:6px;font-size:16px;box-sizing:border-box;">
              <small style="display:block;margin-top:8px;color:#888;font-size:0.9em;">Die Endung .json wird automatisch hinzugefügt</small>
            </div>
            <div style="padding:16px 24px 24px 24px;display:flex;gap:12px;justify-content:flex-end;">
              <button class="cancel-btn" style="padding:12px 24px;border:none;border-radius:6px;cursor:pointer;font-size:16px;font-weight:500;background:#757575;color:white;min-width:100px;">Abbrechen</button>
              <button class="confirm-btn" style="padding:12px 24px;border:none;border-radius:6px;cursor:pointer;font-size:16px;font-weight:500;background:#4a6fa5;color:white;min-width:100px;">Speichern</button>
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        const input = modal.querySelector('#filenameInput');
        const confirmBtn = modal.querySelector('.confirm-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const closeBtn = modal.querySelector('.close-btn');

        const nameWithoutExtension = defaultFilename.replace(/\.json$/, '');
        input.value = nameWithoutExtension;
        input.select();

        const handleConfirm = () => {
            const filename = input.value.trim();
            if (!filename) {
                input.focus();
                return;
            }
            const finalFilename = filename.endsWith('.json') ? filename : filename + '.json';
            modal.remove();
            onConfirm(finalFilename);
        };

        const handleCancel = () => {
            modal.remove();
            if (onCancel) onCancel();
        };

        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        closeBtn.addEventListener('click', handleCancel);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirm();
            } else if (e.key === 'Escape') {
                handleCancel();
            }
        });

        setTimeout(() => input.focus(), 100);
    }

    function generateAutosaveName() {
        try {
            const strasse = document.getElementById('strasseeinzug')?.value.trim() || 'Protokoll';
            const now = new Date();
            const dateStr = now.toLocaleDateString('de-DE').replace(/\./g, '-');
            const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '-');
            autosaveCounter++;
            return `AutoSave_${strasse}_${dateStr}_${timeStr}_${autosaveCounter}`.replace(/[/\\?%*:|"<>]/g, '_');
        } catch (e) {
            autosaveCounter++;
            return `AutoSave_${Date.now()}_${autosaveCounter}`;
        }
    }

    async function performAutosave() {
        try {
            const saveName = generateAutosaveName();
            await saveFormData(saveName);

            const saves = getAllSaves();
            const autoSaves = Object.keys(saves).filter(name => name.startsWith('AutoSave_'));

            if (autoSaves.length > 10) {
                const sortedAutoSaves = autoSaves.sort((a, b) => new Date(saves[a].timestamp) - new Date(saves[b].timestamp));
                const toDelete = sortedAutoSaves.slice(0, autoSaves.length - 10);
                toDelete.forEach(name => delete saves[name]);
                localStorage.setItem('formSaves', JSON.stringify(saves));
            }
        } catch (error) { }
    }

    function startAutosave() {
        if (autosaveInterval) {
            clearInterval(autosaveInterval);
        }
        autosaveInterval = setInterval(() => {
            performAutosave();
        }, 240000);
    }

    function stopAutosave() {
        if (autosaveInterval) {
            clearInterval(autosaveInterval);
            autosaveInterval = null;
        }
    }

    function clearAllInputs() {
        if (!confirm('Wirklich alle Eingaben und Signaturen löschen?')) return;

        document.querySelectorAll('input, select, textarea').forEach(element => {
            if (element.type === 'checkbox' || element.type === 'radio') {
                element.checked = false;
            } else {
                element.value = '';
            }
        });

        clearAllCanvases();
        resetDynamicElements();

        showMobileAlert('Alle Eingaben und Signaturen wurden gelöscht!', 'success');
        closeAnyModal();
    }

    function deleteState(saveName) {
        try {
            const allSaves = getAllSaves();
            delete allSaves[saveName];
            localStorage.setItem('formSaves', JSON.stringify(allSaves));

            // NEUE ZEILEN: Auch Bilder löschen
            if (window.deleteSaveAndImages) {
                window.deleteSaveAndImages(saveName);
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    // Erstelle Element-Funktionen (ohne Bild-Funktionalität)
    const createElementFromSave = (elementType, number, info, buttonId, headerClass, headerHTML, entryClass, entryHTML) => {
        const button = document.getElementById(buttonId);
        if (!button) return;

        if (!document.querySelector(`.${headerClass}`)) {
            button.insertAdjacentHTML('beforebegin', headerHTML);
        }

        const entry = document.createElement('div');
        entry.className = entryClass;
        entry.id = `${elementType}-entry-${number}`;
        entry.innerHTML = entryHTML(number, info);
        button.insertAdjacentElement('beforebegin', entry);

        const deleteBtn = entry.querySelector(`[class*="delete-${elementType}"]`);
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm(`Möchten Sie diesen ${elementType} wirklich löschen?`)) {
                    entry.remove();
                }
            });
        }

        return entry;
    };

    function createMieterFromSave(tenantNumber, mieterInfo) {
        createElementFromSave('tenant', tenantNumber, mieterInfo, 'einzugtenant', 'tenant-headers',
            `<div class="tenant-headers"><h2><i class="fas fa-user"></i> einziehende Mieter</h2><div class="column-headers"><span>Nachname</span><span>Vorname</span><span>Telefonnummer</span><span>E-Mail-Adresse</span><span></span></div></div>`,
            'tenant-entry',
            (number, info) => `
      <div class="tenant-name"><input type="text" id="tenant-name-${number}" class="bemerkung-input" placeholder="Nachname" value="${info.name}"></div>
      <div class="tenant-firstname"><input type="text" id="tenant-firstname-${number}" class="bemerkung-input" placeholder="Vorname" value="${info.firstname}"></div>
      <div class="tenant-phone"><input type="tel" id="tenant-phone-${number}" class="bemerkung-input" placeholder="Telefonnummer" value="${info.phone}"></div>
      <div class="tenant-email"><input type="email" id="tenant-email-${number}" class="bemerkung-input" placeholder="E-Mail-Adresse" value="${info.email}"></div>
      <div class="tenant-delete"><button type="button" class="delete-tenant-btn" id="tenant-delete-btn-${number}" data-tenant-id="${number}">×</button></div>
    `
        );

        setTimeout(() => {
            createSignatureContainerFromSave(tenantNumber, 'einzug');

            // Setup Event-Listener für Echtzeit-Updates
            const firstnameInput = document.getElementById(`tenant-firstname-${tenantNumber}`);
            const lastnameInput = document.getElementById(`tenant-name-${tenantNumber}`);

            if (firstnameInput) {
                firstnameInput.addEventListener('input', () => {
                    updateTenantSignatureName(tenantNumber, 'tenant');
                });
            }

            if (lastnameInput) {
                lastnameInput.addEventListener('input', () => {
                    updateTenantSignatureName(tenantNumber, 'tenant');
                });
            }

            // Setze initialen Namen
            const nameSpan = document.getElementById(`tenant-signature-name-${tenantNumber}`);
            if (nameSpan && mieterInfo.firstname && mieterInfo.name) {
                nameSpan.textContent = `${mieterInfo.firstname} ${mieterInfo.name}`;
            }
        }, 100);
    }

    function createAuszugMieterFromSave(tenantNumber, mieterInfo) {
        createElementFromSave('moveout', tenantNumber, mieterInfo, 'auszugtenant', 'moveout-headers',
            `<div class="moveout-headers"><h2><i class="fas fa-user"></i> ausziehende Mieter</h2><div class="column-headers"><span>Nachname</span><span>Vorname</span><span>Adresse</span><span>E-Mail-Adresse</span><span></span></div></div>`,
            'tenant-entry moveout-entry',
            (number, info) => `
      <div class="tenant-name"><input type="text" id="moveout-name-${number}" class="bemerkung-input" placeholder="Nachname" value="${info.name}"></div>
      <div class="tenant-firstname"><input type="text" id="moveout-firstname-${number}" class="bemerkung-input" placeholder="Vorname" value="${info.firstname}"></div>
      <div class="tenant-phone"><input type="tel" id="moveout-addr-${number}" class="bemerkung-input" placeholder="Adresse" value="${info.phone}"></div>
      <div class="tenant-email"><input type="email" id="moveout-email-${number}" class="bemerkung-input" placeholder="E-Mail-Adresse" value="${info.email}"></div>
      <div class="tenant-delete"><button type="button" class="delete-tenant-btn" id="moveout-delete-btn-${number}" data-tenant-id="${number}">×</button></div>
    `
        );

        setTimeout(() => {
            createSignatureContainerFromSave(tenantNumber, 'auszug');

            // Setup Event-Listener für Echtzeit-Updates
            const firstnameInput = document.getElementById(`moveout-firstname-${tenantNumber}`);
            const lastnameInput = document.getElementById(`moveout-name-${tenantNumber}`);

            if (firstnameInput) {
                firstnameInput.addEventListener('input', () => {
                    updateTenantSignatureName(tenantNumber, 'moveout');
                });
            }

            if (lastnameInput) {
                lastnameInput.addEventListener('input', () => {
                    updateTenantSignatureName(tenantNumber, 'moveout');
                });
            }

            // Setze initialen Namen
            const nameSpan = document.getElementById(`moveout-signature-name-${tenantNumber}`);
            if (nameSpan && mieterInfo.firstname && mieterInfo.name) {
                nameSpan.textContent = `${mieterInfo.firstname} ${mieterInfo.name}`;
            }
        }, 100);
    }

    function createSchluesselFromSave(keyNumber, schluesselInfo) {
        const entry = createElementFromSave('key', keyNumber, schluesselInfo, 'keysbtn', 'key-headers',
            `<div class="key-headers"><h2><i class="fas fa-key"></i> Schlüssel</h2><div class="column-key-headers key-grid"><div class="grid-header grid-col-1">Art</div><div class="grid-header grid-col-2">Anzahl</div><div class="grid-header grid-col-3">Bemerkung</div><div class="grid-header grid-col-4"></div></div></div>`,
            'key-entry key-grid',
            (number, info) => {
                const options = ['Haustür', 'Wohnungstür', 'Haustür inkl. Wohnungstür', 'Briefkasten', 'Keller', 'Dachboden', 'Garage', 'Doppelparkanlage', 'Fahrradbereich', 'Abstellraum', 'Laden', 'Büro', 'Lagerraum', 'Müllraum', 'Sonstige'];
                const optionsHTML = options.map(opt => `<option value="${opt}" ${info.type === opt ? 'selected' : ''}>${opt}</option>`).join('');

                return `
              <div class="key-type grid-col-1">
                <select id="key-type-select-${number}">${optionsHTML}</select>
                <div id="key-custom-container-${number}" style="display:${info.type === 'Sonstige' ? 'block' : 'none'};margin-top:5px;">
                  <input type="text" id="key-custom-type-${number}" placeholder="Eingabe" value="${info.customType}">
                </div>
              </div>
              <div class="key-amount grid-col-2">
                <div class="number-input">
                  <button type="button" class="number-btn minus">-</button>
                  <input type="number" id="key-amount-input-${number}" min="1" max="99" value="${info.amount}">
                  <button type="button" class="number-btn plus">+</button>
                </div>
              </div>
              <div class="key-note grid-col-3"><input type="text" class="bemerkung-input" id="key-note-input-${number}" value="${info.note}"></div>
              <div class="key-delete grid-col-4"><button type="button" class="delete-key-btn" data-key-id="${number}">×</button></div>
            `;
            }
        );

        if (entry) {
            const typeSelect = entry.querySelector(`#key-type-select-${keyNumber}`);
            const customContainer = entry.querySelector(`#key-custom-container-${keyNumber}`);
            const amountInput = entry.querySelector(`#key-amount-input-${keyNumber}`);

            typeSelect?.addEventListener('change', () => {
                customContainer.style.display = typeSelect.value === 'Sonstige' ? 'block' : 'none';
            });

            entry.querySelector('.number-btn.minus')?.addEventListener('click', () => {
                const current = parseInt(amountInput.value) || 1;
                if (current > 1) amountInput.value = current - 1;
            });

            entry.querySelector('.number-btn.plus')?.addEventListener('click', () => {
                const current = parseInt(amountInput.value) || 1;
                if (current < 99) amountInput.value = current + 1;
            });
        }
    }

    function createZaehlerFromSave(zaehlerNumber, zaehlerInfo) {
        const entry = createElementFromSave('zaehler', zaehlerNumber, zaehlerInfo, 'addzaehlerbtn', 'zaehler-headers',
            `<div class="zaehler-headers"><h2><i class="fas fa-tachometer-alt"></i> Zähler</h2><div class="column-zaehler-headers"><span>Typ</span><span>Zählernummer</span><span>Einbaulage</span><span>Zählerstand</span><span></span></div></div>`,
            'zaehler-entry',
            (number, info) => {
                const types = ['Stromzähler', 'Gaszähler', 'Wärmezähler', 'Wasserzähler (kalt)', 'Wasserzähler (warm)', 'Heizkostenverteiler', 'Fernwärmezähler', 'custom'];
                const typesHTML = types.map(type => `<option value="${type}" ${info.type === type ? 'selected' : ''}>${type === 'custom' ? 'Sonstiger Zähler' : type}</option>`).join('');

                return `
              <div class="zaehler-type">
                <select id="zaehler-type-select-${number}">${typesHTML}</select>
                <div id="zaehler-custom-container-${number}" style="display:${info.type === 'custom' ? 'block' : 'none'};margin-top:5px;">
                  <input type="text" id="zaehler-custom-type-${number}" placeholder="Zählertyp eingeben" value="${info.customType}">
                </div>
              </div>
              <div class="zaehler-number"><input type="text" id="zaehler-number-input-${number}" value="${info.number}"></div>
              <div class="zaehler-location"><input type="text" id="zaehler-location-input-${number}" value="${info.location}"></div>
              <div class="zaehler-value"><input type="text" id="zaehler-value-input-${number}" maxlength="14" value="${info.value}"></div>
              <div class="zaehler-delete"><button type="button" class="delete-zaehler-btn" data-zaehler-id="${number}">×</button></div>
            `;
            }
        );

        if (entry) {
            const typeSelect = entry.querySelector(`#zaehler-type-select-${zaehlerNumber}`);
            const customContainer = entry.querySelector(`#zaehler-custom-container-${zaehlerNumber}`);
            const valueInput = entry.querySelector(`#zaehler-value-input-${zaehlerNumber}`);

            typeSelect?.addEventListener('change', () => {
                customContainer.style.display = typeSelect.value === 'custom' ? 'block' : 'none';
            });

            if (valueInput) {
                valueInput.addEventListener('input', function () {
                    if (this.value.length >= 14) {
                        showZaehlerWarning();
                    }
                });

                valueInput.addEventListener('paste', function (e) {
                    setTimeout(() => {
                        if (this.value.length >= 14) {
                            showZaehlerWarning();
                        }
                    }, 10);
                });
            }
        }
    }

    function createZimmerFromSave(zimmerNr, zimmerInfo) {
        const zimmerContainer = document.querySelector('.table-container.zimmer-n');
        if (!zimmerContainer) return;

        const zimmerHTML = `
        <div class="zimmer-section">
            <div class="table-container zimmer" id="zimmer-container-${zimmerNr}" style="margin-top:0;">
                <table>
                    <thead>
                        <tr><th colspan="6" class="zimmer-header"><div class="zimmer-verfuegbar" style="padding-top:10px; padding-bottom:10px; font-weight:300;">Zimmer Nr. ${zimmerNr}<button type="button" class="remove-zimmer-btn" data-zimmer="${zimmerNr}">x</button></div></th></tr>
                        <tr><td colspan="1">Bezeichnung / Lage</td><td colspan="5" class="lage"><input type="text" id="lageinputzimm${zimmerNr}" class="textinput"><div id="lagecontainerzimm${zimmerNr}" class="suggestion-list" style="display:none;"></div></td></tr>
                        <tr class="zustandszeile"><th class="aa">allgemeiner Zustand</th><th class="aa">in Ordnung</th><th class="aa">neuwertig</th><th class="aa">geringe Gebrauchs - spuren</th><th class="aa">stärkere Gebrauchs - spuren</th><th class="aa">nicht renoviert</th></tr>
                        <tr><td></td><td><input type="checkbox" id="boden-pb1-${zimmerNr}"></td><td><input type="checkbox" id="boden-pb2-${zimmerNr}"></td><td><input type="checkbox" id="boden-pb3-${zimmerNr}"></td><td><input type="checkbox" id="boden-pb3b-${zimmerNr}"></td><td><input type="checkbox" id="boden-pb4-${zimmerNr}"></td></tr>
                        <tr><th class="aa1"></th><th class="aa1">in Ordnung</th><th class="aa1">geringe Gebrauchs - spuren</th><th class="aa1">repa. - bedürftig</th><th class="aa1">Reparatur durch den Mieter oder Vermieter</th><th class="aa1">nicht vorhanden</th></tr>
                    </thead>
                    <tbody>
                        ${generateZimmerBodyHTML(zimmerNr)}
                    </tbody>
                </table>
            </div>
        </div>
    `;

        zimmerContainer.insertAdjacentHTML('beforeend', zimmerHTML);

        // BEMERKUNGEN NACH DER HTML-ERSTELLUNG RESTAURIEREN
        if (zimmerInfo && zimmerInfo.bemerkungen && zimmerInfo.bemerkungen.length > 0) {
            setTimeout(() => {
                restoreZimmerBemerkungen(zimmerNr, zimmerInfo.bemerkungen);
            }, 100);
        }

        setupZimmerEventListeners(zimmerNr, zimmerInfo);

        // ✅ Initialisierungen NUR für dieses spezifische Zimmer
        setTimeout(() => {
            if (typeof initAutocomplete === 'function') {
                initAutocomplete();
            }
            if (typeof initColorSuggestions === 'function') {
                initColorSuggestions(zimmerNr);
            }
            if (typeof window.initBodenForZimmer === 'function') {
                window.initBodenForZimmer(zimmerNr);
            }
            // Bemerkungen-Event-Listener für dieses Zimmer initialisieren
            if (typeof window.initBemerkungen === 'function') {
                window.initBemerkungen(zimmerNr);
            }
        }, 150);
    }

    // NEUE HILFSFUNKTION ZUM RESTAURIEREN DER ZIMMER-BEMERKUNGEN
    function restoreZimmerBemerkungen(zimmerNr, bemerkungen) {
        const bemerkungContainer = document.getElementById(`bemerkung-container-zimmer-${zimmerNr}`);
        if (!bemerkungContainer) {
            console.warn(`Bemerkung-Container für Zimmer ${zimmerNr} nicht gefunden`);
            return;
        }

        const tbody = bemerkungContainer.closest('tbody');
        if (!tbody) {
            console.warn(`Tbody für Zimmer ${zimmerNr} nicht gefunden`);
            return;
        }

        // Erste Bemerkung (Index 0) ist bereits im HTML vorhanden, nur Wert setzen
        if (bemerkungen[0] && bemerkungen[0].value) {
            const firstInput = bemerkungContainer.querySelector('.bemerkung-input');
            if (firstInput) {
                firstInput.value = bemerkungen[0].value;
            }
        }

        // Zusätzliche Bemerkungen (Index 1+) als neue Zeilen hinzufügen
        for (let i = 1; i < bemerkungen.length; i++) {
            const bemerkung = bemerkungen[i];
            if (!bemerkung.value || !bemerkung.value.trim()) continue; // Leere Bemerkungen überspringen

            // Neue Bemerkungszeile erstellen
            const newRow = document.createElement('tr');
            newRow.className = 'bemerkung-row';

            newRow.innerHTML = `
            <td colspan="6">
                <div class="bemerkung-container" data-bemerkung-id="bemerkung-zimmer-${zimmerNr}-${i}">
                    <input type="text" id="bemerkung-zimmer-${zimmerNr}-${i}" class="bemerkung-input"
                        placeholder="" data-raum="zimmer-${zimmerNr}" value="${bemerkung.value}">
                    <div class="bemerkung-actions">
                        <button type="button" class="add-bemerkung-btn">+</button>
                        <button type="button" class="del-bemerkung-btn" style="display: block;">×</button>
                    </div>
                </div>
            </td>
        `;

            // Nach der letzten Bemerkungszeile einfügen (vor der Bilder-Zeile)
            const bilderRow = tbody.querySelector('tr.bilder-row');
            if (bilderRow) {
                tbody.insertBefore(newRow, bilderRow);
            } else {
                // Fallback: Am Ende des tbody einfügen
                tbody.appendChild(newRow);
            }
        }

        console.log(`${bemerkungen.length} Bemerkungen für Zimmer ${zimmerNr} restauriert`);
    }

    function generateZimmerBodyHTML(zimmerNr) {
        const rows = [
            { label: 'Türen / Zarge / Beschläge', prefix: 'tuer' },
            { label: 'Fenster / Beschläge / Glas', prefix: 'glas' },
            { label: 'Jalousie / Rolläden / Klappäden', prefix: 'roll' },
            { label: 'Decke', prefix: 'deck' },
            { label: 'Wände / Tapeten', prefix: 'wand' },
            { label: 'Heizkörper / Ventile / Rohre', prefix: 'heiz' },
            { label: 'Fußboden / Leisten', prefix: 'fuss' },
            { label: 'Radio- / Fernseh- / Internetdose', prefix: 'fern' },
            { label: 'Steckdosen / Lichtschalter', prefix: 'licht' }
        ];

        const standardRow = (label, prefix) => `
        <tr>
            <td>${label}</td>
            <td><input type="checkbox" id="zimm${zimmerNr}-${prefix}-p1"></td>
            <td><input type="checkbox" id="zimm${zimmerNr}-${prefix}-p2"></td>
            <td><input type="checkbox" id="zimm${zimmerNr}-${prefix}-p3"></td>
            <td>
                <select id="zimm${zimmerNr}-${prefix}-status">
                    <option value="na">-</option>
                    <option value="mieter">Mieter</option>
                    <option value="landl">Vermieter</option>
                    <option value="klar">in Klärung</option>
                </select>
            </td>
            <td><input type="checkbox" id="zimm${zimmerNr}-op${prefix}5"></td>
        </tr>
    `;

        return rows.map(row => standardRow(row.label, row.prefix)).join('') + `
        <tr>
            <td>Zimmerschlüssel vorhanden?</td>
            <td><input type="checkbox" id="keyYeszimm${zimmerNr}"></td>
            <td class="color1">ja</td>
            <td><input type="checkbox" id="keyNozimm${zimmerNr}"></td>
            <td class="color1">nein</td>
            <td></td>
        </tr>
        <tr>
            <td>Farbe der Wände</td>
            <td><input type="checkbox" id="zimm${zimmerNr}"></td>
            <td class="color1">weiß oder →</td>
            <td colspan="3">
                <input type="text" id="wandfarbe-${zimmerNr}" class="farbe-input" autocomplete="off">
                <div id="farbvorschlaege-${zimmerNr}" class="farbvorschlaege-container" style="display:none;"></div>
            </td>
        </tr>
        <tr>
            <td>Bodenbelag</td>
            <td colspan="5">
                <input type="text" id="fussbodenzimm${zimmerNr}" placeholder="" style="margin-left:2rem" class="farbe-input" autocomplete="off">
                <div id="boden-vorschlaege-zimm${zimmerNr}" class="boden-vorschlaege-container" style="display:none;"></div>
            </td>
        </tr>
        <tr>
            <td>Anzahl Rauchwarnmelder</td>
            <td colspan="5">
                <div class="number-input">
                    <button type="button" class="number-btn minus">-</button>
                    <input type="number" id="rauchmelder-anzahl-${zimmerNr}" min="0" max="9" value="0" readonly="">
                    <button type="button" class="number-btn plus">+</button>
                </div>
            </td>
        </tr>
        
        <!-- NEUE BEMERKUNGSSTRUKTUR WIE IN DER KÜCHE -->
        <tr class="bemerkung-row">
            <td style="font-weight:600; background:#fff; margin-top:11px; padding-top:11px">Bemerkungen:</td>
        </tr>
        <tr class="bemerkung-row">
            <td colspan="6">
                <div class="bemerkung-container" data-bemerkung-id="bemerkung-zimmer-${zimmerNr}-0" id="bemerkung-container-zimmer-${zimmerNr}">
                    <input type="text" id="bemerkung-zimmer-${zimmerNr}-0" class="bemerkung-input"
                        placeholder="" data-raum="zimmer-${zimmerNr}">
                    <div class="bemerkung-actions">
                        <button type="button" class="add-bemerkung-btn">+</button>
                        <button type="button" class="del-bemerkung-btn" style="display: block;">×</button>
                    </div>
                </div>
            </td>
        </tr>
        
        <tr class="bilder-row">
            <td colspan="7">
                <div class="bilder-upload-container">
                    <button type="button" class="bilder-upload-btn">+ Bilder</button>
                    <div class="bilder-thumbnails" id="bilder-thumbnails-${zimmerNr}"></div>
                </div>
            </td>
        </tr>
    `;
    }






    function setupZimmerEventListeners(zimmerNr, zimmerInfo) {
        setTimeout(() => {
            document.querySelector(`[data-zimmer="${zimmerNr}"]`)?.addEventListener('click', () => {
                if (confirm('Möchten Sie dieses Zimmer wirklich entfernen?')) {
                    document.getElementById(`zimmer-container-${zimmerNr}`).closest('.zimmer-section').remove();
                }
            });

            const rauchmelderInput = document.getElementById(`rauchmelder-anzahl-${zimmerNr}`);
            const setupNumberBtn = (selector, operation) => {
                rauchmelderInput?.parentElement.querySelector(selector)?.addEventListener('click', () => {
                    const current = parseInt(rauchmelderInput.value) || 0;
                    const newValue = operation(current);
                    if (newValue >= 0 && newValue <= 9) rauchmelderInput.value = newValue;
                });
            };
            setupNumberBtn('.minus', current => current - 1);
            setupNumberBtn('.plus', current => current + 1);

            const bemerkungsContainer = document.getElementById(`bemerkungen-container-${zimmerNr}`);
            bemerkungsContainer?.addEventListener('click', (e) => {
                if (e.target.classList.contains('add-bemerkung-btn')) {
                    const eingabe = bemerkungsContainer.querySelector('.bemerkung-eingabe');
                    const input = eingabe.querySelector('.bemerkung-input');
                    const text = input.value.trim();

                    const neueBemerkung = document.createElement('div');
                    neueBemerkung.className = 'bemerkung-zeile';
                    neueBemerkung.innerHTML = `<input type="text" class="bemerkung-input" value="${text}" placeholder=""><div class="bemerkung-actions"><button type="button" class="del-bemerkung-btn">×</button></div>`;

                    bemerkungsContainer.insertBefore(neueBemerkung, eingabe);
                    input.value = '';
                } else if (e.target.classList.contains('del-bemerkung-btn')) {
                    e.target.closest('.bemerkung-zeile').remove();
                }
            });

            if (typeof window.initBodenForZimmer === 'function') {
                window.initBodenForZimmer(zimmerNr);
            }

            // ✅ Bemerkungen wiederherstellen - NUR EINMAL!
            if (zimmerInfo.bemerkungen?.length > 0) {
                zimmerInfo.bemerkungen.forEach((bemerkung, index) => {
                    if (index === 0) {
                        const firstInput = document.getElementById(`bemerkungen-input-${zimmerNr}`);
                        if (firstInput) firstInput.value = bemerkung.value;
                    } else {
                        const container = document.getElementById(`bemerkungen-container-${zimmerNr}`);
                        if (container) {
                            const newBemerkung = document.createElement('div');
                            newBemerkung.className = 'bemerkung-zeile';
                            newBemerkung.innerHTML = `<input type="text" class="bemerkung-input" value="${bemerkung.value}" placeholder=""><div class="bemerkung-actions"><button type="button" class="del-bemerkung-btn">×</button></div>`;
                            const eingabeContainer = container.querySelector('.bemerkung-eingabe');
                            container.insertBefore(newBemerkung, eingabeContainer);
                        }
                    }
                });
            }

        }, 100);
    }















    function createSignatureContainerFromSave(tenantNumber, type) {
        const existingTenantSignature = document.getElementById(`tenant-signature-container-${tenantNumber}`);
        const existingMoveoutSignature = document.getElementById(`moveout-signature-container-${tenantNumber}`);

        if (type === 'einzug' && existingTenantSignature) return;
        if (type === 'auszug' && existingMoveoutSignature) return;

        let signContainer = document.getElementById('signtenant1');
        if (!signContainer) {
            const signSection = document.getElementById('sign');
            if (!signSection) return;

            signContainer = document.createElement('div');
            signContainer.className = 'signtenant';
            signContainer.id = 'signtenant1';
            signSection.appendChild(signContainer);
        }

        let html = '';
        if (type === 'einzug' && !existingTenantSignature) {
            html += `
            <div class="signature-block" id="tenant-signature-container-${tenantNumber}">
              <canvas id="tenant-signature-canvas-${tenantNumber}" width="666" height="222" style="border:1px solid #000; touch-action: none;"></canvas>
              <p><strong>einziehender Mieter: <span class="signature-name" id="tenant-signature-name-${tenantNumber}"></span></strong></p>
              <div>
                <button type="button" id="tenant-clear-signature-${tenantNumber}" class="delete-key-btn">x</button>
              </div>
            </div>
          `;
        }

        if (type === 'auszug' && !existingMoveoutSignature) {
            html += `
            <div class="signature-block" id="moveout-signature-container-${tenantNumber}">
              <canvas id="moveout-signature-canvas-${tenantNumber}" width="666" height="222" style="border:1px solid #000; touch-action: none;"></canvas>
              <p><strong>ausziehender Mieter: <span class="signature-name" id="moveout-signature-name-${tenantNumber}"></span></strong></p>
              <div>
                <button type="button" id="moveout-clear-signature-${tenantNumber}" class="delete-key-btn">x</button>
              </div>
            </div>
          `;
        }

        if (html) {
            signContainer.insertAdjacentHTML('beforeend', html);

            setTimeout(() => {
                if (type === 'einzug') {
                    const canvas = document.getElementById(`tenant-signature-canvas-${tenantNumber}`);
                    const clearBtn = document.getElementById(`tenant-clear-signature-${tenantNumber}`);

                    if (canvas && window.setupCanvasDrawing) {
                        window.setupCanvasDrawing(canvas);
                    }

                    if (clearBtn && canvas) {
                        clearBtn.addEventListener('click', () => {
                            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                        });
                    }
                }

                if (type === 'auszug') {
                    const canvas = document.getElementById(`moveout-signature-canvas-${tenantNumber}`);
                    const clearBtn = document.getElementById(`moveout-clear-signature-${tenantNumber}`);

                    if (canvas && window.setupCanvasDrawing) {
                        window.setupCanvasDrawing(canvas);
                    }

                    if (clearBtn && canvas) {
                        clearBtn.addEventListener('click', () => {
                            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                        });
                    }
                }
            }, 100);
        }
    }


    // Canvas Drawing Setup (falls nicht anderweitig vorhanden)
    if (!window.setupCanvasDrawing) {
        window.setupCanvasDrawing = function (canvas) {
            // Verhindere doppeltes Setup
            if (canvas.hasAttribute('data-canvas-setup')) return;

            const ctx = canvas.getContext('2d');
            let isDrawing = false;
            let lastX = 0;
            let lastY = 0;

            function draw(e) {
                if (!isDrawing) return;

                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                ctx.strokeStyle = '#000';
                ctx.lineWidth = 7;
                ctx.lineCap = 'round';

                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(x, y);
                ctx.stroke();

                [lastX, lastY] = [x, y];
            }

            canvas.addEventListener('mousedown', (e) => {
                isDrawing = true;
                const rect = canvas.getBoundingClientRect();
                [lastX, lastY] = [e.clientX - rect.left, e.clientY - rect.top];
            });

            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', () => isDrawing = false);
            canvas.addEventListener('mouseout', () => isDrawing = false);

            canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                isDrawing = true;
                [lastX, lastY] = [touch.clientX - rect.left, touch.clientY - rect.top];
            });

            canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (!isDrawing) return;

                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;

                ctx.strokeStyle = '#000';
                ctx.lineWidth = 7;
                ctx.lineCap = 'round';

                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(x, y);
                ctx.stroke();

                [lastX, lastY] = [x, y];
            });

            canvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                isDrawing = false;
            });

            // Markiere Canvas als setuped
            canvas.setAttribute('data-canvas-setup', 'true');
        };
    }

    // Canvas Drawing Setup (falls nicht anderweitig vorhanden)
    if (!window.setupCanvasDrawing) {
        window.setupCanvasDrawing = function (canvas) {
            // Verhindere doppeltes Setup
            if (canvas.hasAttribute('data-canvas-setup')) return;

            const ctx = canvas.getContext('2d');
            let isDrawing = false;
            let lastX = 0;
            let lastY = 0;

            function draw(e) {
                if (!isDrawing) return;

                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                ctx.strokeStyle = '#000';
                ctx.lineWidth = 7;
                ctx.lineCap = 'round';

                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(x, y);
                ctx.stroke();

                [lastX, lastY] = [x, y];
            }

            canvas.addEventListener('mousedown', (e) => {
                isDrawing = true;
                const rect = canvas.getBoundingClientRect();
                [lastX, lastY] = [e.clientX - rect.left, e.clientY - rect.top];
            });

            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', () => isDrawing = false);
            canvas.addEventListener('mouseout', () => isDrawing = false);

            canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                isDrawing = true;
                [lastX, lastY] = [touch.clientX - rect.left, touch.clientY - rect.top];
            });

            canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (!isDrawing) return;

                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;

                ctx.strokeStyle = '#000';
                ctx.lineWidth = 7;
                ctx.lineCap = 'round';

                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(x, y);
                ctx.stroke();

                [lastX, lastY] = [x, y];
            });

            canvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                isDrawing = false;
            });

            // Markiere Canvas als setuped
            canvas.setAttribute('data-canvas-setup', 'true');
        };
    }

    // HIER FÜGST DU DIE NEUEN FUNKTIONEN EIN:
    function setupAllCanvasElements() {
        // Finde alle Canvas-Elemente die noch nicht setup sind
        document.querySelectorAll('canvas[id*="signature-canvas"]').forEach(canvas => {
            // Prüfe ob Canvas bereits Setup hat (durch vorhandene Event-Listener)
            if (!canvas.hasAttribute('data-canvas-setup')) {
                if (window.setupCanvasDrawing) {
                    window.setupCanvasDrawing(canvas);
                    canvas.setAttribute('data-canvas-setup', 'true');
                }
            }
        });
    }

    // Überwache DOM-Änderungen für neue Canvas-Elemente
    function startCanvasObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Prüfe ob das hinzugefügte Element Canvas enthält
                        const canvasElements = node.querySelectorAll ?
                            node.querySelectorAll('canvas[id*="signature-canvas"]') :
                            (node.matches && node.matches('canvas[id*="signature-canvas"]') ? [node] : []);

                        canvasElements.forEach(canvas => {
                            if (!canvas.hasAttribute('data-canvas-setup')) {
                                setTimeout(() => {
                                    if (window.setupCanvasDrawing) {
                                        window.setupCanvasDrawing(canvas);
                                        canvas.setAttribute('data-canvas-setup', 'true');
                                    }
                                }, 100);
                            }
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return observer;
    }

    function createBemerkungRow(raum, bemerkungId, value = '') {
        if (document.querySelector(`[data-bemerkung-id="${bemerkungId}"]`)) return;

        let container = null;
        if (raum === 'regelungen') {
            const allTables = document.querySelectorAll('.rooms table tbody');
            for (const table of allTables) {
                const existingRegel = table.querySelector('[data-raum="regelungen"]');
                if (existingRegel) {
                    container = table;
                    break;
                }
            }
            if (!container) {
                for (const table of allTables) {
                    const bemerkungRows = table.querySelectorAll('.bemerkung-row');
                    if (bemerkungRows.length > 0) {
                        container = table;
                        break;
                    }
                }
            }
        } else {
            container = document.getElementById(`${raum}-container`) ||
                document.querySelector(`.${raum}`) ||
                document.querySelector(`[data-room="${raum}"]`) ||
                document.querySelector(`#${raum}`);
        }

        if (!container) return;

        const bemerkungRows = container.querySelectorAll('.bemerkung-row');
        if (bemerkungRows.length === 0) return;

        let lastRow = null;
        for (let i = bemerkungRows.length - 1; i >= 0; i--) {
            const row = bemerkungRows[i];
            if (row.querySelector('.bemerkung-actions') || row.querySelector('[data-bemerkung-id]')) {
                lastRow = row;
                break;
            }
        }

        if (!lastRow) {
            lastRow = bemerkungRows[bemerkungRows.length - 1];
        }

        const newRow = document.createElement('tr');
        newRow.className = 'bemerkung-row';
        const colspan = (raum === 'regelungen') ? '7' : '6';
        newRow.innerHTML = `
      <td colspan="${colspan}">
        <div class="bemerkung-container" data-bemerkung-id="${bemerkungId}">
          <input type="text" id="${bemerkungId}" class="bemerkung-input" placeholder="" data-raum="${raum}" value="${value}">
          <div class="bemerkung-actions">
            <button type="button" class="add-bemerkung-btn">+</button>
            <button type="button" class="del-bemerkung-btn" style="display: block;">×</button>
          </div>
        </div>
      </td>
    `;

        lastRow.parentNode.insertBefore(newRow, lastRow.nextSibling);

        // KEINE Event-Listener hinzufügen - die addrow.js übernimmt das bereits!

        // Update Delete-Buttons wie in addrow.js
        const table = newRow.closest('table');
        if (table) {
            const rows = table.querySelectorAll('.bemerkung-row');
            rows.forEach((row) => {
                const delBtn = row.querySelector('.del-bemerkung-btn');
                if (delBtn) {
                    delBtn.style.display = rows.length > 1 ? 'block' : 'none';
                }
            });
        }
    }

    function createBemerkungRowForNebenraum(bemerkungId, value) {
        console.log(`🔧 Erstelle Nebenraum-Bemerkungszeile: ${bemerkungId} = "${value}"`);

        // Stelle sicher, dass Nebenraum-Toggle aktiviert ist
        const nebenraumToggle = document.querySelector('.room-toggle[data-room="nebenraum"]');
        const toggleOptions = nebenraumToggle?.querySelector('.toggle-options');
        const nebenraumContainer = document.getElementById('nebenraum-container');

        if (nebenraumContainer && nebenraumContainer.style.display === 'none') {
            console.log('🔄 Aktiviere Nebenraum-Toggle...');

            if (toggleOptions) {
                toggleOptions.setAttribute('data-active-option', '1');
                const options = toggleOptions.querySelectorAll('.toggle-option');
                options.forEach(option => option.classList.remove('active'));
                const jaOption = toggleOptions.querySelector('[data-value="ja"]');
                if (jaOption) jaOption.classList.add('active');
            }

            nebenraumContainer.style.display = 'block';
            nebenraumContainer.style.animation = '0.3s ease-in-out fadeIn';

            // Toggle-Header aktualisieren
            if (nebenraumToggle) {
                nebenraumToggle.querySelector('.toggle-options')?.classList.remove('opacity');
            }
        }

        // Finde die erste Bemerkungszeile als Referenz
        const firstBemerkungInput = document.getElementById('bemerkung-nebenraum-0');
        if (!firstBemerkungInput) {
            console.error('❌ Erste Nebenraum-Bemerkungszeile nicht gefunden');
            return false;
        }

        const firstBemerkungRow = firstBemerkungInput.closest('tr.bemerkung-row');
        const tbody = firstBemerkungRow.closest('tbody');

        if (!firstBemerkungRow || !tbody) {
            console.error('❌ Nebenraum-Struktur nicht gefunden');
            return false;
        }

        // Erstelle neue Bemerkungszeile
        const newRow = document.createElement('tr');
        newRow.className = 'bemerkung-row';

        newRow.innerHTML = `
        <td colspan="6">
            <div class="bemerkung-container" data-bemerkung-id="${bemerkungId}">
                <input type="text" id="${bemerkungId}" class="bemerkung-input" placeholder="" data-raum="nebenraum" value="${value}">
                <div class="bemerkung-actions">
                    <button type="button" class="add-bemerkung-btn">+</button>
                    <button type="button" class="del-bemerkung-btn" style="display:block;">×</button>
                </div>
            </div>
        </td>
    `;

        // VOR der Bilder-Zeile einfügen
        const bilderRow = tbody.querySelector('tr.bilder-row');
        if (bilderRow) {
            bilderRow.parentNode.insertBefore(newRow, bilderRow);
            console.log('✅ Nebenraum-Zeile vor Bilder-Zeile eingefügt');
        } else {
            // Fallback: nach der letzten Bemerkungszeile
            const bemerkungRows = tbody.querySelectorAll('tr.bemerkung-row');
            const lastBemerkungRow = bemerkungRows[bemerkungRows.length - 1];
            lastBemerkungRow.insertAdjacentElement('afterend', newRow);
            console.log('✅ Nebenraum-Zeile nach letzter Bemerkungszeile eingefügt');
        }

        // Verifikation
        const insertedInput = document.getElementById(bemerkungId);
        if (insertedInput) {
            console.log(`✅ Nebenraum-Bemerkung erfolgreich: ${bemerkungId} = "${insertedInput.value}"`);
            return true;
        } else {
            console.error(`❌ Nebenraum-Bemerkung nicht gefunden: ${bemerkungId}`);
            return false;
        }
    }

    function createBemerkungRowForStandardRoom(raum, bemerkungId, value) {
        console.log(`🔧 Versuche Bemerkungszeile zu erstellen: ${raum} -> ${bemerkungId}`);

        if (raum === 'nebenraum') {
            return createBemerkungRowForNebenraum(bemerkungId, value);
        }

        const containerSelectors = [
            `.table-container.${raum} tbody`,
            `.${raum} tbody`
        ];

        if (raum === 'regelungen') {
            containerSelectors.unshift('#regelungen tbody');
        }

        // HINZUFÜGEN für weiterebemerkungen
        if (raum === 'weitere') {
            containerSelectors.unshift('#weiterebemerkungen tbody');
        }

        let tbody = null;
        for (const selector of containerSelectors) {
            tbody = document.querySelector(selector);
            if (tbody) break;
        }

        if (!tbody) {
            console.error(`❌ Kein tbody gefunden für Raum '${raum}'`);
            return false;
        }

        const bemerkungRows = tbody.querySelectorAll('tr.bemerkung-row');
        if (bemerkungRows.length === 0) {
            console.error(`❌ Keine Bemerkungszeilen in '${raum}' gefunden`);
            return false;
        }

        const lastBemerkungRow = bemerkungRows[bemerkungRows.length - 1];

        const newRow = document.createElement('tr');
        newRow.className = 'bemerkung-row';
        const colspan = (raum === 'regelungen') ? '7' : '6';

        newRow.innerHTML = `
        <td colspan="${colspan}">
            <div class="bemerkung-container" data-bemerkung-id="${bemerkungId}">
                <input type="text" id="${bemerkungId}" class="bemerkung-input" placeholder="" data-raum="${raum}" value="${value}">
                <div class="bemerkung-actions">
                    <button type="button" class="add-bemerkung-btn">+</button>
                    <button type="button" class="del-bemerkung-btn" style="display:block;">×</button>
                </div>
            </div>
        </td>
    `;

        lastBemerkungRow.insertAdjacentElement('afterend', newRow);

        const insertedInput = document.getElementById(bemerkungId);
        if (insertedInput) {
            console.log(`✅ Bemerkungszeile erstellt: ${bemerkungId} = "${insertedInput.value}"`);
            return true;
        }
        return false;
    }

    // Funktion global verfügbar machen
    window.createBemerkungRowForStandardRoom = createBemerkungRowForStandardRoom;

    console.log('✅ Funktion createBemerkungRowForStandardRoom geladen!');

    function loadBemerkungsDataAdvanced(bemerkungsData) {
        if (!bemerkungsData || Object.keys(bemerkungsData).length === 0) return;

        const standardRooms = ['kueche', 'bad', 'wc', 'flur', 'abstellraum', 'nebenraum', 'regelungen', 'weitere'];
        const roomBemerkungen = {};

        Object.entries(bemerkungsData).forEach(([bemerkungId, bemerkungData]) => {
            if (typeof bemerkungData === 'object' && bemerkungData.value) {
                if (bemerkungId.startsWith('bemerkung-zimmer-')) {
                    const input = document.getElementById(bemerkungId);
                    if (input) {
                        input.value = bemerkungData.value;
                    }
                } else {
                    const parts = bemerkungId.split('-');
                    if (parts.length >= 3) {
                        const raum = parts[1];
                        const index = parseInt(parts[2]) || 0;

                        if (standardRooms.includes(raum)) {
                            if (!roomBemerkungen[raum]) roomBemerkungen[raum] = [];
                            roomBemerkungen[raum][index] = {
                                id: bemerkungId,
                                value: bemerkungData.value
                            };
                        }
                    }
                }
            }
        });

        standardRooms.forEach(raum => {
            if (roomBemerkungen[raum]) {
                roomBemerkungen[raum].forEach((bemerkung, index) => {
                    if (!bemerkung) return;

                    let input = document.getElementById(bemerkung.id);
                    if (!input) {
                        if (createBemerkungRowForStandardRoom(raum, bemerkung.id, bemerkung.value)) {
                            input = document.getElementById(bemerkung.id);
                        }
                    }
                    if (input && !input.value) {
                        input.value = bemerkung.value;
                    }
                });

                if (window.bemerkungCounters && roomBemerkungen[raum].length > 0) {
                    window.bemerkungCounters[raum] = Math.max(window.bemerkungCounters[raum] || 1, roomBemerkungen[raum].length);
                }
            }
        });
    }
    function showSavedStates() {
        if (isProcessing) return;
        isProcessing = true;

        try {
            removeExistingDialogs('saved-states-dialog');
            const saves = getAllSaves();

            if (Object.keys(saves).length === 0) {
                showMobileAlert('Keine gespeicherten Zustände gefunden!');
                isProcessing = false;
                return;
            }

            const sortedSaves = Object.entries(saves)
                .sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp))
                .slice(0, 50);

            const dialog = document.createElement('div');
            dialog.className = 'modal-overlay saved-states-dialog';
            dialog.style.cssText = `position:fixed!important;inset:0px!important;width:100vw!important;height:100vh!important;background:rgba(0,0,0,0.8)!important;display:flex!important;justify-content:center!important;align-items:center!important;z-index:99999!important;padding:15px!important;box-sizing:border-box!important;visibility:visible!important;opacity:1!important;`;

            let listHTML = '';
            for (const [name, data] of sortedSaves) {
                const timestamp = new Date(data.timestamp).toLocaleString();
                const hasSignatures = data.canvasData && Object.keys(data.canvasData).length > 0;
                const signatureIndicator = hasSignatures ? ' 📝' : '';

                listHTML += `
              <div style="padding:15px 0!important;border-bottom:1px solid #eee!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:15px!important;">
                <div style="flex:1!important;">
                  <div style="font-weight:600!important;margin-bottom:5px!important;">${escapeHtml(name)}${signatureIndicator}</div>
                  <div style="font-size:0.9rem!important;color:#666!important;">${timestamp}</div>
                </div>
                <div style="display:flex!important;gap:10px!important;">
                  <button class="load-btn" data-name="${escapeHtml(name)}" style="background-color:#335d92!important;color:white!important;border:none!important;padding:8px 16px!important;border-radius:4px!important;cursor:pointer!important;">Laden</button>
                  <button class="delete-btn2" data-name="${escapeHtml(name)}" style="background-color:rgb(137,34,45)!important;color:white!important;border:none!important;padding:8px 12px!important;border-radius:4px!important;cursor:pointer!important;"><i class="fas fa-trash"></i></button>
                </div>
              </div>`;
            }

            dialog.innerHTML = `
            <div style="background:white!important;border-radius:12px!important;width:100%!important;max-width:700px!important;max-height:80vh!important;padding:30px!important;box-shadow:0 10px 30px rgba(0,0,0,0.3)!important;position:relative!important;overflow-y:auto!important;">
              <h3 style="margin:0 0 20px 0!important;font-size:1.5rem!important;color:#333!important;text-align:center!important;">Gespeicherte Zustände</h3>
              <button class="close-dialog" style="position:absolute!important;top:15px!important;right:20px!important;background:transparent!important;border:none!important;font-size:28px!important;cursor:pointer!important;color:#666!important;line-height:1!important;">×</button>
              <div style="margin-bottom:20px!important;text-align:left!important;">
                <button class="cleanup-old-btn" style="background:#8e2525ff!important;color:white!important;border:none!important;padding:10px 20px!important;border-radius:6px!important;cursor:pointer!important;font-size:0.9rem!important;"><i class="fas fa-trash"></i> älteste 5 Einträge löschen</button>
              </div>
              <div style="margin-top:20px!important;">${listHTML}</div>
            </div>
          `;

            document.body.appendChild(dialog);

            dialog.addEventListener('click', (e) => {
                const target = e.target;

                if (target.classList.contains('close-dialog')) {
                    dialog.remove();
                } else if (target.classList.contains('load-btn')) {
                    const saveName = target.dataset.name;
                    if (saveName) {
                        loadSpecificState(saveName);
                        dialog.remove();
                        closeAnyModal();
                    }
                } else if (target.classList.contains('delete-btn2')) {
                    const saveName = target.dataset.name;
                    if (saveName && confirm(`Speicherstand "${saveName}" wirklich löschen?`)) {
                        deleteState(saveName);
                        dialog.remove();
                        setTimeout(() => showSavedStates(), 100);
                    }
                } else if (target.classList.contains('cleanup-old-btn')) {
                    if (confirm('Die ältesten 5 Speichereinträge wirklich löschen?')) {
                        cleanupOldEntries(5);
                        dialog.remove();
                        setTimeout(() => showSavedStates(), 100);
                    }
                }
                isProcessing = false;
            });

        } catch (error) {
            isProcessing = false;
        }
    }

    function loadSpecificState(saveName) {
        try {
            console.log(`📋 Lade Speicherstand: ${saveName}`);

            window.currentLoadedSaveName = saveName;
            const saveData = getAllSaves()[saveName];

            if (!saveData) {
                console.error(`❌ Speicherstand '${saveName}' nicht gefunden`);
                showMobileAlert('Speicherstand nicht gefunden!', 'error');
                return false;
            }

            console.log('📊 Gefundene Daten:', {
                formData: !!saveData.data,
                toggleData: !!saveData.toggleData,
                bemerkungsData: !!saveData.bemerkungsData,
                zimmerData: !!saveData.zimmerData,
                zimmerCount: saveData.zimmerData ? Object.keys(saveData.zimmerData).length : 0
            });

            loadImportedData(saveData);
            showMobileAlert('Speicherstand erfolgreich geladen!', 'success');
            return true;

        } catch (error) {
            console.error('❌ Fehler beim Laden:', error);
            showMobileAlert('Fehler beim Laden des Speicherstands!', 'error');
            return false;
        }
    }
    function cleanupOldEntries(count = 3) {
        try {
            const saves = getAllSaves();
            const sortedEntries = Object.entries(saves).sort((a, b) => new Date(a[1].timestamp || 0) - new Date(b[1].timestamp || 0));
            const toDelete = sortedEntries.slice(0, count);

            // NEUE ZEILEN: Sammle Namen für Bilder-Cleanup
            const deletedSaveNames = toDelete.map(([name]) => name);

            toDelete.forEach(([name]) => delete saves[name]);
            localStorage.setItem('formSaves', JSON.stringify(saves));

            // NEUE ZEILEN: Bilder-Cleanup
            if (window.cleanupDeletedSaveImages && deletedSaveNames.length > 0) {
                window.cleanupDeletedSaveImages(deletedSaveNames);
            }

            showMobileAlert(`${toDelete.length} alte Einträge gelöscht!`, 'success');
            return true;
        } catch (error) {
            showMobileAlert('Fehler beim Löschen!', 'error');
            return false;
        }
    }

    // Event-Listener für Buttons
    const exportBtn = document.getElementById('export');
    const importBtn = document.getElementById('import');

    if (exportBtn) {
        exportBtn.addEventListener('click', exportFormData);
    }
    if (importBtn) {
        importBtn.addEventListener('click', importFormData);
    }

    // Global verfügbare Funktionen
    window.promptSaveName = promptSaveName;
    window.showSavedStates = showSavedStates;
    window.loadSpecificState = loadSpecificState;
    window.clearAllInputs = clearAllInputs;
    window.collectCanvasData = collectCanvasData;
    window.restoreCanvasData = restoreCanvasData;
    window.clearAllCanvases = clearAllCanvases;
    window.showZaehlerWarning = showZaehlerWarning;
    window.startAutosave = startAutosave;
    window.stopAutosave = stopAutosave;
    window.performAutosave = performAutosave;
    window.exportFormData = exportFormData;
    window.importFormData = importFormData;

    // Autosave starten
    startAutosave();

    startCanvasObserver();

    // Setup alle bestehenden Canvas-Elemente
    setTimeout(() => {
        setupAllCanvasElements();
    }, 500);

    function emergencyCleanup() {
        try {
            const saves = getAllSaves();
            const entries = Object.entries(saves);

            console.log(`🧹 Vor Cleanup: ${entries.length} Einträge`);

            const withoutAutoSaves = {};
            let autoSaveCount = 0;
            const deletedAutoSaves = []; // NEUE ZEILE

            entries.forEach(([name, data]) => {
                if (!name.startsWith('AutoSave_')) {
                    withoutAutoSaves[name] = data;
                } else {
                    autoSaveCount++;
                    deletedAutoSaves.push(name); // NEUE ZEILE
                }
            });

            console.log(`🗑️ ${autoSaveCount} AutoSave-Einträge gelöscht`);

            const remaining = Object.entries(withoutAutoSaves);
            const deletedOldSaves = []; // NEUE ZEILE

            if (remaining.length > 5) {
                const sorted = remaining.sort((a, b) => new Date(a[1].timestamp || 0) - new Date(b[1].timestamp || 0));
                const toKeep = sorted.slice(-5);
                const toDelete = sorted.slice(0, -5); // NEUE ZEILE

                deletedOldSaves.push(...toDelete.map(([name]) => name)); // NEUE ZEILE

                const finalSaves = {};
                toKeep.forEach(([name, data]) => {
                    finalSaves[name] = data;
                });

                console.log(`🗑️ ${remaining.length - 5} alte Einträge gelöscht, ${toKeep.length} behalten`);
                localStorage.setItem('formSaves', JSON.stringify(finalSaves));
            } else {
                localStorage.setItem('formSaves', JSON.stringify(withoutAutoSaves));
            }

            // NEUE ZEILEN: Bilder-Cleanup
            const allDeletedSaves = [...deletedAutoSaves, ...deletedOldSaves];
            if (window.cleanupDeletedSaveImages && allDeletedSaves.length > 0) {
                window.cleanupDeletedSaveImages(allDeletedSaves);
            }

            setTimeout(() => {
                checkLocalStorageSize();
            }, 100);

            return true;
        } catch (error) {
            console.error('💥 Cleanup fehlgeschlagen:', error);
            return false;
        }
    }

    function addCleanupButton() {
        const button = document.createElement('button');
        button.textContent = '🧹 Emergency Cleanup';
        button.style.cssText = 'position:fixed;top:10px;right:10px;z-index:99999;background:red;color:white;padding:10px;border:none;border-radius:5px;cursor:pointer;';
        button.onclick = () => {
            emergencyCleanup();
            showMobileAlert('Cleanup durchgeführt!', 'success');
            button.remove();
        };
        document.body.appendChild(button);
    }

    const currentSize = parseFloat(checkLocalStorageSize());
    if (currentSize > 4) {
        addCleanupButton();
        console.log('⚠️ LocalStorage überfüllt - Cleanup-Button hinzugefügt');
    }

    function setupTenantNameListeners() {
        // Setup für einziehende Mieter
        document.querySelectorAll('[id^="tenant-name-"], [id^="tenant-firstname-"]').forEach(input => {
            const tenantId = input.id.match(/\d+$/)?.[0];
            if (!tenantId) return;

            // Entferne alte Event-Listener
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);

            // Füge neuen Event-Listener hinzu
            newInput.addEventListener('input', () => {
                updateTenantSignatureName(tenantId, 'tenant');
            });
        });

        // Setup für ausziehende Mieter
        document.querySelectorAll('[id^="moveout-name-"], [id^="moveout-firstname-"]').forEach(input => {
            const tenantId = input.id.match(/\d+$/)?.[0];
            if (!tenantId) return;

            // Entferne alte Event-Listener
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);

            // Füge neuen Event-Listener hinzu
            newInput.addEventListener('input', () => {
                updateTenantSignatureName(tenantId, 'moveout');
            });
        });
    }

    function updateTenantSignatureName(tenantId, type) {
        let nameSpanId, firstnameInputId, lastnameInputId;

        if (type === 'tenant') {
            nameSpanId = `tenant-signature-name-${tenantId}`;
            firstnameInputId = `tenant-firstname-${tenantId}`;
            lastnameInputId = `tenant-name-${tenantId}`;
        } else if (type === 'moveout') {
            nameSpanId = `moveout-signature-name-${tenantId}`;
            firstnameInputId = `moveout-firstname-${tenantId}`;
            lastnameInputId = `moveout-name-${tenantId}`;
        }

        const nameSpan = document.getElementById(nameSpanId);
        const firstnameInput = document.getElementById(firstnameInputId);
        const lastnameInput = document.getElementById(lastnameInputId);

        if (nameSpan && firstnameInput && lastnameInput) {
            const firstname = firstnameInput.value.trim();
            const lastname = lastnameInput.value.trim();
            nameSpan.textContent = `${firstname} ${lastname}`.trim();
        }
    }


    function setupDynamicElementListenersAlternative() {
        // Setup für Schlüssel hinzufügen - Alternative
        const keysBtn = document.getElementById('keysbtn');
        if (keysBtn && !keysBtn.hasAttribute('data-listener-setup')) {
            keysBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Finde den höchsten bestehenden Key-Index
                const existingKeys = document.querySelectorAll('.key-entry');
                const nextId = existingKeys.length + 1;

                // Erstelle neuen Schlüssel-Eintrag (vereinfacht)
                const newKeyHTML = `
        <div class="key-entry key-grid" id="key-entry-${nextId}">
          <div class="key-type grid-col-1">
            <select id="key-type-select-${nextId}">
              <option value="Haustür">Haustür</option>
              <option value="Wohnungstür">Wohnungstür</option>
              <option value="Sonstige">Sonstige</option>
            </select>
          </div>
          <div class="key-amount grid-col-2">
            <div class="number-input">
              <button type="button" class="number-btn minus">-</button>
              <input type="number" id="key-amount-input-${nextId}" min="1" max="99" value="1">
              <button type="button" class="number-btn plus">+</button>
            </div>
          </div>
          <div class="key-note grid-col-3">
            <input type="text" class="bemerkung-input" id="key-note-input-${nextId}" value="">
          </div>
          <div class="key-delete grid-col-4">
            <button type="button" class="delete-key-btn" data-key-id="${nextId}">×</button>
          </div>
        </div>
      `;

                keysBtn.insertAdjacentHTML('beforebegin', newKeyHTML);
            });
            keysBtn.setAttribute('data-listener-setup', 'true');
        }

        // Ähnlich für Zähler
        const zaehlerBtn = document.getElementById('addzaehlerbtn');
        if (zaehlerBtn && !zaehlerBtn.hasAttribute('data-listener-setup')) {
            zaehlerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const existingZaehler = document.querySelectorAll('.zaehler-entry');
                const nextId = existingZaehler.length + 1;

                // Erstelle neuen Zähler-Eintrag (vereinfacht)
                const newZaehlerHTML = `
        <div class="zaehler-entry" id="zaehler-entry-${nextId}">
          <div class="zaehler-type">
            <select id="zaehler-type-select-${nextId}">
              <option value="Stromzähler">Stromzähler</option>
              <option value="Gaszähler">Gaszähler</option>
              <option value="Wasserzähler (kalt)">Wasserzähler (kalt)</option>
            </select>
          </div>
          <div class="zaehler-number">
            <input type="text" id="zaehler-number-input-${nextId}" value="">
          </div>
          <div class="zaehler-location">
            <input type="text" id="zaehler-location-input-${nextId}" value="">
          </div>
          <div class="zaehler-value">
            <input type="text" id="zaehler-value-input-${nextId}" maxlength="14" value="">
          </div>
          <div class="zaehler-delete">
            <button type="button" class="delete-zaehler-btn" data-zaehler-id="${nextId}">×</button>
          </div>
        </div>
      `;

                zaehlerBtn.insertAdjacentHTML('beforebegin', newZaehlerHTML);
            });
            zaehlerBtn.setAttribute('data-listener-setup', 'true');
        }
    }

    function restoreAddButtonListeners() {
        // Schlüssel-Button wiederherstellen
        const keysBtn = document.getElementById('keysbtn');
        if (keysBtn) {
            // Clone button to remove old listeners
            const newKeysBtn = keysBtn.cloneNode(true);
            keysBtn.parentNode.replaceChild(newKeysBtn, keysBtn);

            newKeysBtn.addEventListener('click', (e) => {
                e.preventDefault();
                addNewKeyEntry();
            });
        }

        // Zähler-Button wiederherstellen
        const zaehlerBtn = document.getElementById('addzaehlerbtn');
        if (zaehlerBtn) {
            // Clone button to remove old listeners
            const newZaehlerBtn = zaehlerBtn.cloneNode(true);
            zaehlerBtn.parentNode.replaceChild(newZaehlerBtn, zaehlerBtn);

            newZaehlerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                addNewZaehlerEntry();
            });
        }

        // Mieter-Buttons wiederherstellen
        const tenantBtn = document.getElementById('einzugtenant');
        if (tenantBtn) {
            const newTenantBtn = tenantBtn.cloneNode(true);
            tenantBtn.parentNode.replaceChild(newTenantBtn, tenantBtn);

            newTenantBtn.addEventListener('click', (e) => {
                e.preventDefault();
                addNewTenantEntry();
            });
        }

        const moveoutBtn = document.getElementById('auszugtenant');
        if (moveoutBtn) {
            const newMoveoutBtn = moveoutBtn.cloneNode(true);
            moveoutBtn.parentNode.replaceChild(newMoveoutBtn, moveoutBtn);

            newMoveoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                addNewMoveoutEntry();
            });
        }
    }

    // Hilfsfunktionen für das Hinzufügen neuer Einträge
    function addNewKeyEntry() {
        const existingKeys = document.querySelectorAll('.key-entry');
        const nextId = existingKeys.length + 1;

        // Erstelle Header falls nicht vorhanden
        const keysBtn = document.getElementById('keysbtn');
        if (!document.querySelector('.key-headers')) {
            keysBtn.insertAdjacentHTML('beforebegin', `
      <div class="key-headers">
        <h2><i class="fas fa-key"></i> Schlüssel</h2>
        <div class="column-key-headers key-grid">
          <div class="grid-header grid-col-1">Art</div>
          <div class="grid-header grid-col-2">Anzahl</div>
          <div class="grid-header grid-col-3">Bemerkung</div>
          <div class="grid-header grid-col-4"></div>
        </div>
      </div>
    `);
        }

        const newKeyHTML = `
    <div class="key-entry key-grid" id="key-entry-${nextId}">
      <div class="key-type grid-col-1">
        <select id="key-type-select-${nextId}">
          <option value="Haustür">Haustür</option>
          <option value="Wohnungstür">Wohnungstür</option>
          <option value="Haustür inkl. Wohnungstür">Haustür inkl. Wohnungstür</option>
          <option value="Briefkasten">Briefkasten</option>
          <option value="Keller">Keller</option>
          <option value="Dachboden">Dachboden</option>
          <option value="Garage">Garage</option>
          <option value="Sonstige">Sonstige</option>
        </select>
        <div id="key-custom-container-${nextId}" style="display:none;margin-top:5px;">
          <input type="text" id="key-custom-type-${nextId}" placeholder="Eingabe" value="">
        </div>
      </div>
      <div class="key-amount grid-col-2">
        <div class="number-input">
          <button type="button" class="number-btn minus">-</button>
          <input type="number" id="key-amount-input-${nextId}" min="1" max="99" value="1">
          <button type="button" class="number-btn plus">+</button>
        </div>
      </div>
      <div class="key-note grid-col-3">
        <input type="text" class="bemerkung-input" id="key-note-input-${nextId}" value="">
      </div>
      <div class="key-delete grid-col-4">
        <button type="button" class="delete-key-btn" data-key-id="${nextId}">×</button>
      </div>
    </div>
  `;

        keysBtn.insertAdjacentHTML('beforebegin', newKeyHTML);

        // Setup Event-Listener für den neuen Eintrag
        setupKeyEventListeners(nextId);
    }

    function addNewZaehlerEntry() {
        const existingZaehler = document.querySelectorAll('.zaehler-entry');
        const nextId = existingZaehler.length + 1;

        // Erstelle Header falls nicht vorhanden
        const zaehlerBtn = document.getElementById('addzaehlerbtn');
        if (!document.querySelector('.zaehler-headers')) {
            zaehlerBtn.insertAdjacentHTML('beforebegin', `
      <div class="zaehler-headers">
        <h2><i class="fas fa-tachometer-alt"></i> Zähler</h2>
        <div class="column-zaehler-headers">
          <span>Typ</span>
          <span>Zählernummer</span>
          <span>Einbaulage</span>
          <span>Zählerstand</span>
          <span></span>
        </div>
      </div>
    `);
        }

        const newZaehlerHTML = `
    <div class="zaehler-entry" id="zaehler-entry-${nextId}">
      <div class="zaehler-type">
        <select id="zaehler-type-select-${nextId}">
          <option value="Stromzähler">Stromzähler</option>
          <option value="Gaszähler">Gaszähler</option>
          <option value="Wärmezähler">Wärmezähler</option>
          <option value="Wasserzähler (kalt)">Wasserzähler (kalt)</option>
          <option value="Wasserzähler (warm)">Wasserzähler (warm)</option>
          <option value="Heizkostenverteiler">Heizkostenverteiler</option>
          <option value="Fernwärmezähler">Fernwärmezähler</option>
          <option value="custom">Sonstiger Zähler</option>
        </select>
        <div id="zaehler-custom-container-${nextId}" style="display:none;margin-top:5px;">
          <input type="text" id="zaehler-custom-type-${nextId}" placeholder="Zählertyp eingeben" value="">
        </div>
      </div>
      <div class="zaehler-number">
        <input type="text" id="zaehler-number-input-${nextId}" value="">
      </div>
      <div class="zaehler-location">
        <input type="text" id="zaehler-location-input-${nextId}" value="">
      </div>
      <div class="zaehler-value">
        <input type="text" id="zaehler-value-input-${nextId}" maxlength="14" value="">
      </div>
      <div class="zaehler-delete">
        <button type="button" class="delete-zaehler-btn" data-zaehler-id="${nextId}">×</button>
      </div>
    </div>
  `;

        zaehlerBtn.insertAdjacentHTML('beforebegin', newZaehlerHTML);

        // Setup Event-Listener für den neuen Eintrag
        setupZaehlerEventListeners(nextId);
    }

    function addNewTenantEntry() {
        const existingTenants = document.querySelectorAll('.tenant-entry:not(.moveout-entry)');
        const nextId = existingTenants.length + 1;

        const tenantBtn = document.getElementById('einzugtenant');
        if (!document.querySelector('.tenant-headers')) {
            tenantBtn.insertAdjacentHTML('beforebegin', `
      <div class="tenant-headers">
        <h2><i class="fas fa-user"></i> einziehende Mieter</h2>
        <div class="column-headers">
          <span>Nachname</span>
          <span>Vorname</span>
          <span>Telefonnummer</span>
          <span>E-Mail-Adresse</span>
          <span></span>
        </div>
      </div>
    `);
        }

        const newTenantHTML = `
    <div class="tenant-entry" id="tenant-entry-${nextId}">
      <div class="tenant-name">
        <input type="text" id="tenant-name-${nextId}" class="bemerkung-input" placeholder="Nachname" value="">
      </div>
      <div class="tenant-firstname">
        <input type="text" id="tenant-firstname-${nextId}" class="bemerkung-input" placeholder="Vorname" value="">
      </div>
      <div class="tenant-phone">
        <input type="tel" id="tenant-phone-${nextId}" class="bemerkung-input" placeholder="Telefonnummer" value="">
      </div>
      <div class="tenant-email">
        <input type="email" id="tenant-email-${nextId}" class="bemerkung-input" placeholder="E-Mail-Adresse" value="">
      </div>
      <div class="tenant-delete">
        <button type="button" class="delete-tenant-btn" id="tenant-delete-btn-${nextId}" data-tenant-id="${nextId}">×</button>
      </div>
    </div>
  `;

        tenantBtn.insertAdjacentHTML('beforebegin', newTenantHTML);

        // Setup Event-Listener für den neuen Eintrag
        setupTenantEventListeners(nextId, 'tenant');
    }

    function addNewMoveoutEntry() {
        const existingMoveouts = document.querySelectorAll('.moveout-entry');
        const nextId = existingMoveouts.length + 1;

        const moveoutBtn = document.getElementById('auszugtenant');
        if (!document.querySelector('.moveout-headers')) {
            moveoutBtn.insertAdjacentHTML('beforebegin', `
      <div class="moveout-headers">
        <h2><i class="fas fa-user"></i> ausziehende Mieter</h2>
        <div class="column-headers">
          <span>Nachname</span>
          <span>Vorname</span>
          <span>Adresse</span>
          <span>E-Mail-Adresse</span>
          <span></span>
        </div>
      </div>
    `);
        }

        const newMoveoutHTML = `
    <div class="tenant-entry moveout-entry" id="moveout-entry-${nextId}">
      <div class="tenant-name">
        <input type="text" id="moveout-name-${nextId}" class="bemerkung-input" placeholder="Nachname" value="">
      </div>
      <div class="tenant-firstname">
        <input type="text" id="moveout-firstname-${nextId}" class="bemerkung-input" placeholder="Vorname" value="">
      </div>
      <div class="tenant-phone">
        <input type="tel" id="moveout-addr-${nextId}" class="bemerkung-input" placeholder="Adresse" value="">
      </div>
      <div class="tenant-email">
        <input type="email" id="moveout-email-${nextId}" class="bemerkung-input" placeholder="E-Mail-Adresse" value="">
      </div>
      <div class="tenant-delete">
        <button type="button" class="delete-tenant-btn" id="moveout-delete-btn-${nextId}" data-tenant-id="${nextId}">×</button>
      </div>
    </div>
  `;

        moveoutBtn.insertAdjacentHTML('beforebegin', newMoveoutHTML);

        // Setup Event-Listener für den neuen Eintrag
        setupTenantEventListeners(nextId, 'moveout');
    }

    // Event-Listener Setup-Funktionen
    function setupKeyEventListeners(keyId) {
        const typeSelect = document.getElementById(`key-type-select-${keyId}`);
        const customContainer = document.getElementById(`key-custom-container-${keyId}`);
        const amountInput = document.getElementById(`key-amount-input-${keyId}`);
        const deleteBtn = document.querySelector(`[data-key-id="${keyId}"]`);

        if (typeSelect && customContainer) {
            typeSelect.addEventListener('change', () => {
                customContainer.style.display = typeSelect.value === 'Sonstige' ? 'block' : 'none';
            });
        }

        if (amountInput) {
            const minusBtn = amountInput.parentElement.querySelector('.minus');
            const plusBtn = amountInput.parentElement.querySelector('.plus');

            minusBtn?.addEventListener('click', () => {
                const current = parseInt(amountInput.value) || 1;
                if (current > 1) amountInput.value = current - 1;
            });

            plusBtn?.addEventListener('click', () => {
                const current = parseInt(amountInput.value) || 1;
                if (current < 99) amountInput.value = current + 1;
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm('Möchten Sie diesen Schlüssel wirklich löschen?')) {
                    document.getElementById(`key-entry-${keyId}`).remove();
                }
            });
        }
    }

    function setupZaehlerEventListeners(zaehlerId) {
        const typeSelect = document.getElementById(`zaehler-type-select-${zaehlerId}`);
        const customContainer = document.getElementById(`zaehler-custom-container-${zaehlerId}`);
        const valueInput = document.getElementById(`zaehler-value-input-${zaehlerId}`);
        const deleteBtn = document.querySelector(`[data-zaehler-id="${zaehlerId}"]`);

        if (typeSelect && customContainer) {
            typeSelect.addEventListener('change', () => {
                customContainer.style.display = typeSelect.value === 'custom' ? 'block' : 'none';
            });
        }

        if (valueInput) {
            valueInput.addEventListener('input', function () {
                if (this.value.length >= 14) {
                    showZaehlerWarning();
                }
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm('Möchten Sie diesen Zähler wirklich löschen?')) {
                    document.getElementById(`zaehler-entry-${zaehlerId}`).remove();
                }
            });
        }
    }

    function setupTenantEventListeners(tenantId, type) {
        const deleteBtn = document.getElementById(`${type === 'tenant' ? 'tenant' : 'moveout'}-delete-btn-${tenantId}`);
        const firstnameInput = document.getElementById(`${type === 'tenant' ? 'tenant' : 'moveout'}-firstname-${tenantId}`);
        const lastnameInput = document.getElementById(`${type === 'tenant' ? 'tenant' : 'moveout'}-name-${tenantId}`);

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm('Möchten Sie diesen Mieter wirklich löschen?')) {
                    document.getElementById(`${type === 'tenant' ? 'tenant' : 'moveout'}-entry-${tenantId}`).remove();
                }
            });
        }

        // Setup Echtzeit-Updates für Unterschriftennamen
        if (firstnameInput) {
            firstnameInput.addEventListener('input', () => {
                updateTenantSignatureName(tenantId, type);
            });
        }

        if (lastnameInput) {
            lastnameInput.addEventListener('input', () => {
                updateTenantSignatureName(tenantId, type);
            });
        }

        // Erstelle Unterschriftenfeld nach kurzer Verzögerung
        setTimeout(() => {
            createSignatureContainerFromSave(tenantId, type === 'tenant' ? 'einzug' : 'auszug');
        }, 100);
    }



    function cleanupDuplicateEventListeners() {
        // Entferne doppelte Event-Listener von allen Bemerkung-Buttons
        document.querySelectorAll('.add-bemerkung-btn, .del-bemerkung-btn').forEach(btn => {
            // Clone den Button um alle Event-Listener zu entfernen
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
        });

        // Stelle Event-Listener wieder her, aber nur einmal
        document.querySelectorAll('.bemerkung-container[data-bemerkung-id]').forEach(container => {
            const addBtn = container.querySelector('.add-bemerkung-btn');
            const delBtn = container.querySelector('.del-bemerkung-btn');
            const input = container.querySelector('.bemerkung-input');

            if (addBtn && input) {
                const raum = input.dataset.raum || 'unknown';

                addBtn.addEventListener('click', () => {
                    if (input.value.trim()) {
                        const nextId = `bemerkung-${raum}-${Date.now()}`;
                        createBemerkungRow(raum, nextId, '');
                    }
                });
            }

            if (delBtn) {
                delBtn.addEventListener('click', () => {
                    if (confirm('Bemerkung wirklich löschen?')) {
                        container.closest('.bemerkung-row, tr').remove();
                    }
                });
            }
        });
    }

    function resetBemerkungCounters() {
        const counters = {
            kueche: 0,
            bad: 0,
            wc: 0,
            flur: 0,
            abstellraum: 0,
            nebenraum: 0,
            regelungen: 0,
            weitere: 0  // ← HINZUFÜGEN
        };

        // Durchsuche alle bestehenden Bemerkungen und finde höchste Counter
        document.querySelectorAll('[data-bemerkung-id]').forEach(container => {
            const bemerkungId = container.dataset.bemerkungId;
            if (bemerkungId) {
                // Standard-Räume: bemerkung-kueche-1, bemerkung-bad-2, etc.
                const standardMatch = bemerkungId.match(/^bemerkung-(\w+)-(\d+)$/);
                if (standardMatch) {
                    const raum = standardMatch[1];
                    const number = parseInt(standardMatch[2]);
                    if (counters.hasOwnProperty(raum) && !isNaN(number)) {
                        counters[raum] = Math.max(counters[raum], number);
                    }
                }
            }
        });

        // Synchronisiere mit window.bemerkungCounters (addrow.js)
        if (window.bemerkungCounters) {
            Object.keys(counters).forEach(raum => {
                window.bemerkungCounters[raum] = counters[raum] + 1;
            });
            console.log('🔧 Bemerkung-Counter synchronisiert:', window.bemerkungCounters);
        }

        // Repariere Container ohne data-bemerkung-id
        document.querySelectorAll('.bemerkung-container:not([data-bemerkung-id])').forEach(container => {
            const input = container.querySelector('.bemerkung-input');
            let raum = input?.dataset.raum;

            // Raum-Erkennung fallback
            if (!raum) {
                const parentContainer = container.closest('[id$="-container"]');
                if (parentContainer) {
                    raum = parentContainer.id.replace('-container', '');
                }

                if (!raum) {
                    const tableContainer = container.closest('.table-container');
                    if (tableContainer) {
                        const classes = tableContainer.className.split(' ');
                        raum = classes.find(cls =>
                            ['kueche', 'bad', 'wc', 'flur', 'abstellraum', 'nebenraum'].includes(cls)
                        );
                    }
                }

                // Spezialfall für Regelungen
                if (!raum && container.closest('#regelungen')) {
                    raum = 'regelungen';
                }
            }

            // Container reparieren
            if (raum && counters.hasOwnProperty(raum)) {
                const newId = `bemerkung-${raum}-${++counters[raum]}`;
                container.setAttribute('data-bemerkung-id', newId);

                if (input) {
                    input.id = newId;
                    input.setAttribute('data-raum', raum);
                }

                console.log(`🔧 Repariert: ${raum} -> ${newId}`);

                // Auch window.bemerkungCounters aktualisieren
                if (window.bemerkungCounters) {
                    window.bemerkungCounters[raum] = counters[raum] + 1;
                }
            }
        });
    }

    window.emergencyCleanup = emergencyCleanup;
    window.showMobileAlert = showMobileAlert;

});
