// ==========================================================================
// PIXELSTORE — PANEL ADMIN : COUCHE SUPABASE PARTAGÉE
// Charge le client supabase-js, fournit l'authentification admin (vérifie le
// rôle admin en base) et des helpers de lecture/écriture pour chaque table.
// Chaque page admin l'utilise via adminGate() pour protéger l'accès.
// ==========================================================================

(function () {
  var CFG = window.ADMIN_CONFIG || {};

  // ---- Client supabase ----
  var adminSupabase = null;
  var adminReady = false;

  function init() {
    var CDN_SOURCES = [
      'vendor/supabase.min.js',
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
      'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js'
    ];

    // Le build UMD expose l'API sur window.supabase (createClient y est une
    // propriété). Certaines anciennes sources fournissent createClient en
    // fonction globale : on couvre les deux cas.
    function getCreateClient() {
      if (typeof window.supabase === 'object' && typeof window.supabase.createClient === 'function') {
        return window.supabase.createClient;
      }
      if (typeof createClient === 'function') return createClient;
      return null;
    }

    function tryCreate() {
      try {
        var create = getCreateClient();
        if (!create) return false;
        adminSupabase = create(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
        window.adminSupabase = adminSupabase;
        adminReady = true;
        resolveReady();
        return true;
      } catch (e) {
        console.error('Init admin Supabase :', e);
        return false;
      }
    }

    function loadFrom(i) {
      if (getCreateClient()) { tryCreate(); return; }
      if (i >= CDN_SOURCES.length) {
        console.error('Impossible de charger le SDK supabase-js (aucune source).');
        resolveReady();
        return;
      }
      var s = document.createElement('script');
      s.src = CDN_SOURCES[i];
      s.onload = function () {
        if (!tryCreate()) loadFrom(i + 1);
      };
      s.onerror = function () {
        console.error('SDK supabase-js indisponible depuis :', CDN_SOURCES[i]);
        loadFrom(i + 1);
      };
      document.head.appendChild(s);
    }

    if (getCreateClient()) {
      tryCreate();
    } else {
      loadFrom(0);
    }
  }

  var readyResolvers = [];
  var settled = false;
  function resolveReady() {
    if (settled) return;
    settled = true;
    readyResolvers.forEach(function (fn) { fn(); });
    readyResolvers = [];
  }
  function whenReady(timeout) {
    timeout = timeout || 6000;
    return new Promise(function (resolve) {
      if (settled) { resolve(adminSupabase); return; }
      readyResolvers.push(function () { resolve(adminSupabase); });
      setTimeout(function () { if (!settled) { settled = true; readyResolvers = []; resolve(adminSupabase); } }, timeout);
    });
  }

  // ---- Auth ----
  var adminUser = null;         // { user, isAdmin }
  var authListeners = [];

  function notifyListeners() {
    authListeners.forEach(function (fn) { try { fn(adminUser); } catch (e) {} });
  }

  async function refreshSession() {
    if (!adminSupabase) return adminUser;
    var u = await adminSupabase.auth.getUser();
    var user = u && u.data && u.data.user ? u.data.user : null;
    var isAdmin = false;
    if (user) {
      var { data } = await adminSupabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      isAdmin = data && data.role === 'admin';
    }
    adminUser = user ? { user: user, isAdmin: isAdmin, email: user.email } : null;
    updateHeaderUser();
    notifyListeners();
    return adminUser;
  }

  async function signIn(email, password) {
    if (!adminSupabase) throw new Error('Service indisponible.');
    var { data, error } = await adminSupabase.auth.signInWithPassword({ email: email, password: password });
    if (error) throw new Error(friendly(error));
    await refreshSession();
    return adminUser;
  }

  async function signOut() {
    if (adminSupabase) await adminSupabase.auth.signOut();
    adminUser = null;
    updateHeaderUser();
    notifyListeners();
  }

  function friendly(err) {
    var m = (err && err.message) || 'Erreur.';
    var t = String(m).toLowerCase();
    if (/invalid login/i.test(t)) return 'E-mail ou mot de passe incorrect.';
    if (/email not confirmed/i.test(t)) return 'E-mail non confirmé. Vérifiez votre boîte mail.';
    return m;
  }

  function onAuthChange(fn) { authListeners.push(fn); }

  // ---- Sidebar / topbar : user / logout ----
  function updateHeaderUser() {
    var nameEls = document.querySelectorAll('.sidebar-user-info strong');
    var emailEls = document.querySelectorAll('.sidebar-user-info span');
    if (nameEls.length) nameEls[0].textContent = adminUser ? (adminUser.user.user_metadata && (adminUser.user.user_metadata.full_name || adminUser.user.user_metadata.name)) || 'Administrateur' : 'Non connecté';
    if (emailEls.length) emailEls[0].textContent = adminUser ? adminUser.email : '—';
  }

  // ==========================================================================
  // HELPERS DE LECTURE / ÉCRITURE (tableaux)
  // ==========================================================================
  var adminDB = {
    async products(opts) {
      if (!adminSupabase) return [];
      // Les images (image_url) sont des data URI base64 parfois énormes : on ne
      // les charge PAS dans les listings (page produits, stock) pour ne pas
      // saturer le réseau. La version complète (avec image) est obtenue au cas
      // par cas via productById() pour l'édition.
      var q = adminSupabase.from('products')
        .select('id, name, slug, reference, tag, price, old_price, rating, description, is_active, brand:brand_id(name), category:category_id(slug, name), stock:stock(quantity)')
        .order('id');
      if (opts && opts.page && opts.pageSize) {
        var start = (opts.page - 1) * opts.pageSize;
        q = q.range(start, start + opts.pageSize - 1);
      }
      var { data, error } = await q;
      if (error) throw error;
      return (data || []).map(function (p) {
        return {
          id: p.id, name: p.name, reference: p.reference, tag: p.tag, price: Number(p.price) || 0,
          oldPrice: p.old_price != null ? Number(p.old_price) : null, rating: Number(p.rating) || 0,
          description: p.description || '', active: !!p.is_active,
          brand: (p.brand && p.brand.name) || 'PixelStore',
          category: (p.category && p.category.slug) || 'ordinateurs',
          categoryName: (p.category && p.category.name) || '',
          stock: (p.stock && p.stock.length ? p.stock[0].quantity : 0) || 0,
          image: ''
        };
      });
    },

    async countProducts() {
      if (!adminSupabase) return 0;
      var { count, error } = await adminSupabase.from('products').select('id', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },

    // Charge UN produit complet (avec son image principale) pour l'édition.
    // Utile car product_images.image_url peut être un data URI base64 énorme :
    // on ne récupère que le produit demandé, pas toute la galerie.
    async productById(id) {
      if (!adminSupabase) return null;
      var { data, error } = await adminSupabase.from('products')
        .select('id, name, slug, reference, tag, price, old_price, rating, description, is_active, is_featured, brand:brand_id(name), category:category_id(slug, name), stock:stock(quantity), images:product_images(image_url, sort_order, is_main)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      var main = (data.images || []).slice().sort(function (a, b) {
        return (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0) || a.sort_order - b.sort_order;
      })[0];
      return {
        id: data.id, name: data.name, reference: data.reference, tag: data.tag,
        price: Number(data.price) || 0,
        oldPrice: data.old_price != null ? Number(data.old_price) : null,
        rating: Number(data.rating) || 0, description: data.description || '',
        active: !!data.is_active, featured: !!data.is_featured,
        brand: (data.brand && data.brand.name) || 'PixelStore',
        category: (data.category && data.category.slug) || 'ordinateurs',
        categoryName: (data.category && data.category.name) || '',
        stock: (data.stock && data.stock.length ? data.stock[0].quantity : 0) || 0,
        image: (main && main.image_url) || ''
      };
    },

    async categories() {
      if (!adminSupabase) return [];
      var { data, error } = await adminSupabase.from('categories')
        .select('id, name, slug, is_active')
        .order('name');
      if (error) throw error;
      return data || [];
    },

    async coupons() {
      if (!adminSupabase) return [];
      var { data, error } = await adminSupabase.from('coupons')
        .select('id, code, discount_type, discount_value, min_order_amount, max_uses, times_used, starts_at, expires_at, is_active')
        .order('id');
      if (error) throw error;
      return data || [];
    },

    async orders() {
      if (!adminSupabase) return [];
      var { data, error } = await adminSupabase.from('orders')
        .select('id, order_number, status, payment_status, payment_method, subtotal, shipping_cost, discount_total, grand_total, customer_notes, created_at, user_id, items:order_items(product_name, quantity, unit_price), user:users(email)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async customers() {
      if (!adminSupabase) return [];
      var { data, error } = await adminSupabase.from('users')
        .select('id, email, first_name, last_name, phone, role, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async stockStatus() {
      if (!adminSupabase) return [];
      var { data, error } = await adminSupabase.from('products')
        .select('id, name, reference, stock:stock(quantity, low_stock_threshold)')
        .order('name');
      if (error) throw error;
      return (data || []).map(function (p) {
        var s = (p.stock && p.stock[0]) || { quantity: 0, low_stock_threshold: 5 };
        return { id: p.id, name: p.name, reference: p.reference, quantity: s.quantity || 0, threshold: s.low_stock_threshold || 5 };
      });
    },

    async dashboardStats() {
      if (!adminSupabase) return {};
      var totals = { products: 0, orders: 0, revenue: 0, customers: 0, lowStock: 0 };
      try {
        var p = await adminSupabase.from('products').select('id').eq('is_active', true);
        totals.products = (p.data || []).length;
        var o = await adminSupabase.from('orders').select('id, grand_total, status');
        totals.orders = (o.data || []).length;
        totals.revenue = (o.data || []).reduce(function (s, r) { return s + (Number(r.grand_total) || 0); }, 0);
        var u = await adminSupabase.from('users').select('id');
        totals.customers = (u.data || []).length;
        var st = await adminSupabase.from('stock').select('product_id, quantity, low_stock_threshold');
        totals.lowStock = (st.data || []).filter(function (r) { return (Number(r.quantity) || 0) <= (Number(r.low_stock_threshold) || 5); }).length;
      } catch (e) { /* sous-comptage */ }
      return totals;
    }
  };

  // ==========================================================================
  // ÉCRITURES — produits, catégories, coupons, stock
  // ==========================================================================
  async function resolveBrand(name) {
    name = (name || '').trim() || 'PixelStore';
    var slug = slugify(name);
    var { data, error } = await adminSupabase.from('brands').select('id').eq('slug', slug).maybeSingle();
    if (data) return data.id;
    var ins = await adminSupabase.from('brands').insert({ name: name, slug: slug }).select('id').single();
    return ins.data ? ins.data.id : null;
  }

  async function resolveCategory(slug) {
    slug = (slug || 'ordinateurs').trim() || 'ordinateurs';
    var { data, error } = await adminSupabase.from('categories').select('id').eq('slug', slug).maybeSingle();
    if (data) return data.id;
    return null;
  }

  async function saveProduct(obj) {
    var p = obj || {};
    var slug = slugify(p.slug || p.name);
    var brandId = await resolveBrand(p.brand);
    var catId = await resolveCategory(p.category);
    var price = Number(p.price) || 0;

    // Référence (SKU) unique : une référence déjà portée par un autre produit
    // lève une vraie violation products_reference_key -> on prévient avec un
    // message clair. En édition, on ignore le produit courant.
    if (p.reference) {
      var refCheck = await adminSupabase.from('products')
        .select('id').eq('reference', p.reference).maybeSingle();
      if (refCheck.error) throw refCheck.error;
      if (refCheck.data && refCheck.data.id !== p.id) {
        throw new Error('Cette référence existe déjà. Choisissez une référence unique.');
      }
    }

    // Slug unique : le slug du nouveau produit doit être libre. En cas de
    // collision on désambiguïse automatiquement (base, base-2, base-3...).
    var baseSlug = slug;
    var suffix = 1;
    while (true) {
      var slugCheck = await adminSupabase.from('products')
        .select('id').eq('slug', slug).maybeSingle();
      if (slugCheck.error) throw slugCheck.error;
      if (!slugCheck.data || slugCheck.data.id === p.id) break;
      suffix += 1;
      slug = baseSlug + '-' + suffix;
    }

    var payload = {
      name: p.name,
      slug: slug,
      reference: p.reference,
      category_id: catId,
      brand_id: brandId,
      tag: p.tag || null,
      description: p.description || null,
      price: price,
      old_price: p.oldPrice ? Number(p.oldPrice) : null,
      rating: Number(p.rating) || 0,
      is_active: !!p.active,
      is_featured: !!p.featured
    };
    var productId;
    if (p.id) {
      productId = p.id;
      await adminSupabase.from('products').update(payload).eq('id', p.id);
    } else {
      var ins = await adminSupabase.from('products').insert(payload).select('id').single();
      // La séquence products_id_seq peut ne pas avoir avancé (les seeds
      // insèrent avec des id explicites) : un nouvel insert sans id repartirait
      // de 1 et violerait la clé primaire. On réessaie alors avec un id libre.
      if (ins.error && String(ins.error.message || '').indexOf('products_pkey') !== -1) {
        var maxRow = await adminSupabase.from('products')
          .select('id').order('id', { ascending: false }).limit(1).maybeSingle();
        var nextId = (maxRow.data && maxRow.data.id ? maxRow.data.id : 0) + 1;
        var ins2 = await adminSupabase.from('products')
          .insert(Object.assign({}, payload, { id: nextId }))
          .select('id').single();
        if (ins2.error) throw ins2.error;
        ins = ins2;
      } else if (ins.error) {
        throw ins.error;
      }
      productId = ins.data.id;
    }

    // Image(s) principale(s)
    if (p.image) {
      await adminSupabase.from('product_images').delete().eq('product_id', productId);
      await adminSupabase.from('product_images').insert({ product_id: productId, image_url: p.image, sort_order: 0, is_main: true });
    }

    // Spécifications
    await adminSupabase.from('product_specs').delete().eq('product_id', productId);
    var specs = (p.specs || []).filter(function (s) { return s && s[0] && s[1]; });
    // Dédoublonne par label (contrainte uq_spec UNIQUE (product_id, label)) :
    // garde la première occurrence, ignore les suivantes.
    var seenLabels = {};
    specs = specs.filter(function (s) {
      var k = String(s[0]).trim().toLowerCase();
      if (seenLabels[k]) return false;
      seenLabels[k] = true;
      return true;
    });
    if (specs.length) {
      await adminSupabase.from('product_specs').insert(specs.map(function (s, i) {
        return { product_id: productId, label: s[0], value: s[1], sort_order: i };
      }));
    }

    // Stock (upsert)
    var qty = Math.max(0, parseInt(p.stock, 10) || 0);
    await adminSupabase.from('stock').upsert({ product_id: productId, quantity: qty });

    return productId;
  }

  async function deleteProduct(id) {
    await adminSupabase.from('products').delete().eq('id', id);
  }

  async function saveCategory(obj) {
    var c = obj || {};
    var slug = slugify(c.slug || c.name);
    if (c.id) {
      await adminSupabase.from('categories').update({ name: c.name, slug: slug, parent_id: c.parent_id || null }).eq('id', c.id);
      return c.id;
    }
    var ins = await adminSupabase.from('categories').insert({ name: c.name, slug: slug, parent_id: c.parent_id || null }).select('id').single();
    if (ins.error) throw ins.error;
    return ins.data.id;
  }

  async function deleteCategory(id) {
    await adminSupabase.from('categories').delete().eq('id', id);
  }

  async function saveCoupon(obj) {
    var c = obj || {};
    var payload = {
      code: (c.code || '').toUpperCase(),
      discount_type: c.discount_type,
      discount_value: Number(c.discount_value) || 0,
      min_order_amount: c.min_order_amount ? Number(c.min_order_amount) : null,
      max_uses: c.max_uses ? Number(c.max_uses) : null,
      is_active: !!c.is_active
    };
    if (c.id) {
      await adminSupabase.from('coupons').update(payload).eq('id', c.id);
      return c.id;
    }
    var ins = await adminSupabase.from('coupons').insert(payload).select('id').single();
    if (ins.error) throw ins.error;
    return ins.data.id;
  }

  async function deleteCoupon(id) {
    await adminSupabase.from('coupons').delete().eq('id', id);
  }

  async function updateStock(productId, quantity) {
    var qty = Math.max(0, parseInt(quantity, 10) || 0);
    var { data, error } = await adminSupabase.from('stock').upsert({ product_id: productId, quantity: qty });
    if (error) throw error;
  }

  async function updateOrderStatus(orderId, status) {
    var { error } = await adminSupabase.rpc('admin_update_order_status', { p_order_id: orderId, p_status: status });
    if (error) throw error;
  }

  function slugify(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Résout une URL d'image pour l'affichage depuis le panneau admin (/admin/...).
  // Les chemins relatifs stockés (ex. "img/products/x.jpg") pointent vers la
  // racine du site ; sous /admin/ il faut remonter d'un niveau ("../img/...").
  // Les URL absolues, data: et les chemins racine ("/...") sont laissés tels quels.
  function resolveAdminImage(url) {
    if (!url) return '';
    if (/^https?:\/\//i.test(url) || /^data:/i.test(url) || url.charAt(0) === '/') return url;
    return '../' + url;
  }

  // ==========================================================================
  // GATE : écran de connexion admin + protection du contenu
  // ==========================================================================
  // usage : adminGate(contentElement, async () => { ...rendu de la page... })
  function adminGate(contentEl, onAuthenticated) {
    if (!contentEl) return;

    function renderLogin() {
      contentEl.innerHTML = '';
      var box = document.createElement('div');
      box.style.cssText = 'max-width:420px;margin:40px auto;background:var(--bg-card);border:1px solid var(--border-color);border-radius:16px;padding:32px;';
      box.innerHTML =
        '<div style="text-align:center;margin-bottom:20px">' +
          '<div style="font-size:13px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.5px">Administration</div>' +
          '<h2 style="margin:6px 0;color:var(--text-primary);font-size:22px">Connexion requise</h2>' +
          '<p style="color:var(--text-secondary);font-size:13px;margin:0">Réservé au compte administrateur.</p>' +
        '</div>' +
        '<div class="admin-login-error" style="background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;border-radius:8px;padding:8px 12px;font-size:13px;margin-bottom:14px;display:none"></div>' +
        '<div style="margin-bottom:14px;"><label style="display:block;font-size:13px;margin-bottom:6px;color:var(--text-primary)">Adresse e-mail</label>' +
          '<input id="adminEmail" type="email" style="width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid var(--border-color);border-radius:10px;background:var(--bg-primary);color:var(--text-primary);font-size:14px" placeholder="admin@..."></div>' +
        '<div style="margin-bottom:18px;"><label style="display:block;font-size:13px;margin-bottom:6px;color:var(--text-primary)">Mot de passe</label>' +
          '<input id="adminPassword" type="password" style="width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid var(--border-color);border-radius:10px;background:var(--bg-primary);color:var(--text-primary);font-size:14px" placeholder="••••••••"></div>' +
        '<button id="adminLoginBtn" style="width:100%;padding:12px;border:none;border-radius:10px;background:var(--accent-green,#10b981);color:#fff;font-weight:700;font-size:14px;cursor:pointer">Se connecter</button>' +
        '<p style="text-align:center;margin-top:16px;font-size:12px;color:var(--text-secondary)">Retour à la boutique : <a href="../index.html" style="color:var(--accent-green)">PixelStore</a></p>';

      contentEl.appendChild(box);

      var errEl = box.querySelector('.admin-login-error');
      var emailEl = box.querySelector('#adminEmail');
      var pwdEl = box.querySelector('#adminPassword');

      function submit() {
        var email = emailEl.value.trim().toLowerCase();
        var pwd = pwdEl.value;
        if (!email || !pwd) { errEl.textContent = 'Renseignez l\'e-mail et le mot de passe.'; errEl.style.display = 'block'; return; }
        errEl.style.display = 'none';
        var btn = box.querySelector('#adminLoginBtn');
        btn.disabled = true; btn.textContent = 'Connexion…';
        signIn(email, pwd)
          .then(function (res) {
            if (!res || !res.isAdmin) { btn.disabled = false; btn.textContent = 'Se connecter'; errEl.textContent = 'Ce compte n\'est pas administrateur.'; errEl.style.display = 'block'; signOut(); return; }
            renderAuthed();
          })
          .catch(function (e) {
            btn.disabled = false; btn.textContent = 'Se connecter';
            errEl.textContent = (e && e.message) || 'Erreur.';
            errEl.style.display = 'block';
          });
      }

      box.querySelector('#adminLoginBtn').addEventListener('click', submit);
      emailEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
      pwdEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    }

    function renderDenied() {
      contentEl.innerHTML = '';
      var box = document.createElement('div');
      box.style.cssText = 'max-width:420px;margin:40px auto;background:var(--bg-card);border:1px solid var(--border-color);border-radius:16px;padding:32px;text-align:center';
      box.innerHTML =
        '<h2 style="color:var(--text-primary);font-size:20px;margin-bottom:8px">Accès refusé</h2>' +
        '<p style="color:var(--text-secondary);font-size:14px;margin-bottom:20px">Ce compte est connecté mais ne possède pas le rôle administrateur.</p>' +
        '<a href="../index.html" class="btn btn-secondary" style="text-decoration:none">Retour à la boutique</a>';
      contentEl.appendChild(box);
    }

    function renderAuthed() {
      Promise.resolve()
        .then(function () { return onAuthenticated ? onAuthenticated() : null; })
        .catch(function (e) {
          contentEl.innerHTML = '';
          var box = document.createElement('div');
          box.style.cssText = 'max-width:420px;margin:40px auto;background:var(--bg-card);border:1px solid var(--border-color);border-radius:16px;padding:32px;text-align:center';
          box.innerHTML = '<h2 style="color:var(--text-primary);font-size:18px">Erreur de chargement</h2><p style="color:var(--text-secondary);font-size:13px">' + ((e && e.message) || 'Problème de connexion à la base.') + '</p>';
          contentEl.appendChild(box);
        });
    }

    function start() {
      refreshSession().then(function (u) {
        if (u && u.isAdmin) renderAuthed();
        else if (u && u.user) renderDenied();
        else renderLogin();
      });
    }

    // Relance automatiquement après connexion via l'écran de connexion.
    whenReady().then(function () { start(); });
  }

  // Expose
  window.adminSupabase = adminSupabase;
  window.adminReady = adminReady;
  window.adminAuth = {
    getUser: function () { return adminUser; },
    refresh: refreshSession,
    signIn: signIn,
    signOut: signOut,
    onAuthChange: onAuthChange,
    ready: whenReady
  };
  window.adminDB = adminDB;
  adminDB.saveProduct = saveProduct;
  adminDB.deleteProduct = deleteProduct;
  adminDB.saveCategory = saveCategory;
  adminDB.deleteCategory = deleteCategory;
  adminDB.saveCoupon = saveCoupon;
  adminDB.deleteCoupon = deleteCoupon;
  adminDB.updateStock = updateStock;
  adminDB.updateOrderStatus = updateOrderStatus;
  adminDB.slugify = slugify;
  window.adminGate = adminGate;
  window.adminConfig = CFG;
  window.adminResolveImage = resolveAdminImage;

  init();
})();
