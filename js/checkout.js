// ==========================================================================
// PIXELSTORE — CHECKOUT (js/checkout.js)
// Gère la page checkout.html : récapitulatif du panier, validation, code
// promo, et création réelle de la commande via la fonction SQL create_order
// (qui requiert un utilisateur connecté et un panier synchronisé en base).
// ==========================================================================

(function () {
  const SHIPPING_COST = 5000;

  const emptyEl = document.getElementById('checkout-empty');
  const layoutEl = document.getElementById('checkout-layout');
  const successEl = document.getElementById('checkout-success');
  const guestNotice = document.getElementById('guest-notice');
  const errorEl = document.getElementById('checkout-error');
  const itemsContainer = document.getElementById('checkout-items');
  const placeOrderBtn = document.getElementById('place-order-btn');

  let cart = [];
  let coupon = null;            // coupon validé côté client (estimation)
  let appliedCode = null;
  let submitting = false;

  function fmt(n) {
    return (n || 0).toLocaleString('fr-FR') + ' BIF';
  }
  function getCart() {
    try { return JSON.parse(localStorage.getItem('pixelstore_cart') || '[]'); } catch (e) { return []; }
  }
  function isEmpty() { return !getCart().length; }

  // ---- Sélection d'un moyen de paiement ----
  function initPaymentSelection() {
    var options = document.querySelectorAll('.payment-option');
    options.forEach(function (opt) {
      opt.addEventListener('click', function () {
        options.forEach(function (o) { o.classList.remove('selected'); });
        opt.classList.add('selected');
        opt.querySelector('input').checked = true;
      });
    });
  }

  // ---- Estimation de la remise (le serveur recalculera) ----
  function estimatedDiscount() {
    var sub = subtotal();
    if (!coupon) return 0;
    if (coupon.discount_type === 'fixed') return Math.min(coupon.discount_value, sub);
    return Math.min(sub, sub * (coupon.discount_value / 100));
  }
  function subtotal() {
    return cart.reduce(function (s, it) { return s + (Number(it.price) || 0) * (Number(it.quantity) || 1); }, 0);
  }

  function renderSummary() {
    cart = getCart();
    if (itemsContainer) {
      itemsContainer.innerHTML = cart.map(function (it) {
        return (
          '<div class="checkout-item">' +
            '<div class="checkout-item-image"><img src="' + (it.image || '') + '" alt="' + it.name + '"></div>' +
            '<div class="checkout-item-info">' +
              '<div class="checkout-item-name">' + it.name + '</div>' +
              '<div class="checkout-item-qty">Qté : ' + it.quantity + '</div>' +
            '</div>' +
            '<div class="checkout-item-price">' + fmt((Number(it.price) || 0) * (Number(it.quantity) || 1)) + '</div>' +
          '</div>'
        );
      }).join('');
    }

    var sub = subtotal();
    var disc = estimatedDiscount();
    var total = sub - disc + SHIPPING_COST;

    document.getElementById('co-subtotal').textContent = fmt(sub);
    var discRow = document.getElementById('co-discount-row');
    if (disc > 0) { discRow.style.display = 'flex'; document.getElementById('co-discount').textContent = '-' + fmt(disc); }
    else { discRow.style.display = 'none'; }
    document.getElementById('co-shipping').textContent = fmt(SHIPPING_COST);
    document.getElementById('co-total').textContent = fmt(total);
  }

  // ---- Affichage du panier vide / succès ----
  function showLayout() {
    if (successEl) successEl.style.display = 'none';
    if (layoutEl) layoutEl.style.display = 'block';
    if (emptyEl) emptyEl.style.display = 'none';
    if (guestNotice) guestNotice.style.display = window.storeUser ? 'none' : 'block';
  }
  function showEmpty() {
    if (layoutEl) layoutEl.style.display = 'none';
    if (successEl) successEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'block';
  }
  function showSuccess(orderNumber, total) {
    if (layoutEl) layoutEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'none';
    if (successEl) successEl.style.display = 'block';
    document.getElementById('success-order-number').textContent = orderNumber || '';
  }

  function setError(msg) {
    if (!msg) { errorEl.classList.remove('show'); return; }
    errorEl.textContent = msg;
    errorEl.classList.add('show');
  }

  function setCouponMsg(msg, ok) {
    var el = document.getElementById('coupon-msg');
    el.textContent = msg || '';
    el.className = 'coupon-msg ' + (ok ? 'ok' : (msg ? 'err' : ''));
  }

  // ---- Application d'un code promo (estimé côté client) ----
  async function applyCoupon() {
    var code = (document.getElementById('coupon-input').value || '').trim().toUpperCase();
    setCouponMsg('', false);
    if (!code) { coupon = null; appliedCode = null; renderSummary(); return; }

    var client = await waitForSupabase();
    if (!client) { setCouponMsg('Service indisponible.', false); return; }

    const { data, error } = await client
      .from('coupons')
      .select('code, discount_type, discount_value, min_order_amount, expires_at')
      .eq('code', code)
      .maybeSingle();

    if (error || !data) { coupon = null; appliedCode = null; setCouponMsg('Code promo invalide.', false); renderSummary(); return; }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { setCouponMsg('Ce code a expiré.', false); return; }
    if (data.min_order_amount && subtotal() < Number(data.min_order_amount)) {
      setCouponMsg('Montant minimum requis : ' + fmt(data.min_order_amount), false); return;
    }

    coupon = data;
    appliedCode = code;
    setCouponMsg('Code ' + code + ' appliqué ✓', true);
    renderSummary();
  }

  // ---- Validation du formulaire ----
  function validate() {
    var phone = document.getElementById('co-phone').value.trim();
    var line1 = document.getElementById('ship-line1').value.trim();
    var city = document.getElementById('ship-city').value.trim();
    if (!phone) return 'Veuillez renseigner votre numéro de téléphone.';
    if (!line1) return 'Veuillez renseigner votre adresse de livraison.';
    if (!city) return 'Veuillez renseigner votre ville.';
    return null;
  }

  // ---- Création de la commande ----
  async function placeOrder() {
    if (submitting) return;
    if (!window.storeUser) {
      setError('Veuillez vous connecter pour finaliser votre commande.');
      if (window.PixelAuth && PixelAuth.openModal) PixelAuth.openModal('login');
      return;
    }
    setError('');

    var v = validate();
    if (v) { setError(v); return; }

    submitting = true;
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Enregistrement…';

    var paymentMethod = (document.querySelector('input[name="payment"]:checked') || {}).value || 'cod';

    try {
      // 1) Synchronise le panier localStorage vers la base (carts/cart_items).
      if (typeof syncCartToDb === 'function') await syncCartToDb();

      // 2) Appelle la fonction SQL create_order.
      var client = await waitForSupabase();
      if (!client) throw new Error('Service de commande indisponible.');

      var notes = document.getElementById('ship-notes').value.trim();
      const { data, error } = await client.rpc('create_order', {
        p_payment_method: paymentMethod,
        p_coupon_code: appliedCode || null,
        p_shipping_address_id: null,
        p_billing_address_id: null,
        p_notes: notes || null
      });

      if (error) {
        var msg = error.message || '';
        if (/non authentifié/.test(msg)) {
          setError('Veuillez vous connecter pour finaliser votre commande.');
          if (window.PixelAuth && PixelAuth.openModal) PixelAuth.openModal('login');
        } else if (/stock insuffisant/i.test(msg)) {
          setError('Stock insuffisant pour un ou plusieurs articles. Réduisez les quantités.');
        } else {
          setError('Impossible de finaliser la commande : ' + msg);
        }
        return;
      }

      // 3) Succès : vide le panier local + badge.
      localStorage.removeItem('pixelstore_cart');
      if (typeof updateCartBadge === 'function') updateCartBadge();

      var orderNumber = data && data[0] ? (data[0].order_number || '') : '';
      showSuccess(orderNumber, data && data[0] ? fmt(data[0].grand_total) : '');
    } catch (err) {
      setError('Erreur lors de la commande : ' + (err && err.message ? err.message : err));
    } finally {
      submitting = false;
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = 'Confirmer la commande';
    }
  }

  // ---- Initialisation ----
  async function init() {
    initPaymentSelection();
    document.getElementById('coupon-apply').addEventListener('click', applyCoupon);
    placeOrderBtn.addEventListener('click', placeOrder);

    // Pré-remplit l'email si connecté.
    var emailInput = document.getElementById('co-email');
    if (window.storeUser && emailInput) emailInput.value = window.storeUser.email || '';

    renderSummary();
    if (isEmpty()) { showEmpty(); return; }
    showLayout();

    // Réagit aux connexions/déconnexions en direct.
    window.onUserChange = function (user) {
      var e = document.getElementById('co-email');
      if (e) e.value = user ? user.email || '' : '';
      if (isEmpty()) { showEmpty(); return; }
      showLayout();
    };

    // Si Supabase n'est pas encore prêt, on attend pour afficher l'état login.
    if (!window.storeUser && typeof waitForSupabase === 'function') {
      waitForSupabase().then(function (client) {
        if (client && client.auth) {
          client.auth.getSession().then(function (r) {
            if (r.data && r.data.session && r.data.session.user) {
              window.storeUser = r.data.session.user;
              if (emailInput) emailInput.value = r.data.session.user.email || '';
            }
            showLayout();
          });
        }
      });
    }
  }

  if (document.getElementById('checkout-layout')) {
    init();
  }
})();
