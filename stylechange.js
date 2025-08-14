document.addEventListener('DOMContentLoaded', function() {
    // Beim Laden der Seite den gespeicherten Stil anwenden
    const initialStyle = localStorage.getItem('currentStyle') || 'stylesdesktop.css';
    applyStyle(initialStyle);
    setActiveRadioButton(initialStyle);
    
    // Event-Listener für alle Radio-Buttons hinzufügen
    const radioButtons = document.querySelectorAll('input[name="viewStyle"]');
    radioButtons.forEach(radioButton => {
        radioButton.addEventListener('change', handleStyleChange);
    });
});

function handleStyleChange(event) {
    if (event.target.checked) {
        const selectedStyle = event.target.value;
        localStorage.setItem('currentStyle', selectedStyle);
        applyStyle(selectedStyle);
    }
}

function applyStyle(styleFile) {
    // Alle vorhandenen Stylesheets entfernen
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        if (link.href.includes('stylesdesktop.css') ||
            link.href.includes('stylestablet.css') ||
            link.href.includes('stylesphone.css') ||
            link.href.includes('stylespdf.css')) {
            link.remove();
        }
    });
    
    // Neues Stylesheet hinzufügen
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = styleFile;
    document.head.appendChild(link);
}

function setActiveRadioButton(styleFile) {
    const radioButtons = document.querySelectorAll('input[name="viewStyle"]');
    radioButtons.forEach(radioButton => {
        if (radioButton.value === styleFile) {
            radioButton.checked = true;
        }
    });
}