// ==========================================================================
// PIXELSTORE — AUTHENTIFICATION (Supabase Auth)
// Injecte dans le header le bouton de connexion (ou le menu utilisateur),
// gère l'inscription / la connexion via une modale, et expose de petits
// helpers globaux (window.storeUser / onUserChange) utilisés par le reste
// de l'application (panier DB, checkout, admin).
//
// Ce script doit être chargé APRÈS supabase-config.js (instance `supabase`)
// et api.js (waitForSupabase).
// ==========================================================================

window.storeUser = null;      // utilisateur Supabase connecté (ou null)
window.PixelAuth = {};        // API publique

(function () {
  var Icons = {
    user: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    close: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    box: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    exit: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'
  };

  var headerActions = document.querySelector('.header-actions');
  var modalEl = null;
  var logoutSubscribers = [];

  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }

  function initials(name) {
    if (!name) return '?';
    var parts = name.trim().split(/\s+/);
    return ((parts[0] || '')[0] || '').toUpperCase() + ((parts[1] || '')[0] || '').toUpperCase();
  }

  function userName(user) {
    if (!user) return '';
    var meta = (user.user_metadata || {});
    return meta.full_name || meta.name || user.email || ('Utilisateur');
  }

  function userEmail(user) {
    return (user && user.email) || '';
  }

  // ---- Rendu du header (bouton connexion OU menu utilisateur) ----
  function renderHeader() {
    if (!headerActions) return;
    var existing = headerActions.querySelector('.auth-root');
    if (existing) existing.remove();

    var root = document.createElement('div');
    root.className = 'auth-root';

    if (!window.storeUser) {
      var btn = el('<button class="auth-btn" aria-label="Se connecter">' + Icons.user + '<span>Connexion</span></button>');
      btn.addEventListener('click', function () { openModal('login'); });
      root.appendChild(btn);
    } else {
      var menu = el(
        '<div class="user-menu">' +
          '<button class="user-menu-trigger">' +
            '<span class="user-avatar"></span>' +
            '<span class="user-menu-name"></span>' +
          '</button>' +
          '<div class="user-dropdown">' +
            '<div class="user-dropdown-header"><strong class="ud-name"></strong><span class="ud-email"></span></div>' +
            '<a class="dropdown-orders" href="commandes.html">' + Icons.box + '<span>Mes commandes</span></a>' +
            '<button class="dropdown-danger dropdown-logout">' + Icons.exit + '<span>Se déconnecter</span></button>' +
          '</div>' +
        '</div>'
      );
      menu.querySelector('.user-avatar').textContent = initials(userName(window.storeUser));
      menu.querySelector('.user-menu-name').textContent = userName(window.storeUser).split(' ')[0];
      menu.querySelector('.ud-name').textContent = userName(window.storeUser);
      menu.querySelector('.ud-email').textContent = userEmail(window.storeUser);

      var avatar = menu.querySelector('.user-avatar');
      var meta = (window.storeUser.user_metadata || {});
      if (meta.avatar_url) {
        var img = new Image();
        img.onload = function () { avatar.textContent = ''; avatar.style.backgroundImage = "url('" + meta.avatar_url + "')"; avatar.style.backgroundSize = 'cover'; avatar.style.backgroundPosition = 'center'; };
        img.src = meta.avatar_url;
      }

      var trigger = menu.querySelector('.user-menu-trigger');
      var dropdown = menu.querySelector('.user-dropdown');
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });
      document.addEventListener('click', function (e) {
        if (!menu.contains(e.target)) dropdown.classList.remove('open');
      });
      menu.querySelector('.dropdown-logout').addEventListener('click', function () { doLogout(); dropdown.classList.remove('open'); });
      root.appendChild(menu);
    }

    headerActions.appendChild(root);
  }

  // ---- Modale connexion / inscription ----
  function openModal(mode) {
    if (!modalEl) modalEl = buildModal();
    document.body.appendChild(modalEl);
    switchTab(mode || 'login');
    // ouvre via requestAnimationFrame pour déclencher la transition CSS
    requestAnimationFrame(function () { modalEl.classList.add('open'); });
    modalEl.querySelector('.' + (mode === 'register' ? 'reg-email' : 'email')).focus();
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('open');
    setTimeout(function () { if (modalEl) modalEl.remove(); }, 250);
  }

  function buildModal() {
    var overlay = el(
      '<div class="modal-overlay">' +
        '<div class="auth-modal" role="dialog" aria-modal="true">' +
          '<button class="modal-close" aria-label="Fermer">' + Icons.close + '</button>' +
          '<h2 class="auth-title">Connexion</h2>' +
          '<p class="auth-subtitle">Accédez à votre espace PixelStore</p>' +
          '<div class="auth-tabs">' +
            '<button class="auth-tab active" data-tab="login">Connexion</button>' +
            '<button class="auth-tab" data-tab="register">Inscription</button>' +
          '</div>' +
          '<div class="auth-error"></div>' +
          '<form class="auth-form" novalidate>' +
            '<div class="reg-fields" style="display:none;">' +
              '<div class="auth-field"><label for="reg-name">Nom complet</label><input class="reg-name" id="reg-name" type="text" placeholder="Jean Dupont"></div>' +
              '<div class="auth-field"><label for="reg-phone">Téléphone (optionnel)</label><input class="reg-phone" id="reg-phone" type="tel" placeholder="+257 00 00 00 00"></div>' +
            '</div>' +
            '<div class="auth-field"><label>Adresse e-mail</label><input class="email" type="email" placeholder="vous@exemple.com" autocomplete="email"></div>' +
            '<div class="auth-field"><label>Mot de passe</label><input class="password" type="password" placeholder="••••••••" autocomplete="current-password"></div>' +
            '<button type="submit" class="auth-submit">Se connecter</button>' +
          '</form>' +
          '<div class="auth-status"></div>' +
        '</div>' +
      '</div>'
    );

    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    overlay.querySelector('.modal-close').addEventListener('click', closeModal);
    overlay.querySelectorAll('.auth-tab').forEach(function (tab) {
      tab.addEventListener('click', function () { switchTab(tab.getAttribute('data-tab')); });
    });
    overlay.querySelector('.auth-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var title = overlay.querySelector('.auth-title').textContent;
      if (title === 'Inscription') doRegister(overlay); else doLogin(overlay);
    });
    return overlay;
  }

  function switchTab(mode) {
    if (!modalEl) return;
    modalEl.querySelectorAll('.auth-tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === mode);
    });
    var isRegister = mode === 'register';
    modalEl.querySelector('.auth-title').textContent = isRegister ? 'Inscription' : 'Connexion';
    modalEl.querySelector('.auth-subtitle').textContent = isRegister
      ? 'Créez votre compte pour suivre vos commandes'
      : 'Accédez à votre espace PixelStore';
    modalEl.querySelector('.reg-fields').style.display = isRegister ? 'block' : 'none';
    modalEl.querySelector('.auth-submit').textContent = isRegister ? 'Créer mon compte' : 'Se connecter';
    var pwd = modalEl.querySelector('.password');
    pwd.autocomplete = isRegister ? 'new-password' : 'current-password';
    clearError();
  }

  function setError(overlay, msg) {
    var box = overlay.querySelector('.auth-error');
    box.textContent = msg;
    box.classList.add('show');
  }
  function clearError() {
    if (modalEl) modalEl.querySelector('.auth-error').classList.remove('show');
  }

  function setStatus(msg) {
    if (!modalEl) return;
    var s = modalEl.querySelector('.auth-status');
    s.textContent = msg || '';
  }

  function extractErrorMessage(error) {
    var m = (error && error.message) || 'Une erreur est survenue.';
    return m.replace(/^.*?\b(?:password|email|code|user|rate).*?:/i, '') || m;
  }

  function doLogin(overlay) {
    var client = window.supabase;
    if (!client) { setError(overlay, 'Service de connexion indisponible. Réessayez dans un instant.'); return; }
    var email = overlay.querySelector('.email').value.trim();
    var password = overlay.querySelector('.password').value;
    if (!email || !password) { setError(overlay, 'Veuillez renseigner votre e-mail et votre mot de passe.'); return; }
    setError(overlay, '');
    var btn = overlay.querySelector('.auth-submit');
    var label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Connexion…';

    client.auth.signInWithPassword({ email: email, password: password })
      .then(function (res) {
        btn.disabled = false; btn.textContent = label;
        if (res.error) { setError(overlay, extractErrorMessage(res.error)); return; }
        setStatus('Connexion réussie ✓');
        setTimeout(function () {
          closeModal();
          window.storeUser = res.data.user;
          renderHeader();
          notifyUserChange(res.data.user);
        }, 600);
      })
      .catch(function (err) {
        btn.disabled = false; btn.textContent = label;
        setError(overlay, extractErrorMessage(err));
      });
  }

  function doRegister(overlay) {
    var client = window.supabase;
    if (!client) { setError(overlay, 'Service d\'inscription indisponible. Réessayez dans un instant.'); return; }
    var name = overlay.querySelector('.reg-name').value.trim();
    var phone = overlay.querySelector('.reg-phone').value.trim();
    var email = overlay.querySelector('.email').value.trim();
    var password = overlay.querySelector('.password').value;
    if (!name) { setError(overlay, 'Veuillez indiquer votre nom complet.'); return; }
    if (!email || !password) { setError(overlay, 'Veuillez renseigner votre e-mail et votre mot de passe.'); return; }
    if (password.length < 6) { setError(overlay, 'Le mot de passe doit contenir au moins 6 caractères.'); return; }
    setError(overlay, '');
    var btn = overlay.querySelector('.auth-submit');
    var label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Création…';

    var meta = { full_name: name };
    if (name.indexOf(' ') > 0) {
      meta.first_name = name.split(' ')[0];
      meta.last_name = name.split(' ').slice(1).join(' ');
    } else {
      meta.first_name = name;
    }
    if (phone) meta.phone = phone;

    client.auth.signUp({ email: email, password: password, options: { data: meta } })
      .then(function (res) {
        btn.disabled = false; btn.textContent = label;
        if (res.error) { setError(overlay, extractErrorMessage(res.error)); return; }
        var user = res.data.user;
        // Si l'e-mail n'est pas confirmé, on informe l'utilisateur.
        if (user && user.identities && user.identities.length === 0) {
          setStatus('Un e-mail de confirmation a été envoyé. Vérifiez votre boîte de réception.');
          return;
        }
        if (res.data.session) {
          setStatus('Compte créé ✓');
          setTimeout(function () {
            closeModal();
            window.storeUser = user;
            renderHeader();
            notifyUserChange(user);
          }, 600);
        } else {
          setStatus('Compte créé ✓ Vérifiez votre boîte mail pour confirmer.');
        }
      })
      .catch(function (err) {
        btn.disabled = false; btn.textContent = label;
        setError(overlay, extractErrorMessage(err));
      });
  }

  function doLogout() {
    var client = window.supabase;
    if (!client) return;
    client.auth.signOut().finally(function () {
      window.storeUser = null;
      renderHeader();
      notifyUserChange(null);
    });
  }

  // ---- Notification du changement d'utilisateur aux autres modules ----
  function notifyUserChange(user) {
    if (typeof window.onUserChange === 'function') {
      try { window.onUserChange(user); } catch (e) { /* non bloquant */ }
    }
    // Synchronise le panier localStorage vers la base une fois connecté.
    if (user && typeof syncCartToDb === 'function') {
      try { syncCartToDb(); } catch (e) { /* non bloquant */ }
    }
  }

  // ---- API publique ----
  window.PixelAuth.openModal = openModal;
  window.PixelAuth.closeModal = closeModal;
  window.PixelAuth.onLogout = function (fn) { if (typeof fn === 'function') logoutSubscribers.push(fn); };

  // ---- Initialisation ----
  function init() {
    // Affiche immédiatement l'interface (état déconnecté par défaut), même si
    // Supabase n'est pas encore prêt : le bouton "Connexion" apparaît sans délai.
    // Il sera remplacé par le menu utilisateur si une session est trouvée.
    renderHeader();

    // Ensuite, on récupère la session (et on réagit aux changements d'état).
    if (typeof waitForSupabase === 'function') {
      waitForSupabase().then(function (client) {
        if (!client) return; // Supabase indisponible : on reste en mode déconnecté
        client.auth.getSession().then(function (res) {
          window.storeUser = res && res.data && res.data.session ? res.data.session.user : null;
          if (window.storeUser) renderHeader();
          // Réagit aux connexions/déconnexions (même via une autre fenêtre).
          client.auth.onAuthStateChange(function (event, session) {
            window.storeUser = session ? session.user : null;
            renderHeader();
            notifyUserChange(window.storeUser);
          });
        });
      });
    }
  }

  if (typeof waitForSupabase === 'function') {
    init();
  }
})();
