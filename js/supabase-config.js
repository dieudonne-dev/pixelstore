// ==========================================================================
// PIXELSTORE — CONFIGURATION SUPABASE
// Charge le client supabase-js (CDN) et expose une instance globale `supabase`.
// À remplacer par TES valeurs réelles (Projet Supabase → Settings → API).
//
//   SUPABASE_URL    : ex. https://xxxxxxxxxxxx.supabase.co
//   SUPABASE_ANON_KEY : clé publique "anon" (publiable côté client).
//
// La sécurité des données est assurée par les policies RLS côté serveur,
// pas par le secret de cette clé (qui est forcément visible dans un site
// statique hébergé sur GitHub Pages).
// ==========================================================================

var SUPABASE_URL = 'https://ysaydbefzncsiovevlag.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_YzO-RFWZauh6seSMRRutrg_rKaFW1x9';

// Expose l'instance globale `supabase` pour être utilisée partout.
var supabase;
var supabaseReady = false;

// Chemins vers le SDK supabase-js : on privilégie la copie LOCALE (chargée
// en statique dans les pages) car elle est rapide et fiable, y compris sans
// accès au CDN externe. Le CDN n'est qu'un secours.
var LOCAL_SDK = 'js/vendor/supabase.min.js';
var CDN_SDK = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

function initClient() {
  try {
    if (typeof createClient !== 'function') throw new Error('createClient manquant');
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    supabaseReady = true;
    document.dispatchEvent(new CustomEvent('supabase:ready'));
    return true;
  } catch (e) {
    supabaseReady = false;
    console.error('Échec de l\'initialisation Supabase :', e);
    return false;
  }
}

function loadSdk(src, onReady) {
  var s = document.createElement('script');
  s.src = src;
  s.onload = function () { if (initClient()) onReady(); else onReady(); };
  s.onerror = function () { onReady(); };
  document.head.appendChild(s);
}

(function initSupabase() {
  // SDK déjà disponible globalement (balise <script> statique présente) ?
  if (typeof createClient === 'function') {
    initClient();
    return;
  }

  // Sinon, charge le SDK local d'abord, puis le CDN en secours si besoin.
  loadSdk(LOCAL_SDK, function () {
    if (supabaseReady) return;
    loadSdk(CDN_SDK, function () {
      if (!supabaseReady) {
        console.error('Impossible de charger le SDK supabase-js.');
      }
    });
  });
})();
