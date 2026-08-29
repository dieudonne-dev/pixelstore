// ==================== PAGE FICHE TECHNIQUE (produit.html) ====================
// Charge le produit depuis l'URL (?id=...), affiche toutes les informations,
// le certificat, la quantité disponible, et permet l'ajout au panier.

(function () {
  // ---------- Utilitaires ----------
  function getProductIdFromUrl() {
    return parseInt(new URLSearchParams(window.location.search).get('id'), 10);
  }

  function formatPrice(n) {
    if (typeof n !== 'number') return '—';
    return n.toLocaleString('fr-FR') + ' BIF';
  }

  function starsHTML(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="${rating >= i - 0.25 ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>`;
    }
    html += `<span>${rating ? rating.toFixed(1) : '—'}</span>`;
    return html;
  }

  // ---------- Récupération du produit ----------
  const product = (typeof pixelProducts !== 'undefined' ? pixelProducts : [])
    .find(p => p.id === getProductIdFromUrl());

  const $ = (id) => document.getElementById(id);

  // ---------- Produit introuvable ----------
  if (!product) {
    document.title = 'Produit introuvable - PixelStore';
    const crumbs = $('crumb-name');
    if (crumbs) crumbs.textContent = 'Produit introuvable';
    const showcase = document.querySelector('.product-showcase');
    if (showcase) {
      showcase.innerHTML = `
        <div class="container pd-notfound">
          <h2>Produit introuvable</h2>
          <p>Ce produit n'existe pas ou n'est plus disponible.</p>
          <a href="catalogue.html" class="btn btn-primary">Voir le catalogue</a>
          <a href="index.html" class="btn btn-secondary">Retour à l'accueil</a>
        </div>`;
    }
    const fiche = $('fiche-technique');
    const related = document.querySelector('.related-section');
    if (fiche) fiche.style.display = 'none';
    if (related) related.style.display = 'none';
    return;
  }

  // ---------- Remplissage de la page ----------
  document.title = `${product.name} - Fiche technique - PixelStore`;
  $('crumb-name').textContent = product.name;

  // ---------- Galerie d'images ----------
  const gallery = (Array.isArray(product.gallery) && product.gallery.length) ? product.gallery : [product.image];

  function setMainImage(src) {
    $('pd-image').src = src;
    $('pd-image').alt = product.name;
    // Réapplique la palette de couleurs de la nouvelle image sur la fiche
    if (window.applyPaletteToElement) applyPaletteToElement($('fichePanel'), src);
  }

  const thumbsEl = $('pd-thumbs');
  if (thumbsEl) {
    thumbsEl.innerHTML = gallery.map((img, i) => `
      <button type="button" class="gallery-thumb${i === 0 ? ' active' : ''}" data-index="${i}" aria-label="Image ${i + 1} de ${product.name}">
        <img src="${img}" alt="${product.name} — image ${i + 1}">
      </button>`).join('');

    thumbsEl.addEventListener('click', (e) => {
      const thumb = e.target.closest('.gallery-thumb');
      if (!thumb) return;
      const src = gallery[parseInt(thumb.getAttribute('data-index'), 10)];
      if (!src) return;
      thumbsEl.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      setMainImage(src);
    });

    setMainImage(product.image);
  } else {
    $('pd-image').src = product.image;
    $('pd-image').alt = product.name;
  }

  $('pd-tag').textContent = product.tag;
  $('pd-brand').textContent = product.brand;
  $('pd-name').textContent = product.name;
  $('pd-rating').innerHTML = starsHTML(product.rating);
  $('pd-ref').textContent = product.reference;
  $('pd-desc').textContent = product.desc;
  $('pd-price').textContent = formatPrice(product.price);
  $('pd-old-price').textContent = product.oldPrice ? formatPrice(product.oldPrice) : '';
  $('pd-model').textContent = product.name;
  $('pd-warranty-perk').textContent = product.warranty;
  $('pd-warranty').textContent = product.warranty;

  // Quantité disponible
  const stockEl = $('pd-stock');
  $('pd-add-cart').setAttribute('data-id', product.id);

  if (product.stock > 0) {
    stockEl.innerHTML = `
      <span class="stock-dot"></span>
      <span>En stock — <strong>${product.stock} disponibles</strong></span>`;
  } else {
    stockEl.innerHTML = '<span class="stock-dot stock-out"></span><span>Rupture de stock</span>';
    $('pd-add-cart').disabled = true;
    $('pd-add-label').textContent = 'Indisponible';
  }

  // Liste des specs
  $('pd-specs').innerHTML = product.specs
    .map(([label, value]) => `<li><span>${label}</span><strong>${value}</strong></li>`)
    .join('');

  // Certificat
  if (product.cert) {
    $('pd-cert-title').textContent = product.cert.title;
    $('pd-cert-no').textContent = product.cert.number;
    $('pd-cert-authority').textContent = product.cert.authority;
    $('pd-cert-date').textContent = product.cert.date;
    $('pd-cert-points').innerHTML = product.cert.points
      .map(p => `<li><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg><span>${p}</span></li>`)
      .join('');
  }

  // ---------- Couleurs dynamiques : fiche technique assortie à l'image ----------
  if (window.applyPaletteToElement) {
    applyPaletteToElement($('fichePanel'), product.image);
  }

  // ---------- Sélecteur de quantité ----------
  const qtyInput = $('qty-input');
  const addBtn = $('pd-add-cart');
  const maxQty = Math.max(1, product.stock || 99);

  function syncQty() {
    let val = parseInt(qtyInput.value, 10) || 1;
    val = Math.max(1, Math.min(val, maxQty));
    qtyInput.value = val;
    if (addBtn) addBtn.setAttribute('data-qty', val);
  }

  $('qty-minus').addEventListener('click', () => {
    qtyInput.value = (parseInt(qtyInput.value, 10) || 1) - 1;
    syncQty();
  });
  $('qty-plus').addEventListener('click', () => {
    qtyInput.value = (parseInt(qtyInput.value, 10) || 1) + 1;
    syncQty();
  });
  qtyInput.addEventListener('input', syncQty);
  qtyInput.addEventListener('change', syncQty);
  syncQty();

  // ---------- Produits similaires ----------
  const relatedGrid = $('related-grid');
  const others = (typeof pixelProducts !== 'undefined' ? pixelProducts : []).filter(p => p.id !== product.id).slice(0, 3);

  if (others.length) {
    relatedGrid.innerHTML = others.map(p => `
      <a href="produit.html?id=${p.id}" class="related-card reveal">
        <div class="related-image">
          <img src="${p.image}" alt="${p.name}">
        </div>
        <div class="related-info">
          <span class="related-tag">${p.tag}</span>
          <h3>${p.name}</h3>
          <strong>${formatPrice(p.price)}</strong>
          <span class="related-link">Voir la fiche technique
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </span>
        </div>
      </a>`).join('');
  } else {
    const relatedSection = document.querySelector('.related-section');
    if (relatedSection) relatedSection.style.display = 'none';
  }
})();