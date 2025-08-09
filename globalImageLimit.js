class GlobalImageLimit {
    constructor(max = 50) {
        this.max = max;
        this.arrays = new Map();
        this.createModal();
        // createCounter() entfernt - Counter ist jetzt im HTML
    }

    register(name, array) {
        this.arrays.set(name, array);
        this.update();
    }

    canAdd(count = 1) {
        return this.getTotal() + count <= this.max;
    }

    getTotal() {
        let total = 0;
        this.arrays.forEach(arr => total += arr.length);
        return total;
    }

    checkLimit(count = 1) {
        if (!this.canAdd(count)) {
            this.showWarning();
            return false;
        }
        return true;
    }

update() {
    const total = this.getTotal();
    console.log("🔄 UPDATE: Total images =", total);
    
    const counterDisplay = document.getElementById('imageCountDisplay');
    if (counterDisplay) {
        counterDisplay.textContent = `${total} / ${this.max} Bilder`;
        counterDisplay.style.color = total >= this.max ? '#d32f2f' : 'white';
    }

    document.querySelectorAll('.bilder-upload-btn').forEach(btn => {
        if (total >= this.max) {
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.title = `Limit erreicht (${total}/${this.max})`;
            btn.dataset.limitReached = 'true';
        } else {
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.title = `${total}/${this.max} Bilder`;
            btn.dataset.limitReached = 'false';
        }
    });
}
// NEUE FUNKTION: Originale Handler wiederherstellen
restoreOriginalHandler(btn) {
    // Finde das entsprechende Array für diesen Button
    this.arrays.forEach((array, name) => {
        if (name.includes('kueche') && btn.closest('.kueche')) {
            btn.addEventListener('click', () => {
                const container = btn.closest('.kueche');
                const thumbnailContainer = container.querySelector('.bilder-thumbnails');
                const galleryContainer = document.getElementById('kueche-galerie');
                const titleElement = document.getElementById('kueche-galerie-title');
                showImageSourceDialog(array, thumbnailContainer, galleryContainer, titleElement);
            });
        }
        // Weitere Bereiche hier hinzufügen wenn nötig...
    });
}
// NEUE FUNKTION: Modal für ausgegraute Buttons
showMaxReachedModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.6); z-index: 1002;
        display: flex; justify-content: center; align-items: center;
    `;
    
    modal.innerHTML = `
        <div style="background:white;padding:30px;border-radius:12px;text-align:center;max-width:400px;width:90%;box-shadow:0 10px 30px rgba(0,0,0,0.3);">
            <h3 style="color:#d32f2f;margin:0 0 15px 0;">📸 Bildlimit erreicht</h3>
            <p style="margin:15px 0;line-height:1.5;">
                Bereits die maximale Anzahl an Bildern hochgeladen.
            </p>
            <div style="background:#f5f5f5;padding:15px;border-radius:10px;margin:20px 0;">
                <strong>${this.getTotal()}/${this.max} Bilder verwendet</strong>
            </div>
            <p style="margin:15px 0;color:#666;font-size:0.9rem;">
                Löschen Sie zunächst andere Bilder um neue hinzuzufügen.
            </p>
            <button id="maxReachedOkBtn" 
                    style="background:#466c9c;color:white;border:none;padding:12px 30px;border-radius:25px;cursor:pointer;font-size:1rem;">
                OK
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);

    const okBtn = modal.querySelector('#maxReachedOkBtn');
    okBtn.addEventListener('click', () => modal.remove());
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}
    showWarning() {
        const modal = document.getElementById('imgLimitModal');
        document.getElementById('imgCount').textContent = `${this.getTotal()}/${this.max}`;
        modal.style.display = 'flex';
    }

    createModal() {
        // Modal wird jetzt im HTML erstellt - diese Funktion kann leer sein
    }
}

// Objekt erstellen
window.imageLimit = new GlobalImageLimit(50);