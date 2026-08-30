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

(function initSupabase() {
  // Charge dynamiquement le SDK supabase-js depuis le CDN si absent.
  if (typeof supabase === 'undefined' && typeof createClient === 'undefined') {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload = function () {
      try {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        supabaseReady = true;
        document.dispatchEvent(new CustomEvent('supabase:ready'));
      } catch (e) {
        console.error('Échec de l\'initialisation Supabase :', e);
      }
    };
    s.onerror = function () {
      console.error('Impossible de charger le SDK supabase-js (réseau/CDN indisponible).');
    };
    document.head.appendChild(s);
    return;
  }

  // Déjà chargé par une balise <script> statique.
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    supabaseReady = true;
    document.dispatchEvent(new CustomEvent('supabase:ready'));
  } catch (e) {
    console.error('Échec de l\'initialisation Supabase :', e);
  }
})();
