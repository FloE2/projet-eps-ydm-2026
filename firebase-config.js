// ============================================================
//  CONFIGURATION FIREBASE — Collège Yves du Manoir
//  ✅ Utilise Realtime Database (gratuit, déjà activé)
//  ❌ Firestore désactivé (nécessite facturation en Europe)
// ============================================================
const firebaseConfig = {
  apiKey:            "AIzaSyBt_P5FLg105eCF-DVL_Fp5hctk6-qz_68",
  authDomain:        "projet-eps-ydm-2026.firebaseapp.com",
  databaseURL:       "https://projet-eps-ydm-2026-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "projet-eps-ydm-2026",
  storageBucket:     "projet-eps-ydm-2026.firebasestorage.app",
  messagingSenderId: "504635237273",
  appId:             "1:504635237273:web:8bcefc790c3f09fa276908"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();  // Realtime Database

// ============================================================
//  CONFIGURATION DU COLLÈGE
// ============================================================
window.COLLEGE_NOM    = "Collège Yves du Manoir";
window.COLLEGE_VILLE  = "Vaucresson";
window.ANNEE_SCOLAIRE = "2025-2026";
window.ADMIN_PASSWORD = "Eps2026";
window.ADMIN_USERS    = ["florian.eude", "emeric.cosperec"];

// ============================================================
//  CONSTANTES PÉDAGOGIQUES
// ============================================================
window.CHAMPS_APPRENTISSAGE = {
  CA1: "Produire une performance optimale à une échéance donnée",
  CA2: "Adapter ses déplacements à des environnements variés",
  CA3: "S'exprimer devant les autres par une prestation acrobatique ou artistique",
  CA4: "Conduire et maîtriser un affrontement individuel ou collectif"
};

window.DOMAINES_SOCLE = {
  "D1.1": "Les langages pour penser et communiquer",
  "D1.4": "Les langages pour penser et communiquer (corps / mouvement)",
  "D2":   "Les méthodes et outils pour apprendre",
  "D3":   "La formation de la personne et du citoyen",
  "D4":   "Les systèmes naturels et techniques",
  "D5":   "Les représentations du monde et l'activité humaine"
};

window.NIVEAUX_6E = [
  { code: "NA",  label: "Non Acquis",            couleur: "#E53E3E", icon: "✗" },
  { code: "ECA", label: "En cours d'acquisition", couleur: "#F6A000", icon: "◑" },
  { code: "A",   label: "Acquis",                couleur: "#2D9E68", icon: "✓" }
];
window.NIVEAUX_5E_3E = [
  { code: "NA",  label: "Non Acquis",            couleur: "#E53E3E", icon: "✗" },
  { code: "ECA", label: "En cours d'acquisition", couleur: "#F6A000", icon: "◑" },
  { code: "A",   label: "Acquis",                couleur: "#2D9E68", icon: "✓" },
  { code: "D",   label: "Dépassé",               couleur: "#6B21A8", icon: "★" }
];

function getNiveaux(niveauClasse) {
  return niveauClasse === "6e" ? window.NIVEAUX_6E : window.NIVEAUX_5E_3E;
}

// ============================================================
//  AUTH
// ============================================================
function isProf() { return localStorage.getItem("eps_prof") === "true"; }
function requireProf() {
  if (!isProf()) window.location.href = getBase() + "admin/login.html";
}
function getBase() {
  const p = window.location.pathname;
  return (p.includes("/admin/") || p.includes("/eleve/")) ? "../" : "./";
}

// ============================================================
//  UTILITAIRES REALTIME DATABASE
// ============================================================
const dbGet    = p => db.ref(p).once("value").then(s => s.val());
const dbSet    = (p, d) => db.ref(p).set(d);
const dbUpdate = (p, d) => db.ref(p).update(d);
const dbRemove = p => db.ref(p).remove();
const dbPush   = (p, d) => db.ref(p).push(d).then(r => r.key);

// ── Classes ────────────────────────────────────────────────
async function getClasses() {
  const data = await dbGet("classes");
  if (!data) return [];
  return Object.entries(data).map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => a.nom.localeCompare(b.nom));
}

// ── Élèves ─────────────────────────────────────────────────
async function getEleves(classeId) {
  const data = await dbGet("eleves");
  if (!data) return [];
  return Object.entries(data).map(([id, v]) => ({ id, ...v }))
    .filter(e => e.classeId === classeId)
    .sort((a, b) => a.nom.localeCompare(b.nom));
}
async function getTousEleves() {
  const data = await dbGet("eleves");
  if (!data) return [];
  return Object.entries(data).map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => a.nom.localeCompare(b.nom));
}

// ── Cycles ─────────────────────────────────────────────────
async function getCyclesActifs(classeId) {
  const data = await dbGet("cycles");
  if (!data) return [];
  return Object.entries(data).map(([id, v]) => ({ id, ...v }))
    .filter(c => c.classeId === classeId && c.actif === true);
}
async function getTousCycles() {
  const data = await dbGet("cycles");
  if (!data) return [];
  return Object.entries(data).map(([id, v]) => ({ id, ...v }));
}

// ── APSA ───────────────────────────────────────────────────
async function getApsa(apsaId) {
  const data = await dbGet("apsa/" + apsaId);
  return data ? { id: apsaId, ...data } : null;
}
async function getToutesApsa() {
  const data = await dbGet("apsa");
  if (!data) return [];
  return Object.entries(data).map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => (a.champAppr || "").localeCompare(b.champAppr || ""));
}

// ── Évaluations ────────────────────────────────────────────
async function getEvaluation(eleveId, cycleId) {
  const data = await dbGet("evaluations");
  if (!data) return null;
  const found = Object.entries(data).find(([, v]) =>
    v.eleveId === eleveId && v.cycleId === cycleId);
  return found ? { id: found[0], ...found[1] } : null;
}
async function sauvegarderEvaluation(eleveId, cycleId, apsaId, resultats) {
  const existing = await getEvaluation(eleveId, cycleId);
  const data = { eleveId, cycleId, apsaId, resultats, dateModif: new Date().toISOString() };
  if (existing) {
    await dbUpdate("evaluations/" + existing.id, data);
    return existing.id;
  }
  return await dbPush("evaluations", data);
}
async function getHistoriqueEleve(eleveId) {
  const data = await dbGet("evaluations");
  if (!data) return [];
  return Object.entries(data).map(([id, v]) => ({ id, ...v }))
    .filter(e => e.eleveId === eleveId)
    .sort((a, b) => (b.dateModif || "").localeCompare(a.dateModif || ""));
}
async function getToutesEvaluations() {
  const data = await dbGet("evaluations");
  if (!data) return [];
  return Object.entries(data).map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => (b.dateModif || "").localeCompare(a.dateModif || ""));
}
async function getEvaluationsParEleves(eleveIds) {
  const data = await dbGet("evaluations");
  if (!data) return [];
  return Object.entries(data).map(([id, v]) => ({ id, ...v }))
    .filter(e => eleveIds.includes(e.eleveId));
}

// ── Config profs ───────────────────────────────────────────
async function getConfigProfs() {
  return await dbGet("config/profs");
}
