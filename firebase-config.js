// ============================================================
//  CONFIGURATION FIREBASE — Collège Yves du Manoir
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

// Initialisation Firebase (compat SDK)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// ============================================================
//  CONFIGURATION DU COLLÈGE — À MODIFIER
// ============================================================
window.COLLEGE_NOM    = "Collège Yves du Manoir";
window.COLLEGE_VILLE  = "Vaucresson";
window.ANNEE_SCOLAIRE = "2025-2026";

// Mot de passe administration (à changer !)
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

// Niveaux d'acquisition selon la classe
window.NIVEAUX_6E = [
  { code: "NA",  label: "Non Acquis",           couleur: "#E53E3E", icon: "✗" },
  { code: "ECA", label: "En cours d'acquisition",couleur: "#F6A000", icon: "◑" },
  { code: "A",   label: "Acquis",               couleur: "#2D9E68", icon: "✓" }
];
window.NIVEAUX_5E_3E = [
  { code: "NA",  label: "Non Acquis",           couleur: "#E53E3E", icon: "✗" },
  { code: "ECA", label: "En cours d'acquisition",couleur: "#F6A000", icon: "◑" },
  { code: "A",   label: "Acquis",               couleur: "#2D9E68", icon: "✓" },
  { code: "D",   label: "Dépassé",              couleur: "#6B21A8", icon: "★" }
];

function getNiveaux(niveauClasse) {
  return niveauClasse === "6e" ? window.NIVEAUX_6E : window.NIVEAUX_5E_3E;
}

// ============================================================
//  UTILITAIRES AUTH
// ============================================================
function isProf() {
  return localStorage.getItem("eps_prof") === "true";
}
function requireProf() {
  if (!isProf()) {
    const base = getBase();
    window.location.href = base + "admin/login.html";
  }
}
function getBase() {
  // Retourne le chemin vers la racine du projet
  const path = window.location.pathname;
  if (path.includes("/admin/") || path.includes("/eleve/")) return "../";
  return "./";
}

// ============================================================
//  UTILITAIRES FIRESTORE
// ============================================================
async function getClasses() {
  const snap = await db.collection("classes").orderBy("nom").get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function getEleves(classeId) {
  const snap = await db.collection("eleves")
    .where("classeId", "==", classeId)
    .orderBy("nom").get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function getCyclesActifs(classeId) {
  const snap = await db.collection("cycles")
    .where("classeId", "==", classeId)
    .where("actif", "==", true)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function getApsa(apsaId) {
  const doc = await db.collection("apsa").doc(apsaId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}
async function getEvaluation(eleveId, cycleId) {
  const snap = await db.collection("evaluations")
    .where("eleveId", "==", eleveId)
    .where("cycleId", "==", cycleId)
    .limit(1).get();
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}
async function sauvegarderEvaluation(eleveId, cycleId, apsaId, resultats) {
  const existing = await getEvaluation(eleveId, cycleId);
  const data = { eleveId, cycleId, apsaId, resultats,
                 dateModif: firebase.firestore.FieldValue.serverTimestamp() };
  if (existing) {
    await db.collection("evaluations").doc(existing.id).update(data);
    return existing.id;
  } else {
    const ref = await db.collection("evaluations").add(data);
    return ref.id;
  }
}
async function getHistoriqueEleve(eleveId) {
  const snap = await db.collection("evaluations")
    .where("eleveId", "==", eleveId)
    .orderBy("dateModif", "desc").get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
