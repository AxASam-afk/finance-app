# Finances — Application de gestion de finances personnelles

Application mono-utilisateur, interface en français, construite avec Next.js (App Router), Prisma/PostgreSQL et Tailwind CSS. Voir `CLAUDE.md` à la racine du projet complet pour le cahier des charges intégral et la feuille de route.

## État actuel

✅ Implémenté :
- Socle du projet (Next.js, TypeScript, Tailwind, thème clair/sombre)
- Schéma de base de données complet (Prisma) pour toutes les entités du cahier des charges
- Catégories par défaut (seed)
- Moteur de transactions : création, modification, recherche, filtres, tri, pagination, corbeille (suppression douce) + restauration
- Tableau de bord : solde réel (calculé, pas stocké en dur), revenus/dépenses du mois, transactions récentes, navigation entre mois

✅ Également implémenté :
- Moteur de récurrences (génération idempotente, page `/recurrences`)
- Budget mensuel (global + par catégorie, indicateurs proche limite / dépassé, page `/budget`)

🚧 Pas encore implémenté (voir `CLAUDE.md` → feuille de route) : prévisionnel, calendrier, statistiques, épargne, import/export CSV, notifications, assistant IA.

## Installation locale

```bash
npm install
cp .env.example .env       # puis renseigner DATABASE_URL, ANTHROPIC_API_KEY, etc.
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

L'application est disponible sur http://localhost:3000.

## Base de données

Neon via l'intégration Vercel Storage est recommandé. Renseignez `DATABASE_URL` (poolée) et `DATABASE_URL_UNPOOLED` (directe) dans `.env`, puis :

```bash
npx prisma migrate dev --name init
npm run db:seed   # crée les catégories par défaut et la ligne Settings
```

`npx prisma studio` permet d'inspecter les données directement.

## Déploiement sur Vercel

1. Poussez le projet sur un repo Git, importez-le dans Vercel.
2. Renseignez les mêmes variables d'environnement que `.env.example` dans les paramètres du projet Vercel.
3. Ajoutez une base Postgres (Vercel Postgres ou Neon) et copiez son `DATABASE_URL`.
4. Le script `vercel-build` applique automatiquement `prisma migrate deploy` puis `next build`.
5. Lancez `npm run db:seed` une fois (en local avec les variables Vercel) pour créer les catégories par défaut.

## Scripts utiles

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run db:migrate` | Nouvelle migration Prisma (dev) |
| `npm run db:seed` | Recrée les catégories par défaut |
| `npm run db:studio` | Interface d'inspection de la base |
