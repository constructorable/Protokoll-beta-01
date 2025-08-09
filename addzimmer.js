document.addEventListener('DOMContentLoaded', function () {
    // Konfiguration
    const CONFIG = {
        maxImages: 20,
        thumbnailSize: 75,
        gallerySize: 1250,
        maxImageSize: 3500
    };

    // Klassische Wandfarben für Vorschläge
    const CLASSIC_WALL_COLORS = [
        "weiß",
        "beige",
        "grau",
        "hellgrau",
        "anthrazit",
        "creme",
        "creme-weiß",
        "elfenbein",
        "taubenblau",
        "hellblau",
        "schwarz",
        "bunt",
        "dunkelblau",
        "mintgrün",
        "pastellrosa",
        "sand",
        "terrakotta",
        "olivgrün",
        "taupe",
        "vanille",
        "himmelblau",
        "lachs",
        "moosgrün",
        "zitronengelb",
        "sonstige",
        "rot",
        "hellrot",
        "dunkelrot",
        "karminrot",
        "weinrot",
        "grün",
        "hellgrün",
        "dunkelgrün",
        "waldgrün",
        "apfelgrün",
        "braun",
        "hellbraun",
        "dunkelbraun",
        "kakao",
        "mahagoni",
        "mittelgrau",
        "steingrau",
        "silbergrau",
        "lila",
        "helllila",
        "dunkellila",
        "flieder",
        "lavendel",
        "rosa",
        "hellrosa",
        "dunkelrosa",
        "puderrosa",
        "altrosa",
        "gelb",
        "hellgelb",
        "dunkelgelb",
        "sonnenblumengelb",
        "goldgelb"
    ];

    // Globale Variablen
    let zimmerCount = 0;
    const zimmerBilder = {}; // Bilderspeicher für alle Zimmer
    const zimmerGalerien = {}; // Referenzen zu den Galerie-Containern

    // DOM-Elemente
    const addZimmerButton = document.getElementById('addzimmert');
    const galerieContainer = document.querySelector('.bildergalerie-container');

    // Initialisierung
    init();

    // Kamera-Funktionen
    async function getAvailableCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('Fehler beim Ermitteln der Kameras:', error);
            return [];
        }
    }

    function showCameraSelectionDialog(cameras, callback) {
        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1001;
        `;

        const dialog = document.createElement("div");
        dialog.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;

        const title = document.createElement("h3");
        title.textContent = "Kamera auswählen";
        title.style.cssText = `
            margin: 0 0 20px 0;
            color: #333;
            font-size: 1.5rem;
        `;
        dialog.appendChild(title);

        // Kamera-Buttons erstellen
        cameras.forEach((camera, index) => {
            const button = document.createElement("button");

            // Kamera-Label bestimmen
            let cameraLabel = camera.label || `Kamera ${index + 1}`;
            if (cameraLabel.toLowerCase().includes('front') || cameraLabel.toLowerCase().includes('user')) {
                cameraLabel = `Frontkamera (Selfie)`;
            } else if (cameraLabel.toLowerCase().includes('back') || cameraLabel.toLowerCase().includes('environment')) {
                cameraLabel = `Rückkamera`;
            } else {
                cameraLabel = `${cameraLabel}`;
            }

            button.textContent = cameraLabel;
            button.style.cssText = `
             display: block;
                width: 100%;
                margin: 10px 0;
                padding: 15px;
                background: linear-gradient(135deg, #466c9c, #466c9c);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1.4rem;
                transition: all 0.3s ease;
            `;

            button.onmouseover = () => {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 5px 15px rgba(76, 175, 80, 0.3)';
            };

            button.onmouseout = () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = 'none';
            };

            button.addEventListener('click', () => {
                document.body.removeChild(overlay);
                callback(camera.deviceId);
            });

            dialog.appendChild(button);
        });

        // Abbrechen-Button
        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Abbrechen";
        cancelButton.style.cssText = `
     display: block;
            width: 100%;
            margin: 20px 0 0 0;
            padding: 12px;
            background:rgb(117, 27, 20);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1.4rem;
        `;

        cancelButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        dialog.appendChild(cancelButton);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    }

    function showImageSourceDialog(count) {
        if (void 0 !== window.orientation || -1 !== navigator.userAgent.indexOf("IEMobile")) {
            const overlay = document.createElement("div");
            overlay.style.cssText = `
          position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            `;

            const dialog = document.createElement("div");
            dialog.style.cssText = `
                background: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
            `;

            const title = document.createElement("h3");
            title.textContent = "Bildquelle wählen";
            dialog.appendChild(title);

            const cameraButton = document.createElement("button");
            cameraButton.textContent = "Kamera verwenden";
            cameraButton.style.cssText = `
          font-size: 1.4rem;
                margin: 10px;
                padding: 10px 20px;
                background-color: #466c9c;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            `;

            const galleryButton = document.createElement("button");
            galleryButton.textContent = "Aus Galerie wählen";
            galleryButton.style.cssText = `
                font-size: 1.4rem;
                margin: 10px;
                padding: 10px 20px;
                background-color: #466c9c;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            `;

            const cancelButton = document.createElement("button");
            cancelButton.textContent = "Abbrechen";
            cancelButton.style.cssText = `
             font-size: 1.4rem;
                margin: 10px;
                padding: 10px 20px;
                background-color:rgb(130, 24, 16);
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            `;

            cameraButton.addEventListener("click", async () => {
                document.body.removeChild(overlay);

                // Verfügbare Kameras ermitteln
                const cameras = await getAvailableCameras();

                if (cameras.length === 0) {
                    alert('Keine Kameras gefunden!');
                    return;
                }

                if (cameras.length === 1) {
                    // Nur eine Kamera verfügbar
                    startCameraWithDeviceId(cameras[0].deviceId, count);
                } else {
                    // Mehrere Kameras - Auswahl anzeigen
                    showCameraSelectionDialog(cameras, (deviceId) => {
                        startCameraWithDeviceId(deviceId, count);
                    });
                }
            });

            galleryButton.addEventListener("click", () => {
                document.body.removeChild(overlay);
                selectFromGallery(count);
            });

            cancelButton.addEventListener("click", () => {
                document.body.removeChild(overlay);
            });

            dialog.appendChild(cameraButton);
            dialog.appendChild(galleryButton);
            dialog.appendChild(cancelButton);
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
        } else {
            selectFromGallery(count);
        }
    }

    function startCameraWithDeviceId(deviceId, count) {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const constraints = {
                video: {
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };

            navigator.mediaDevices.getUserMedia(constraints)
                .then(function (stream) {
                    const video = document.createElement("video");
                    video.style.cssText = `
                          position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 1000;
                        background-color: black;
                        object-fit: cover;
                    `;
                    video.srcObject = stream;
                    video.play();

                    const controls = document.createElement("div");
                    controls.style.cssText = `
                      position: fixed;
                        bottom: 20px;
                        left: 0;
                        width: 100%;
                        display: flex;
                        justify-content: center;
                        z-index: 1001;
                    `;

                    const captureButton = document.createElement("button");
                    captureButton.textContent = "Foto aufnehmen";
                    captureButton.style.cssText = `
                        padding: 15px 30px;
                        background: linear-gradient(135deg, #466c9c, #466c9c);
                        color: white;
                        border: none;
                        border-radius: 25px;
                        margin: 0 10px;
                        cursor: pointer;
                        font-size: 1.4rem;
                        box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
                    `;

                    const cancelCameraButton = document.createElement("button");
                    cancelCameraButton.textContent = "Abbrechen";
                    cancelCameraButton.style.cssText = `
                           padding: 15px 30px;
                        background: linear-gradient(135deg,rgb(90, 20, 15),rgb(109, 22, 22));
                        color: white;
                        border: none;
                        border-radius: 25px;
                        margin: 0 10px;
                        cursor: pointer;
                        font-size: 1.4rem;
                        box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
                    `;

                    captureButton.addEventListener("click", function () {
                        const canvas = document.createElement("canvas");
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

                        stream.getTracks().forEach(track => track.stop());
                        document.body.removeChild(video);
                        document.body.removeChild(controls);

                        canvas.toBlob(async function (blob) {
                            try {
                                // NEUE PRÜFUNG: Vor Kamera-Bild prüfen
                                if (window.imageLimit && !window.imageLimit.canAdd(1)) {
                                    window.imageLimit.showWarning();
                                    return;
                                }

                                const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
                                const imageData = await processImage(file);
                                zimmerBilder[count].push(imageData);
                                window.imageLimit?.update();
                                updateThumbnails(count);
                                updateGalerie(count);
                            } catch (error) {
                                console.error("Fehler beim Verarbeiten des Kamerabildes:", error);
                            }
                        }, "image/jpeg", 0.9);
                    });

                    cancelCameraButton.addEventListener("click", function () {
                        stream.getTracks().forEach(track => track.stop());
                        document.body.removeChild(video);
                        document.body.removeChild(controls);
                    });

                    controls.appendChild(captureButton);
                    controls.appendChild(cancelCameraButton);
                    document.body.appendChild(video);
                    document.body.appendChild(controls);
                })
                .catch(function (error) {
                    console.error("Kamera konnte nicht gestartet werden:", error);
                    selectFromGallery(count);
                });
        } else {
            selectFromGallery(count);
        }
    }

    function selectFromGallery(count) {
        if (window.imageLimit && !window.imageLimit.checkLimit(1)) return;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;

        input.onchange = async (e) => {
            const files = Array.from(e.target.files || []);
            if (files.length === 0) return;

            const currentTotal = window.imageLimit?.getTotal() || 0;
            const maxAllowed = window.imageLimit?.max || 7;
            const availableSlots = maxAllowed - currentTotal;

            // NEUE PRÜFUNG: Wenn zu viele Dateien ausgewählt
            if (files.length > availableSlots) {
                showOverlimitModal(files.length, availableSlots, maxAllowed, currentTotal);
                return;
            }

            // Normal hochladen wenn OK
            for (const file of files) {
                try {
                    const imageData = await processImage(file);
                    zimmerBilder[count].push(imageData);
                    window.imageLimit?.update();
                    updateThumbnails(count);
                    updateGalerie(count);
                } catch (error) {
                    console.error('Fehler beim Bildupload:', error);
                }
            }
        };
        input.click();
    }

    // NEUE FUNKTION: Overlimit Modal
    function showOverlimitModal(selectedCount, availableSlots, maxAllowed, currentTotal) {
        const modal = document.createElement('div');
        modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.6); z-index: 1002;
        display: flex; justify-content: center; align-items: center;
    `;

        modal.innerHTML = `
        <div style="background:white;padding:30px;border-radius:12px;text-align:center;max-width:450px;width:90%;box-shadow:0 10px 30px rgba(0,0,0,0.3);">
            <h3 style="color:#d32f2f;margin:0 0 20px 0;">⚠️ Zu viele Bilder ausgewählt</h3>
            <p style="margin:15px 0;line-height:1.5;">
                Sie haben <strong>${selectedCount} Bilder</strong> ausgewählt.<br>
                Es sind nur noch <strong>${availableSlots} Plätze</strong> frei.
            </p>
            <div style="background:#f5f5f5;padding:15px;border-radius:10px;margin:20px 0;">
                <strong>${currentTotal}/${maxAllowed} Bilder verwendet</strong>
            </div>
            <p style="margin:15px 0;color:#666;">
                Bitte löschen Sie zunächst andere Bilder oder wählen Sie weniger Dateien aus.
            </p>
            <button id="overlimitOkBtn" 
                    style="background:#466c9c;color:white;border:none;padding:12px 30px;border-radius:25px;cursor:pointer;font-size:1rem;">
                Verstanden
            </button>
        </div>
    `;

        document.body.appendChild(modal);

        // Button Event Listener hinzufügen
        const okBtn = modal.querySelector('#overlimitOkBtn');
        okBtn.addEventListener('click', () => {
            modal.remove();
        });

        // ESC-Taste zum Schließen
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);

        // Klick außerhalb zum Schließen
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Funktionen
    function init() {
        addZimmerButton.addEventListener('click', addNewZimmer);

        // Galerie-Container für Zimmer erstellen, falls nicht vorhanden
        if (!document.getElementById('zimmer-galerien-container')) {
            const container = document.createElement('div');
            container.id = 'zimmer-galerien-container';
            galerieContainer.appendChild(container);
        }
    }

function addNewZimmer() {
    // Aktuelle Zimmer zählen und höchste Nummer finden
    const existingZimmer = document.querySelectorAll('[id^="zimmer-container-"]');
    let maxZimmerNr = 0;
    existingZimmer.forEach(container => {
        const zimmerNr = parseInt(container.id.replace('zimmer-container-', ''));
        if (zimmerNr > maxZimmerNr) maxZimmerNr = zimmerNr;
    });
    
    // Nächste Zimmernummer = höchste + 1
    zimmerCount = maxZimmerNr + 1;
    
    zimmerBilder[zimmerCount] = [];
    window.imageLimit?.register(`zimmer${zimmerCount}`, zimmerBilder[zimmerCount]);
    createZimmerSection(zimmerCount);
    createGalerieSection(zimmerCount);
}

    function createZimmerSection(count) {
        const section = document.createElement('div');
        section.className = 'zimmer-section';
        section.innerHTML = generateZimmerHTML(count);
        const zimmerContainer = document.querySelector('.table-container.zimmer-n');
        zimmerContainer.appendChild(section);

        // Füge Event-Listener für den Lösch-Button hinzu
        const removeBtn = section.querySelector(`.remove-zimmer-btn[data-zimmer="${count}"]`);
        removeBtn.addEventListener('click', () => {
            if (confirm('Möchten Sie dieses Zimmer wirklich entfernen?')) {
                removeZimmer(count);
            }
        });

        // Rest der bestehenden Initialisierung
        initColorSuggestions(count);
        initBemerkungen(count);
        initRauchmelder(count);
        initImageUpload(count);

        if (window.initBodenForZimmer) {
            window.initBodenForZimmer(count);
        }
    }

    function createGalerieSection(count) {
        const container = document.getElementById('zimmer-galerien-container');

        const title = document.createElement('h3');
        title.id = `zimmer-${count}-galerie-title`;
        title.style.display = 'none';

        const galerie = document.createElement('div');
        galerie.className = `zimmer-galerie zimmer-${count}-galerie`;
        galerie.id = `zimmer-${count}-galerie`;

        container.appendChild(title);
        container.appendChild(galerie);

        zimmerGalerien[count] = {
            title: title,
            container: galerie
        };
    }

    function generateZimmerHTML(count) {
        return `
        <div class="table-container zimmer" id="zimmer-container-${count}" style="margin-top: 0;">
            <table>
                <thead>
                    <tr>
                        <th colspan="6" class="zimmer-header">
                            <div class="zimmer-verfuegbar" style="padding-top:10px; padding-bottom:10px; font-weight:300;">
                                Zimmer Nr. ${count}
                                <button type="button" class="remove-zimmer-btn" data-zimmer="${count}">x</button>
                            </div>
                        </th>
                    </tr>

                                            <tr>
                            <td colspan="1">Bezeichnung / Lage</td>
                            <td colspan="5"class="lage">
                                <input type="text" id="lageinputzimm${count}" class="textinput">
                                <div id="lagecontainerzimm${count}" class="suggestion-list"></div>
                            </td>


                                         </tr>
                    <tr class="zustandszeile">
                        <th class="aa">allgemeiner Zustand</th>
                        <th class="aa">in Ordnung</th>
                        <th class="aa">neuwertig</th>
                        <th class="aa">geringe Gebrauchs - spuren</th>
                        <th class="aa">stärkere Gebrauchs - spuren</th>
                        <th class="aa">nicht renoviert</th>
                    </tr>
                    <tr>
                        <td></td>
                        <td><input type="checkbox" id="boden-pb1-${count}"></td>
                        <td><input type="checkbox" id="boden-pb2-${count}"></td>
                        <td><input type="checkbox" id="boden-pb3-${count}"></td>
                        <td><input type="checkbox" id="boden-pb3b-${count}"></td>
                        <td><input type="checkbox" id="boden-pb4-${count}"></td>
                    </tr>
                    <tr>
                        <th class="aa1"></th>
                        <th class="aa1">in Ordnung</th>
                        <th class="aa1">geringe Gebrauchs - spuren</th>
                        <th class="aa1">repa. - bedürftig</th>
                        <th class="aa1">Reparatur durch den Mieter oder Vermieter</th>
                        <th class="aa1">nicht vor handen</th>
                    </tr>
                </thead>
                <tbody>


                    <tr>
                        <td>Türen / Zarge / Beschläge</td>
                        <td><input type="checkbox" id="zimm${count}-tuer-p1"></td>
                        <td><input type="checkbox" id="zimm${count}-tuer-p2"></td>
                        <td><input type="checkbox" id="zimm${count}-tuer-p3"></td>
                        <td>
                            <select id="zimm${count}-tuer-status">
                                <option value="na" id="zimm${count}-optuer1">-</option>
                                <option value="mieter" id="zimm${count}-optuer2">Mieter</option>
                                <option value="landl" id="zimm${count}-optuer3">Vermieter</option>
                                <option value="klar" id="zimm${count}-optuer4">in Klärung</option>
                            </select>
                        </td>
                        <td><input type="checkbox" id="zimm${count}-optuer5"></td>
                    </tr>






           <tr>
                                    <td>Zimmerschlüssel vorhanden?</td>
                                    <td><input type="checkbox" id="keyYeszimm${count}"></td>
                                    <td class="color1">ja</td>
                                    <td><input type="checkbox" id="keyNozimm${count}"></td>
                                    <td class="color1">nein</td>
                                    <td></td>
                                </tr>





                    <tr>
                        <td>Fenster / Beschläge / Glas</td>
                        <td><input type="checkbox" id="zimm${count}-glas-p1"></td>
                        <td><input type="checkbox" id="zimm${count}-glas-p2"></td>
                        <td><input type="checkbox" id="zimm${count}-glas-p3"></td>
                        <td>
                            <select id="zimm${count}-glas-status">
                                <option value="na" id="zimm${count}-opglas1">-</option>
                                <option value="mieter" id="zimm${count}-opglas2">Mieter</option>
                                <option value="landl" id="zimm${count}-opglas3">Vermieter</option>
                                <option value="klar" id="zimm${count}-opglas4">in Klärung</option>
                            </select>
                        </td>
                        <td><input type="checkbox" id="zimm${count}-opglas5"></td>
                    </tr>

                                        <tr>
                        <td>Jalousie / Rolläden / Klappäden</td>
                        <td><input type="checkbox" id="zimm${count}-roll-p1"></td>
                        <td><input type="checkbox" id="zimm${count}-roll-p2"></td>
                        <td><input type="checkbox" id="zimm${count}-roll-p3"></td>
                        <td>
                            <select id="zimm${count}-roll-status">
                                <option value="na" id="zimm${count}-oproll1">-</option>
                                <option value="mieter" id="zimm${count}-oproll2">Mieter</option>
                                <option value="landl" id="zimm${count}-oproll3">Vermieter</option>
                                <option value="klar" id="zimm${count}-oproll4">in Klärung</option>
                            </select>
                        </td>
                        <td><input type="checkbox" id="zimm${count}-oproll5"></td>
                    </tr>

                                        <tr>
                        <td>Decke</td>
                        <td><input type="checkbox" id="zimm${count}-deck-p1"></td>
                        <td><input type="checkbox" id="zimm${count}-deck-p2"></td>
                        <td><input type="checkbox" id="zimm${count}-deck-p3"></td>
                        <td>
                            <select id="zimm${count}-deck-status">
                                <option value="na" id="zimm${count}-opdeck1">-</option>
                                <option value="mieter" id="zimm${count}-opdeck2">Mieter</option>
                                <option value="landl" id="zimm${count}-opdeck3">Vermieter</option>
                                <option value="klar" id="zimm${count}-opdeck4">in Klärung</option>
                            </select>
                        </td>
                        <td><input type="checkbox" id="zimm${count}-opdeck5"></td>
                    </tr>

                                        <tr>
                        <td>Wände / Tapeten</td>
                        <td><input type="checkbox" id="zimm${count}-wand-p1"></td>
                        <td><input type="checkbox" id="zimm${count}-wand-p2"></td>
                        <td><input type="checkbox" id="zimm${count}-wand-p3"></td>
                        <td>
                            <select id="zimm${count}-wand-status">
                                <option value="na" id="zimm${count}-opwand1">-</option>
                                <option value="mieter" id="zimm${count}-opwand2">Mieter</option>
                                <option value="landl" id="zimm${count}-opwand3">Vermieter</option>
                                <option value="klar" id="zimm${count}-opwand4">in Klärung</option>
                            </select>
                        </td>
                        <td><input type="checkbox" id="zimm${count}-opwand5"></td>
                    </tr>



                    <tr>
                        <td>Farbe der Wände</td>
                         <td><input type="checkbox" id="zimm${count}"></td>
                                    <td class="color1">weiß oder →</td>
                        <td colspan="3">
                            <input type="text" id="wandfarbe-${count}" placeholder="" style="margin-left:0rem" class="farbe-input" autocomplete="off">
                            <div id="farbvorschlaege-${count}" class="farbvorschlaege-container" style="display:none;"></div>
                        </td>
                    </tr>


                                                            <tr>
                        <td>Heizkörper / Ventile / Rohre</td>
                        <td><input type="checkbox" id="zimm${count}-heiz-p1"></td>
                        <td><input type="checkbox" id="zimm${count}-heiz-p2"></td>
                        <td><input type="checkbox" id="zimm${count}-heiz-p3"></td>
                        <td>
                            <select id="zimm${count}-heiz-status">
                                <option value="na" id="zimm${count}-opheiz1">-</option>
                                <option value="mieter" id="zimm${count}-opheiz2">Mieter</option>
                                <option value="landl" id="zimm${count}-opheiz3">Vermieter</option>
                                <option value="klar" id="zimm${count}-opheiz4">in Klärung</option>
                            </select>
                        </td>
                        <td><input type="checkbox" id="zimm${count}-opheiz5"></td>
                    </tr>


 


                                                                                <tr>
                        <td>Fußboden / Leisten</td>
                        <td><input type="checkbox" id="zimm${count}-fuss-p1"></td>
                        <td><input type="checkbox" id="zimm${count}-fuss-p2"></td>
                        <td><input type="checkbox" id="zimm${count}-fuss-p3"></td>
                        <td>
                            <select id="zimm${count}-fuss-status">
                                <option value="na" id="zimm${count}-opfuss1">-</option>
                                <option value="mieter" id="zimm${count}-opfuss2">Mieter</option>
                                <option value="landl" id="zimm${count}-opfuss3">Vermieter</option>
                                <option value="klar" id="zimm${count}-opfuss4">in Klärung</option>
                            </select>
                        </td>
                        <td><input type="checkbox" id="zimm${count}-opfuss5"></td>
                    </tr>


                            <tr>
                                <td>Bodenbelag</td>
                                <td colspan="5">
                                    <input type="text" id="fussbodenzimm${count}" placeholder="" style="margin-left:2rem"
                                        class="farbe-input" autocomplete="off">
                                </td>
                            </tr>


                                                                                <tr>
                        <td>Radio- / Fernseh- / Internetdose</td>
                        <td><input type="checkbox" id="zimm${count}-fern-p1"></td>
                        <td><input type="checkbox" id="zimm${count}-fern-p2"></td>
                        <td><input type="checkbox" id="zimm${count}-fern-p3"></td>
                        <td>
                            <select id="zimm${count}-fern-status">
                                <option value="na" id="zimm${count}-opfern1">-</option>
                                <option value="mieter" id="zimm${count}-opfern2">Mieter</option>
                                <option value="landl" id="zimm${count}-opfern3">Vermieter</option>
                                <option value="klar" id="zimm${count}-opfern4">in Klärung</option>
                            </select>
                        </td>
                        <td><input type="checkbox" id="zimm${count}-opfern5"></td>
                    </tr>


                                                                                                   <tr>
                        <td>Steckdosen / Lichtschalter</td>
                        <td><input type="checkbox" id="zimm${count}-licht-p1"></td>
                        <td><input type="checkbox" id="zimm${count}-licht-p2"></td>
                        <td><input type="checkbox" id="zimm${count}-licht-p3"></td>
                        <td>
                            <select id="zimm${count}-licht-status">
                                <option value="na" id="zimm${count}-oplicht1">-</option>
                                <option value="mieter" id="zimm${count}-oplicht2">Mieter</option>
                                <option value="landl" id="zimm${count}-oplicht3">Vermieter</option>
                                <option value="klar" id="zimm${count}-oplicht4">in Klärung</option>
                            </select>
                        </td>
                        <td><input type="checkbox" id="zimm${count}-oplicht5"></td>
                    </tr>
                    


               
                    <tr>
                        <td>Anzahl Rauchwarnmelder</td>
                        <td colspan="5">
                            <div class="number-input">
                                <button type="button" class="number-btn minus">-</button>
                                <input type="number" id="rauchmelder-anzahl-${count}" min="0" max="9" value="0" readonly>
                                <button type="button" class="number-btn plus">+</button>
                            </div>
                        </td>
                    </tr>
                   
                <tr class="bemerkung-row">
                    <td style="font-weight:600; background:#fff; margin-top:11px; padding-top:11px">Bemerkungen:</td>
                </tr>
                <tr class="bemerkung-row">
                    <td colspan="6">
                        <div class="bemerkung-container" data-bemerkung-id="bemerkung-zimmer-${count}-0" id="bemerkung-container-zimmer-${count}">
                            <input type="text" id="bemerkung-zimmer-${count}-0" class="bemerkung-input"
                                placeholder="" data-raum="zimmer-${count}">
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
                                <div class="bilder-thumbnails" id="bilder-thumbnails-${count}"></div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>`;
    }

    function removeZimmer(count) {
        // Entferne das Zimmer aus dem DOM
        const container = document.getElementById(`zimmer-container-${count}`);
        if (container) container.remove();

        // Entferne die zugehörige Galerie
        const galerieContainer = document.getElementById(`zimmer-${count}-galerie`);
        const galerieTitle = document.getElementById(`zimmer-${count}-galerie-title`);
        if (galerieContainer) galerieContainer.remove();
        if (galerieTitle) galerieTitle.remove();

        // Bereinige die gespeicherten Bilder
        if (zimmerBilder[count]) {
            zimmerBilder[count].forEach(img => {
                URL.revokeObjectURL(img.originalUrl);
                URL.revokeObjectURL(img.thumbnailUrl);
                URL.revokeObjectURL(img.galleryUrl);
            });
            delete zimmerBilder[count];
        }

        // Entferne die Galerie aus der Verwaltung
        delete zimmerGalerien[count];
    }

    function initColorSuggestions(count) {
        const input = document.getElementById(`wandfarbe-${count}`);
        const suggestions = document.getElementById(`farbvorschlaege-${count}`);

        if (!input || !suggestions) return;

        input.addEventListener('input', (e) => {
            const value = e.target.value.trim().toLowerCase();

            if (value.length > 0) {
                const filtered = CLASSIC_WALL_COLORS.filter(color =>
                    color.toLowerCase().includes(value)
                );

                if (filtered.length > 0) {
                    suggestions.innerHTML = filtered.map(color =>
                        `<div class="farbvorschlag" onclick="this.parentElement.previousElementSibling.value='${color}'; this.parentElement.style.display='none'">${color}</div>`
                    ).join('');
                    suggestions.style.display = 'block';
                } else {
                    suggestions.style.display = 'none';
                }
            } else {
                suggestions.style.display = 'none';
            }
        });

        document.addEventListener('click', (e) => {
            if (!suggestions.contains(e.target) && e.target !== input) {
                suggestions.style.display = 'none';
            }
        });
    }

function initBemerkungen(count) {
    
    const bemerkungContainer = document.getElementById(`bemerkung-container-zimmer-${count}`);
    if (!bemerkungContainer) return;
    
 

    let bemerkungCounter = 0; // Zähler für neue Bemerkungen

    // Event-Delegation für alle Bemerkungsaktionen in diesem Zimmer
    bemerkungContainer.closest('tbody').addEventListener('click', (e) => {
        
        // Plus-Button (+) geklickt
        if (e.target.classList.contains('add-bemerkung-btn')) {
            bemerkungCounter++;
            
            // Neue Bemerkungszeile erstellen
            const newRow = document.createElement('tr');
            newRow.className = 'bemerkung-row';
            
            newRow.innerHTML = `
                <td colspan="6">
                    <div class="bemerkung-container" data-bemerkung-id="bemerkung-zimmer-${count}-${bemerkungCounter}">
                        <input type="text" id="bemerkung-zimmer-${count}-${bemerkungCounter}" class="bemerkung-input"
                            placeholder="" data-raum="zimmer-${count}">
                        <div class="bemerkung-actions">
                            <button type="button" class="add-bemerkung-btn">+</button>
                            <button type="button" class="del-bemerkung-btn" style="display: block;">×</button>
                        </div>
                    </div>
                </td>
            `;
            
            // Neue Zeile nach der aktuellen Bemerkungszeile einfügen
            const currentRow = e.target.closest('tr');
            currentRow.parentNode.insertBefore(newRow, currentRow.nextSibling);
        }
        
        // Löschen-Button (×) geklickt
        if (e.target.classList.contains('del-bemerkung-btn')) {
            const bemerkungRow = e.target.closest('tr');
            const bemerkungContainer = e.target.closest('.bemerkung-container');
            const bemerkungId = bemerkungContainer.getAttribute('data-bemerkung-id');
            
            // Prüfen ob es die erste/ursprüngliche Bemerkung ist
            if (bemerkungId === `bemerkung-zimmer-${count}-0`) {
                // Ursprüngliche Bemerkung nur leeren, nicht löschen
                const input = bemerkungContainer.querySelector('.bemerkung-input');
                input.value = '';
            } else {
                // Zusätzliche Bemerkungszeilen komplett entfernen
                bemerkungRow.remove();
            }
        }
    });
}

    // Hilfsfunktion zum Aktualisieren der IDs nach dem Löschen
    function updateBemerkungIDs(container, zimmerNummer) {
        const bemerkungen = container.querySelectorAll('.bemerkung-zeile');
        bemerkungen.forEach((bemerkung, index) => {
            const input = bemerkung.querySelector('.bemerkung-input');
            input.id = `zimm-${zimmerNummer}-bem-${index + 1}`;
        });
    }

    function initRauchmelder(count) {
        const input = document.getElementById(`rauchmelder-anzahl-${count}`);
        if (!input) return;

        const minusBtn = input.previousElementSibling;
        const plusBtn = input.nextElementSibling;

        if (minusBtn) {
            minusBtn.addEventListener('click', () => {
                let value = parseInt(input.value);
                if (value > 0) input.value = value - 1;
            });
        }

        if (plusBtn) {
            plusBtn.addEventListener('click', () => {
                let value = parseInt(input.value);
                if (value < 9) input.value = value + 1;
            });
        }
    }

    function initImageUpload(count) {
        const uploadBtn = document.querySelector(`#zimmer-container-${count} .bilder-upload-btn`);
        const thumbnailContainer = document.getElementById(`bilder-thumbnails-${count}`);

        if (!uploadBtn || !thumbnailContainer) return;

        uploadBtn.addEventListener('click', (event) => {
            if (event.target.dataset.limitReached === 'true') {
                window.imageLimit?.showMaxReachedModal();
                return;
            }
            if (window.imageLimit && !window.imageLimit.checkLimit(1)) {
                return;
            }

            // Prüfen ob mobile Gerät
            if (void 0 !== window.orientation || -1 !== navigator.userAgent.indexOf("IEMobile")) {
                showImageSourceDialog(count);
            } else {
                selectFromGallery(count);
            }
        });

        thumbnailContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('thumbnail-remove')) {
                const index = e.target.getAttribute('data-index');
                removeImage(count, index);
                window.imageLimit?.update();
            }
        });
    }

    async function processImage(file) {
        const img = await loadImage(file);

        const originalBlob = await resizeImage(img, CONFIG.maxImageSize, CONFIG.maxImageSize);
        const thumbnailBlob = await resizeImage(img, CONFIG.thumbnailSize, CONFIG.thumbnailSize);
        const galleryBlob = await resizeImage(img, CONFIG.gallerySize, CONFIG.gallerySize);

        return {
            originalUrl: URL.createObjectURL(originalBlob),
            thumbnailUrl: URL.createObjectURL(thumbnailBlob),
            galleryUrl: URL.createObjectURL(galleryBlob),
            name: file.name
        };
    }

    function loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Bild konnte nicht geladen werden'));
            };

            img.src = url;
        });
    }

    function resizeImage(img, maxWidth, maxHeight, quality = 0.5) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.floor(width * ratio);
                height = Math.floor(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(resolve, 'image/jpeg', quality);
        });
    }

    function updateThumbnails(count) {
        const container = document.getElementById(`bilder-thumbnails-${count}`);
        if (!container) return;

        container.innerHTML = '';

        zimmerBilder[count].forEach((img, index) => {
            const thumb = document.createElement('div');
            thumb.className = 'thumbnail';
            thumb.innerHTML = `
                <img src="${img.thumbnailUrl}" alt="Thumbnail">
                <button class="thumbnail-remove" data-index="${index}" title="Bild entfernen">×</button>
                <div class="thumbnail-name">${img.name}</div>
            `;
            container.appendChild(thumb);
        });
    }

    function updateGalerie(count) {
        const { container, title } = zimmerGalerien[count];
        if (!container || !title) return;

        container.innerHTML = '';

        if (zimmerBilder[count].length > 0) {
            title.style.display = 'block';

            zimmerBilder[count].forEach((img, index) => {
                const imgElement = document.createElement('div');
                imgElement.className = 'galerie-bild';
                imgElement.innerHTML = `
                    <div class="bild-info">
                        <span>Zimmer ${count} - Bild ${index + 1}</span>
                    </div>
                    <img src="${img.galleryUrl}" alt="Galeriebild">
                `;
                container.appendChild(imgElement);
            });
        } else {
            title.style.display = 'none';
        }
    }

    function removeImage(count, index) {
        const images = zimmerBilder[count];
        if (!images[index]) return;

        // Speicher freigeben
        URL.revokeObjectURL(images[index].originalUrl);
        URL.revokeObjectURL(images[index].thumbnailUrl);
        URL.revokeObjectURL(images[index].galleryUrl);

        // Bild entfernen
        images.splice(index, 1);

        // Anzeigen aktualisieren
        updateThumbnails(count);
        updateGalerie(count);
    }

window.addNewZimmer = addNewZimmer;
window.generateZimmerHTML = generateZimmerHTML;
window.initColorSuggestions = initColorSuggestions;
window.initBemerkungen = initBemerkungen;
window.initRauchmelder = initRauchmelder;
window.initImageUpload = initImageUpload;
window.removeZimmer = removeZimmer;
/* window.zimmerCount = zimmerCount; */

});

// Am Ende von addzimmer.js hinzufügen:
