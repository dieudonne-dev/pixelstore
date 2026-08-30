// ==========================================================================
// PIXELSTORE — PANEL ADMINISTRATEUR
// Script partagé : thème, menu mobile, helpers, toast + base de données
// de démonstration (produits, commandes, clients, catégories, stock).
// En conditions réelles, ces données proviendraient de l'API / MySQL.
// ==========================================================================

// --------------------------------------------------------------------------
// THÈME CLAIR / SOMBRE
// --------------------------------------------------------------------------
function initAdminTheme() {
  const html = document.documentElement;
  const saved = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', saved);

  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      html.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }
}

// --------------------------------------------------------------------------
// MENU LATÉRAL (mobile)
// --------------------------------------------------------------------------
function initAdminSidebar() {
  const toggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.querySelector('.sidebar-backdrop');

  const open = () => {
    if (sidebar) sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
  };
  const close = () => {
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
  };

  if (toggle) toggle.addEventListener('click', open);
  if (backdrop) backdrop.addEventListener('click', close);

  // Ferme après clic sur un lien (mobile)
  document.querySelectorAll('.sidebar a').forEach((a) => {
    a.addEventListener('click', close);
  });
}

// --------------------------------------------------------------------------
// HELPERS GÉNÉRAUX
// --------------------------------------------------------------------------
function formatPrice(n) {
  return Number(n).toLocaleString('fr-FR') + ' BIF';
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function initials(fullName) {
  return fullName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Barre de recherche globale (topbar) : redirige vers les produits avec la requête
function initGlobalSearch() {
  const input = document.getElementById('globalSearch');
  if (!input) return;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      window.location.href = 'produits.html?q=' + encodeURIComponent(input.value.trim());
    }
  });
}

// Bouton déconnexion : retour au site public
function initSidebarLogout() {
  const logout = document.querySelector('.logout-btn');
  if (logout) {
    logout.addEventListener('click', () => window.location.href = '../index.html');
  }
}

// --------------------------------------------------------------------------
// NOTIFICATIONS (cloche dans la topbar)
// --------------------------------------------------------------------------
function initNotifications() {
  const trigger = document.querySelector('.topbar-actions .topbar-icon[title="Notifications"]');
  if (!trigger) return;

  const items = [
    { icon: ICONS.orders, text: 'Nouvelle commande <strong>PS-20260829-001</strong>', time: 'il y a 15 min', type: 'green' },
    { icon: ICONS.products, text: 'Produit <strong>PixelGPU RTX 4070</strong> mis à jour', time: 'il y a 1 h', type: 'blue' },
    { icon: ICONS.customers, text: 'Nouveau client <strong>Chantal Irankunda</strong>', time: 'il y a 3 h', type: 'blue' },
    { icon: ICONS.stock, text: 'Stock faible : <strong>PixelGPU RTX 4070</strong>', time: 'il y a 5 h', type: 'red' },
    { icon: ICONS.coupons, text: 'Code promo <strong>VIPPIXEL</strong> créé', time: 'hier', type: 'violet' }
  ];

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    let panel = document.querySelector('.notif-panel');
    if (panel) {
      panel.remove();
      return;
    }

    panel = document.createElement('div');
    panel.className = 'notif-panel';
    panel.innerHTML = `
      <div class="notif-header">
        <strong>Notifications</strong>
        <span>${items.length} non lues</span>
      </div>
      <div class="notif-list">
        ${items.map(n => `
          <div class="notif-item">
            <div class="notif-icon ${n.type}">${n.icon}</div>
            <div class="notif-body">
              <p>${n.text}</p>
              <span>${n.time}</span>
            </div>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-ghost btn-sm notif-mark">Tout marquer comme lu</button>
    `;
    document.body.appendChild(panel);

    // Positionne le panneau sous la cloche
    const rect = trigger.getBoundingClientRect();
    panel.style.top = (rect.bottom + 8) + 'px';
    panel.style.right = (window.innerWidth - rect.right) + 'px';

    // Retire le point rouge
    const dot = trigger.querySelector('.badge-dot');
    if (dot) dot.style.display = 'none';

    panel.querySelector('.notif-mark').addEventListener('click', (e) => {
      e.stopPropagation();
      panel.remove();
      const badge = trigger.querySelector('.badge-dot');
      if (badge) badge.style.display = 'none';
      showToast('Toutes les notifications ont été marquées comme lues.');
    });
  });

  // Ferme le panneau au clic ailleurs / Échap
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.notif-panel') && !e.target.closest('.topbar-actions .topbar-icon[title="Notifications"]')) {
      const panel = document.querySelector('.notif-panel');
      if (panel) panel.remove();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const panel = document.querySelector('.notif-panel');
      if (panel) panel.remove();
    }
  });
}

// --------------------------------------------------------------------------
// TOAST / NOTIFICATIONS
// --------------------------------------------------------------------------
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast ' + (type === 'error' ? 'error' : type === 'warning' ? 'warning' : '');
  toast.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2" style="color:var(--accent-green)">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    <span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// --------------------------------------------------------------------------
// BASE DE DONNÉES DE DÉMONSTRATION
// --------------------------------------------------------------------------

// Catégories (alignées sur les filtres du site)
const adminCategories = [
  { id: 1, name: 'Ordinateurs', slug: 'ordinateurs', count: 2, icon: 'laptop' },
  { id: 2, name: 'Claviers', slug: 'claviers', count: 2, icon: 'keyboard' },
  { id: 3, name: 'Souris', slug: 'souris', count: 2, icon: 'mouse' },
  { id: 4, name: 'Écrans', slug: 'ecrans', count: 2, icon: 'monitor' },
  { id: 5, name: 'Casques', slug: 'casques', count: 2, icon: 'headphones' },
  { id: 6, name: 'Composants', slug: 'composants', count: 2, icon: 'cpu' }
];

// Produits (repris et enrichis depuis pixelProducts / products)
// Données de démonstration par défaut — servent de semence au premier lancement.
const DEFAULT_ADMIN_PRODUCTS = [
  { id: 1, name: 'OrdiPro Pixel X15', category: 'ordinateurs', brand: 'PixelStore', reference: 'ORD-PX-X15', price: 850000, oldPrice: 950000, stock: 8, image: '../img/products/1496181133206-80ce9b88a853.jpg', rating: 4.8, tag: 'Nouveau', featured: true, active: true },
  { id: 2, name: 'PixelBook 14', category: 'ordinateurs', brand: 'PixelStore', reference: 'PC-PB-14', price: 720000, oldPrice: 800000, stock: 10, image: '../img/products/1517336714731-489689fd1ca8.jpg', rating: 4.6, tag: 'Ultra mobile', featured: false, active: true },
  { id: 3, name: 'Clavier MécaK Pixel K68', category: 'claviers', brand: 'PixelStore', reference: 'CLV-K68-RGB', price: 65000, oldPrice: 85000, stock: 15, image: '../img/products/1587829741301-dc798b83add3.jpg', rating: 4.7, tag: 'Top vente', featured: false, active: true },
  { id: 4, name: 'Clavier PixelK Air 75', category: 'claviers', brand: 'PixelStore', reference: 'CLV-K75-AIR', price: 78000, oldPrice: 90000, stock: 22, image: '../img/products/1618384887929-16ec33fab9ef.jpg', rating: 4.5, tag: 'Confort', featured: false, active: true },
  { id: 5, name: 'PixelMouse Pro', category: 'souris', brand: 'PixelStore', reference: 'SOU-PX-PRO', price: 45000, oldPrice: 58000, stock: 20, image: '../img/products/1527864550417-7fd91fc51a46.jpg', rating: 4.6, tag: 'Nouveau', featured: false, active: true },
  { id: 6, name: 'Souris PixelEase', category: 'souris', brand: 'PixelStore', reference: 'SOU-PX-EASE', price: 28000, oldPrice: 35000, stock: 18, image: '../img/products/1615663245857-ac93bb7c39e7.jpg', rating: 4.4, tag: 'Confort', featured: false, active: true },
  { id: 7, name: 'Écran UltraPixel 27"', category: 'ecrans', brand: 'PixelStore', reference: 'ECR-UP-27K', price: 320000, oldPrice: 380000, stock: 6, image: '../img/products/1527443224154-c4a3942d3acf.jpg', rating: 4.9, tag: '4K Ultra HD', featured: false, active: true },
  { id: 8, name: 'Écran VisionPixel 24"', category: 'ecrans', brand: 'PixelStore', reference: 'ECR-VP-24F', price: 145000, oldPrice: 175000, stock: 14, image: '../img/products/1551645120-d70bfe84c826.jpg', rating: 4.5, tag: 'Essentiel', featured: false, active: true },
  { id: 9, name: 'Casque PixelSound H90', category: 'casques', brand: 'PixelStore', reference: 'CSQ-PS-H90', price: 95000, oldPrice: 110000, stock: 12, image: '../img/products/1505740420928-5e560c06d30e.jpg', rating: 4.7, tag: 'Son immersif', featured: false, active: true },
  { id: 10, name: 'Casque PixelStudio', category: 'casques', brand: 'PixelStore', reference: 'CSQ-PS-STUDIO', price: 120000, oldPrice: 140000, stock: 7, image: '../img/products/1546435770-a3e426bf472b.jpg', rating: 4.8, tag: 'Créateurs', featured: false, active: true },
  { id: 11, name: 'SSD PixelStore 1To NVMe', category: 'composants', brand: 'PixelStore', reference: 'SSD-PX-1TB', price: 55000, oldPrice: 65000, stock: 30, image: '../img/products/1591370874773-6702e8f12fd8.jpg', rating: 4.8, tag: 'Performance', featured: false, active: true },
  { id: 12, name: 'PixelGPU RTX 4070', category: 'composants', brand: 'PixelStore', reference: 'GPU-PX-4070', price: 620000, oldPrice: 680000, stock: 4, image: '../img/products/1591488320449-011701bb6704.jpg', rating: 4.9, tag: 'Puissance', featured: false, active: true }
];

// Clé de stockage en localStorage (persistance du catalogue entre les pages)
const PRODUCTS_STORAGE_KEY = 'pixelstore_admin_products';

// Charge le catalogue : localStorage s'il existe, sinon les données de démo.
function loadAdminProducts() {
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* données corrompues : on repart des valeurs par défaut */ }
  return DEFAULT_ADMIN_PRODUCTS.map((p) => ({ ...p }));
}

// Catalogue des produits (persisté)
const adminProducts = loadAdminProducts();

// Persiste le catalogue en localStorage
function saveAdminProducts() {
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(adminProducts));
  } catch (e) {
    console.error('Impossible de sauvegarder le catalogue :', e);
  }
}

// Clients (démonstration)
const adminCustomers = [
  { id: 1, name: 'Dieudonné Safari', email: 'dieudonne@example.com', phone: '+257 79 000 111', city: 'Bujumbura', orders: 6, spent: 2350000, joined: '2025-11-12', status: 'active' },
  { id: 2, name: 'Aline Niyonkuru', email: 'aline@example.com', phone: '+257 79 000 222', city: 'Bujumbura', orders: 3, spent: 895000, joined: '2026-01-05', status: 'active' },
  { id: 3, name: 'Jean-Claude Habimana', email: 'jc@example.com', phone: '+257 69 000 333', city: 'Gitega', orders: 8, spent: 3200000, joined: '2025-09-20', status: 'active' },
  { id: 4, name: 'Sandrine Uwase', email: 'sandrine@example.com', phone: '+257 79 000 444', city: 'Ngozi', orders: 1, spent: 28000, joined: '2026-08-02', status: 'active' },
  { id: 5, name: 'Eric Ndayishimiye', email: 'eric@example.com', phone: '+257 61 000 555', city: 'Bujumbura', orders: 2, spent: 410000, joined: '2026-05-18', status: 'active' },
  { id: 6, name: 'Chantal Irankunda', email: 'chantal@example.com', phone: '+257 79 000 666', city: 'Muyinga', orders: 0, spent: 0, joined: '2026-08-25', status: 'pending' }
];

// Commandes (démonstration, alignées sur le schéma SQL)
const adminOrders = [
  { id: 1, number: 'PS-20260829-001', customerId: 2, date: '2026-08-29T10:15:00', status: 'delivered', payment: 'paid', method: 'mobile_money', items: [{ productId: 1, name: 'OrdiPro Pixel X15', qty: 1, price: 850000 }], subtotal: 850000, shipping: 5000, total: 855000 },
  { id: 2, number: 'PS-20260829-002', customerId: 3, date: '2026-08-29T09:02:00', status: 'processing', payment: 'paid', method: 'card', items: [{ productId: 3, name: 'Clavier MécaK Pixel K68', qty: 2, price: 65000 }, { productId: 5, name: 'PixelMouse Pro', qty: 1, price: 45000 }], subtotal: 175000, shipping: 5000, total: 180000 },
  { id: 3, number: 'PS-20260828-014', customerId: 1, date: '2026-08-28T18:40:00', status: 'pending', payment: 'pending', method: 'cod', items: [{ productId: 7, name: 'Écran UltraPixel 27"', qty: 1, price: 320000 }], subtotal: 320000, shipping: 5000, total: 325000 },
  { id: 4, number: 'PS-20260828-013', customerId: 5, date: '2026-08-28T14:22:00', status: 'shipped', payment: 'paid', method: 'mobile_money', items: [{ productId: 12, name: 'PixelGPU RTX 4070', qty: 1, price: 620000 }], subtotal: 620000, shipping: 5000, total: 625000 },
  { id: 5, number: 'PS-20260827-011', customerId: 3, date: '2026-08-27T11:05:00', status: 'delivered', payment: 'paid', method: 'bank_transfer', items: [{ productId: 2, name: 'PixelBook 14', qty: 1, price: 720000 }], subtotal: 720000, shipping: 5000, total: 725000 },
  { id: 6, number: 'PS-20260826-009', customerId: 4, date: '2026-08-26T09:30:00', status: 'delivered', payment: 'paid', method: 'cod', items: [{ productId: 6, name: 'Souris PixelEase', qty: 1, price: 28000 }], subtotal: 28000, shipping: 5000, total: 33000 },
  { id: 7, number: 'PS-20260825-007', customerId: 1, date: '2026-08-25T15:48:00', status: 'cancelled', payment: 'refunded', method: 'card', items: [{ productId: 10, name: 'Casque PixelStudio', qty: 1, price: 120000 }], subtotal: 120000, shipping: 0, total: 120000 },
  { id: 8, number: 'PS-20260824-005', customerId: 5, date: '2026-08-24T12:11:00', status: 'delivered', payment: 'paid', method: 'mobile_money', items: [{ productId: 9, name: 'Casque PixelSound H90', qty: 1, price: 95000 }], subtotal: 95000, shipping: 5000, total: 100000 }
];

// Coupons (démonstration)
const adminCoupons = [
  { id: 1, code: 'BIENVENUE10', type: 'percentage', value: 10, uses: 42, max: 200, active: true },
  { id: 2, code: 'ETE2026', type: 'fixed', value: 20000, uses: 18, max: 50, active: true },
  { id: 3, code: 'FLASH150', type: 'fixed', value: 15000, uses: 65, max: 100, active: true },
  { id: 4, code: 'VIPPIXEL', type: 'percentage', value: 15, uses: 9, max: 20, active: true }
];

// Statuts de commande -> libellé + couleur de badge
const orderStatusMap = {
  pending:    { label: 'En attente',  badge: 'badge-amber' },
  confirmed:  { label: 'Confirmée',   badge: 'badge-blue' },
  processing: { label: 'En traitement', badge: 'badge-blue' },
  shipped:    { label: 'Expédiée',    badge: 'badge-violet' },
  delivered:  { label: 'Livrée',      badge: 'badge-green' },
  cancelled:  { label: 'Annulée',     badge: 'badge-red' },
  refunded:   { label: 'Remboursée',  badge: 'badge-gray' }
};

const paymentStatusMap = {
  pending: { label: 'En attente', badge: 'badge-amber' },
  paid:    { label: 'Payé',       badge: 'badge-green' },
  failed:  { label: 'Échoué',     badge: 'badge-red' },
  refunded:{ label: 'Remboursé',  badge: 'badge-gray' }
};

// Aide : retrouve un produit / un client par id
const findProduct = (id) => adminProducts.find((p) => p.id === id);
const findCustomer = (id) => adminCustomers.find((c) => c.id === id);

// --------------------------------------------------------------------------
// INITIALISATION PARTAGÉE
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initAdminTheme();
  initAdminSidebar();
  initGlobalSearch();
  initSidebarLogout();
});
