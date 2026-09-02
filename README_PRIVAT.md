# PixelStore — Mémoire de travail (à lire avant de reprendre)

> **À LIRE EN PREMIER demain** : « lis le README » → je reprends toute l'info ci-dessous automatiquement.

---

## 1. Aperçu du projet

- **PixelStore** : site e-commerce statique (HTML/CSS/JS pur, **aucun framework**), dossier `D:\PROJETS\tech-store`.
- Objectif : intégration **backend Supabase** (boutique complète : catalogue, auth, panier, checkout, panneau admin).
- Dépôt GitHub : `https://github.com/dieudonne-dev/pixelstore.git` (branche `main`).
- Site public (GitHub Pages) : `https://dieudonne-dev.github.io/pixelstore/`.
- Panneau admin : `D:\PROJETS\tech-store\admin\` (déployé sous `/admin/`).

## 2. Connexion Supabase (clés PUBLIABLES — OK pour REST + Auth)

- **URL** : `https://ysaydbefzncsiovevlag.supabase.co`
- **Clé anon / publiable** : `sb_publishable_YzO-RFWZauh6seSMRRutrg_rKaFW1x9`
- Vérifiée : `/auth/v1/settings` → `200`. Config : `mailer_autoconfirm:false` (jusqu'à réglage), `google:false`, `disable_signup:false`.
- **Clé de service** : à récupérer sur le dashboard Supabase SI besoin d'écrire en admin hors RLS (pas conservée ici volontairement).

## 3. Compte admin

- **Email admin (fixe)** : `admin@pixelstore.bi`
- Rôle `admin` attribué **automatiquement** par le schéma (`handle_new_user` + `handle_user_update` + UPDATE idempotent de promotion dans la section démo).
- ⚠️ **Site public : ne jamais utiliser de vrai mot de passe perso** (mot de passe de démo suffit, ex. `AdminPixel2026!`).

## 4. Architecture & fichiers clés

### Frontend (racine)
- `js/supabase-config.js` : client Supabase (URL + clé anon). Détecte le SDK local UMD (`window.supabase.createClient`) **puis** le CDN en secours — corrige le blocage « Service temporairement indisponible ». SDK local : `js/vendor/supabase.min.js` (v2.112.4 UMD).
- `js/main.js` : handlers **newsletter** + **contact** robustes (`waitSupabase()`, `withTimeout()` → alerte « Délai dépassé », `try/catch/finally` pour réactiver le bouton).
- `js/api.js` : couche d'accès données avec **fallback local** (`waitForSupabase()`) ; helpers panier DB `getOrCreateCart`/`syncCartToDb`/`loadCartFromDb`.
- `js/auth.js` : auth front (inscription/connexion/déconnexion, modale injectée, menu `.header-actions`, `window.PixelAuth` / `window.storeUser` / `window.onUserChange`, sync panier). API : `resetPasswordForEmail`, `extractErrorMessage` (messages FR).
- `js/filters.js`, `js/fiche.js` : catalogue asynchrone.
- `js/checkout.js` + `checkout.html` : panier localStorage → DB → RPC `create_order`.
- `js/commandes.js` + `commandes.html` : historique des commandes de l'utilisateur connecté.
- `css/auth.css`, `css/checkout.css`, `css/commandes.css`.
- **Newsletter + contact** : bandeau newsletter ajouté sur toutes les pages marchandes ; insertion **anonyme** (RLS insert public OK) dans `newsletter_subscribers` (footer) et `contacts` (formulaire contact `index.html`). Pas de service d'email → stockage seul, l'admin gère depuis l'admin.

### Panneau admin (`admin/`)
- `js/admin-config.js` : `window.ADMIN_CONFIG` (URL, clé anon, `ADMIN_EMAIL='admin@pixelstore.bi'`).
- `js/admin-supabase.js` : **couche partagée** — client, `adminGate()` (écran login + contrôle rôle admin), `adminDB` :
  - **Lecture** : `products()` (avec brand/category/stock/images), `categories()`, `coupons()`, `orders()` (avec items + user email), `customers()`, `stockStatus()`, `dashboardStats()`, `subscribers()`, `subscriberStats()`, `contacts()`, `contactStats()`.
  - **Notifications** : `getNotifications()` (agrège messages non lus, commandes récentes 24h, nouveaux clients/abonnés 24h, stock faible).
  - **Écriture** : `saveProduct/deleteProduct`, `saveCategory/deleteCategory`, `saveCoupon/deleteCoupon`, `updateStock`, `updateOrderStatus`, `toggleSubscriber`, `deleteSubscriber`, `markContactRead`, `markAllMessagesRead`, `deleteContact`, `slugify`.
- `js/layout.js` : `renderAdminLayout(pageKey)` + `initSidebarLogout` (déconnexion Supabase → site public). Sidebar (groupe Marketing) : « Abonnés newsletter » → `abonnes.html`, « Messages » → `contacts.html`.
- `js/admin.js` : helpers (`formatPrice`, `statusMap`, `showToast`, etc.), `initAdminTheme/Sidebar/GlobalSearch/Notifications`.

### Pages admin — toutes connectées à Supabase (materialisées dans le commit `0747f6c`)
- `index.html` (dashboard : stats DB), `produits.html` (liste), `produit-form.html` (création/édition/suppression), `categories.html`, `commandes.html` (détail + changement de statut), `coupons.html`, `clients.html`, `stock.html`.
- `abonnes.html` : liste des abonnés newsletter (stats total/actifs/ce mois/source, recherche, toggle actif/inactif, suppression).
- `contacts.html` : boîte de réception des messages (stats total/non lus/ce mois, recherche, modal lecture auto-marqué lu, toggle lu/non-lu, suppression). Ouvre automatiquement un message via `?id=` (depuis la cloche).
- Chaque page : `renderAdminLayout(pageKey)` puis `adminGate(content, load)` → l'accès nécessite session **et** rôle admin ; non-admin → « Accès refusé ».

### Cloche de notifications admin (événements réels du site)
- **Données** : panel alimenté par `adminDB.getNotifications()` (messages non lus, nouvelles commandes, nouveaux clients, abonnés, stock faible). Polling toutes les **30 s** → les nouveaux événements apparaissent sans action.
- **Compteur** = **nombre de messages non lus uniquement** (pas toutes les activités). Badge rouge chiffré ; masqué si 0.
- **Tri** : messages non lus **en premier** (le plus récent en haut), puis autres événements par date.
- **Clic / bouton « Lire »** : message → ouvre `contacts.html?id=...` (boîte de réception + message ouvert/marqué lu) ; commande → `commandes.html` ; client → `clients.html` ; abonné → `abonnes.html` ; stock → `stock.html`.
- **« Marquer comme lu »** : marque tous les messages non lus lus (`markAllMessagesRead`) et remet le compteur à zéro.

## 5. Schéma (`supabase_schema.sql`) — IDEMPOTENT, à ré-exécuter

Fichier idempotent (CREATE OR REPLACE, DROP POLICY IF EXISTS, seeds ON CONFLICT DO NOTHING). Ajouts récents (admin) :
- `handle_new_user` + `handle_user_update` : attribuent `role='admin'` quand email = `admin@pixelstore.bi`.
- UPDATE idempotent de promotion dans la section démo.
- Fonction **`admin_update_order_status(uuid, text)`** en `SECURITY DEFINER` (permet à l'admin de changer le statut d'une commande, car volontairement AUCUNE policy UPDATE sur `orders`). Colonnes réelles : `order_status_history.created_at` (+ `changed_by`).
- Policy **`users_admin`** (SELECT sur TOUS les utilisateurs pour admin) — nécessaire pour la page Clients et la jointure email des commandes. `users_self` reste `id = auth.uid()`.
- `create_order` : `SECURITY DEFINER` + `SET search_path = public`, paramètre `p_notes`, `GRANT EXECUTE ... TO anon, authenticated`.
- **Tables marketing** (ajout 2026-09-02) :
  - `newsletter_subscribers` : `id, email (UNIQUE), phone, name, source (default 'footer'), is_active, created_at` — RLS insert public, admin gère.
  - `contacts` : `id, name, email, subject, message, is_read, created_at` — RLS insert public, admin gère.
  - Policies : `nsub_insert` / `contacts_insert` (INSERT public anonyme vérifié → 201), `nsub_read/write` / `contacts_read/write` (admin).

### Segrérité RLS (clés)
- Écritures admin via `FOR ALL USING (public.is_admin())` sur products, product_images, product_specs, product_certificates, categories, brands, stock, coupons, stock_movements.
- `products_read` : SELECT `is_active` seulement (front) ; admin voit tout via la policy écrite.
- `orders_self` : SELECT si `user_id = auth.uid() OR is_admin()` ; pas de UPDATE client.

## 6. Tests exécutés

- `node --check` OK sur : `admin-supabase.js`, `admin-config.js`, `admin.js`, `layout.js`, `js/main.js`, `js/supabase-config.js`, + les scripts inline extraits de toutes les pages admin (index, produits, produit-form, commandes, clients, categories, coupons, stock, abonnes, contacts).
- Insertions **anonymes** vérifiées (HTTP 201) sur `newsletter_subscribers` et `contacts` → RLS insert public OK.
- `getNotifications()` vérifiée en base : 3 messages non lus (Emma, Savoir, Test) → compteur à 3.
- Aucun framework de test / lint (pas de package.json).

## 7. État Git

- Commits récents poussés sur `main` : `04e5c1b` (compression images), `50a004d` (compactage), `7eadcdf` (newsletter + contacts + pages admin abonnes/contacts), `620aa47` (correctifs frontend + SDK local), `7b2f189` (supabase-config SDK local UMD), `2bfc755` (cloche notifications), `d378c20` (compteur = messages non lus + tri).
- Dernière fonctionnalité en cours/livrée : cloche admin branchée sur les événements réels + boîte de réception.
- Tout est commité (working tree propre sauf si nouvelles modifs à partir de ce README).

---

## 8. PROCHAINES ÉTAPES (à faire côté utilisateur — bloque les tests)

1. ✅ **Ré-exécuter `supabase_schema.sql`** : appliqué (tables `newsletter_subscribers` + `contacts` + policies créées, promotion rôle admin, `admin_update_order_status`, `users_admin`).
2. ✅ **Désactiver « Confirm email »** + **compte admin créé** (`admin@pixelstore.bi`) — connexion admin fonctionnelle.
3. ✅ **Flow newsletter / contact / cloche** testé et fonctionnel.
4. Reste éventuel : valider la clé de service / Storage si un jour besoin (actuellement inutile).

## 8ter. IMAGES PRODUITS — compression côté client (sans Storage)

- **Problème résolu** (2026-09-02) : l'upload d'image dans l'admin stockait un **data URI base64 de plusieurs Mo** dans `product_images.image_url` → lenteur extrême (chacun chargé à chaque listing). Le produit 13 (image id 181, 2,6 Mo) en était la cause principale.
- **Solution retenue** (simple, sans Storage ni SQL) : l'image est **redimensionnée et compressée dans le navigateur** (canvas → JPEG, max 1000 px, qualité auto, ~100-200 Ko) avant d'être stockée en data URI léger dans la base.
- **Code fait** :
  - `admin/produit-form.html` : `compressImage()` remplace l'ancien upload brut → data URI compressé.
  - `admin/js/admin-supabase.js` : les listings (`products()`) ne chargent que les **images arborescentes légères** (`img/...`), jamais les data URI (filtrés par `NOT ILIKE 'data:%'` via `imagesByProduct()`). Le produit consulté est chargé à la demande par `productById()`.
  - `scripts/compact-image.ps1` : compresse un data URI existant (ex. l'image 181) déjà stocké.
- **Bucket Storage `product-images`** : inutile désormais (abandonné). Aucune action requise.
- **Résultats mesurés** : image 181 traitée 1 976 Ko → 196 Ko ; listing des images ~4 Ko réponses en ~0,9 s.

## 8bis. BUG CORRIGÉ — Séquence products_id_seq (violation clé primaire)

- **Symptôme** : « duplicate key value violates unique constraint "products_pkey" » (code 23505) à la **création d'un produit** dans l'admin.
- **Cause** : les seeds insèrent les produits avec des `id` explicites (1..12). La séquence `products_id_seq` ne progresse donc pas → le premier insert SANS id repart de 1 → collision.
- **Corrigé le 2026-09-01** :
  - `admin-supabase.js` / `saveProduct` : en cas d'échec `products_pkey`, re-tente avec `id = max(id)+1` (contournement immédiat, sans SQL).
  - `supabase_schema.sql` : ajout en fin de script d'un `SELECT setval('products_id_seq', ...)` idempotent → **ré-exécuter le schéma dans l'éditeur SQL** pour corriger la base définitivement.
- **Tests** : insert sans id → 409 (séquence cassée) ; insert avec id=13 → 201 (fallback OK). Produits de test supprimés.

## 9. Prochaines idées / fichiers de référence (non priorisés)

- Améliorations de forme (placeholders, edit de specs, gestion galerie d'images, recherche pagination produits).
- Noter que pour éditer les specs d'un produit existant, `produit-form.html` n'affiche pas encore les specs existantes (elles sont réinitialisées) — à améliorer si besoin.
- README produit du dépôt : ne pas confondre avec ce fichier (celui-ci est la mémoire de travail).
