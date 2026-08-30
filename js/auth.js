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
    exit: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    eye: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    'eye-off': '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
    google: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.62 6.62 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>'
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
          '<button type="button" class="oauth-btn">' + Icons.google + '<span>Continuer avec Google</span></button>' +
          '<div class="auth-divider">ou avec votre e-mail</div>' +
          '<form class="auth-form" novalidate>' +
            '<div class="reg-fields" style="display:none;">' +
              '<div class="auth-field"><label for="reg-name">Nom complet</label><input class="reg-name" id="reg-name" type="text" placeholder="Jean Dupont"></div>' +
              '<div class="auth-field"><label for="reg-phone">Téléphone (optionnel)</label><input class="reg-phone" id="reg-phone" type="tel" placeholder="+257 00 00 00 00"></div>' +
            '</div>' +
            '<div class="auth-field"><label>Adresse e-mail</label><input class="email" type="email" placeholder="vous@exemple.com" autocomplete="email"></div>' +
            '<div class="auth-field"><label>Mot de passe</label>' +
              '<div class="password-wrap">' +
                '<input class="password" type="password" placeholder="••••••••" autocomplete="current-password">' +
                '<button type="button" class="password-toggle" aria-label="Afficher le mot de passe">' + Icons.eye + '</button>' +
              '</div>' +
            '</div>' +
            '<p class="auth-forgot" style="text-align:right;margin:-6px 0 14px;font-size:.78rem;"><a href="#" style="color:var(--accent-green);text-decoration:none;">Mot de passe oublié ?</a></p>' +
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

    // Oeil : afficher / masquer le mot de passe
    var pwdToggle = overlay.querySelector('.password-toggle');
    var pwdInput = overlay.querySelector('.password');
    if (pwdToggle && pwdInput) {
      pwdToggle.addEventListener('click', function () {
        var show = pwdInput.type === 'password';
        pwdInput.type = show ? 'text' : 'password';
        pwdToggle.innerHTML = show ? Icons['eye-off'] : Icons.eye;
        pwdToggle.setAttribute('aria-label', show ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
      });
    }

    // Connexion Google (OAuth)
    var oauthBtn = overlay.querySelector('.oauth-btn');
    if (oauthBtn) {
      oauthBtn.addEventListener('click', function () { googleLogin(overlay); });
    }

    // Mot de passe oublié
    var forgot = overlay.querySelector('.auth-forgot a');
    if (forgot) {
      forgot.addEventListener('click', function (e) { e.preventDefault(); forgotPassword(overlay); });
    }
    return overlay;
  }

  // Connexion avec Google (nécessite le fournisseur activé dans Supabase)
  function googleLogin(overlay) {
    var client = window.supabase;
    if (!client) { setError(overlay, 'Service de connexion indisponible. Réessayez dans un instant.'); return; }
    var btn = overlay.querySelector('.oauth-btn');
    if (btn) btn.disabled = true;
    client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname }
    })
      .then(function (res) {
        if (btn) btn.disabled = false;
        if (res.error) {
          setError(overlay, 'La connexion avec Google n\'est pas encore activée sur ce site. Utilisez votre e-mail ou contactez l\'administrateur.');
        }
        // Sinon supabase-js redirige vers la page de connexion Google.
      })
      .catch(function () {
        if (btn) btn.disabled = false;
        setError(overlay, 'Impossible de se connecter avec Google.');
      });
  }

  // Envoie un lien de réinitialisation de mot de passe
  function forgotPassword(overlay) {
    var email = overlay.querySelector('.email').value.trim();
    if (!email) { setError(overlay, 'Saisissez d\'abord votre adresse e-mail ci-dessus.'); return; }
    var client = window.supabase;
    if (!client) { setError(overlay, 'Service indisponible. Réessayez dans un instant.'); return; }
    setError(overlay, '');
    client.auth.resetPasswordForEmail(email)
      .then(function (res) {
        if (res.error) { setError(overlay, 'Impossible d\'envoyer le lien : ' + (res.error.message || 'Réessayez.')); return; }
        setStatus('Un lien de réinitialisation a été envoyé à ' + email + '. Vérifiez votre boîte mail.');
      })
      .catch(function () { setError(overlay, 'Impossible d\'envoyer le lien. Réessayez.'); });
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
    var raw = (error && error.message) || 'Une erreur est survenue. Réessayez.';
    var m = String(raw).toLowerCase();
    if (/invalid login credentials/i.test(m) || /invalid login/i.test(m) || /incorrect/i.test(m)) {
      return 'E-mail ou mot de passe incorrect.';
    }
    if (/email not confirmed/i.test(m) || /not confirmed/i.test(m)) {
      return 'Votre e-mail n\'a pas encore été confirmé. Vérifiez votre boîte de réception.';
    }
    if (/user already registered/i.test(m) || /already registered/i.test(m)) {
      return 'Un compte existe déjà avec cet e-mail. Connectez-vous.';
    }
    if (/password should be at least/i.test(m) || /at least 6/i.test(m)) {
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    }
    if (/rate limit/i.test(m) || /too many requests/i.test(m)) {
      return 'Trop de tentatives. Réessayez dans quelques minutes.';
    }
    if (/failed to fetch/i.test(m) || /network/i.test(m) || /loadfailed/i.test(m)) {
      return 'Problème de connexion internet. Vérifiez votre réseau puis réessayez.';
    }
    return raw;
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
