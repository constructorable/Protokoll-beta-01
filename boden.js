document.addEventListener('DOMContentLoaded', function () {
    const bodenbelaege = [
        "Holz - Parkett",
        "Holz - Parkett, Eiche",
        "Holz - Parkett, Esche",
        "Holz - Parkett, Kiefer",
        "Holz - Parkett, Meranti",
        "Holz - Parkett, Lärche",
        "Holz",
        "Holz - Dielen",
        "Holz - Dielen, Eiche",
        "Holz - Dielen, Kiefer",
        "Holz - Dielen, Lärche",
        "Holz - Dielen, Esche",
        "Holz - Dielen, Meranti",
        "Holz - Dielen, Bambus",
        "Laminat",
        "Laminat - Optik Buche",
        "Laminat - Optik Esche",
        "Laminat - Optik Eiche",
        "Laminat - Optik Kiefer",
        "Laminat - Optik Stein",
        "Laminat - Optik terrakotta",
        "Laminat - Optik Bunt / Musterung",
        "Fliesen",
        "Fliesen - beige",
        "Fliesen - weiß",
        "Fliesen - schwarz",
        "Fliesen - grau",
        "Fliesen - blau",
        "Fliesen - grün",
        "Fliesen - terrakotta",
        "Teppich",
        "Teppich - grau",
        "Teppich - blau",
        "Teppich - beige",
        "Teppich - schwarz",
        "Teppich - gemustert",
        "Vinyl",
        "Vinyl - Optik Buche",
        "Vinyl - Optik Esche",
        "Vinyl - Optik Eiche",
        "Vinyl - Optik Kiefer",
        "Vinyl - Optik Stein",
        "Vinyl - Optik terrakotta",
        "Vinyl - Optik Bunt / Musterung",
        "PVC",
        "PVC - Optik Buche",
        "PVC - Optik Esche",
        "PVC - Optik Eiche",
        "PVC - Optik Kiefer",
        "PVC - Optik Stein",
        "PVC - Optik terrakotta",
        "PVC - Optik Bunt / Musterung",
        "Beton",
        "Betonoptik",
        "Kork",
        "Naturstein",
        "Marmor",
        "Granit",
        "Linoleum",
        "Terrazzo",
        "Zement",
        "Kunststoff",
        "sonstiger Bodenbelag"
    ];

    // Funktion zur Sortierung der Bodenbeläge mit Priorisierung
    function sortiereBodenbelaege(bodenListe) {
        const hauptkategorien = [];
        const restlicheBoeden = [];

        // Zuerst die drei Hauptkategorien in gewünschter Reihenfolge
        if (bodenListe.includes("Vinyl")) {
            hauptkategorien.push("Vinyl");
        }
        if (bodenListe.includes("Holz - Parkett")) {
            hauptkategorien.push("Holz - Parkett");
        }
        if (bodenListe.includes("Laminat")) {
            hauptkategorien.push("Laminat");
        }
        if (bodenListe.includes("PVC")) {
            hauptkategorien.push("PVC");
        }
        if (bodenListe.includes("Holz - Dielen")) {
            hauptkategorien.push("Holz - Dielen");
        }

        // Alle anderen Einträge alphabetisch sortiert
        bodenListe.forEach(boden => {
            if (boden !== "Vinyl" && boden !== "Holz - Parkett" && boden !== "Laminat") {
                restlicheBoeden.push(boden);
            }
        });

        restlicheBoeden.sort();

        return [...hauptkategorien, ...restlicheBoeden];
    }

    // Funktion zur Anzeige aller Vorschläge
    function zeigeAlleVorschlaege(inputFeld, raum) {
        const vorschlaegeContainer = document.getElementById(`boden-vorschlaege-${raum}`) || createVorschlaegeContainer(inputFeld, raum);
        vorschlaegeContainer.innerHTML = '';

        const sortierteBoeden = sortiereBodenbelaege(bodenbelaege);

        sortierteBoeden.forEach(boden => {
            const vorschlag = document.createElement('div');
            vorschlag.textContent = boden;
            vorschlag.classList.add('boden-vorschlag');
            vorschlag.addEventListener('click', function () {
                inputFeld.value = boden;
                vorschlaegeContainer.style.display = 'none';
            });
            vorschlaegeContainer.appendChild(vorschlag);
        });

        positioniereVorschlaege(vorschlaegeContainer, inputFeld);
        vorschlaegeContainer.style.display = 'block';
    }

    // Funktion zur Initialisierung der Bodenvorschläge für ein bestimmtes Input
    function initBodenVorschlaege(inputFeld, raum) {
        if (!inputFeld) return;

        inputFeld.addEventListener('input', function () {
            const input = this.value.toLowerCase();
            const vorschlaegeContainer = document.getElementById(`boden-vorschlaege-${raum}`) || createVorschlaegeContainer(inputFeld, raum);

            vorschlaegeContainer.innerHTML = '';

            if (input.length > 0) {
                const passenderBoden = bodenbelaege.filter(boden =>
                    boden.toLowerCase().includes(input)
                );

                if (passenderBoden.length > 0) {
                    const sortierteBoedenGefiltert = sortiereBodenbelaege(passenderBoden);

                    sortierteBoedenGefiltert.forEach(boden => {
                        const vorschlag = document.createElement('div');
                        vorschlag.textContent = boden;
                        vorschlag.classList.add('boden-vorschlag');
                        vorschlag.addEventListener('click', function () {
                            inputFeld.value = boden;
                            vorschlaegeContainer.style.display = 'none';
                        });
                        vorschlaegeContainer.appendChild(vorschlag);
                    });

                    positioniereVorschlaege(vorschlaegeContainer, inputFeld);
                    vorschlaegeContainer.style.display = 'block';
                } else {
                    vorschlaegeContainer.style.display = 'none';
                }
            } else {
                vorschlaegeContainer.style.display = 'none';
            }
        });

        inputFeld.addEventListener('focus', function () {
            // Andere Vorschläge-Container schließen
            document.querySelectorAll('[id^="boden-vorschlaege-"]').forEach(container => {
                if (container.id !== `boden-vorschlaege-${raum}`) {
                    container.style.display = 'none';
                }
            });

            // Alle Vorschläge anzeigen, wenn das Feld leer ist
            if (this.value.length === 0) {
                zeigeAlleVorschlaege(this, raum);
            }
        });

        // Click-Event für das gleiche Verhalten wie focus
        inputFeld.addEventListener('click', function () {
            if (this.value.length === 0) {
                zeigeAlleVorschlaege(this, raum);
            }
        });
    }

    // Initialisierung für die festen Räume
    const bodeninputs = {
        kueche: document.getElementById('fussbodenkue'),
        bad: document.getElementById('fussbodenbad'),
        wc: document.getElementById('fussbodenwc'),
        flur: document.getElementById('fussbodenflur'),
        abstell: document.getElementById('fussbodenabstell')
    };

    Object.keys(bodeninputs).forEach(raum => {
        initBodenVorschlaege(bodeninputs[raum], raum);
    });

    // Funktion zur Initialisierung für dynamisch hinzugefügte Zimmer
    window.initBodenForZimmer = function (count) {
        const inputFeld = document.getElementById(`fussbodenzimm${count}`);
        initBodenVorschlaege(inputFeld, `zimm${count}`);
    };

    function createVorschlaegeContainer(inputFeld, raum) {
        const container = document.createElement('div');
        container.id = `boden-vorschlaege-${raum}`;
        container.classList.add('boden-vorschlaege-container');
        inputFeld.parentNode.appendChild(container);
        return container;
    }

    function positioniereVorschlaege(container, inputFeld) {
        container.classList.remove('upwards');

        const inputRect = inputFeld.getBoundingClientRect();
        const spaceBelow = window.innerHeight - inputRect.bottom;
        const spaceAbove = inputRect.top;
        const containerHeight = Math.min(200, container.scrollHeight);

        if (spaceBelow < containerHeight && spaceAbove >= containerHeight) {
            container.classList.add('upwards');
        }
    }

    // Schließen der Vorschläge bei Klick außerhalb
    document.addEventListener('click', function (e) {
        if (!e.target.classList.contains('boden-input') && !e.target.matches('[id^="fussbodenzimm"]') && !e.target.matches('[id^="fussboden"]')) {
            document.querySelectorAll('[id^="boden-vorschlaege-"]').forEach(container => {
                container.style.display = 'none';
            });
        }
    });

    // Bei Fensteränderungen neu positionieren
    window.addEventListener('scroll', repositionOnEvent);
    window.addEventListener('resize', repositionOnEvent);

    function repositionOnEvent() {
        document.querySelectorAll('[id^="boden-vorschlaege-"]').forEach(container => {
            if (container.style.display === 'block') {
                const raum = container.id.split('-')[2];
                const inputFeld = document.getElementById(`fussboden${raum}`) || document.getElementById(`fussbodenzimm${raum.replace('zimm', '')}`);
                if (inputFeld) {
                    positioniereVorschlaege(container, inputFeld);
                }
            }
        });
    }
});