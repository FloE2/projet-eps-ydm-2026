// ============================================================
//  CONFIGURATION FIREBASE — Collège Yves du Manoir
//  ✅ Utilise Realtime Database (gratuit, déjà activé)
//  ✅ Authentification Google activée
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
const db   = firebase.database();   // Realtime Database
const auth = firebase.auth();       // Google Auth

// ============================================================
//  UTILISATEURS AUTORISÉS (vos deux comptes Gmail uniquement)
// ============================================================
window.EMAILS_AUTORISES = [
  "florianeude@gmail.com",
  "cosperecemeric@gmail.com"
];

// ============================================================
//  CONFIGURATION DU COLLÈGE
// ============================================================
window.COLLEGE_NOM   = "Collège Yves du Manoir";
window.COLLEGE_VILLE = "Vaucresson";

// ── Année scolaire dynamique ────────────────────────────────
function calculerAnneeEnCours() {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 8 ? `${y}-${y+1}` : `${y-1}-${y}`;
}
function getAnneeActive() {
  return localStorage.getItem('eps_annee_active') || calculerAnneeEnCours();
}
function setAnneeActive(annee) {
  localStorage.setItem('eps_annee_active', annee);
  window.ANNEE_SCOLAIRE = annee;
}
// Compatibilité rétroactive
window.ANNEE_SCOLAIRE = getAnneeActive();

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
//  AUTH — Firebase Google
// ============================================================

// Vérifie si l'utilisateur connecté est un prof autorisé
function isProf() {
  const user = auth.currentUser;
  return user && window.EMAILS_AUTORISES.includes(user.email);
}

// Redirige vers login si pas connecté (pour les pages protégées)
function requireProf() {
  auth.onAuthStateChanged(user => {
    if (!user || !window.EMAILS_AUTORISES.includes(user.email)) {
      window.location.href = getBase() + "login.html";
    }
  });
}

function getBase() {
  const p = window.location.pathname;
  return (p.includes("/admin/") || p.includes("/eleve/")) ? "../" : "./";
}

// Déconnexion
function deconnexion() {
  auth.signOut().then(() => {
    window.location.href = getBase() + "login.html";
  });
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

// ============================================================
//  IDENTIFIANTS STABLES ÉLÈVES (multi-années)
// ============================================================

/**
 * Convertit DD/MM/YYYY → YYYYMMDD (chaîne de chiffres)
 */
function parseDDN(ddn) {
  if (!ddn) return '';
  const parts = ddn.trim().split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [d, m, y] = parts;
    if (y.length === 4) return `${y}${m.padStart(2,'0')}${d.padStart(2,'0')}`;
    if (d.length === 4) return `${d}${m.padStart(2,'0')}${y.padStart(2,'0')}`;
  }
  return ddn.replace(/[^0-9]/g, '');
}

/**
 * Génère un identifiant stable et unique pour un élève.
 * Format : NOM_PRENOM_YYYYMMDD  (ou NOM_PRENOM_  si pas de DDN)
 */
function genererEleveUID(nom, prenom, dateNaissance) {
  const normalize = s => (s || '').toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '');
  const n = normalize(nom);
  const p = normalize(prenom);
  const d = parseDDN(dateNaissance);
  return `${n}_${p}_${d}`;
}

/**
 * Retourne toutes les inscriptions (une par année) partageant le même eleveUID.
 */
async function getElevesParUID(eleveUID) {
  const data = await dbGet("eleves");
  if (!data) return [];
  return Object.entries(data)
    .map(([id, v]) => ({ id, ...v }))
    .filter(e => e.eleveUID === eleveUID)
    .sort((a, b) => (a.anneeScolaire || '').localeCompare(b.anneeScolaire || ''));
}

/**
 * Retourne toutes les évaluations pour une liste d'eleveIds (multi-années).
 */
async function getEvaluationsMultiEleves(eleveIds) {
  const data = await dbGet("evaluations");
  if (!data) return [];
  return Object.entries(data)
    .map(([id, v]) => ({ id, ...v }))
    .filter(e => eleveIds.includes(e.eleveId))
    .sort((a, b) => (a.dateModif || '').localeCompare(b.dateModif || ''));
}

/**
 * Liste toutes les années scolaires présentes dans la base.
 */
async function getAnneesDisponibles() {
  const data = await dbGet("classes");
  if (!data) return [getAnneeActive()];
  const set = new Set(
    Object.values(data).map(c => c.anneeScolaire).filter(Boolean)
  );
  // Si des classes sans anneeScolaire existent → les rattacher à l'année par défaut
  const hasUntagged = Object.values(data).some(c => !c.anneeScolaire);
  if (hasUntagged) set.add(calculerAnneeEnCours());
  set.add(calculerAnneeEnCours()); // Toujours inclure l'année en cours
  return [...set].sort().reverse();
}

/**
 * Retourne les classes filtrées par année scolaire (optionnel).
 */
async function getClassesByAnnee(anneeScolaire) {
  const data = await dbGet("classes");
  if (!data) return [];
  let arr = Object.entries(data).map(([id, v]) => ({ id, ...v }));
  if (anneeScolaire) {
    // Les classes sans anneeScolaire (créées avant la mise à jour) appartiennent
    // à l'année par défaut calculée automatiquement.
    const anneeDefaut = calculerAnneeEnCours();
    arr = arr.filter(c =>
      c.anneeScolaire === anneeScolaire ||
      (!c.anneeScolaire && anneeScolaire === anneeDefaut)
    );
  }
  return arr.sort((a, b) => a.nom.localeCompare(b.nom));
}

/**
 * Recherche un élève existant par eleveUID (exact ou partiel pour migration).
 * Retourne le record le plus récent ou null.
 */
async function trouverEleveExistant(eleveUID) {
  const data = await dbGet("eleves");
  if (!data) return null;
  const tous = Object.entries(data).map(([id, v]) => ({ id, ...v }));

  // 1. Match exact (avec DDN)
  let trouve = tous.filter(e => e.eleveUID === eleveUID);
  if (trouve.length) {
    return trouve.sort((a, b) => (b.anneeScolaire || '').localeCompare(a.anneeScolaire || ''))[0];
  }

  // 2. Match sans DDN (élèves migrés sans date de naissance : NOM_PRENOM_)
  const uidSansDDN = eleveUID.replace(/_\d+$/, '_');
  trouve = tous.filter(e => e.eleveUID === uidSansDDN);
  if (trouve.length) {
    return {
      ...trouve.sort((a, b) => (b.anneeScolaire || '').localeCompare(a.anneeScolaire || ''))[0],
      _matchPartiel: true
    };
  }

  return null;
}
