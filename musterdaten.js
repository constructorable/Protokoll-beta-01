function loadMusterdaten() {


 console.log("🎯 Fülle Protokoll mit Musterdaten...");

 const MUSTERMIETER = [
   {
     vorname: "Max",
     nachname: "Mustermann", 
     email: "max.mustermann@email.de",
     telefon: "0123456789",
     strasse: "Musterstraße 12",
     plzOrt: "12345 Musterstadt"
   },
   {
     vorname: "Anna", 
     nachname: "Schmidt",
     email: "anna.schmidt@gmail.com", 
     telefon: "01771234567",
     strasse: "Testweg 34",
     plzOrt: "54321 Testdorf"
   },
   {
     vorname: "Tom",
     nachname: "Weber", 
     email: "tom.weber@web.de",
     telefon: "040123456",
     strasse: "Beispielplatz 56", 
     plzOrt: "11111 Beispielort"
   },
   {
     vorname: "Lisa",
     nachname: "Müller",
     email: "lisa.mueller@yahoo.de", 
     telefon: "030987654",
     strasse: "Demostraße 78",
     plzOrt: "22222 Democity"
   },
   {
     vorname: "Peter",
     nachname: "Bauer",
     email: "peter.bauer@outlook.com",
     telefon: "089555666", 
     strasse: "Probeallee 90",
     plzOrt: "33333 Probestadt"
   }
 ];

 const MUSTERDATEN = {
   text: [
     "Mustereintrag", "Test Wert", "Beispiel Text", "Demo Eingabe", 
     "Testwert 123", "Muster GmbH", "gut erhalten", "renoviert", "sauber",
     "neuwertig", "abgenutzt", "beschädigt", "reparaturbedürftig"
   ],
   farben: ["weiß", "beige", "grau", "hellgrau", "creme", "elfenbein"],
   bodenbelag: ["Laminat", "Parkett", "Fliesen", "Teppich", "Vinyl", "Linoleum"],
   schluesselarten: ["Haustür", "Wohnungstür", "Briefkasten", "Keller", "Garage"],
   zaehlerarten: ["Stromzähler", "Gaszähler", "Wasserzähler (kalt)", "Wasserzähler (warm)"]
 };

 let filledCount = 0;

 function getRandomMieter() {
   return MUSTERMIETER[Math.floor(Math.random() * MUSTERMIETER.length)];
 }

 document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea').forEach(input => {
   if (!input.value.trim() && input.id) {
     let value = "";
     const mieter = getRandomMieter();

     if (input.type === "email" || input.id.includes("email")) {
       value = mieter.email;
     } else if (input.type === "tel" || input.id.includes("phone") || input.id.includes("telefon")) {
       value = mieter.telefon;
     } else if (input.id.includes("firstname") || input.id.includes("vorname")) {
       value = mieter.vorname;
     } else if (input.id.includes("name") && !input.id.includes("firstname")) {
       value = mieter.nachname;
     } else if (input.id.includes("tenant-name")) {
       value = mieter.nachname;
     } else if (input.id.includes("tenant-firstname")) {
       value = mieter.vorname;
     } else if (input.id.includes("moveout-name")) {
       value = `${mieter.vorname} ${mieter.nachname}`;
     } else if (input.id.includes("moveout-firstname")) {
       value = mieter.strasse;
     } else if (input.id.includes("moveout-addr")) {
       value = mieter.plzOrt;
     } else if (input.id.includes("strasse") || input.id.includes("street") || input.id.includes("adresse")) {
       value = mieter.strasse;
     } else if (input.id.includes("plz") || input.id.includes("ort") || input.id.includes("city")) {
       value = mieter.plzOrt;
     } else if (input.id.includes("farbe") || input.id.includes("wandfarbe")) {
       value = MUSTERDATEN.farben[Math.floor(Math.random() * MUSTERDATEN.farben.length)];
     } else if (input.id.includes("boden") || input.id.includes("fussboden")) {
       value = MUSTERDATEN.bodenbelag[Math.floor(Math.random() * MUSTERDATEN.bodenbelag.length)];
     } else if (input.id.includes("zaehler-number")) {
       value = Math.floor(Math.random() * 900000000) + 100000000; 
     } else if (input.id.includes("zaehler-location")) {
       value = "Keller";
     } else if (input.id.includes("key-note")) {
       value = "Funktioniert einwandfrei";
     } else {
       value = MUSTERDATEN.text[Math.floor(Math.random() * MUSTERDATEN.text.length)];
     }

     input.value = value;
     // Wichtig: Event auslösen für Echtzeit-Updates
     input.dispatchEvent(new Event('input', { bubbles: true }));
     filledCount++;
   }
 });

 document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
   if (!checkbox.checked && Math.random() > 0.4) {
     checkbox.checked = true;
     filledCount++;
   }
 });

 const radioGroups = {};
 document.querySelectorAll('input[type="radio"]').forEach(radio => {
   const name = radio.name;
   if (name && !radioGroups[name]) {
     radio.checked = true;
     radioGroups[name] = true;
     filledCount++;
   }
 });

 document.querySelectorAll('select').forEach(select => {
   if (select.selectedIndex <= 0 && select.options.length > 1) {
     let selectedIndex = 1; 

     if (select.id.includes("key-type")) {
       const schluesselOptionen = Array.from(select.options).filter(opt => 
         MUSTERDATEN.schluesselarten.includes(opt.value)
       );
       if (schluesselOptionen.length > 0) {
         const randomOption = schluesselOptionen[Math.floor(Math.random() * schluesselOptionen.length)];
         selectedIndex = Array.from(select.options).indexOf(randomOption);
       }
     } else if (select.id.includes("zaehler-type")) {
       const zaehlerOptionen = Array.from(select.options).filter(opt => 
         MUSTERDATEN.zaehlerarten.includes(opt.value)
       );
       if (zaehlerOptionen.length > 0) {
         const randomOption = zaehlerOptionen[Math.floor(Math.random() * zaehlerOptionen.length)];
         selectedIndex = Array.from(select.options).indexOf(randomOption);
       }
     } else if (select.id.includes("status")) {
       const statusOptions = ["mieter", "landl"];
       const targetValue = statusOptions[Math.floor(Math.random() * statusOptions.length)];
       const targetOption = Array.from(select.options).find(opt => opt.value === targetValue);
       if (targetOption) {
         selectedIndex = Array.from(select.options).indexOf(targetOption);
       }
     } else {
       selectedIndex = Math.floor(Math.random() * (select.options.length - 1)) + 1;
     }

     select.selectedIndex = selectedIndex;
     filledCount++;
   }
 });

 document.querySelectorAll('input[type="number"]').forEach(input => {
   if (!input.value && input.id) {
     let value;
     if (input.id.includes("rauchmelder")) {
       value = Math.floor(Math.random() * 3) + 1; 
     } else if (input.id.includes("key-amount")) {
       value = Math.floor(Math.random() * 3) + 1; 
     } else if (input.id.includes("zaehler-value")) {
       value = (Math.random() * 10000).toFixed(2); 
     } else if (input.id.includes("anzahl")) {
       value = Math.floor(Math.random() * 5) + 1; 
     } else {
       value = Math.floor(Math.random() * 100) + 1; 
     }
     input.value = value;
     filledCount++;
   }
 });

 document.querySelectorAll('.toggle-option[data-value="ja"]').forEach(toggle => {
   if (!toggle.classList.contains('active')) {
     const parent = toggle.closest('.toggle-options');
     if (parent) {
       parent.querySelectorAll('.toggle-option').forEach(opt => opt.classList.remove('active'));
       toggle.classList.add('active');
       parent.dataset.activeOption = toggle.dataset.value;

       const roomToggle = toggle.closest('.room-toggle');
       if (roomToggle) {
         const roomName = roomToggle.dataset.room;
         const container = document.getElementById(roomName + '-container');
         if (container) {
           container.style.display = 'block';
         }
       }
       filledCount++;
     }
   }
 });

 console.log(`✅ ${filledCount} Felder mit Musterdaten gefüllt!`);
 

}