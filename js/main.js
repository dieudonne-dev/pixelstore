// ==================== GESTION DU THÈME (Dark/Light Mode) ====================

// Récupère l'élément racine HTML et le bouton toggle
const htmlElement = document.documentElement;
const themeToggleBtn = document.getElementById('theme-toggle');

// Au chargement de la page : vérifie si un thème est déjà enregistré (localStorage)
// Sinon, on garde "light" par défaut
const savedTheme = localStorage.getItem('theme') || 'light';
htmlElement.setAttribute('data-theme', savedTheme);

// Au clic sur le bouton : on bascule entre "light" et "dark"
themeToggleBtn.addEventListener('click', () => {
  const currentTheme = htmlElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';

  // Applique le nouveau thème sur la page
  htmlElement.setAttribute('data-theme', newTheme);

  // Sauvegarde le choix pour qu'il soit mémorisé même après rechargement
  localStorage.setItem('theme', newTheme);
});


// ==================== NEWSLETTER ====================

const newsletterForm = document.getElementById('newsletter-form');

if (newsletterForm) {
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Merci pour votre inscription !');
    newsletterForm.reset();
  });
}

// ==================== MENU MOBILE ====================
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileNav = document.getElementById('mobile-nav');

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
    mobileMenuBtn.classList.toggle('active');
  });
}

// Ferme le menu si on clique sur un lien
document.querySelectorAll('.mobile-nav a').forEach(link => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    mobileMenuBtn.classList.remove('active');
  });
});