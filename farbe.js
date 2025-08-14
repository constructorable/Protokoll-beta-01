document.addEventListener('DOMContentLoaded', function() {
    // Beide Farb-Eingabefelder auswählen
    const farbeInputs = {
        kueche: document.getElementById('wandfarbe'),
        bad: document.getElementById('wandfarbebad'),
        wc: document.getElementById('wandfarbewc'),
        flur: document.getElementById('wandfarbeflur'),
        abstell: document.getElementById('wandfarbeabstell')
    };

    const farbeVorschlaege = [
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

    // Funktion zur Sortierung der Farben mit Priorisierung
    function sortierefarben(farbenListe) {
        const hauptfarben = [];
        const restlicheFarben = [];

        // Zuerst die drei Hauptfarben in gewünschter Reihenfolge
        if (farbenListe.includes("beige")) {
            hauptfarben.push("beige");
        }
        if (farbenListe.includes("gelb")) {
            hauptfarben.push("gelb");
        }
        if (farbenListe.includes("grau")) {
            hauptfarben.push("grau");
        }

        // Alle anderen Einträge alphabetisch sortiert
        farbenListe.forEach(farbe => {
            if (farbe !== "beige" && farbe !== "gelb" && farbe !== "grau") {
                restlicheFarben.push(farbe);
            }
        });

        restlicheFarben.sort();

        return [...hauptfarben, ...restlicheFarben];
    }

    // Funktion zur Anzeige aller Farbvorschläge
    function zeigeAlleFarbvorschlaege(inputFeld, raum) {
        const vorschlaegeContainer = document.getElementById(`farbe-vorschlaege-${raum}`) || createVorschlaegeContainer(raum);
        vorschlaegeContainer.innerHTML = '';

        const sortierteFarben = sortierefarben(farbeVorschlaege);

        sortierteFarben.forEach(farbe => {
            const vorschlag = document.createElement('div');
            vorschlag.textContent = farbe;
            vorschlag.classList.add('farbe-vorschlag');
            vorschlag.addEventListener('click', function() {
                inputFeld.value = farbe;
                vorschlaegeContainer.style.display = 'none';
            });
            vorschlaegeContainer.appendChild(vorschlag);
        });

        positioniereVorschlaege(vorschlaegeContainer, inputFeld);
        vorschlaegeContainer.style.display = 'block';
    }

    // Funktionen für beide Eingabefelder
    Object.keys(farbeInputs).forEach(raum => {
        const inputFeld = farbeInputs[raum];
        if (!inputFeld) return;

        inputFeld.addEventListener('input', function() {
            const input = this.value.toLowerCase();
            const vorschlaegeContainer = document.getElementById(`farbe-vorschlaege-${raum}`) || createVorschlaegeContainer(raum);
            
            vorschlaegeContainer.innerHTML = '';
            
            if (input.length > 0) {
                const passendeFarben = farbeVorschlaege.filter(farbe => 
                    farbe.toLowerCase().includes(input)
                );
                
                if (passendeFarben.length > 0) {
                    const sortierteFarbenGefiltert = sortierefarben(passendeFarben);

                    sortierteFarbenGefiltert.forEach(farbe => {
                        const vorschlag = document.createElement('div');
                        vorschlag.textContent = farbe;
                        vorschlag.classList.add('farbe-vorschlag');
                        vorschlag.addEventListener('click', function() {
                            inputFeld.value = farbe;
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

        inputFeld.addEventListener('focus', function() {
            // Andere Vorschläge-Container schließen
            document.querySelectorAll('[id^="farbe-vorschlaege-"]').forEach(container => {
                if (container.id !== `farbe-vorschlaege-${raum}`) {
                    container.style.display = 'none';
                }
            });

            // Alle Farbvorschläge anzeigen, wenn das Feld leer ist
            if (this.value.length === 0) {
                zeigeAlleFarbvorschlaege(this, raum);
            }
        });

        // Click-Event für das gleiche Verhalten wie focus
        inputFeld.addEventListener('click', function() {
            if (this.value.length === 0) {
                zeigeAlleFarbvorschlaege(this, raum);
            }
        });
    });

    // Funktion zur Initialisierung für dynamisch hinzugefügte Zimmer
    window.initFarbeForZimmer = function(count) {
        const inputFeld = document.getElementById(`wandfarbezimm${count}`);
        if (!inputFeld) return;

        inputFeld.addEventListener('input', function() {
            const input = this.value.toLowerCase();
            const vorschlaegeContainer = document.getElementById(`farbe-vorschlaege-zimm${count}`) || createVorschlaegeContainerZimmer(count);
            
            vorschlaegeContainer.innerHTML = '';
            
            if (input.length > 0) {
                const passendeFarben = farbeVorschlaege.filter(farbe => 
                    farbe.toLowerCase().includes(input)
                );
                
                if (passendeFarben.length > 0) {
                    const sortierteFarbenGefiltert = sortierefarben(passendeFarben);

                    sortierteFarbenGefiltert.forEach(farbe => {
                        const vorschlag = document.createElement('div');
                        vorschlag.textContent = farbe;
                        vorschlag.classList.add('farbe-vorschlag');
                        vorschlag.addEventListener('click', function() {
                            inputFeld.value = farbe;
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

        inputFeld.addEventListener('focus', function() {
            document.querySelectorAll('[id^="farbe-vorschlaege-"]').forEach(container => {
                if (container.id !== `farbe-vorschlaege-zimm${count}`) {
                    container.style.display = 'none';
                }
            });

            if (this.value.length === 0) {
                zeigeAlleFarbvorschlaege(this, `zimm${count}`);
            }
        });

        inputFeld.addEventListener('click', function() {
            if (this.value.length === 0) {
                zeigeAlleFarbvorschlaege(this, `zimm${count}`);
            }
        });
    };

    function createVorschlaegeContainer(raum) {
        const container = document.createElement('div');
        container.id = `farbe-vorschlaege-${raum}`;
        container.classList.add('farbe-vorschlaege-container');
        farbeInputs[raum].parentNode.appendChild(container);
        return container;
    }

    function createVorschlaegeContainerZimmer(count) {
        const container = document.createElement('div');
        container.id = `farbe-vorschlaege-zimm${count}`;
        container.classList.add('farbe-vorschlaege-container');
        const inputFeld = document.getElementById(`wandfarbezimm${count}`);
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
    document.addEventListener('click', function(e) {
        if (!e.target.classList.contains('farbe-input') && !e.target.matches('[id^="wandfarbezimm"]') && !e.target.matches('[id^="wandfarbe"]')) {
            document.querySelectorAll('[id^="farbe-vorschlaege-"]').forEach(container => {
                container.style.display = 'none';
            });
        }
    });

    // Bei Fensteränderungen neu positionieren
    window.addEventListener('scroll', repositionOnEvent);
    window.addEventListener('resize', repositionOnEvent);
    
    function repositionOnEvent() {
        document.querySelectorAll('[id^="farbe-vorschlaege-"]').forEach(container => {
            if (container.style.display === 'block') {
                const raum = container.id.split('-')[2];
                const inputFeld = farbeInputs[raum] || document.getElementById(`wandfarbezimm${raum.replace('zimm', '')}`);
                if (inputFeld) {
                    positioniereVorschlaege(container, inputFeld);
                }
            }
        });
    }
});