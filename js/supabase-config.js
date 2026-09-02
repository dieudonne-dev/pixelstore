// ==========================================================================
// PIXELSTORE — CONFIGURATION SUPABASE
// Charge le client supabase-js et expose une instance globale `window.supabase`.
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

// Chemins vers le SDK supabase-js : on privilégie la copie LOCALE (rapide et
// fiable, même sans accès au CDN externe). Le CDN n'est qu'un secours.
var LOCAL_SDK = 'js/vendor/supabase.min.js';
var CDN_SDK = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

// L'instance client finale est exposée sous window.supabase.
// (importante : le build UMD du SDK définit lui aussi `supabase` comme
// namespace module ; on l'écrase proprement avec l'INSTANCE client.)
var supabase;
var supabaseReady = false;

// Crée l'instance client à partir du SDK disponible sous l'une des deux formes :
//  - window.createClient  (build ESM/CDN)
//  - window.supabase.createClient  (build UMD local : supabase = namespace module)
function tryBuildClient() {
  var createFn = null;
  if (typeof window.createClient === 'function') {
    createFn = window.createClient;
  } else if (window.supabase && typeof window.supabase.createClient === 'function') {
    createFn = window.supabase.createClient;
  }
  if (!createFn) return false;
  try {
    supabase = createFn(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabase = supabase;   // expose l'instance
    supabaseReady = true;
    document.dispatchEvent(new CustomEvent('supabase:ready'));
    return true;
  } catch (e) {
    console.error('Échec de l\'initialisation Supabase :', e);
    supabaseReady = false;
    return false;
  }
}

function loadSdk(src, onReady, wasCalledOnce) {
  var s = document.createElement('script');
  s.src = src;
  s.onload = function () {
    if (tryBuildClient()) { onReady(); } else { onReady(); }
  };
  s.onerror = function () { onReady(); };
  document.head.appendChild(s);
}

(function initSupabase() {
  // SDK déjà disponible globalement (balise <script> statique présente, ou
  // fichier local déjà chargé) ? On tente de construire le client immédiatement.
  if (typeof window.createClient === 'function' ||
      (window.supabase && typeof window.supabase.createClient === 'function')) {
    if (tryBuildClient()) return;
  }

  // Sinon, charge la copie locale d'abord, puis le CDN en secours si besoin.
  loadSdk(LOCAL_SDK, function () {
    if (supabaseReady) return;
    loadSdk(CDN_SDK, function () {
      if (!supabaseReady) {
        console.error('Impossible de charger le SDK supabase-js.');
      }
    });
  });
})();
