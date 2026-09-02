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
- `js/supabase-config.js` : client Supabase (URL + clé anon, CDN).
- `js/api.js` : couche d'accès données avec **fallback local** (`waitForSupabase()`) ; helpers panier DB `getOrCreateCart`/`syncCartToDb`/`loadCartFromDb`.
- `js/auth.js` : auth front (inscription/connexion/déconnexion, modale injectée, menu `.header-actions`, `window.PixelAuth` / `window.storeUser` / `window.onUserChange`, sync panier). API : `resetPasswordForEmail`, `extractErrorMessage` (messages FR).
- `js/filters.js`, `js/fiche.js` : catalogue asynchrone.
- `js/checkout.js` + `checkout.html` : panier localStorage → DB → RPC `create_order`.
- `js/commandes.js` + `commandes.html` : historique des commandes de l'utilisateur connecté.
- `css/auth.css`, `css/checkout.css`, `css/commandes.css`.

### Panneau admin (`admin/`)
- `js/admin-config.js` : `window.ADMIN_CONFIG` (URL, clé anon, `ADMIN_EMAIL='admin@pixelstore.bi'`).
- `js/admin-supabase.js` : **couche partagée** — client, `adminGate()` (écran login + contrôle rôle admin), `adminDB` :
  - **Lecture** : `products()` (avec brand/category/stock/images), `categories()`, `coupons()`, `orders()` (avec items + user email), `customers()`, `stockStatus()`, `dashboardStats()`.
  - **Écriture** : `saveProduct/deleteProduct`, `saveCategory/deleteCategory`, `saveCoupon/deleteCoupon`, `updateStock`, `updateOrderStatus`, `slugify`.
- `js/layout.js` : `renderAdminLayout(pageKey)` + `initSidebarLogout` (déconnexion Supabase → site public).
- `js/admin.js` : helpers (`formatPrice`, `statusMap`, `showToast`, etc.), `initAdminTheme/Sidebar/GlobalSearch/Notifications`.

### Pages admin — toutes connectées à Supabase (materialisées dans le commit `0747f6c`)
- `index.html` (dashboard : stats DB), `produits.html` (liste), `produit-form.html` (création/édition/suppression), `categories.html`, `commandes.html` (détail + changement de statut), `coupons.html`, `clients.html`, `stock.html`.
- Chaque page : `renderAdminLayout(pageKey)` puis `adminGate(content, load)` → l'accès nécessite session **et** rôle admin ; non-admin → « Accès refusé ».

## 5. Schéma (`supabase_schema.sql`) — IDEMPOTENT, à ré-exécuter

Fichier idempotent (CREATE OR REPLACE, DROP POLICY IF EXISTS, seeds ON CONFLICT DO NOTHING). Ajouts récents (admin) :
- `handle_new_user` + `handle_user_update` : attribuent `role='admin'` quand email = `admin@pixelstore.bi`.
- UPDATE idempotent de promotion dans la section démo.
- Fonction **`admin_update_order_status(uuid, text)`** en `SECURITY DEFINER` (permet à l'admin de changer le statut d'une commande, car volontairement AUCUNE policy UPDATE sur `orders`). Colonnes réelles : `order_status_history.created_at` (+ `changed_by`).
- Policy **`users_admin`** (SELECT sur TOUS les utilisateurs pour admin) — nécessaire pour la page Clients et la jointure email des commandes. `users_self` reste `id = auth.uid()`.
- `create_order` : `SECURITY DEFINER` + `SET search_path = public`, paramètre `p_notes`, `GRANT EXECUTE ... TO anon, authenticated`.

### Segrérité RLS (clés)
- Écritures admin via `FOR ALL USING (public.is_admin())` sur products, product_images, product_specs, product_certificates, categories, brands, stock, coupons, stock_movements.
- `products_read` : SELECT `is_active` seulement (front) ; admin voit tout via la policy écrite.
- `orders_self` : SELECT si `user_id = auth.uid() OR is_admin()` ; pas de UPDATE client.

## 6. Tests exécutés

- `node --check` OK sur : `admin-supabase.js`, `admin-config.js`, `admin.js`, `layout.js`, + les scripts inline extraits de toutes les pages admin (index, produits, produit-form, commandes, clients, categories, coupons, stock).
- Aucun framework de test / lint (pas de package.json).

## 7. État Git

- Dernier commit : **`0747f6c`** « Admin connecté à Supabase : login/gate admin, produits, catégories, commandes, coupons, clients, stock, dashboard » — **poussé sur `main`**.
- Tout est commité (working tree propre sauf si nouvelles modifs).

---

## 8. PROCHAINES ÉTAPES (à faire côté utilisateur — bloque les tests)

1. **Ré-exécuter `supabase_schema.sql`** dans l'éditeur SQL Supabase (applique les changements admin : promotion rôle, `admin_update_order_status`, policy `users_admin`).
2. **Désactiver « Confirm email »** (option choisie) : Supabase Dashboard → Authentication → Providers → Email → décocher « Confirm email ». → permet une inscription immédiate sans email.
3. **Créer le compte admin** `admin@pixelstore.bi` + mot de passe de démo (via S'inscrire sur le site, ou via l'API si demandé).
4. **Vérifier que le rôle = admin** : soit par le schéma (étape 1), soit par l'UPDATE SQL :
   ```sql
   UPDATE public.users SET role = 'admin'
   WHERE lower(email) = lower('admin@pixelstore.bi');
   ```
5. **Tester le flux** : connexion admin → ajout de produit → visible dans le catalogue.

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
