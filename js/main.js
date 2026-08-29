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


// ==================== HERO : DIAPORAMA + TEXTE PAR IMAGE ====================

function initHeroSlider() {
  const slides = document.querySelectorAll('#heroSlides .hero-slide');
  const texts = document.querySelectorAll('.hero-slide-text');
  const dotsWrap = document.getElementById('heroDots');

  // Pas de hero sur la page => on ne fait rien
  if (slides.length === 0) return;

  let current = 0;
  let timer = null;
  const INTERVAL = 6000;

  // Construit les points de navigation (un par image)
  const dots = [];
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.setAttribute('aria-label', 'Image ' + (i + 1));
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
    dots.push(dot);
  });

  function goTo(i) {
    if (i === current) return;

    slides[current].classList.remove('active');
    texts[current].classList.remove('active');
    dots[current].classList.remove('active');

    current = i;

    slides[current].classList.add('active');
    texts[current].classList.add('active');
    dots[current].classList.add('active');

    start();
  }

  function next() {
    goTo((current + 1) % slides.length);
  }

  function start() {
    clearInterval(timer);
    timer = setInterval(next, INTERVAL);
  }

  start();
}

initHeroSlider();


// ==================== NAVBAR SUR LE HERO (devient opaque au scroll) ====================

function initHeroNav() {
  const nav = document.getElementById('heroNav');
  if (!nav) return;

  const onScroll = () => {
    const y = window.scrollY;
    if (y > 60) {
      nav.classList.add('nav-scrolled');
    } else {
      nav.classList.remove('nav-scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

initHeroNav();


// ==================== ANIMATION D'APPARITION AU SCROLL ====================

function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}

initReveal();


// ==================== LIGHTBOX PRODUIT (image 4K plein écran d'abord) ====================

function initProductLightbox() {
  const lightbox = document.getElementById('productLightbox');
  if (!lightbox) return;

  const closeBtn = document.getElementById('lightboxClose');
  const imageWrap = document.getElementById('lightboxWrap');
  const imgA = document.getElementById('lightboxImage');
  const imgB = document.getElementById('lightboxImageNext');
  const cta = document.getElementById('lightboxCta');
  const lbName = document.getElementById('lbName');
  const lbPrice = document.getElementById('lbPrice');
  const ctaLink = document.getElementById('lbCtaLink');

  const INTERVAL = 3500;
  let gallery = [];
  let index = 0;
  let timer = null;
  let current = 'A'; // calque actuellement affiché

  function setImage(src) {
    // Fait basculer sur l'autre calque : l'ancien se fond dans le nouveau
    if (current === 'A') {
      imgB.src = src;
      imgB.alt = lbName.textContent || 'Image produit';
      imgA.classList.remove('active');
      imgB.classList.add('active');
      current = 'B';
    } else {
      imgA.src = src;
      imgA.alt = lbName.textContent || 'Image produit';
      imgB.classList.remove('active');
      imgA.classList.add('active');
      current = 'A';
    }
    if (window.applyPaletteToElement) applyPaletteToElement(cta, src);
  }

  function resetLayers() {
    current = 'A';
    imgA.classList.add('active');
    imgB.classList.remove('active');
    imgA.src = '';
    imgB.src = '';
    imageWrap.classList.remove('zoom-in');
    void imageWrap.offsetWidth;
    imageWrap.classList.add('zoom-in');
  }

  function stopAutoPlay() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function startAutoPlay() {
    stopAutoPlay();
    timer = setInterval(() => {
      if (!gallery.length) return;
      index = (index + 1) % gallery.length;
      setImage(gallery[index]);
    }, INTERVAL);
  }

  function openProduct(product) {
    gallery = (Array.isArray(product.gallery) && product.gallery.length) ? product.gallery : [product.image];
    index = 0;

    imgA.alt = product.name;
    lbName.textContent = product.name;
    lbPrice.textContent = (typeof product.price === 'number')
      ? product.price.toLocaleString('fr-FR') + ' BIF'
      : product.price;

    // Le bouton envoie vers la page réelle de la fiche technique
    ctaLink.setAttribute('href', 'produit.html?id=' + product.id);

    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    resetLayers();
    setImage(gallery[0]);
    startAutoPlay();
  }

  function closeLightbox() {
    stopAutoPlay();
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.category-card[data-id]').forEach((card) => {
    card.addEventListener('click', () => {
      const id = parseInt(card.getAttribute('data-id'), 10);
      const prod = (typeof pixelProducts !== 'undefined' ? pixelProducts : []).find(p => p.id === id);
      if (prod) openProduct(prod);
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
}

initProductLightbox();