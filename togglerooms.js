document.addEventListener('DOMContentLoaded', function() {
    // Initialisiere alle Raum-Toggles
    const roomToggles = document.querySelectorAll('.room-toggle');
    
    roomToggles.forEach(toggle => {
        const roomId = toggle.dataset.room;
        const optionsContainer = toggle.querySelector('.toggle-options');
        const options = toggle.querySelectorAll('.toggle-option');
        const container = document.getElementById(`${roomId}-container`);
        const gallery = document.getElementById(`${roomId}-galerie`);
        const galleryTitle = document.getElementById(`${roomId}-galerie-title`);
        
        // Setze initialen Zustand
        let activeIndex = 0;
        options.forEach((option, index) => {
            if (option.classList.contains('active')) {
                activeIndex = index;
                const currentValue = option.dataset.value;
                updateRoomVisibility(roomId, currentValue === 'ja', container, gallery, galleryTitle);
            }
        });
        optionsContainer.setAttribute('data-active-option', activeIndex);
        
        // Event Listener für Toggle-Optionen
        options.forEach((option, index) => {
            option.addEventListener('click', function() {
                if (this.classList.contains('active')) return;
                
                // Entferne active-Klasse von allen Optionen
                options.forEach(opt => opt.classList.remove('active'));
                // Füge active-Klasse zur ausgewählten Option hinzu
                this.classList.add('active');
                // Aktualisiere den Slider-Indikator
                optionsContainer.setAttribute('data-active-option', index);
                
                // Aktualisiere die Sichtbarkeit
                const currentValue = this.dataset.value;
                updateRoomVisibility(roomId, currentValue === 'ja', container, gallery, galleryTitle);
            });
        });
    });
    
    // Observer für Galerieänderungen
    observeGalleryChanges();
    
    function updateRoomVisibility(roomId, isVisible, container, gallery, galleryTitle) {
        // Container anzeigen/verstecken
        if (container) {
            container.style.animation = isVisible ? 'fadeIn 0.3s ease-in-out' : 'fadeOut 0.3s ease-in-out';
            setTimeout(() => {
                container.style.display = isVisible ? 'block' : 'none';
            }, isVisible ? 0 : 300);
        }
        
        // Galerie prüfen
        if (isVisible && gallery && galleryTitle) {
            checkGallery(roomId, gallery, galleryTitle);
        } else if (gallery && galleryTitle) {
            gallery.style.display = 'none';
            galleryTitle.style.display = 'none';
        }
    }
    
    function checkGallery(roomId, gallery, galleryTitle) {
        if (!gallery || !galleryTitle) return;
        
        const hasImages = gallery.querySelectorAll('img').length > 0;
        
        if (hasImages) {
            galleryTitle.style.display = 'block';
            gallery.style.display = 'block';
        } else {
            galleryTitle.style.display = 'none';
            gallery.style.display = 'none';
        }
    }
    
    function observeGalleryChanges() {
        const galleries = document.querySelectorAll('[id$="-galerie"]');
        const config = { childList: true, subtree: true };
        
        galleries.forEach(gallery => {
            const roomId = gallery.id.replace('-galerie', '');
            const galleryTitle = document.getElementById(`${roomId}-galerie-title`);
            const container = document.getElementById(`${roomId}-container`);
            
            const observer = new MutationObserver(() => {
                const toggle = document.querySelector(`.room-toggle[data-room="${roomId}"]`);
                if (!toggle) return;
                
                const activeOption = toggle.querySelector('.toggle-option.active');
                if (!activeOption) return;
                
                const isVisible = activeOption.dataset.value === 'ja';
                
                if (isVisible) {
                    checkGallery(roomId, gallery, galleryTitle);
                }
            });
            
            observer.observe(gallery, config);
        });
    }
});