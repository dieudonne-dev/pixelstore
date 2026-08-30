// ==========================================================================
// PIXELSTORE — PANEL ADMIN : LAYOUT PARTAGÉ
// Injecte la barre latérale + la barre supérieure communes dans chaque page.
// ==========================================================================

const ICONS = {
  dashboard: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect></svg>',
  products: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
  orders: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
  customers: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
  categories: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
  stock: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
  coupons: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 5H3v5a2 2 0 0 1 0 4v5h18V5z"></path><line x1="7" y1="10" x2="12" y2="10"></line><circle cx="15" cy="12" r="1"></circle><circle cx="18" cy="12" r="1"></circle></svg>',
  store: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
  logout: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
  bell: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
  sun: '<svg class="icon-sun" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
  moon: '<svg class="icon-moon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
  menu: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
  home: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>'
};

// Navigation de la barre latérale
const SIDEBAR_NAV = [
  {
    section: 'Principal',
    links: [
      { href: 'index.html', label: 'Tableau de bord', icon: 'dashboard', pageKey: 'index' },
      { href: 'produits.html', label: 'Produits', icon: 'products', pageKey: 'produits' }
    ]
  },
  {
    section: 'Gestion',
    links: [
      { href: 'commandes.html', label: 'Commandes', icon: 'orders', pageKey: 'commandes' },
      { href: 'clients.html', label: 'Clients', icon: 'customers', pageKey: 'clients' },
      { href: 'categories.html', label: 'Catégories', icon: 'categories', pageKey: 'categories' },
      { href: 'stock.html', label: 'Stock', icon: 'stock', pageKey: 'stock' }
    ]
  },
  {
    section: 'Marketing',
    links: [
      { href: 'coupons.html', label: 'Codes promo', icon: 'coupons', pageKey: 'coupons' }
    ]
  }
];

// Construit et injecte le layout complet (sidebar + topbar + backdrop)
function renderAdminLayout(currentPage) {
  const body = document.body;

  body.insertAdjacentHTML('afterbegin', `
    <div class="sidebar-backdrop" id="sidebarBackdrop"></div>

    <div class="admin-layout">

      <!-- ===== SIDEBAR ===== -->
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="logo">
            <a href="index.html">Pixel<span class="logo-accent">Store</span> <small>Admin</small></a>
          </div>
        </div>

        <nav class="sidebar-nav">
          ${SIDEBAR_NAV.map((group) => `
            <div class="nav-section">${group.section}</div>
            ${group.links.map((link) => `
              <a href="${link.href}" class="nav-link ${currentPage === link.pageKey ? 'active' : ''}">
                ${ICONS[link.icon]}
                <span>${link.label}</span>
              </a>
            `).join('')}
          `).join('')}
        </nav>

        <div class="sidebar-footer">
          <div class="avatar">PA</div>
          <div class="sidebar-user-info">
            <strong>Pixel Admin</strong>
            <span>admin@pixelstore.com</span>
          </div>
          <a href="#" class="logout-btn" title="Se déconnecter" aria-label="Se déconnecter">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </a>
        </div>
      </aside>

      <!-- ===== CONTENU ===== -->
      <main class="admin-main">

        <!-- Topbar -->
        <header class="topbar">
          <button class="menu-toggle" id="menuToggle" aria-label="Ouvrir le menu">
            ${ICONS.menu}
          </button>

          <div class="topbar-search">
            ${ICONS.home === '' ? '' : ''}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" id="globalSearch" placeholder="Rechercher un produit, une commande...">
          </div>

          <div class="topbar-actions">
            <a href="../index.html" class="topbar-icon" title="Voir la boutique" aria-label="Voir la boutique">
              ${ICONS.store}
            </a>
            <button class="topbar-icon" id="theme-toggle" title="Changer de thème" aria-label="Changer de thème">
              ${ICONS.sun}${ICONS.moon}
            </button>
            <button class="topbar-icon" title="Notifications" aria-label="Notifications">
              ${ICONS.bell}
              <span class="badge-dot"></span>
            </button>
          </div>
        </header>

        <!-- Contenu de la page -->
        <div class="content" id="adminContent">
          <!-- Le contenu propre à chaque page est injecté ici -->
        </div>

      </main>
    </div>
  `);

  // Après injection du layout, on attache les comportements de la topbar.
  // Ne doit être exécuté qu'ici (les éléments existent à ce moment-là).
  try {
    initAdminTheme();
    initAdminSidebar();
    initGlobalSearch();
    initSidebarLogout();
    initNotifications();
  } catch (e) {
    /* fonctions non encore définies : ignoré */
  }

  return document.getElementById('adminContent');
}
