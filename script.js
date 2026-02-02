const kategorije = [
  { naziv: "Motivacija", start: 0 },
  { naziv: "Organizacija", start: 4 },
  { naziv: "Koncentracija", start: 8 },
  { naziv: "Tehnike učenja", start: 12 },
  { naziv: "Samopouzdanje", start: 16 }
];

const pitanja = [
  "Moje dijete samovoljno ulaže trud u učenje",
  "Moje dijete rijetko odgađa učenje i pisanje domaće zadaće do zadnjeg trenutka",
  "Moje dijete je ustrajno u rješavanju zadataka čak i kada nailazi na određene zapreke",
  "Moje dijete rijetko pokazuje izraz lica koje izražava gađenje, strah, ljutnju ili tugu dok izvršava školske obveze",
  "Moje dijete rijetko zaboravi napisati domaću zadaću",
  "Moje dijete rijetko zaboravi termine testova u školi",
  "Moje dijete unaprijed planira vrijeme za učenje",
  "Moje dijete ima dovoljno vremena za igru i druženje s prijateljima i za učenje",
  "Moje dijete s lakoćom izvršava određenu radnju od početka do kraja bez prekida",
  "Moje dijete lako prepriča pročitani tekst",
  "Moje dijete može učiti bez prekida 30 minuta",
  "Moje dijete rijetko odluta tijekom razgovora",
  "Moje dijete često koristi vlastite bilješke za učenje",
  "Moje dijete rado uči pomoću crtanja",
  "Moje dijete prilikom učenja rado koristi boje",
  "Moje dijete se služi tehnikama učenja za vrijeme učenja",
  "Moje dijete aktivno sudjeluje i rado postavlja pitanja za vrijeme nastave",
  "Moje dijete nema strah od određenog predmeta i/ili profesora",
  "Moje dijete rijetko izražava nelagodu za vrijeme usmenog ispitivanja",
  "Moje dijete rado izražava svoje mišljenje i stavove"
];

// Generiraj pitanja
const qDiv = document.getElementById("questions");
pitanja.forEach((p, i) => {
  const card = document.createElement("div");
  card.className = "card";
  const question = document.createElement("p");
  question.textContent = `${i + 1}. ${p}`;
  card.appendChild(question);

  const options = document.createElement("div");
  options.className = "options";
  
  for (let v = 1; v <= 5; v++) {
    const label = document.createElement("label");
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = `p${i}`;
    radio.value = v;
    
    const span = document.createElement("span");
    span.textContent = v;
    
    label.appendChild(radio);
    label.appendChild(span);
    options.appendChild(label);
  }
  
  card.appendChild(options);
  qDiv.appendChild(card);
});

function calculate() {
  const email = document.getElementById("email").value;
  const consent = document.getElementById("consent").checked;

  // Validacija
  if (!email || !consent) {
    alert("Molimo unesite e-mail i prihvatite privolu.");
    return;
  }

  // Provjeri jesu li odgovorena sva pitanja
  let allAnswered = true;
  for (let i = 0; i < 20; i++) {
    const answer = document.querySelector(`input[name="p${i}"]:checked`);
    if (!answer) {
      allAnswered = false;
      break;
    }
  }

  if (!allAnswered) {
    alert("Molimo odgovorite na sva pitanja.");
    return;
  }

  // Izračunaj bodove
  const odgovori = [];
  for (let i = 0; i < 20; i++) {
    odgovori.push(Number(document.querySelector(`input[name="p${i}"]:checked`).value));
  }

  let ukupno = 0;
  const kategorijeRezultat = {};
  
  kategorije.forEach((k) => {
    const bodovi = odgovori.slice(k.start, k.start + 4).reduce((a, b) => a + b, 0);
    ukupno += bodovi;
    kategorijeRezultat[k.naziv] = bodovi;
  });

  const paket = odrediPaket(ukupno);

  // Spremi u Google Sheet
  fetch("/.netlify/functions/saveEmail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      motivacija: kategorijeRezultat["Motivacija"],
      organizacija: kategorijeRezultat["Organizacija"],
      koncentracija: kategorijeRezultat["Koncentracija"],
      tehnike: kategorijeRezultat["Tehnike učenja"],
      samopouzdanje: kategorijeRezultat["Samopouzdanje"],
      ukupno: ukupno,
      paket: paket
    })
  });

  // Prikaži rezultat
  renderResult(kategorijeRezultat, ukupno, paket);
}

function renderResult(kategorije, ukupno, paket) {
  document.getElementById("test").classList.add("hidden");
  document.getElementById("result").classList.remove("hidden");

  let html = `
    <div class="result-section">
      <h2>Rezultati po kategorijama</h2>`;

  Object.entries(kategorije).forEach(([naziv, bodovi]) => {
    html += `
      <p><strong>${naziv}: ${bodovi}/20</strong></p>
      <div class="bar-container">
        <div class="bar" style="width:${bodovi * 5}%">${bodovi}</div>
      </div>`;
  });

  html += `
      <h3>Ukupno bodova: ${ukupno}/100</h3>
      <h2>Preporučeni paket: ${paket}</h2>
      <p>${opisPaketa(paket)}</p>
    </div>`;

  document.getElementById("resultContent").innerHTML = html;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function odrediPaket(b) {
  if (b <= 30) return "Maksi paket";
  if (b <= 50) return "Veliki paket";
  if (b <= 70) return "Osnovni paket";
  if (b <= 90) return "Mini paket";
  return "Mikro paket";
}

function opisPaketa(p) {
  const opisi = {
    "Maksi paket": "Intenzivna individualna podrška za razvoj svih ključnih vještina učenja. 20 susreta mjesečno po 2 školska sata",
    "Veliki paket": "Strukturirana podrška za jačanje organizacije, motivacije, koncentracije, tehnika učenja i samopouzdanja. 16 susreta mjesečno po 2 školska sata",
    "Osnovni paket": "Temeljni paket za poboljšanje učenja. 12 susreta mjesečno po 2 školska sata",
    "Mini paket": "Individualna podrška za podešavanje vještina. 8 susreta mjesečno po 2 školska sata",
    "Mikro paket": "Podrška i usavršavanje. 4 susreta mjesečno po 2 školska sata"
  };
  return opisi[p];
}

function restart() {
  document.getElementById("result").classList.add("hidden");
  document.getElementById("test").classList.remove("hidden");
  
  // Obriši sve odgovore
  document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
  document.getElementById("email").value = "";
  document.getElementById("consent").checked = false;
  
  window.scrollTo({ top: 0, behavior: "smooth" });
}