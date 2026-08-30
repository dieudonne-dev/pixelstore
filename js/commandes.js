// ==========================================================================
// PIXELSTORE — MES COMMANDES (js/commandes.js)
// Affiche l'historique des commandes de l'utilisateur connecté, chargé
// depuis la base (tables orders + order_items, protégées par RLS, l'utilisateur
// ne voit que ses propres commandes).
// ==========================================================================

(function () {
  var requiredEl = document.getElementById('orders-required');
  var listEl = document.getElementById('orders-list');
  var emptyEl = document.getElementById('orders-empty');
  var loginBtn = document.getElementById('orders-login-btn');

  function fmt(n) {
    return (n || 0).toLocaleString('fr-FR') + ' BIF';
  }
  function fmtDate(d) {
    if (!d) return '';
    var dt = new Date(d);
    return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }
  function statusClass(s) {
    s = (s || 'pending').toLowerCase();
    return { pending: 'pending', paid: 'paid', confirmed: 'pending', processing: 'pending', shipped: 'pending', delivered: 'paid', cancelled: 'failed', refunded: 'failed' }[s] || 'pending';
  }

  function show(view) {
    requiredEl.style.display = view === 'required' ? 'block' : 'none';
    listEl.style.display = view === 'list' ? 'flex' : 'none';
    emptyEl.style.display = view === 'empty' ? 'block' : 'none';
  }

  function orderCard(o) {
    var items = (o.items || []).map(function (i) {
      return (
        '<div class="order-item">' +
          '<span class="oi-name">' + i.product_name + '</span>' +
          '<span class="oi-qty">x' + i.quantity + '</span>' +
          '<span class="oi-price">' + fmt((Number(i.unit_price) || 0) * (Number(i.quantity) || 1)) + '</span>' +
        '</div>'
      );
    }).join('');

    return (
      '<div class="order-card">' +
        '<div class="order-card-head">' +
          '<div>' +
            '<div class="oc-number">' + (o.order_number || o.id) + '</div>' +
            '<div class="oc-date">' + fmtDate(o.created_at) + '</div>' +
          '</div>' +
          '<span class="order-status ' + statusClass(o.payment_status) + '">' + (o.payment_status || 'pending') + '</span>' +
        '</div>' +
        '<div class="order-card-body"><div class="order-items">' + items + '</div></div>' +
        '<div class="order-card-foot">' +
          '<span class="of-label">Statut : ' + (o.status || 'pending') + '</span>' +
          '<span class="of-total">' + fmt(o.grand_total) + '</span>' +
        '</div>' +
      '</div>'
    );
  }

  async function loadOrders() {
    if (!window.storeUser) { show('required'); return; }
    var client = await waitForSupabase();
    if (!client) { show('required'); return; }

    const { data, error } = await client
      .from('orders')
      .select('id, order_number, status, payment_status, grand_total, created_at, items:order_items(product_name, quantity, unit_price)')
      .order('created_at', { ascending: false });

    if (error) { show('required'); return; }

    if (!data || !data.length) { show('empty'); return; }

    listEl.innerHTML = data.map(orderCard).join('');
    show('list');
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', function () {
      if (window.PixelAuth && PixelAuth.openModal) PixelAuth.openModal('login');
      else window.location.href = 'index.html';
    });
  }

  // L'utilisateur change (connexion/déconnexion) → recharge.
  window.onUserChange = function () { loadOrders(); };

  if (document.getElementById('orders-list')) {
    // Attend que l'auth soit initialisée puis charge.
    (async function init() {
      if (typeof waitForSupabase === 'function') {
        var client = await waitForSupabase();
        if (client && client.auth) {
          var r = await client.auth.getSession();
          window.storeUser = r.data && r.data.session ? r.data.session.user : null;
        }
      }
      loadOrders();
    })();
  }
})();
