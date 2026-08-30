// ==========================================================================
// PIXELSTORE — CONFIGURATION ADMIN
// Constantes partagées par le panneau d'administration.
//
//   ADMIN_EMAIL : l'adresse qui dispose du rôle administrateur.
//     ⚠️ Modifie-la ici ET dans supabase_schema.sql (handle_new_user,
//     handle_user_update et l'UPDATE de promotion) pour rester cohérent.
// ==========================================================================

window.ADMIN_CONFIG = {
  SUPABASE_URL: 'https://ysaydbefzncsiovevlag.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_YzO-RFWZauh6seSMRRutrg_rKaFW1x9',
  ADMIN_EMAIL: 'admin@pixelstore.bi'
};
