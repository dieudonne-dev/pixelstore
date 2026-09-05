// ==========================================================================
// PIXELSTORE — COUCHE D'ACCÈS AUX DONNÉES (Supabase)
// Fournit des fonctions asynchrones qui chargent les données depuis la base
// Supabase (via l'instance globale `supabase` définie dans supabase-config.js)
// et les mappent vers le format attendu par le frontend existant.
//
// Chaque fonction "get*" renvoie une Promise. En cas de problème (SDK non
// chargé, RLS, réseau), on bascule automatiquement sur les données statiques
// locales (js/products.js, js/data.js) afin de ne jamais casser le site.
// ==========================================================================

// Normalise toutes les images : les URLs relatives pointent vers les fichiers
// locaux du dépôt, les URLs absolues (stockage Supabase) sont laissées telles.
function resolveAsset(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || /^data:/i.test(url)) return url;
  return url;
}

// Attend que le SDK supabase-js soit chargé (ou qu'il ait échoué / time out).
// Permet aux fonctions "get*" de savoir si l'on peut interroger la base.
function waitForSupabase(timeoutMs) {
  var timeout = timeoutMs || 4000;
  return new Promise(function (resolve) {
    if (typeof supabase !== 'undefined' && supabaseReady) {
      resolve(supabase);
      return;
    }
    var done = false;
    var finish = function () { if (!done) { done = true; resolve(typeof supabase !== 'undefined' ? supabase : null); } };
    document.addEventListener('supabase:ready', finish, { once: true });
    setTimeout(finish, timeout);
  });
}

// Préfixe d'URL du bucket de stockage (pour les images téléversées).
function storageUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path) || /^data:/i.test(path)) return path;
  return path; // laisse les chemins relatifs/statiques tels quels
}

// Récupère les catégories depuis Supabase.
async function getCategories() {
  const client = await waitForSupabase();
  if (client && supabaseReady) {
    try {
      const { data, error } = await client
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');
      if (!error && Array.isArray(data) && data.length) {
        return data;
      }
    } catch (e) {
      console.warn('Supabase indisponible (catégories), utilisation des données locales.', e);
    }
  }
  // Repli : catégories locales (déduites du catalogue statique)
  const seen = {};
  const local = [];
  (typeof products !== 'undefined' ? products : []).forEach((p) => {
    if (p.category && !seen[p.category]) {
      seen[p.category] = true;
      local.push({ id: local.length + 1, name: p.category, slug: p.category });
    }
  });
  return local;
}

// Charge le catalogue public (pour catalogue.html) depuis Supabase,
// mappé au format attendu par filters.js/renderProducts.
// Format cible : { id, name, category, brand, price, oldPrice, image, inStock, rating }
async function getCatalogProducts() {
  const client = await waitForSupabase();
  if (client && supabaseReady) {
    try {
      // On charge produits + liaison stock, puis on assemble côté client.
      const { data: rows, error } = await client
        .from('products')
        .select(`
          id, name, slug, price, old_price, rating,
          brand:brand_id ( name ),
          category:category_id ( name, slug ),
          stock:stock ( quantity, reserved_quantity ),
          images:product_images ( image_url, sort_order, is_main )
        `)
        .eq('is_active', true)
        .order('id');

      if (!error && Array.isArray(rows) && rows.length) {
        return rows.map((p) => {
          const stockRaw = Array.isArray(p.stock) ? (p.stock[0] || null) : p.stock;
          const available = stockRaw
            ? (Number(stockRaw.quantity) || 0) - (Number(stockRaw.reserved_quantity) || 0)
            : 999;
          const mainImage =
            (p.images && p.images.slice().sort((a, b) => a.sort_order - b.sort_order)[0]);
          return {
            id: p.id,
            name: p.name,
            category: (p.category && (p.category.slug || p.category.name)) || 'ordinateurs',
            brand: (p.brand && p.brand.name) || 'PixelStore',
            price: Number(p.price) || 0,
            oldPrice: p.old_price != null ? Number(p.old_price) : null,
            image: resolveAsset(mainImage ? mainImage.image_url : ''),
            inStock: available > 0,
            stock: available,
            rating: Number(p.rating) || 0
          };
        });
      }
    } catch (e) {
      console.warn('Supabase indisponible (catalogue), utilisation des données locales.', e);
    }
  }
  // Repli : catalogue statique local (products.js)
  return Array.isArray(products) ? products.map((p) => ({ ...p })) : [];
}

// Charge les produits "maison" PixelStore (pour index.html / produit.html)
// au format riche attendu par fiche.js : gallery, specs, cert, stock, warranty...
async function getStoreProducts() {
  const client = await waitForSupabase();
  if (client && supabaseReady) {
    try {
      const { data: rows, error } = await client
        .from('products')
        .select(`
          id, name, slug, reference, tag, description, price, old_price, rating, warranty,
          brand:brand_id ( name ),
          gallery:product_images ( image_url, sort_order ),
          specs:product_specs ( label, value, sort_order ),
          cert:product_certificates ( title, number, authority, cert_date, points ),
          stock:stock ( quantity )
        `)
        .eq('is_active', true)
        .order('id');

      if (!error && Array.isArray(rows) && rows.length) {
        return rows.map((p) => {
          const gallery = (p.gallery || [])
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((g) => resolveAsset(g.image_url));
          const specs = (p.specs || [])
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((s) => [s.label, s.value]);
          const cert = p.cert && p.cert.length ? p.cert[0] : null;
          return {
            id: p.id,
            name: p.name,
            brand: (p.brand && p.brand.name) || 'PixelStore',
            tag: p.tag || '',
            reference: p.reference,
            price: Number(p.price) || 0,
            oldPrice: p.old_price != null ? Number(p.old_price) : null,
            rating: Number(p.rating) || 0,
            image: gallery[0] || resolveAsset(''),
            gallery: gallery.length ? gallery : [gallery[0] || ''],
            desc: p.description || '',
            stock: (Array.isArray(p.stock) ? (p.stock[0] && p.stock[0].quantity) : (p.stock && p.stock.quantity)) || 0,
            warranty: p.warranty || '',
            preview: p.tag || '',
            cert: cert
              ? {
                  title: cert.title || '',
                  number: cert.number || '',
                  authority: cert.authority || '',
                  date: cert.cert_date || '',
                  points: Array.isArray(cert.points) ? cert.points : []
                }
              : null,
            specs: specs.length ? specs : [['', '']]
          };
        });
      }
    } catch (e) {
      console.warn('Supabase indisponible (store), utilisation des données locales.', e);
    }
  }
  // Repli : données "maison" statiques locales (data.js)
  // N.B. les objets locaux sont partagés avec le shop : on les clone.
  return Array.isArray(pixelProducts)
    ? pixelProducts.map((p) => ({
        ...p,
        gallery: Array.isArray(p.gallery) ? p.gallery.slice() : [p.image],
        cert: p.cert ? { ...p.cert } : null,
        specs: Array.isArray(p.specs) ? p.specs.map((s) => [s[0], s[1]]) : []
      }))
    : [];
}

// Charge une fiche produit précise (pour produit.html) en filtrant côté client.
async function getStoreProductById(id) {
  const list = await getStoreProducts();
  return (list.find((p) => p.id === Number(id)) || null);
}

// Récupère l'utilisateur Supabase courant (null si non connecté).
async function getCurrentUser() {
  const client = await waitForSupabase();
  if (client && supabaseReady) {
    const { data } = await client.auth.getUser();
    return data && data.user ? data.user : null;
  }
  return null;
}

// ==========================================================================
// PANIER EN BASE (carts / cart_items) — utilisé quand un utilisateur est
// connecté. Le panier "localStorage" (cart.js) reste la source d'entrée ;
// on le synchronise vers la base pour que create_order puisse le lire.
// Toutes ces fonctions échouent silencieusement si personne n'est connecté
// (aucune erreur ne bloque le site).
// ==========================================================================

// Renvoie l'id du panier de l'utilisateur connecté, en le créant si besoin.
async function getOrCreateCart() {
  const user = await getCurrentUser();
  if (!user) return null;
  const client = await waitForSupabase();
  if (!client) return null;

  // Tente de récupérer le panier existant.
  const { data: existing } = await client
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (existing && existing.id) return existing.id;

  // Sinon, on en crée un (la colonne user_id est UNIQUE, RLS autorise).
  const { data, error } = await client
    .from('carts')
    .insert({ user_id: user.id })
    .select('id')
    .single();
  if (error || !data) return null;
  return data.id;
}

// Synchronise le panier localStorage vers la base (upsert des lignes).
async function syncCartToDb() {
  const user = await getCurrentUser();
  if (!user) return;
  const cartId = await getOrCreateCart();
  if (!cartId) return;

  let cart = [];
  try { cart = JSON.parse(localStorage.getItem('pixelstore_cart') || '[]'); } catch (e) { cart = []; }
  if (!cart.length) return;

  const client = await waitForSupabase();
  if (!client) return;

  const rows = cart.map((item) => ({
    cart_id: cartId,
    product_id: Number(item.id),
    quantity: Number(item.quantity) || 1
  }));

  await client
    .from('cart_items')
    .upsert(rows, { onConflict: 'cart_id,product_id' });
}

// Charge le panier depuis la base (pour restaurer un panier après connexion).
async function loadCartFromDb() {
  const user = await getCurrentUser();
  if (!user) return null;
  const client = await waitForSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from('cart_items')
    .select('product_id, quantity')
    .eq('cart_id', (await getOrCreateCart()) || '__none__');
  if (error || !Array.isArray(data)) return null;

  // Enrichit chaque ligne avec les infos produit nécessaires au panier.
  const detail = await getCatalogProducts();
  const byId = {};
  (detail || []).forEach((p) => { byId[p.id] = p; });

  return data
    .map((row) => {
      const p = byId[Number(row.product_id)];
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        quantity: Number(row.quantity) || 1
      };
    })
    .filter(Boolean);
}
