// Globale Bildqualitäts-Konfiguration
window.GLOBAL_IMAGE_QUALITY = 0.6;

document.addEventListener("DOMContentLoaded", (function () {
    const e = [{
        name: "kueche",
        uploadBtnSelector: ".kueche .bilder-upload-btn",
        thumbnailContainerSelector: ".kueche .bilder-thumbnails",
        galleryContainerId: "kueche-galerie",
        titleElementId: "kueche-galerie-title"
    }, {
        name: "badezimmer",
        uploadBtnSelector: ".badezimmer .bilder-upload-btn",
        thumbnailContainerSelector: ".badezimmer .bilder-thumbnails",
        galleryContainerId: "bad-galerie",
        titleElementId: "bad-galerie-title"
    }, {
        name: "wc",
        uploadBtnSelector: ".wc .bilder-upload-btn",
        thumbnailContainerSelector: ".wc .bilder-thumbnails",
        galleryContainerId: "wc-galerie",
        titleElementId: "wc-galerie-title"
    }, {
        name: "flur",
        uploadBtnSelector: ".flur .bilder-upload-btn",
        thumbnailContainerSelector: ".flur .bilder-thumbnails",
        galleryContainerId: "flur-galerie",
        titleElementId: "flur-galerie-title"
    }, {
        name: "abstellraum",
        uploadBtnSelector: ".abstellraum .bilder-upload-btn",
        thumbnailContainerSelector: ".abstellraum .bilder-thumbnails",
        galleryContainerId: "abstellraum-galerie",
        titleElementId: "abstellraum-galerie-title"
    }, {
        name: "nebenraum",
        uploadBtnSelector: ".nebenraum .bilder-upload-btn",
        thumbnailContainerSelector: ".nebenraum .bilder-thumbnails",
        galleryContainerId: "nebenraum-galerie",
        titleElementId: "nebenraum-galerie-title"
    }];

    const t = {};

    function checkLimit(count = 1) {
        return window.imageLimit ? window.imageLimit.checkLimit(count) : true;
    }

    // Verfügbare Kameras ermitteln
    async function getAvailableCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('Fehler beim Ermitteln der Kameras:', error);
            return [];
        }
    }

    // Kameraauswahl-Dialog anzeigen
    function showCameraSelectionDialog(cameras, callback) {
        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
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
            font-size: 1.4rem;
        `;
        dialog.appendChild(title);

        // Kamera-Buttons erstellen
        cameras.forEach((camera, index) => {
            const button = document.createElement("button");

            let cameraLabel = camera.label || `Kamera ${index + 1}`;

            if (cameraLabel.toLowerCase().includes('back') || cameraLabel.toLowerCase().includes('environment')) { cameraLabel = `Rückkamera`; }

            else if (cameraLabel.toLowerCase().includes('front') || cameraLabel.toLowerCase().includes('user')) { cameraLabel = `Front (Selfie)`; }

            else { cameraLabel = `${cameraLabel}`; }





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
        cancelButton.textContent = "x";
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

    function n(e) {
        return new Promise((t => {
            const n = document.querySelector(e);
            if (n) return t(n);
            const l = new MutationObserver((() => {
                const n = document.querySelector(e);
                n && (l.disconnect(), t(n))
            }));
            l.observe(document.body, {
                childList: !0,
                subtree: !0
            })
        }))
    }

    async function l(e) {
        try {
            const [l, i] = await Promise.all([n(e.uploadBtnSelector), n(e.thumbnailContainerSelector)]),
                c = document.getElementById(e.galleryContainerId),
                s = document.getElementById(e.titleElementId);
            console.log(`Successfully initialized ${e.name}:`, {
                uploadBtn: l,
                thumbnailContainer: i,
                galleryContainer: c,
                titleElement: s
            });

            l.addEventListener("click", ((event) => {
                if (event.target.dataset.limitReached === 'true') {
                    window.imageLimit?.showMaxReachedModal();
                    return;
                }
                showImageSourceDialog(t[e.name], i, c, s)
            }));

            i.addEventListener("click", (function (n) {
                if (n.target.classList.contains("thumbnail-remove")) {
                    const l = n.target.getAttribute("data-index");
                    t[e.name][l] && (URL.revokeObjectURL(t[e.name][l].originalUrl), URL.revokeObjectURL(t[e.name][l].thumbnailUrl), URL.revokeObjectURL(t[e.name][l].galerieUrl));
                    t[e.name].splice(l, 1);
                    updateThumbnails(t[e.name], i);
                    updateGallery(t[e.name], c, s);
                    window.imageLimit?.update();
                }
            }));

            updateGallery(t[e.name], c, s)
        } catch (t) {
            console.error(`Error initializing ${e.name}:`, t)
        }
    }

    function showImageSourceDialog(imageArray, thumbnailContainer, galleryContainer, titleElement) {



        if (window.imageLimit && !window.imageLimit.checkLimit(1)) {
            return;
        }
        if (!checkLimit(1)) return;
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
            cancelButton.textContent = "x";
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
                    startCameraWithDeviceId(cameras[0].deviceId, imageArray, thumbnailContainer, galleryContainer, titleElement);
                } else {
                    // Mehrere Kameras - Auswahl anzeigen
                    showCameraSelectionDialog(cameras, (deviceId) => {
                        startCameraWithDeviceId(deviceId, imageArray, thumbnailContainer, galleryContainer, titleElement);
                    });
                }
            });

            galleryButton.addEventListener("click", () => {
                document.body.removeChild(overlay);
                selectFromGallery(imageArray, thumbnailContainer, galleryContainer, titleElement);
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
            selectFromGallery(imageArray, thumbnailContainer, galleryContainer, titleElement);
        }
    }

    function startCameraWithDeviceId(deviceId, imageArray, thumbnailContainer, galleryContainer, titleElement) {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {

            const constraints = {
                video: {
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    width: { ideal: 3264 },
                    height: { ideal: 2448 },
                    aspectRatio: { ideal: 4 / 3 }
                }
            };

            navigator.mediaDevices.getUserMedia(constraints)
                .then(function (stream) {
                    const video = document.createElement("video");
                    video.style.cssText = `
    position: fixed;
    top: 12.5%;
    left: 12.5%;
    width: 75%;
    height: 75%;
    z-index: 1000;
    background-color: black;
    object-fit: contain;
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
                    cancelCameraButton.textContent = "x";
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
                                const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
                                await processImage(file, imageArray, thumbnailContainer, galleryContainer, titleElement);
                            } catch (error) {
                                console.error("Fehler beim Verarbeiten des Kamerabildes:", error);
                            }
                        }, "image/jpeg", window.GLOBAL_IMAGE_QUALITY);
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
                    selectFromGallery(imageArray, thumbnailContainer, galleryContainer, titleElement);
                });
        } else {
            selectFromGallery(imageArray, thumbnailContainer, galleryContainer, titleElement);
        }
    }

    function selectFromGallery(imageArray, thumbnailContainer, galleryContainer, titleElement) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.multiple = true;

        input.onchange = async function (event) {
            const files = event.target.files; // DIESE ZEILE FEHLTE!
            if (files.length > 0) {
                // NEUE PRÜFUNG: Multi-File Limit Check
                const currentTotal = window.imageLimit?.getTotal() || 0;
                const maxAllowed = window.imageLimit?.max || 7;
                const availableSlots = maxAllowed - currentTotal;

                if (files.length > availableSlots) {
                    showOverlimitModal(files.length, availableSlots, maxAllowed, currentTotal);
                    return;
                }

                for (const file of Array.from(files)) {
                    try {
                        await processImage(file, imageArray, thumbnailContainer, galleryContainer, titleElement);
                    } catch (error) {
                        console.error("Fehler beim Verarbeiten des Bildes:", error);
                    }
                }
            }
        };
        input.click();
    }

    // NEUE FUNKTION: Overlimit Modal für addbilder.js
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

        // Button Event Listener
        const okBtn = modal.querySelector('#overlimitOkBtn');
        okBtn.addEventListener('click', () => {
            modal.remove();
        });

        // ESC und Click-Outside
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async function processImage(file, imageArray, thumbnailContainer, galleryContainer, titleElement) {
        const img = await loadImage(file);
        const originalBlob = await resizeImage(img, 2560, 2560, window.GLOBAL_IMAGE_QUALITY);
        const originalUrl = URL.createObjectURL(originalBlob);
        const thumbnailBlob = await resizeImage(img, 120, 120, window.GLOBAL_IMAGE_QUALITY);
        const thumbnailUrl = URL.createObjectURL(thumbnailBlob);
        const galleryBlob = await resizeImage(img, 1600, 1600, window.GLOBAL_IMAGE_QUALITY);
        const galleryUrl = URL.createObjectURL(galleryBlob);
        const imageData = {
            originalUrl: originalUrl,
            thumbnailUrl: thumbnailUrl,
            galerieUrl: galleryUrl
        };
        imageArray.push(imageData);
        updateThumbnails(imageArray, thumbnailContainer);
        updateGallery(imageArray, galleryContainer, titleElement);
        window.imageLimit?.update();
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
                reject(new Error("Bild konnte nicht geladen werden"));
            };
            img.src = url;
        });
    }

    function resizeImage(img, maxWidth, maxHeight, quality = window.GLOBAL_IMAGE_QUALITY) {
        return new Promise(resolve => {
            const canvas = document.createElement("canvas");
            let { width, height } = img;

            if (width > maxWidth || height > maxHeight) {
                const scale = Math.min(maxWidth / width, maxHeight / height);
                width = Math.floor(width * scale);
                height = Math.floor(height * scale);
            }

            canvas.width = width;
            canvas.height = height;
            canvas.getContext("2d").drawImage(img, 0, 0, width, height);
            canvas.toBlob(blob => resolve(blob), "image/jpeg", quality);
        });
    }

    function updateThumbnails(imageArray, container) {
        if (!container) return;

        container.innerHTML = "";
        imageArray.forEach((imageData, index) => {
            const thumbnail = document.createElement("div");
            thumbnail.className = "thumbnail";
            thumbnail.innerHTML = `
                <img src="${imageData.thumbnailUrl}" alt="Foto" style="width:75px; height:75px; object-fit:cover;">
                <button class="thumbnail-remove" data-index="${index}">×</button>
            `;
            container.appendChild(thumbnail);
        });
    }

    function updateGallery(imageArray, container, titleElement) {
        if (!container || !titleElement) return;

        container.innerHTML = "";
        const categoryName = container.id.replace("-galerie", "");

        imageArray.forEach((imageData, index) => {
            const galleryImage = document.createElement("div");
            galleryImage.className = "galerie-bild";
            galleryImage.style.marginBottom = "20px";
            galleryImage.innerHTML = `
                <div style="margin-bottom: 5px;">${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} – Bild ${index + 1}</div>
                <img src="${imageData.galerieUrl}" alt="Foto" style="max-width:1000px;">
            `;
            container.appendChild(galleryImage);
        });

        // Titel-Element Sichtbarkeit
        if (container && titleElement) {
            if (container.children.length > 0) {
                titleElement.style.display = "block";
                titleElement.style.animation = "0.3s ease-in-out fadeIn";
            } else {
                titleElement.style.display = "none";
            }
        }
    }

    // Initialisierung
    e.forEach(category => {
        t[category.name] = [];
        window.imageLimit?.register(category.name, t[category.name]);
    });

    e.forEach(category => {
        l(category);
    });
}));

window.addEventListener('load', () => {
    setTimeout(() => {
        window.imageLimit?.update();
    }, 500);

});









