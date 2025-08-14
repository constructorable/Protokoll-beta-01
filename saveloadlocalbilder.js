// Globale Bildqualitäts-Konfiguration
window.GLOBAL_IMAGE_QUALITY = 0.6;

document.addEventListener('DOMContentLoaded', function () {
    console.log('🖼️ saveloadlocalbilder.js geladen');

    // IndexedDB Konfiguration
    const DB_NAME = 'ImmobilienBilderDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'images';
    let db = null;

    // Bild-Konfiguration
const IMAGE_CONFIG = {
    thumbnail: { maxSize: 120, quality: window.GLOBAL_IMAGE_QUALITY, format: 'image/jpeg' },
    gallery: { maxSize: 1600, quality: window.GLOBAL_IMAGE_QUALITY, format: 'image/jpeg' },
    original: { maxSize: 2560, quality: window.GLOBAL_IMAGE_QUALITY, format: 'image/jpeg' }
};

    // IndexedDB initialisieren
    async function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('❌ IndexedDB Fehler:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                db = request.result;
                console.log('✅ IndexedDB verbunden');
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                const database = event.target.result;

                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('saveId', 'saveId', { unique: false });
                    store.createIndex('roomName', 'roomName', { unique: false });
                    console.log('🔧 IndexedDB Store erstellt');
                }
            };
        });
    }

    // Bild komprimieren
    function compressImage(file, config) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                let { width, height } = img;

                if (width > config.maxSize || height > config.maxSize) {
                    const ratio = Math.min(config.maxSize / width, config.maxSize / height);
                    width = Math.floor(width * ratio);
                    height = Math.floor(height * ratio);
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL(config.format, config.quality));
            };

            img.src = URL.createObjectURL(file);
        });
    }

    // Bild aus Blob-URL komprimieren
    function compressImageFromBlob(blobUrl, config) {
        return new Promise((resolve, reject) => {
            fetch(blobUrl)
                .then(response => response.blob())
                .then(blob => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();

                    img.onload = () => {
                        let { width, height } = img;

                        if (width > config.maxSize || height > config.maxSize) {
                            const ratio = Math.min(config.maxSize / width, config.maxSize / height);
                            width = Math.floor(width * ratio);
                            height = Math.floor(height * ratio);
                        }

                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);

                        resolve(canvas.toDataURL(config.format, config.quality));
                    };

                    img.onerror = reject;
                    img.src = URL.createObjectURL(blob);
                })
                .catch(reject);
        });
    }

    // Bild in IndexedDB speichern
    async function saveImageToDB(imageData) {
        if (!db) await initDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const request = store.put(imageData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Bilder aus IndexedDB laden
    async function loadImagesFromDB(saveId) {
        if (!db) await initDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('saveId');

            const request = index.getAll(saveId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Bilder für Speicherstand löschen
    async function deleteImagesFromDB(saveId) {
        if (!db) await initDB();

        const images = await loadImagesFromDB(saveId);

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            let completed = 0;
            const total = images.length;

            if (total === 0) {
                resolve();
                return;
            }

            images.forEach(image => {
                const deleteRequest = store.delete(image.id);

                deleteRequest.onsuccess = () => {
                    completed++;
                    if (completed === total) resolve();
                };

                deleteRequest.onerror = () => reject(deleteRequest.error);
            });
        });
    }

    // Bilder sammeln (für Speichern)
    async function collectImageData() {
        const imageData = {};

        if (!window.imageLimit || !window.imageLimit.arrays) {
            console.log('📷 Kein imageLimit System gefunden');
            return imageData;
        }

        for (const [roomName, imageArray] of window.imageLimit.arrays) {
            if (imageArray.length > 0) {
                imageData[roomName] = [];

                for (const img of imageArray) {
                    try {
                        const [thumbnailBase64, galleryBase64] = await Promise.all([
                            compressImageFromBlob(img.thumbnailUrl, IMAGE_CONFIG.thumbnail),
                            compressImageFromBlob(img.galerieUrl || img.galleryUrl, IMAGE_CONFIG.gallery)
                        ]);

                        imageData[roomName].push({
                            thumbnail: thumbnailBase64,
                            gallery: galleryBase64,
                            name: img.name || 'image.jpg'
                        });
                    } catch (error) {
                        console.warn(`⚠️ Fehler beim Verarbeiten von Bild in ${roomName}:`, error);
                    }
                }
            }
        }

        console.log('📸 Bilder gesammelt:', Object.keys(imageData));
        return imageData;
    }

    // Bilder in IndexedDB speichern
    async function saveImageDataToDB(saveId, imageData) {
        if (!db) await initDB();

        console.log(`💾 Speichere Bilder für: ${saveId}`);

        // Erst alte Bilder löschen
        await deleteImagesFromDB(saveId);

        const promises = [];

        Object.entries(imageData).forEach(([roomName, images]) => {
            images.forEach((imgData, index) => {
                const imageRecord = {
                    id: `${saveId}_${roomName}_${index}`,
                    saveId: saveId,
                    roomName: roomName,
                    index: index,
                    thumbnail: imgData.thumbnail,
                    gallery: imgData.gallery,
                    name: imgData.name,
                    timestamp: new Date().toISOString()
                };

                promises.push(saveImageToDB(imageRecord));
            });
        });

        await Promise.all(promises);
        console.log(`✅ ${promises.length} Bilder gespeichert`);
    }

    // Bilder aus IndexedDB laden und wiederherstellen
    async function loadImageDataFromDB(saveId) {
        if (!db) await initDB();

        console.log(`🔍 Lade Bilder für: ${saveId}`);

        const images = await loadImagesFromDB(saveId);

        if (images.length === 0) {
            console.log('📷 Keine Bilder gefunden');
            return;
        }

        // Gruppiere Bilder nach Räumen
        const imagesByRoom = {};
        images.forEach(img => {
            if (!imagesByRoom[img.roomName]) {
                imagesByRoom[img.roomName] = [];
            }
            imagesByRoom[img.roomName].push(img);
        });

        // Sortiere nach Index
        Object.values(imagesByRoom).forEach(roomImages => {
            roomImages.sort((a, b) => a.index - b.index);
        });

        // Bilder wiederherstellen
        await restoreImageData(imagesByRoom);
        console.log(`✅ Bilder wiederhergestellt für ${Object.keys(imagesByRoom).length} Räume`);
    }

    // Base64 zu Blob konvertieren
    function base64ToBlob(base64) {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        return new Blob([new Uint8Array(byteNumbers)], { type: 'image/jpeg' });
    }

    // Bilder wiederherstellen
    async function restoreImageData(imagesByRoom) {
        // imageLimit System zurücksetzen
        if (window.imageLimit) {
            window.imageLimit.arrays.clear();
        }

        Object.entries(imagesByRoom).forEach(([roomName, images]) => {
            console.log(`🖼️ Stelle ${images.length} Bilder für ${roomName} wieder her`);

            images.forEach((imgRecord, index) => {
                const thumbnailBlob = base64ToBlob(imgRecord.thumbnail);
                const galleryBlob = base64ToBlob(imgRecord.gallery);
                const thumbnailUrl = URL.createObjectURL(thumbnailBlob);
                const galleryUrl = URL.createObjectURL(galleryBlob);

                if (roomName.startsWith('zimmer')) {
                    const zimmerNr = roomName.replace('zimmer', '');
                    restoreZimmerImage(zimmerNr, thumbnailUrl, galleryUrl, imgRecord.name, index);
                } else {
                    setTimeout(() => {
                        restoreRoomImage(roomName, thumbnailUrl, galleryUrl, index);
                    }, 100);
                }

                // Zu imageLimit hinzufügen
                if (window.imageLimit) {
                    if (!window.imageLimit.arrays.has(roomName)) {
                        window.imageLimit.arrays.set(roomName, []);
                    }
                    const array = window.imageLimit.arrays.get(roomName);
                    array.push({
                        originalUrl: galleryUrl,
                        thumbnailUrl: thumbnailUrl,
                        galerieUrl: galleryUrl,
                        galleryUrl: galleryUrl,
                        name: imgRecord.name
                    });
                }
            });
        });

        // imageLimit updaten
        if (window.imageLimit) {
            setTimeout(() => {
                window.imageLimit.update();
                console.log('🔄 imageLimit System aktualisiert');
            }, 500);
        }
    }

    // Zimmer-Bild wiederherstellen
    function restoreZimmerImage(zimmerNr, thumbnailUrl, galleryUrl, fileName, index) {
        // Thumbnail hinzufügen
        const thumbContainer = document.getElementById(`bilder-thumbnails-${zimmerNr}`);
        if (thumbContainer) {
            thumbContainer.insertAdjacentHTML('beforeend', `
        <div class="thumbnail">
          <img src="${thumbnailUrl}" alt="Thumbnail" style="width:75px;height:75px;object-fit:cover;">
          <button class="thumbnail-remove" data-index="${index}">×</button>
          <div class="thumbnail-name">${fileName}</div>
        </div>
      `);
        }

        // Galerie hinzufügen
        const galerieContainer = document.querySelector('.bildergalerie-container');
        if (galerieContainer) {
            let zimmerGalerienContainer = document.getElementById('zimmer-galerien-container');
            if (!zimmerGalerienContainer) {
                zimmerGalerienContainer = document.createElement('div');
                zimmerGalerienContainer.id = 'zimmer-galerien-container';
                galerieContainer.appendChild(zimmerGalerienContainer);
            }

            let zimmerGalerie = document.getElementById(`zimmer${zimmerNr}-galerie`);
            if (!zimmerGalerie) {
                zimmerGalerienContainer.insertAdjacentHTML('beforeend', `
          <h3 id="zimmer${zimmerNr}-galerie-title">Zimmer ${zimmerNr} - Bilder</h3>
          <div class="zimmer${zimmerNr}-galerie" id="zimmer${zimmerNr}-galerie"></div>
        `);
                zimmerGalerie = document.getElementById(`zimmer${zimmerNr}-galerie`);
            }

            if (zimmerGalerie) {
                zimmerGalerie.insertAdjacentHTML('beforeend', `
          <div class="galerie-bild" style="margin-bottom:20px;">
            <div style="margin-bottom:5px;">Zimmer ${zimmerNr} – Bild ${index + 1}</div>
            <img src="${galleryUrl}" alt="Galeriebild" style="max-width:1000px;">
          </div>
        `);

                zimmerGalerie.style.display = 'block';
                const zimmerTitle = document.getElementById(`zimmer${zimmerNr}-galerie-title`);
                if (zimmerTitle) zimmerTitle.style.display = 'block';
            }
        }
    }

    // Raum-Bild wiederherstellen
    function restoreRoomImage(roomName, thumbnailUrl, galleryUrl, index) {
        // Thumbnail hinzufügen
        let thumbContainer = document.querySelector(`.${roomName} .bilder-thumbnails`);
        if (!thumbContainer) {
            thumbContainer = document.querySelector(`#${roomName} .bilder-thumbnails`);
        }
        if (!thumbContainer) {
            thumbContainer = document.querySelector(`[data-room="${roomName}"] .bilder-thumbnails`);
        }

        if (thumbContainer) {
            thumbContainer.insertAdjacentHTML('beforeend', `
        <div class="thumbnail">
          <img src="${thumbnailUrl}" alt="Foto" style="width:75px;height:75px;object-fit:cover;">
          <button class="thumbnail-remove" data-index="${index}">×</button>
        </div>
      `);
        }

        // Galerie hinzufügen
        const galerieContainer = document.querySelector('.bildergalerie-container');
        if (galerieContainer) {
            let galerie = document.getElementById(`${roomName}-galerie`);
            if (!galerie) {
                galerieContainer.insertAdjacentHTML('beforeend', `
          <h3 id="${roomName}-galerie-title">${roomName.charAt(0).toUpperCase() + roomName.slice(1)} - Bilder</h3>
          <div class="${roomName}-galerie" id="${roomName}-galerie"></div>
        `);
                galerie = document.getElementById(`${roomName}-galerie`);
            }

            if (galerie) {
                const roomDisplayName = roomName.charAt(0).toUpperCase() + roomName.slice(1);
                galerie.insertAdjacentHTML('beforeend', `
          <div class="galerie-bild" style="margin-bottom:20px;">
            <div style="margin-bottom:5px;">${roomDisplayName} – Bild ${index + 1}</div>
            <img src="${galleryUrl}" alt="Foto" style="max-width:1000px;">
          </div>
        `);

                galerie.style.display = 'block';
                const galerieTitle = document.getElementById(`${roomName}-galerie-title`);
                if (galerieTitle) galerieTitle.style.display = 'block';
            }
        }
    }

    // Bilder exportieren
    async function exportImageData(saveId = null) {
        try {
            let imageData;

            if (saveId) {
                // Exportiere gespeicherte Bilder
                const images = await loadImagesFromDB(saveId);
                imageData = {};

                images.forEach(img => {
                    if (!imageData[img.roomName]) {
                        imageData[img.roomName] = [];
                    }
                    imageData[img.roomName].push({
                        thumbnail: img.thumbnail,
                        gallery: img.gallery,
                        name: img.name
                    });
                });
            } else {
                // Exportiere aktuelle Bilder
                imageData = await collectImageData();
            }

            const exportData = {
                imageData: imageData,
                timestamp: new Date().toISOString(),
                exportMetadata: {
                    version: '1.0',
                    source: 'saveloadlocalbilder.js',
                    totalImages: Object.values(imageData).reduce((sum, images) => sum + images.length, 0)
                }
            };

            return exportData;
        } catch (error) {
            console.error('❌ Export-Fehler:', error);
            throw error;
        }
    }

    // Bilder importieren
    async function importImageData(importData, saveId) {
        try {
            if (importData.imageData) {
                await saveImageDataToDB(saveId, importData.imageData);
                await loadImageDataFromDB(saveId);
                console.log('✅ Bilder importiert');
            }
        } catch (error) {
            console.error('❌ Import-Fehler:', error);
            throw error;
        }
    }

    // Alle Bilder für Speicherstand löschen
    async function clearImagesForSave(saveId) {
        try {
            await deleteImagesFromDB(saveId);
            console.log(`🗑️ Bilder für ${saveId} gelöscht`);
        } catch (error) {
            console.error('❌ Lösch-Fehler:', error);
        }
    }

    // Speicher-Info anzeigen
    async function getStorageInfo() {
        if (!db) await initDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.count();

            request.onsuccess = () => {
                resolve({
                    totalImages: request.result,
                    dbName: DB_NAME,
                    storeName: STORE_NAME
                });
            };

            request.onerror = () => reject(request.error);
        });
    }

    // Integration mit saveloadlocal.js
    function integrateMitSaveLoadLocal() {
        // Überschreibe die ursprünglichen Funktionen
        if (typeof window.collectImageData === 'function') {
            window.originalCollectImageData = window.collectImageData;
        }
        if (typeof window.restoreImageData === 'function') {
            window.originalRestoreImageData = window.restoreImageData;
        }

        // Neue Funktionen global verfügbar machen
        window.collectImageData = collectImageData;
        window.restoreImageData = restoreImageData;
        window.saveImageDataToDB = saveImageDataToDB;
        window.loadImageDataFromDB = loadImageDataFromDB;
        window.exportImageData = exportImageData;
        window.importImageData = importImageData;
        window.clearImagesForSave = clearImagesForSave;
        window.getImageStorageInfo = getStorageInfo;

        console.log('🔗 Integration mit saveloadlocal.js abgeschlossen');
    }

    // Initialisierung
    async function init() {
        try {
            await initDB();
            integrateMitSaveLoadLocal();

            const info = await getStorageInfo();
            console.log(`📊 IndexedDB bereit: ${info.totalImages} Bilder gespeichert`);

            // NEUE ZEILE: Zeige detaillierten Report
            if (info.totalImages > 0) {
                setTimeout(() => showImageStorageReport(), 1000);
            }

            // NEUE ZEILE: Report-Funktion in Console verfügbar machen
            console.log('💡 Tipp: Verwende showImageStorageReport() für detaillierte Statistiken');

        } catch (error) {
            console.error('❌ Initialisierung fehlgeschlagen:', error);
        }
    }

    // Auto-Start
    init();

    // Füge diese Funktionen zur saveloadlocalbilder.js hinzu:

    // Detaillierte Speicher-Info anzeigen
    async function getDetailedStorageInfo() {
        if (!db) await initDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const allImages = request.result;

                // Statistiken sammeln
                const stats = {
                    totalImages: allImages.length,
                    totalSizeBytes: 0,
                    totalSizeMB: 0,
                    byRoom: {},
                    bySave: {},
                    qualityInfo: {
                        thumbnails: { count: 0, avgSize: 0, totalSize: 0 },
                        galleries: { count: 0, avgSize: 0, totalSize: 0 }
                    },
                    pixelInfo: []
                };

                allImages.forEach(img => {
                    // Größe berechnen
                    const thumbnailSize = img.thumbnail ? (img.thumbnail.length * 0.75) : 0; // Base64 overhead
                    const gallerySize = img.gallery ? (img.gallery.length * 0.75) : 0;
                    const totalImageSize = thumbnailSize + gallerySize;

                    stats.totalSizeBytes += totalImageSize;

                    // Nach Raum gruppieren
                    if (!stats.byRoom[img.roomName]) {
                        stats.byRoom[img.roomName] = { count: 0, size: 0, images: [] };
                    }
                    stats.byRoom[img.roomName].count++;
                    stats.byRoom[img.roomName].size += totalImageSize;
                    stats.byRoom[img.roomName].images.push({
                        name: img.name,
                        thumbnailSize: Math.round(thumbnailSize),
                        gallerySize: Math.round(gallerySize),
                        totalSize: Math.round(totalImageSize)
                    });

                    // Nach Speicherstand gruppieren
                    if (!stats.bySave[img.saveId]) {
                        stats.bySave[img.saveId] = { count: 0, size: 0 };
                    }
                    stats.bySave[img.saveId].count++;
                    stats.bySave[img.saveId].size += totalImageSize;

                    // Qualitäts-Info
                    if (img.thumbnail) {
                        stats.qualityInfo.thumbnails.count++;
                        stats.qualityInfo.thumbnails.totalSize += thumbnailSize;
                    }
                    if (img.gallery) {
                        stats.qualityInfo.galleries.count++;
                        stats.qualityInfo.galleries.totalSize += gallerySize;
                    }

                    // Pixel-Info extrahieren (aus Base64 Header wenn möglich)
                    if (img.gallery) {
                        try {
                            const pixelInfo = extractImageDimensions(img.gallery);
                            if (pixelInfo) {
                                stats.pixelInfo.push({
                                    room: img.roomName,
                                    name: img.name,
                                    ...pixelInfo,
                                    size: Math.round(gallerySize)
                                });
                            }
                        } catch (e) {
                            // Ignore extraction errors
                        }
                    }
                });

                // Durchschnittswerte berechnen
                stats.totalSizeMB = (stats.totalSizeBytes / (1024 * 1024)).toFixed(2);

                if (stats.qualityInfo.thumbnails.count > 0) {
                    stats.qualityInfo.thumbnails.avgSize = Math.round(
                        stats.qualityInfo.thumbnails.totalSize / stats.qualityInfo.thumbnails.count
                    );
                }

                if (stats.qualityInfo.galleries.count > 0) {
                    stats.qualityInfo.galleries.avgSize = Math.round(
                        stats.qualityInfo.galleries.totalSize / stats.qualityInfo.galleries.count
                    );
                }

                // Größen in KB/MB umrechnen
                Object.values(stats.byRoom).forEach(room => {
                    room.sizeMB = (room.size / (1024 * 1024)).toFixed(2);
                    room.sizeKB = (room.size / 1024).toFixed(1);
                });

                Object.values(stats.bySave).forEach(save => {
                    save.sizeMB = (save.size / (1024 * 1024)).toFixed(2);
                    save.sizeKB = (save.size / 1024).toFixed(1);
                });

                resolve(stats);
            };

            request.onerror = () => reject(request.error);
        });
    }

    // Bild-Dimensionen aus Base64 extrahieren (vereinfacht)
    function extractImageDimensions(base64String) {
        try {
            // Erstelle temporäres Image Element
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            return new Promise((resolve) => {
                img.onload = () => {
                    resolve({
                        width: img.width,
                        height: img.height,
                        megapixels: ((img.width * img.height) / 1000000).toFixed(2)
                    });
                };
                img.onerror = () => resolve(null);
                img.src = base64String;
            });
        } catch (e) {
            return null;
        }
    }

    // Console-Report anzeigen
    async function showImageStorageReport() {
        try {
            console.log('=== INDEXEDDB BILDER-REPORT ===');
            console.log('=== INDEXEDDB BILDER-REPORT ===');
            console.log('=== INDEXEDDB BILDER-REPORT ===');

            const stats = await getDetailedStorageInfo();

            // Gesamt-Übersicht
            console.log(`📈 GESAMT-STATISTIK:`);
            console.log(`   💾 Bilder gesamt: ${stats.totalImages}`);
            console.log(`   📦 Speicherplatz: ${stats.totalSizeMB} MB (${(stats.totalSizeBytes / 1024).toFixed(1)} KB)`);
            console.log(`   🖼️ Durchschn. pro Bild: ${(stats.totalSizeBytes / stats.totalImages / 1024).toFixed(1)} KB`);

            // Qualitäts-Info
            console.log(`\n🎨 QUALITÄTS-ÜBERSICHT:`);
            console.log(`   🔍 Thumbnails: ${stats.qualityInfo.thumbnails.count} Stück`);
            console.log(`      ↳ Durchschnitt: ${(stats.qualityInfo.thumbnails.avgSize / 1024).toFixed(1)} KB`);
            console.log(`      ↳ Konfiguration: ${IMAGE_CONFIG.thumbnail.maxSize}px, ${Math.round(IMAGE_CONFIG.thumbnail.quality * 100)}% Qualität`);

            console.log(`   🖼️ Galerien: ${stats.qualityInfo.galleries.count} Stück`);
            console.log(`      ↳ Durchschnitt: ${(stats.qualityInfo.galleries.avgSize / 1024).toFixed(1)} KB`);
            console.log(`      ↳ Konfiguration: ${IMAGE_CONFIG.gallery.maxSize}px, ${Math.round(IMAGE_CONFIG.gallery.quality * 100)}% Qualität`);

            // Nach Räumen
            console.log(`\n🏠 VERTEILUNG NACH RÄUMEN:`);
            Object.entries(stats.byRoom).forEach(([room, data]) => {
                console.log(`   📁 ${room}: ${data.count} Bilder, ${data.sizeMB} MB`);
                data.images.forEach(img => {
                    console.log(`      ↳ ${img.name}: Thumb ${(img.thumbnailSize / 1024).toFixed(1)}KB + Galerie ${(img.gallerySize / 1024).toFixed(1)}KB`);
                });
            });

            // Nach Speicherständen
            console.log(`\n💾 VERTEILUNG NACH SPEICHERSTÄNDEN:`);
            Object.entries(stats.bySave).forEach(([saveId, data]) => {
                console.log(`   📂 ${saveId}: ${data.count} Bilder, ${data.sizeMB} MB`);
            });

            // Pixel-Info (falls verfügbar)
            if (stats.pixelInfo.length > 0) {
                console.log(`\n📏 PIXEL-INFORMATIONEN:`);
                stats.pixelInfo.forEach(pixel => {
                    if (pixel.width && pixel.height) {
                        console.log(`   🖼️ ${pixel.room}/${pixel.name}: ${pixel.width}x${pixel.height}px (${pixel.megapixels}MP), ${(pixel.size / 1024).toFixed(1)}KB`);
                    }
                });
            }

            console.log(`\n⚙️ AKTUELLE KONFIGURATION:`);
            console.log(`   🔍 Thumbnail: max ${IMAGE_CONFIG.thumbnail.maxSize}px, ${Math.round(IMAGE_CONFIG.thumbnail.quality * 100)}% Qualität`);
            console.log(`   🖼️ Galerie: max ${IMAGE_CONFIG.gallery.maxSize}px, ${Math.round(IMAGE_CONFIG.gallery.quality * 100)}% Qualität`);
            console.log(`   📦 Format: ${IMAGE_CONFIG.thumbnail.format}`);

            console.log(`📊 === REPORT ENDE ===\n`);

            return stats;
        } catch (error) {
            console.error('❌ Fehler beim Erstellen des Reports:', error);
        }
    }

    // Funktion global verfügbar machen
    window.showImageStorageReport = showImageStorageReport;
    window.getDetailedStorageInfo = getDetailedStorageInfo;



    // Bilder für gelöschten Speicherstand aufräumen
async function cleanupDeletedSaveImages(deletedSaveIds) {
  if (!db) await initDB();
  
  console.log(`🗑️ Räume Bilder auf für gelöschte Speicherstände:`, deletedSaveIds);
  
  const deletedImages = [];
  
  for (const saveId of deletedSaveIds) {
    try {
      const images = await loadImagesFromDB(saveId);
      deletedImages.push(...images);
      await deleteImagesFromDB(saveId);
      console.log(`✅ ${images.length} Bilder für "${saveId}" gelöscht`);
    } catch (error) {
      console.warn(`⚠️ Fehler beim Löschen von Bildern für "${saveId}":`, error);
    }
  }
  
  if (deletedImages.length > 0) {
    console.log(`🧹 Cleanup abgeschlossen: ${deletedImages.length} Bilder insgesamt gelöscht`);
    
    // Optional: Report nach Cleanup anzeigen
    setTimeout(() => {
      console.log('📊 Speicher nach Cleanup:');
      showImageStorageReport();
    }, 500);
  }
  
  return deletedImages.length;
}

// Einzelnen Speicherstand und seine Bilder löschen
async function deleteSaveAndImages(saveId) {
  try {
    await deleteImagesFromDB(saveId);
    console.log(`🗑️ Bilder für "${saveId}" gelöscht`);
    return true;
  } catch (error) {
    console.error(`❌ Fehler beim Löschen der Bilder für "${saveId}":`, error);
    return false;
  }
}

// Funktionen global verfügbar machen
window.cleanupDeletedSaveImages = cleanupDeletedSaveImages;
window.deleteSaveAndImages = deleteSaveAndImages;


// Entwickler-Funktionen für komplettes Löschen

// Modal für LocalStorage löschen
// Modal für LocalStorage löschen - ÜBERARBEITETES DESIGN
function showClearLocalStorageModal() {
  let saves = {};
  let saveCount = 0;
  let sizeInMB = '0.00';
  
  try {
    if (typeof window.getAllSaves === 'function') {
      saves = window.getAllSaves();
    } else if (typeof getAllSaves === 'function') {
      saves = getAllSaves();
    } else {
      const savedData = localStorage.getItem('formSaves');
      saves = savedData ? JSON.parse(savedData) : {};
    }
    
    saveCount = Object.keys(saves).length;
    const dataStr = JSON.stringify(saves);
    sizeInMB = (new Blob([dataStr]).size / 1024 / 1024).toFixed(2);
  } catch (error) {
    console.warn('Konnte LocalStorage-Daten nicht laden:', error);
  }
  
  const modal = document.createElement('div');
  modal.style.cssText = `position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;background:rgba(70,108,156,0.1)!important;display:flex!important;justify-content:center!important;align-items:center!important;z-index:99999!important;padding:20px!important;box-sizing:border-box!important;`;

  modal.innerHTML = `
    <div style="background:white!important;border-radius:8px!important;padding:40px!important;max-width:600px!important;width:100%!important;text-align:center!important;box-shadow:0 4px 20px rgba(70,108,156,0.15)!important;border:1px solid #f5f5f5!important;">
      
      <div style="display:flex!important;align-items:center!important;justify-content:center!important;margin-bottom:25px!important;">
        <i class="fas fa-database" style="font-size:24px!important;color:#466c9c!important;margin-right:15px!important;"></i>
        <h3 style="margin:0!important;color:#466c9c!important;font-size:1.4rem!important;font-weight:600!important;">LocalStorage löschen</h3>
      </div>
      
      <div style="background:#f5f5f5!important;padding:25px!important;border-radius:6px!important;margin:25px 0!important;text-align:left!important;">
        <div style="display:flex!important;align-items:center!important;margin-bottom:15px!important;">
          <i class="fas fa-chart-bar" style="color:#466c9c!important;margin-right:10px!important;"></i>
          <h4 style="margin:0!important;color:#466c9c!important;font-size:1.1rem!important;">Aktuelle Daten:</h4>
        </div>
        
        <div style="margin-left:25px!important;">
          <p style="margin:8px 0!important;color:#333!important;"><strong>Speicherstände:</strong> ${saveCount}</p>
          <p style="margin:8px 0!important;color:#333!important;"><strong>Gesamtgröße:</strong> ${sizeInMB} MB</p>
          <p style="margin:8px 0!important;color:#333!important;"><strong>Enthält:</strong> Form-Daten, Unterschriften, Einstellungen</p>
        </div>
        
        <div style="margin-top:20px!important;padding-top:15px!important;border-top:1px solid #ddd!important;">
          <div style="display:flex!important;align-items:center!important;margin-bottom:10px!important;">
            <i class="fas fa-exclamation-triangle" style="color:#dc3545!important;margin-right:10px!important;"></i>
            <strong style="color:#dc3545!important;">Folgende Daten werden gelöscht:</strong>
          </div>
          <ul style="margin:10px 0 0 35px!important;color:#666!important;line-height:1.6!important;">
            <li>Alle Speicherstände</li>
            <li>AutoSave-Daten</li>
            <li>Form-Einstellungen</li>
            <li>Canvas-Unterschriften</li>
          </ul>
        </div>
      </div>
      
      <div style="background:#fff3cd!important;border:1px solid #ffeaa7!important;border-radius:6px!important;padding:15px!important;margin:25px 0!important;">
        <div style="display:flex!important;align-items:center!important;justify-content:center!important;">
          <i class="fas fa-info-circle" style="color:#856404!important;margin-right:10px!important;"></i>
          <span style="color:#856404!important;font-weight:500!important;">
            Diese Aktion kann nicht rückgängig gemacht werden!<br>
            IndexedDB-Bilder bleiben erhalten.
          </span>
        </div>
      </div>
      
      <div style="display:flex!important;gap:15px!important;justify-content:center!important;margin-top:30px!important;">
        <button id="cancelClearLS" style="background:#f5f5f5!important;color:#466c9c!important;border:1px solid #ddd!important;padding:12px 30px!important;border-radius:6px!important;cursor:pointer!important;font-size:1rem!important;font-weight:500!important;transition:all 0.2s!important;">
          <i class="fas fa-times" style="margin-right:8px!important;"></i>Abbrechen
        </button>
        <button id="confirmClearLS" style="background:#dc3545!important;color:white!important;border:none!important;padding:12px 30px!important;border-radius:6px!important;cursor:pointer!important;font-size:1rem!important;font-weight:500!important;transition:all 0.2s!important;">
          <i class="fas fa-trash-alt" style="margin-right:8px!important;"></i>LocalStorage löschen
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Hover-Effekte
  const cancelBtn = document.getElementById('cancelClearLS');
  const confirmBtn = document.getElementById('confirmClearLS');
  
  cancelBtn.addEventListener('mouseenter', () => {
    cancelBtn.style.background = '#e9ecef';
  });
  cancelBtn.addEventListener('mouseleave', () => {
    cancelBtn.style.background = '#f5f5f5';
  });
  
  confirmBtn.addEventListener('mouseenter', () => {
    confirmBtn.style.background = '#c82333';
  });
  confirmBtn.addEventListener('mouseleave', () => {
    confirmBtn.style.background = '#dc3545';
  });

  confirmBtn.addEventListener('click', () => {
    clearCompleteLocalStorage();
    modal.remove();
  });

  cancelBtn.addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// Modal für IndexedDB löschen - ÜBERARBEITETES DESIGN
async function showClearIndexedDBModal() {
  let imageStats = { totalImages: 0, totalSizeMB: '0.00', byRoom: {}, bySave: {} };
  
  try {
    imageStats = await getDetailedStorageInfo();
  } catch (error) {
    console.warn('Konnte IndexedDB-Statistiken nicht laden:', error);
  }

  const modal = document.createElement('div');
  modal.style.cssText = `position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;background:rgba(70,108,156,0.1)!important;display:flex!important;justify-content:center!important;align-items:center!important;z-index:99999!important;padding:20px!important;box-sizing:border-box!important;`;

  const roomsList = Object.entries(imageStats.byRoom)
    .map(([room, data]) => `<li style="margin:5px 0!important;">${room}: ${data.count} Bilder (${data.sizeMB} MB)</li>`)
    .join('');

  const savesList = Object.entries(imageStats.bySave)
    .slice(0, 5)
    .map(([save, data]) => `<li style="margin:5px 0!important;">${save}: ${data.count} Bilder (${data.sizeMB} MB)</li>`)
    .join('');

  modal.innerHTML = `
    <div style="background:white!important;border-radius:8px!important;padding:40px!important;max-width:700px!important;width:100%!important;text-align:center!important;box-shadow:0 4px 20px rgba(70,108,156,0.15)!important;border:1px solid #f5f5f5!important;max-height:85vh!important;overflow-y:auto!important;">
      
      <div style="display:flex!important;align-items:center!important;justify-content:center!important;margin-bottom:25px!important;">
        <i class="fas fa-images" style="font-size:24px!important;color:#466c9c!important;margin-right:15px!important;"></i>
        <h3 style="margin:0!important;color:#466c9c!important;font-size:1.4rem!important;font-weight:600!important;">IndexedDB löschen</h3>
      </div>
      
      <div style="background:#f5f5f5!important;padding:25px!important;border-radius:6px!important;margin:25px 0!important;text-align:left!important;">
        <div style="display:flex!important;align-items:center!important;margin-bottom:15px!important;">
          <i class="fas fa-chart-pie" style="color:#466c9c!important;margin-right:10px!important;"></i>
          <h4 style="margin:0!important;color:#466c9c!important;font-size:1.1rem!important;">Aktuelle Daten:</h4>
        </div>
        
        <div style="margin-left:25px!important;">
          <p style="margin:8px 0!important;color:#333!important;"><strong>Bilder gesamt:</strong> ${imageStats.totalImages}</p>
          <p style="margin:8px 0!important;color:#333!important;"><strong>Gesamtgröße:</strong> ${imageStats.totalSizeMB} MB</p>
          <p style="margin:8px 0!important;color:#333!important;"><strong>Qualität:</strong> Thumbnails (75px) + Galerien (800px, 40%)</p>
        </div>
        
        ${imageStats.totalImages > 0 ? `
        <div style="margin-top:20px!important;">
          <div style="display:flex!important;align-items:center!important;margin-bottom:10px!important;">
            <i class="fas fa-folder" style="color:#466c9c!important;margin-right:10px!important;"></i>
            <strong style="color:#466c9c!important;">Nach Räumen:</strong>
          </div>
          <ul style="margin:10px 0 0 35px!important;color:#666!important;max-height:120px!important;overflow-y:auto!important;line-height:1.4!important;">
            ${roomsList}
          </ul>
        </div>
        
        <div style="margin-top:20px!important;">
          <div style="display:flex!important;align-items:center!important;margin-bottom:10px!important;">
            <i class="fas fa-save" style="color:#466c9c!important;margin-right:10px!important;"></i>
            <strong style="color:#466c9c!important;">Nach Speicherständen:</strong>
          </div>
          <ul style="margin:10px 0 0 35px!important;color:#666!important;max-height:120px!important;overflow-y:auto!important;line-height:1.4!important;">
            ${savesList}
            ${Object.keys(imageStats.bySave).length > 5 ? '<li style="margin:5px 0!important;font-style:italic!important;">... und weitere</li>' : ''}
          </ul>
        </div>
        ` : ''}
        
        <div style="margin-top:20px!important;padding-top:15px!important;border-top:1px solid #ddd!important;">
          <div style="display:flex!important;align-items:center!important;margin-bottom:10px!important;">
            <i class="fas fa-exclamation-triangle" style="color:#dc3545!important;margin-right:10px!important;"></i>
            <strong style="color:#dc3545!important;">Folgende Daten werden gelöscht:</strong>
          </div>
          <ul style="margin:10px 0 0 35px!important;color:#666!important;line-height:1.6!important;">
            <li>Alle Bilder (Thumbnails + Galerien)</li>
            <li>Komplette IndexedDB-Datenbank</li>
            <li>Alle Raum- und Zimmerbilder</li>
          </ul>
        </div>
      </div>
      
      <div style="background:#fff3cd!important;border:1px solid #ffeaa7!important;border-radius:6px!important;padding:15px!important;margin:25px 0!important;">
        <div style="display:flex!important;align-items:center!important;justify-content:center!important;">
          <i class="fas fa-info-circle" style="color:#856404!important;margin-right:10px!important;"></i>
          <span style="color:#856404!important;font-weight:500!important;">
            Diese Aktion kann nicht rückgängig gemacht werden!<br>
            LocalStorage-Daten bleiben erhalten.
          </span>
        </div>
      </div>
      
      <div style="display:flex!important;gap:15px!important;justify-content:center!important;margin-top:30px!important;">
        <button id="cancelClearDB" style="background:#f5f5f5!important;color:#466c9c!important;border:1px solid #ddd!important;padding:12px 30px!important;border-radius:6px!important;cursor:pointer!important;font-size:1rem!important;font-weight:500!important;transition:all 0.2s!important;">
          <i class="fas fa-times" style="margin-right:8px!important;"></i>Abbrechen
        </button>
        <button id="confirmClearDB" style="background:#dc3545!important;color:white!important;border:none!important;padding:12px 30px!important;border-radius:6px!important;cursor:pointer!important;font-size:1rem!important;font-weight:500!important;transition:all 0.2s!important;">
          <i class="fas fa-trash-alt" style="margin-right:8px!important;"></i>IndexedDB löschen
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Hover-Effekte
  const cancelBtn = document.getElementById('cancelClearDB');
  const confirmBtn = document.getElementById('confirmClearDB');
  
  cancelBtn.addEventListener('mouseenter', () => {
    cancelBtn.style.background = '#e9ecef';
  });
  cancelBtn.addEventListener('mouseleave', () => {
    cancelBtn.style.background = '#f5f5f5';
  });
  
  confirmBtn.addEventListener('mouseenter', () => {
    confirmBtn.style.background = '#c82333';
  });
  confirmBtn.addEventListener('mouseleave', () => {
    confirmBtn.style.background = '#dc3545';
  });

  confirmBtn.addEventListener('click', () => {
    clearCompleteIndexedDB();
    modal.remove();
  });

  cancelBtn.addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// Modal für IndexedDB löschen
async function showClearIndexedDBModal() {
  let imageStats = { totalImages: 0, totalSizeMB: '0.00', byRoom: {}, bySave: {} };
  
  try {
    imageStats = await getDetailedStorageInfo();
  } catch (error) {
    console.warn('Konnte IndexedDB-Statistiken nicht laden:', error);
  }

  const modal = document.createElement('div');
  modal.style.cssText = `position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;background:rgba(0,0,0,0.7)!important;display:flex!important;justify-content:center!important;align-items:center!important;z-index:99999!important;padding:20px!important;box-sizing:border-box!important;`;

  const roomsList = Object.entries(imageStats.byRoom)
    .map(([room, data]) => `<li>${room}: ${data.count} Bilder (${data.sizeMB} MB)</li>`)
    .join('');

  const savesList = Object.entries(imageStats.bySave)
    .slice(0, 5) // Nur erste 5 anzeigen
    .map(([save, data]) => `<li>${save}: ${data.count} Bilder (${data.sizeMB} MB)</li>`)
    .join('');

  modal.innerHTML = `
    <div style="background:white!important;border-radius:12px!important;padding:30px!important;max-width:700px!important;width:100%!important;text-align:center!important;box-shadow:0 10px 30px rgba(0,0,0,0.3)!important;border-top:4px solid #315082!important;max-height:80vh!important;overflow-y:auto!important;">
      <div style="font-size:3rem!important;color:#315082!important;margin-bottom:15px!important;">🖼️</div>
      <h3 style="margin:0 0 15px 0!important;color:#2c3e50!important;font-size:1.3rem!important;">IndexedDB komplett löschen</h3>
      
      <div style="background:#f8f9fa!important;padding:20px!important;border-radius:8px!important;margin:20px 0!important;text-align:left!important;">
        <h4 style="margin:0 0 10px 0!important;color:#495057!important;">📊 Aktuelle IndexedDB Daten:</h4>
        <p style="margin:5px 0!important;"><strong>Bilder gesamt:</strong> ${imageStats.totalImages}</p>
        <p style="margin:5px 0!important;"><strong>Gesamtgröße:</strong> ${imageStats.totalSizeMB} MB</p>
        <p style="margin:5px 0!important;"><strong>Qualität:</strong> Thumbnails (75px) + Galerien (800px, 40%)</p>
        
        ${imageStats.totalImages > 0 ? `
        <div style="margin-top:15px!important;">
          <strong>📁 Nach Räumen:</strong>
          <ul style="margin:10px 0 0 20px!important;color:#6c757d!important;max-height:100px!important;overflow-y:auto!important;">
            ${roomsList}
          </ul>
        </div>
        
        <div style="margin-top:15px!important;">
          <strong>💾 Nach Speicherständen:</strong>
          <ul style="margin:10px 0 0 20px!important;color:#6c757d!important;max-height:100px!important;overflow-y:auto!important;">
            ${savesList}
            ${Object.keys(imageStats.bySave).length > 5 ? '<li>... und weitere</li>' : ''}
          </ul>
        </div>
        ` : ''}
        
        <div style="margin-top:15px!important;">
          <strong style="color:#315082!important;">Folgende Daten werden gelöscht:</strong>
          <ul style="margin:10px 0 0 20px!important;color:#6c757d!important;">
            <li>Alle Bilder (Thumbnails + Galerien)</li>
            <li>Komplette IndexedDB-Datenbank</li>
            <li>Alle Raum- und Zimmerbilder</li>
          </ul>
        </div>
      </div>
      
      <p style="margin:0 0 25px 0!important;color:#dc3545!important;font-weight:bold!important;">
        
        LocalStorage-Daten bleiben erhalten.
      </p>
      
      <div style="display:flex!important;gap:15px!important;justify-content:center!important;">
        <button id="cancelClearDB" style="background:#6c757d!important;color:white!important;border:none!important;padding:12px 25px!important;border-radius:6px!important;cursor:pointer!important;font-size:1rem!important;font-weight:500!important;">Abbrechen</button>
        <button id="confirmClearDB" style="background:#315082!important;color:white!important;border:none!important;padding:12px 25px!important;border-radius:6px!important;cursor:pointer!important;font-size:1rem!important;font-weight:500!important;">IndexedDB löschen</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('confirmClearDB').addEventListener('click', () => {
    clearCompleteIndexedDB();
    modal.remove();
  });

  document.getElementById('cancelClearDB').addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// LocalStorage komplett löschen
function clearCompleteLocalStorage() {
  try {
    const beforeSize = checkLocalStorageSize();
    
    localStorage.clear();
    
    console.log('🗑️ === LOCALSTORAGE KOMPLETT GELÖSCHT ===');
    console.log(`📊 Vorher: ${beforeSize} MB`);
    console.log(`📊 Nachher: ${checkLocalStorageSize()} MB`);
    console.log('✅ Alle Speicherstände, AutoSaves und Einstellungen gelöscht');
    
    showMobileAlert('LocalStorage komplett gelöscht!', 'success');
    
    // Seite neu laden nach 2 Sekunden
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('❌ Fehler beim Löschen des LocalStorage:', error);
    showMobileAlert('Fehler beim Löschen!', 'error');
  }
}

// IndexedDB komplett löschen
async function clearCompleteIndexedDB() {
  try {
    const beforeStats = await getDetailedStorageInfo();
    
    if (db) {
      db.close();
      db = null;
    }
    
    await new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
      
      deleteRequest.onsuccess = () => {
        console.log('🗑️ === INDEXEDDB KOMPLETT GELÖSCHT ===');
        console.log(`📊 Gelöschte Bilder: ${beforeStats.totalImages}`);
        console.log(`📊 Freigegebener Speicher: ${beforeStats.totalSizeMB} MB`);
        console.log('✅ Komplette Bilder-Datenbank gelöscht');
        
        // imageLimit zurücksetzen
        if (window.imageLimit) {
          window.imageLimit.arrays.clear();
          window.imageLimit.update();
        }
        
        resolve();
      };
      
      deleteRequest.onerror = () => {
        console.error('❌ Fehler beim Löschen der IndexedDB');
        reject(deleteRequest.error);
      };
      
      deleteRequest.onblocked = () => {
        console.warn('⚠️ IndexedDB-Löschung blockiert - schließe andere Tabs');
      };
    });
    
    // IndexedDB neu initialisieren
    await initDB();
    
    showMobileAlert(`IndexedDB gelöscht! ${beforeStats.totalImages} Bilder entfernt`, 'success');
    
  } catch (error) {
    console.error('❌ Fehler beim Löschen der IndexedDB:', error);
    showMobileAlert('Fehler beim Löschen der IndexedDB!', 'error');
  }
}

// Hilfsfunktion für LocalStorage Größe
function checkLocalStorageSize() {
  try {
    // Prüfe ob getAllSaves verfügbar ist, sonst direkter LocalStorage-Zugriff
    let saves = {};
    
    if (typeof window.getAllSaves === 'function') {
      saves = window.getAllSaves();
    } else if (typeof getAllSaves === 'function') {
      saves = getAllSaves();
    } else {
      // Fallback: Direkter Zugriff auf LocalStorage
      const savedData = localStorage.getItem('formSaves');
      saves = savedData ? JSON.parse(savedData) : {};
    }
    
    const dataStr = JSON.stringify(saves);
    const sizeInMB = (new Blob([dataStr]).size / 1024 / 1024).toFixed(2);
    return sizeInMB;
  } catch (error) {
    console.warn('Konnte LocalStorage-Größe nicht ermitteln:', error);
    return '0.00';
  }
}
// Funktionen global verfügbar machen
window.showClearLocalStorageModal = showClearLocalStorageModal;
window.showClearIndexedDBModal = showClearIndexedDBModal;
window.clearCompleteLocalStorage = clearCompleteLocalStorage;
window.clearCompleteIndexedDB = clearCompleteIndexedDB;
// Funktionen global verfügbar machen für andere Module


});