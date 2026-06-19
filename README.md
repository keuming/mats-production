# MATS Transport — Plateforme de Réservation (Production Vercel + Neon)

Plateforme de réservation de billets de bus et de gestion d'expéditions pour **Maashaa Allah Transport Service (MATS)**, ré-architecturée pour un déploiement Vercel + Neon PostgreSQL.

## 🏗️ Architecture

Ce monorepo contient **3 applications déployées séparément sur Vercel** :

```
mats-production/
├── apps/
│   ├── api/         → api.matstransport.com   (Backend tRPC, Vercel Functions)
│   ├── web/          → matstransport.com        (Site public de réservation)
│   └── admin/         → admin.matstransport.com  (Tableau de bord compagnie)
├── packages/
│   ├── db/            → Schéma Drizzle ORM (PostgreSQL / Neon)
│   └── shared/         → Constantes partagées
```

### Pourquoi 3 projets Vercel distincts ?

- **Séparation des domaines** demandée (`matstransport.com` vs `admin.matstransport.com`)
- **Sécurité** : le dashboard admin n'est jamais exposé sur le bundle JS public
- **Scalabilité indépendante** : chaque app a son propre build et déploiement

## 🔄 Changements par rapport à la version originale (Manus/HUB-VOYAGE)

| Original | Migré vers | Raison |
|---|---|---|
| MySQL/TiDB (`drizzle-orm/mysql2`) | PostgreSQL Neon (`drizzle-orm/neon-http`) | Neon est PostgreSQL natif, requis par la consigne |
| Manus OAuth propriétaire | JWT (jose) + bcrypt, email/mot de passe | Manus OAuth n'est pas portable hors de l'écosystème Manus |
| `vite-plugin-manus-runtime` | Supprimé | Dépendance interne Manus, inutile en prod Vercel |
| Express monolithique (front+back) | API serverless séparée (Vercel Functions) + 2 SPA Vite | Modèle natif Vercel : functions + static hosting |
| `onDuplicateKeyUpdate` (MySQL) | Requêtes adaptées au dialecte PostgreSQL | Incompatibilité de syntaxe entre dialectes |
| 1 dashboard mêlé au site public | Dashboard admin isolé sur sous-domaine | Demande explicite (admin.matstransport.com) |

## 🚀 Déploiement — Étapes complètes

### 1. Créer la base de données Neon

1. Allez sur [console.neon.tech](https://console.neon.tech) et créez un projet `mats-transport`
2. Copiez la **Connection String** (commence par `postgresql://...`)
3. Gardez-la pour l'étape 3

### 2. Pousser le code sur GitHub

```bash
cd mats-production
git init
git add .
git commit -m "Initial commit - MATS Transport production"
git remote add origin https://github.com/<votre-compte>/mats-transport.git
git push -u origin main
```

### 3. Déployer l'API (`api.matstransport.com`)

Sur [vercel.com/new](https://vercel.com/new) :

1. Importez le repo GitHub
2. **Root Directory** : `apps/api`
3. **Framework Preset** : Other
4. **Build Command** : `cd ../.. && pnpm install && pnpm --filter @mats/api build`
5. **Output Directory** : laissez par défaut (Vercel détecte `api/index.ts`)
6. Ajoutez les variables d'environnement (voir `apps/api/.env.example`) :
   - `DATABASE_URL` (depuis Neon)
   - `JWT_SECRET` (générez avec `openssl rand -base64 32`)
   - `SETUP_KEY` (clé temporaire pour créer le 1er admin)
   - `TWILIO_*` si vous utilisez les SMS
7. Déployez, puis dans **Settings → Domains**, ajoutez `api.matstransport.com`

### 4. Créer les tables dans Neon

En local, avec `DATABASE_URL` pointant vers Neon :

```bash
cd mats-production
pnpm install
pnpm db:push
```

Cela crée les 25+ tables du schéma dans votre base Neon.

### 5. Créer le premier compte administrateur

```bash
curl -X POST https://api.matstransport.com/trpc/auth.createAdminAccount \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "email": "admin@matstransport.com",
      "name": "Administrateur MATS",
      "password": "VotreMotDePasseSecurise123!",
      "setupKey": "VOTRE_SETUP_KEY_DEFINIE_DANS_VERCEL"
    }
  }'
```

⚠️ Une fois ce compte créé, supprimez ou changez `SETUP_KEY` dans Vercel pour empêcher la création d'autres admins par ce biais.

### 6. Déployer le site public (`matstransport.com`)

Nouveau projet Vercel :

1. **Root Directory** : `apps/web`
2. **Framework Preset** : Vite
3. **Build Command** : `cd ../.. && pnpm install && pnpm --filter @mats/web build`
4. **Output Directory** : `dist`
5. Variable d'environnement : `VITE_API_URL=https://api.matstransport.com`
6. Domaine : `matstransport.com` + `www.matstransport.com`

### 7. Déployer le dashboard admin (`admin.matstransport.com`)

Nouveau projet Vercel :

1. **Root Directory** : `apps/admin`
2. **Framework Preset** : Vite
3. **Build Command** : `cd ../.. && pnpm install && pnpm --filter @mats/admin build`
4. **Output Directory** : `dist`
5. Variable d'environnement : `VITE_API_URL=https://api.matstransport.com`
6. Domaine : `admin.matstransport.com`

### 8. Configurer le CORS

Dans `apps/api/api/index.ts`, la liste `allowedOrigins` contient déjà `matstransport.com` et `admin.matstransport.com`. Si vous utilisez d'autres domaines, ajoutez-les.

### 9. Connecter vos domaines DNS

Chez votre registrar (ou Cloudflare) :

| Type | Nom | Valeur |
|---|---|---|
| CNAME | `@` ou `matstransport.com` | `cname.vercel-dns.com` |
| CNAME | `admin` | `cname.vercel-dns.com` |
| CNAME | `api` | `cname.vercel-dns.com` |

Vercel vous donnera les valeurs exactes dans l'onglet Domains de chaque projet.

## 🧪 Développement local

```bash
pnpm install

# Copiez les .env.example en .env et remplissez les valeurs
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env

# Lancer tout en parallèle
pnpm dev
```

- API : http://localhost:3001
- Site public : http://localhost:3000
- Dashboard : http://localhost:5174

## 📋 Checklist avant mise en production

- [ ] Base Neon créée et `DATABASE_URL` configurée
- [ ] `pnpm db:push` exécuté (tables créées)
- [ ] `JWT_SECRET` généré aléatoirement (pas la valeur par défaut)
- [ ] Premier compte admin créé via `createAdminAccount`, puis `SETUP_KEY` révoquée
- [ ] 3 projets Vercel déployés (api, web, admin)
- [ ] Domaines DNS configurés et propagés
- [ ] CORS vérifié (pas d'erreur dans la console navigateur)
- [ ] Test du parcours : recherche → réservation → confirmation
- [ ] Test de connexion au dashboard admin
- [ ] Tarifs et lignes de bus configurés via le dashboard
- [ ] (Optionnel) Twilio configuré pour les SMS
- [ ] (Optionnel) Sentry ou monitoring d'erreurs ajouté

## ⚠️ Ce qui reste à compléter

Cette livraison couvre l'architecture, le schéma de données, l'API complète (100+ procédures tRPC) et les pages essentielles des deux frontends (recherche, réservation, suivi, dashboard admin avec gestion billets/expéditions/finance/staff).

Pages **non incluses dans cette livraison** (présentes dans l'app Manus originale mais à recréer si besoin) :
- Pages mobiles agent (embarquement, expédition terrain)
- Blog et CGV
- Composants d'impression PDF (billets, reçus)
- Gestion fine des caisses par gare (CaissesCentrale)
- Export CSV passagers

Ces fonctionnalités peuvent être ajoutées progressivement — le routeur tRPC (`apps/api/src/router.ts`) expose déjà la majorité de la logique métier nécessaire ; il s'agit principalement de construire l'interface correspondante.

## 🔐 Sécurité

- Mots de passe hashés avec bcrypt (12 rounds)
- Sessions JWT signées (jose), expiration 30 jours
- Rate limiting sur l'API (300 req/15min par IP)
- Helmet pour les en-têtes de sécurité HTTP
- Validation stricte des entrées via Zod sur toutes les procédures tRPC
- CORS restreint aux domaines MATS connus

## 📞 Support technique

Pour toute question sur cette livraison, consultez le code source commenté dans `apps/api/src/router.ts` qui détaille chaque procédure métier.
