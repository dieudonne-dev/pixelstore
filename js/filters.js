// ==================== RENDU DES PRODUITS ====================
// Cette fonction prend un tableau de produits et génère les cartes HTML
// correspondantes dans la grille. Elle est appelée à chaque fois qu'un
// filtre change, pour rafraîchir l'affichage.

const productsGrid = document.getElementById('products-grid');
const resultsCount = document.getElementById('results-count');
const noResults = document.getElementById('no-results');

function formatPrice(price) {
  // Formate le prix avec des espaces comme séparateurs de milliers (ex: 850000 -> "850 000")
  return price.toLocaleString('fr-FR');
}

function renderProducts(list) {
  // Vide la grille avant de la remplir à nouveau
  productsGrid.innerHTML = '';

  // Met à jour le compteur de résultats
  resultsCount.textContent = list.length;

  // Si aucun produit ne correspond aux filtres, affiche le message et arrête
  if (list.length === 0) {
    noResults.style.display = 'block';
    return;
  } else {
    noResults.style.display = 'none';
  }

  // Génère une carte HTML pour chaque produit
  list.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';

    // Construit le badge (Promo si oldPrice existe, ou Rupture si hors stock)
    let badgeHTML = '';
    if (!product.inStock) {
      badgeHTML = '<span class="product-badge out-of-stock">Rupture</span>';
    } else if (product.oldPrice) {
      badgeHTML = '<span class="product-badge">Promo</span>';
    }

    // Construit le bloc prix (barré + réel, ou juste le prix si pas de promo)
    const priceHTML = product.oldPrice
      ? `<span class="price-old">${formatPrice(product.oldPrice)} BIF</span>
         <span class="price-current">${formatPrice(product.price)} BIF</span>`
      : `<span class="price-current">${formatPrice(product.price)} BIF</span>`;

    card.innerHTML = `
      <div class="product-image">
        ${badgeHTML}
        <div class="product-wishlist" aria-label="Ajouter aux favoris">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </div>
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="product-info">
        <p class="product-category">${product.category}</p>
        <h3 class="product-name">${product.name}</h3>
        <div class="product-rating">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <span>${product.rating}</span>
        </div>
        <div class="product-price">
          ${priceHTML}
        </div>
        <button class="btn-add-cart" data-id="${product.id}" ${!product.inStock ? 'disabled' : ''}>
          ${product.inStock ? 'Ajouter au panier' : 'Indisponible'}
        </button>
      </div>
    `;

    productsGrid.appendChild(card);
  });
}

// ==================== LOGIQUE DE FILTRAGE ====================
// Récupère les éléments de filtre du DOM
const searchInput = document.getElementById('search-input');
const categoryFilters = document.getElementById('category-filters');
const brandFilters = document.getElementById('brand-filters');
const priceRange = document.getElementById('price-range');
const priceValue = document.getElementById('price-value');
const stockFilter = document.getElementById('stock-filter');
const sortSelect = document.getElementById('sort-select');
const resetBtn = document.getElementById('reset-filters');

function applyFilters() {
  let filtered = [...products]; // copie du tableau original

  // 1. Filtre recherche (nom du produit)
  const searchTerm = searchInput.value.toLowerCase().trim();
  if (searchTerm) {
    filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm));
  }

  // 2. Filtre catégorie (coché "Toutes" = pas de filtre appliqué)
  const checkedCategories = Array.from(
    categoryFilters.querySelectorAll('input:checked')
  ).map(input => input.value);

  if (!checkedCategories.includes('all') && checkedCategories.length > 0) {
    filtered = filtered.filter(p => checkedCategories.includes(p.category));
  }

  // 3. Filtre marque (si aucune marque cochée, on ne filtre pas)
  const checkedBrands = Array.from(
    brandFilters.querySelectorAll('input:checked')
  ).map(input => input.value);

  if (checkedBrands.length > 0) {
    filtered = filtered.filter(p => checkedBrands.includes(p.brand));
  }

  // 4. Filtre prix maximum
  const maxPrice = parseInt(priceRange.value);
  filtered = filtered.filter(p => p.price <= maxPrice);

  // 5. Filtre disponibilité
  if (stockFilter.checked) {
    filtered = filtered.filter(p => p.inStock);
  }

  // 6. Tri
  const sortValue = sortSelect.value;
  if (sortValue === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortValue === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortValue === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortValue === 'rating-desc') {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  renderProducts(filtered);
}

// ==================== GESTION SPÉCIALE : CATÉGORIE "TOUTES" ====================
// Si l'utilisateur coche une catégorie précise, on décoche "Toutes"
// Si l'utilisateur coche "Toutes", on décoche les catégories précises
categoryFilters.addEventListener('change', (e) => {
  const allCheckbox = categoryFilters.querySelector('input[value="all"]');
  const otherCheckboxes = Array.from(categoryFilters.querySelectorAll('input:not([value="all"])'));

  if (e.target.value === 'all' && e.target.checked) {
    otherCheckboxes.forEach(cb => cb.checked = false);
  } else if (e.target.value !== 'all' && e.target.checked) {
    allCheckbox.checked = false;
  } else if (otherCheckboxes.every(cb => !cb.checked)) {
    // Si plus aucune catégorie précise n'est cochée, recoche "Toutes" automatiquement
    allCheckbox.checked = true;
  }

  applyFilters();
});

// ==================== ÉCOUTEURS D'ÉVÉNEMENTS ====================
searchInput.addEventListener('input', applyFilters);
brandFilters.addEventListener('change', applyFilters);
stockFilter.addEventListener('change', applyFilters);
sortSelect.addEventListener('change', applyFilters);

priceRange.addEventListener('input', () => {
  priceValue.textContent = formatPrice(parseInt(priceRange.value));
  applyFilters();
});

// Réinitialisation de tous les filtres
resetBtn.addEventListener('click', () => {
  searchInput.value = '';
  categoryFilters.querySelector('input[value="all"]').checked = true;
  categoryFilters.querySelectorAll('input:not([value="all"])').forEach(cb => cb.checked = false);
  brandFilters.querySelectorAll('input').forEach(cb => cb.checked = false);
  priceRange.value = 1000000;
  priceValue.textContent = '1 000 000';
  stockFilter.checked = false;
  sortSelect.value = 'default';
  applyFilters();
});

// ==================== INITIALISATION ====================
// Affiche tous les produits au chargement initial de la page
renderProducts(products);