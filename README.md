# 🏃 Projet EPS Collège — Guide d'installation

Site de suivi des compétences EPS pour collège.
Auto-évaluation continue · 4 niveaux · 6e → 3e

---

## 📁 Structure du projet

```
projet-eps-college/
│
├── index.html                  ← Page d'accueil (Élève / Prof)
├── firebase-config.js          ← ⚙️ Config Firebase + utilitaires
│
├── assets/
│   ├── style.css               ← Feuille de style globale
│   └── ...
│
├── eleve/
│   ├── classe.html             ← Sélection classe → APSA → élève
│   └── fiche.html              ← Fiche d'auto-évaluation
│
└── admin/
    ├── login.html              ← Connexion professeur
    ├── dashboard.html          ← Tableau de bord
    ├── gestion-apsa.html       ← Créer/modifier les APSA et objectifs
    ├── gestion-classes.html    ← Gérer classes, élèves, cycles
    ├── suivi-eleve.html        ← Parcours 6e→3e d'un élève
    └── bilan-classe.html       ← Matrice CA × Domaines du Socle
```

---

## 🔥 Étape 1 — Créer un projet Firebase

1. Aller sur [console.firebase.google.com](https://console.firebase.google.com)
2. Créer un nouveau projet (ex : `eps-college-jean-moulin`)
3. Activer **Firestore Database** en mode **Production**
4. Dans **Paramètres du projet** → **Applications** → ajouter une application Web
5. Copier la configuration Firebase

---

## ⚙️ Étape 2 — Configurer firebase-config.js

Ouvrir `firebase-config.js` et remplacer les placeholders :

```javascript
const firebaseConfig = {
  apiKey:            "AIza...",        // ← Votre clé API
  authDomain:        "mon-projet.firebaseapp.com",
  projectId:         "mon-projet",
  storageBucket:     "mon-projet.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123:web:abc"
};

window.COLLEGE_NOM    = "Collège Jean Moulin";  // ← Votre établissement
window.COLLEGE_VILLE  = "Marseille";
window.ANNEE_SCOLAIRE = "2025-2026";
window.ADMIN_PASSWORD = "MotDePasseSecurise2026!"; // ← À changer !
```

---

## 🔒 Étape 3 — Règles Firestore

Dans Firebase Console → Firestore → Règles, copier :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Config (lecture seule pour tous, écriture pour personne via client)
    match /config/{doc} {
      allow read: if true;
      allow write: if false;
    }

    // Classes et APSA : lecture publique, écriture via admin uniquement
    match /classes/{id}   { allow read: if true; allow write: if false; }
    match /apsa/{id}      { allow read: if true; allow write: if false; }
    match /cycles/{id}    { allow read: if true; allow write: if false; }

    // Élèves : lecture publique (pas d'identifiants sensibles)
    match /eleves/{id}    { allow read: if true; allow write: if false; }

    // Évaluations : lecture/écriture publiques (auto-éval sans auth)
    match /evaluations/{id} {
      allow read, write: if true;
    }
  }
}
```

> **Note sécurité** : Ces règles permettent à n'importe qui de lire les données.
> Pour la production, envisager Firebase Auth pour les profs.

---

## 📦 Étape 4 — Déployer sur GitHub Pages

```bash
# 1. Créer un dépôt GitHub (ex : projet-eps-college)
# 2. Pousser tous les fichiers
git init
git add .
git commit -m "Premier commit — Projet EPS"
git remote add origin https://github.com/TON-USER/projet-eps-college.git
git push -u origin main

# 3. Dans GitHub → Settings → Pages → Source : main / root
# Le site sera accessible sur : https://ton-user.github.io/projet-eps-college/
```

---

## 🚀 Étape 5 — Première utilisation

### Configuration initiale (à faire une fois)
1. Aller sur `admin/login.html` → se connecter
2. **Gestion APSA** → créer les APSA avec leurs objectifs
3. **Gestion Classes** → créer les classes (6eA, 6eB, etc.)
4. **Gestion Classes** → importer les élèves (liste par classe)
5. **Gestion Classes** → créer les cycles (associer APSA ↔ classe)

### Utilisation quotidienne (élèves en cours)
1. Ouvrir `index.html` sur la tablette
2. Cliquer **ÉLÈVE**
3. Choisir la classe → l'APSA → cliquer sur son prénom
4. S'auto-évaluer → **Enregistrer**

---

## 📊 Structure de données Firebase

```
classes/    → { nom, niveau, annee }
eleves/     → { prenom, nom, classeId, classe, niveau }
apsa/       → { nom, champAppr, description, niveaux[], objectifs[] }
cycles/     → { classeId, apsaId, actif, dateDebut, dateFin }
evaluations/→ { eleveId, cycleId, apsaId, resultats{}, dateModif }
config/     → { profs: { password } }
```

---

## 🎯 Niveaux d'acquisition

| Code | Label                 | 6e | 5e-3e |
|------|-----------------------|----|-------|
| NA   | Non Acquis            | ✓  | ✓     |
| ECA  | En cours d'acquisition| ✓  | ✓     |
| A    | Acquis                | ✓  | ✓     |
| D    | Dépassé               | ✗  | ✓     |

---

## 🛟 Support

En cas de problème Firebase, vérifier :
- La configuration dans `firebase-config.js`
- Les règles Firestore (Étape 3)
- La console navigateur (F12) pour les erreurs

---

*Projet développé pour le collège — 2025-2026*
