// ==================== PAGE CATÉGORIES ====================
// Vue par catégorie : sélecteur (pills) + grille de produits filtrables.
// La catégorie ne mène pas sur le Store : on reste sur la page, les produits
// pointent vers leur fiche (produit.html?id=...).
// Supporte ?categorie=slug dans l'URL (ex. categories.html?categorie=ordinateurs).

const catGrid = document.getElementById('products-grid');
const catResultsCount = document.getElementById('results-count');
const catNoResults = document.getElementById('no-results');
const catPills = document.getElementById('category-pills');
const catSort = document.getElementById('sort-select');
const catTitle = document.getElementById('page-title');
const catSubtitle = document.getElementById('page-subtitle');

// Ordre d'affichage préféré (sinon ordre du catalogue).
const CATEGORY_ORDER = ['ordinateurs', 'claviers', 'souris', 'ecrans', 'casques', 'composants'];

// Libellés propres de secours si les noms Supabase ne sont pas disponibles.
const CATEGORY_LABELS = {
  ordinateurs: 'Ordinateurs',
  claviers: 'Claviers',
  souris: 'Souris',
  ecrans: 'Écrans',
  casques: 'Casques',
  composants: 'Composants'
};

let catCatalog = [];
let categoryOptions = [];
let currentCategory = 'all';

function catLabel(slug) {
  return CATEGORY_LABELS[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
}

function catLabelFor(slug) {
  const opt = categoryOptions.find(function (o) { return o.slug === slug; });
  return opt ? opt.name : catLabel(slug);
}

function formatCatPrice(price) {
  return Number(price).toLocaleString('fr-FR');
}

function renderCategoryPills() {
  if (!catPills) return;
  const all = [{ slug: 'all', name: 'Tous les produits' }];
  catPills.innerHTML = all.concat(categoryOptions).map(function (c) {
    return '<button type="button" class="category-pill' + (currentCategory === c.slug ? ' active' : '') +
      '" data-slug="' + c.slug + '">' + c.name + '</button>';
  }).join('');
}

function renderCatProducts(list) {
  if (!catGrid) return;
  catGrid.innerHTML = '';

  if (catResultsCount) catResultsCount.textContent = list.length;

  if (list.length === 0) {
    if (catNoResults) catNoResults.style.display = 'block';
    return;
  }
  if (catNoResults) catNoResults.style.display = 'none';

  list.forEach(function (product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('role', 'link');
    card.setAttribute('tabindex', '0');
    card.dataset.id = product.id;

    const isFav = typeof PixelWishlist !== 'undefined' && PixelWishlist.has(product.id);

    let badgeHTML = '';
    if (!product.inStock) {
      badgeHTML = '<span class="product-badge out-of-stock">Rupture</span>';
    } else if (product.oldPrice) {
      badgeHTML = '<span class="product-badge">Promo</span>';
    }

    const priceHTML = product.oldPrice
      ? '<span class="price-old">' + formatCatPrice(product.oldPrice) + ' BIF</span>' +
        '<span class="price-current">' + formatCatPrice(product.price) + ' BIF</span>'
      : '<span class="price-current">' + formatCatPrice(product.price) + ' BIF</span>';

    card.innerHTML =
      '<div class="product-image">' +
        badgeHTML +
        '<div class="product-wishlist' + (isFav ? ' is-active' : '') + '" data-wish-id="' + product.id + '" aria-label="Ajouter aux favoris">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="' + (isFav ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2">' +
            '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>' +
          '</svg>' +
        '</div>' +
        '<img src="' + product.image + '" alt="' + product.name + '">' +
      '</div>' +
      '<div class="product-info">' +
        '<p class="product-category">' + catLabelFor(product.category) + '</p>' +
        '<h3 class="product-name">' + product.name + '</h3>' +
        '<div class="product-rating">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">' +
            '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>' +
          '</svg>' +
          '<span>' + product.rating + '</span>' +
        '</div>' +
        '<div class="product-price">' + priceHTML + '</div>' +
        '<button class="btn-add-cart" data-id="' + product.id + '"' + (!product.inStock ? ' disabled' : '') + '>' +
          (product.inStock ? 'Ajouter au panier' : 'Indisponible') +
        '</button>' +
      '</div>';

    catGrid.appendChild(card);
  });
}

function applyCategoryFilter() {
  let list = catCatalog.slice();
  if (currentCategory !== 'all') {
    list = list.filter(function (p) { return p.category === currentCategory; });
  }

  const sortValue = catSort ? catSort.value : 'default';
  if (sortValue === 'price-asc') {
    list.sort(function (a, b) { return a.price - b.price; });
  } else if (sortValue === 'price-desc') {
    list.sort(function (a, b) { return b.price - a.price; });
  } else if (sortValue === 'name-asc') {
    list.sort(function (a, b) { return a.name.localeCompare(b.name); });
  } else if (sortValue === 'rating-desc') {
    list.sort(function (a, b) { return b.rating - a.rating; });
  }

  if (catTitle) {
    catTitle.textContent = currentCategory === 'all' ? 'Nos catégories' : catLabelFor(currentCategory);
  }
  if (catSubtitle) {
    catSubtitle.textContent = currentCategory === 'all'
      ? 'Parcourez nos produits par catégorie'
      : 'Tous les produits de la catégorie « ' + catLabelFor(currentCategory) + ' »';
  }

  renderCatProducts(list);
}

// ==================== ÉCOUTEURS D'ÉVÉNEMENTS ====================
if (catPills) {
  catPills.addEventListener('click', function (e) {
    const btn = e.target.closest('.category-pill');
    if (!btn || btn.classList.contains('active')) return;
    currentCategory = btn.getAttribute('data-slug');

    // Met à jour l'URL pour que le lien soit partageable.
    const search = new URLSearchParams(location.search);
    if (currentCategory === 'all') {
      search.delete('categorie');
    } else {
      search.set('categorie', currentCategory);
    }
    const qs = search.toString();
    history.replaceState(null, '', qs ? '?' + qs : location.pathname);

    renderCategoryPills();
    applyCategoryFilter();
  });
}

if (catSort) {
  catSort.addEventListener('change', applyCategoryFilter);
}

// Clic sur une carte produit → fiche technique
if (catGrid) {
  catGrid.addEventListener('click', function (e) {
    if (e.target.closest('.btn-add-cart')) return;

    if (e.target.closest('.product-wishlist')) {
      e.stopPropagation();
      const btn = e.target.closest('.product-wishlist');
      const pid = Number(btn.dataset.wishId);
      if (!pid || typeof PixelWishlist === 'undefined') return;
      const added = PixelWishlist.toggle(pid);
      const svg = btn.querySelector('svg');
      svg.setAttribute('fill', added ? 'currentColor' : 'none');
      btn.classList.toggle('is-active', added);
      return;
    }

    const card = e.target.closest('.product-card');
    if (card && card.dataset.id) {
      window.location.href = 'produit.html?id=' + card.dataset.id;
    }
  });

  // Support clavier (Entrée/Espace)
  catGrid.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.product-card');
      if (card && card.dataset.id && !e.target.closest('.product-wishlist') && !e.target.closest('.btn-add-cart')) {
        e.preventDefault();
        window.location.href = 'produit.html?id=' + card.dataset.id;
      }
    }
  });
}

// ==================== INITIALISATION ====================
async function loadCategoriesPage() {
  // Charge le catalogue (Supabase d'abord, sinon données locales).
  catCatalog = await getCatalogProducts();

  // Synchronise le tableau global pour que le panier trouve les produits
  // (même comportement que filters.js sur catalogue.html).
  try {
    if (typeof products !== 'undefined' && Array.isArray(products)) {
      products.length = 0;
      catCatalog.forEach(function (p) { products.push(p); });
    }
  } catch (e) { /* silencieux */ }

  // Catégories réellement présentes dans le catalogue (ordre d'affichage stable).
  const used = [];
  catCatalog.forEach(function (p) {
    if (p.category && used.indexOf(p.category) === -1) used.push(p.category);
  });

  // Noms propres depuis Supabase quand dispo (sinon libellés de secours).
  // En repli local, getCategories() renvoie name === slug : on préfère alors
  // le libellé lisible (catLabel) au slug brut.
  const names = {};
  try {
    const db = await getCategories();
    if (Array.isArray(db)) db.forEach(function (c) { names[c.slug] = c.name; });
  } catch (e) { /* silencieux */ }

  categoryOptions = used.slice().sort(function (a, b) {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  }).map(function (slug) {
    const n = names[slug];
    return { slug: slug, name: (n && n !== slug) ? n : catLabel(slug) };
  });

  // Présélection via l'URL ?categorie=slug (liens du footer par exemple).
  const fromUrl = new URLSearchParams(location.search).get('categorie');
  if (fromUrl && categoryOptions.some(function (o) { return o.slug === fromUrl; })) {
    currentCategory = fromUrl;
  }

  renderCategoryPills();
  applyCategoryFilter();
}

loadCategoriesPage();