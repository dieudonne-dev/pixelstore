// ==================== GESTION DU PANIER ====================
// Le panier est stocké dans localStorage sous forme de tableau d'objets :
// [{ id, name, price, image, quantity }, ...]
// Ça permet au panier de survivre à un rechargement de page ou une fermeture d'onglet.

const cartCountEl = document.getElementById('cart-count');

// Récupère le panier depuis localStorage (ou tableau vide si rien n'existe encore)
function getCart() {
  const cart = localStorage.getItem('pixelstore_cart');
  return cart ? JSON.parse(cart) : [];
}

// Sauvegarde le panier dans localStorage
function saveCart(cart) {
  localStorage.setItem('pixelstore_cart', JSON.stringify(cart));
  updateCartBadge();
}

// Met à jour le petit badge rouge du panier dans le header (nombre d'articles)
function updateCartBadge() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCountEl) {
    cartCountEl.textContent = totalItems;
  }
}

// Ajoute un produit au panier (ou augmente sa quantité s'il y est déjà)
function addToCart(productId, quantity = 1) {
  // Trouve le produit complet grâce à son id (catalogue ou produits PixelStore)
  let product = (typeof products !== 'undefined' ? products : [])
    .find(p => p.id === parseInt(productId));
  if (!product && typeof pixelProducts !== 'undefined') {
    product = pixelProducts.find(p => p.id === parseInt(productId));
  }
  if (!product) return;

  const cart = getCart();
  const existingItem = cart.find(item => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantity
    });
  }

  saveCart(cart);
  showCartConfirmation(product.name);
}

// Petite notification visuelle temporaire quand un produit est ajouté
function showCartConfirmation(productName) {
  const toast = document.createElement('div');
  toast.className = 'cart-toast';
  toast.textContent = `${productName} ajouté au panier`;
  document.body.appendChild(toast);

  // Déclenche l'animation d'apparition
  setTimeout(() => toast.classList.add('show'), 10);

  // Retire la notification après 2.5 secondes
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ==================== ÉCOUTEUR SUR LES BOUTONS "AJOUTER AU PANIER" ====================
// Comme les boutons sont générés dynamiquement (dans filters.js), on ne peut pas
// leur attacher un écouteur directement au chargement de la page.
// On utilise donc la délégation d'événements : on écoute les clics sur toute
// la grille, et on vérifie si l'élément cliqué est un bouton "ajouter au panier".

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-add-cart');
  if (btn && !btn.disabled) {
    const productId = btn.getAttribute('data-id');
    const qty = parseInt(btn.getAttribute('data-qty') || '1', 10) || 1;
    addToCart(productId, qty);
  }
});

// ==================== INITIALISATION ====================
// Met à jour le badge dès le chargement de n'importe quelle page
updateCartBadge();


// ==================== RENDU DE LA PAGE PANIER ====================
// Ce bloc ne s'exécute que si on est sur panier.html (les éléments existent dans le DOM)

const cartItemsContainer = document.getElementById('cart-items');
const cartLayout = document.getElementById('cart-layout');
const cartEmpty = document.getElementById('cart-empty');
const summarySubtotal = document.getElementById('summary-subtotal');
const summaryTotal = document.getElementById('summary-total');

const SHIPPING_COST = 5000; // frais de livraison fixes

function formatCartPrice(price) {
  return price.toLocaleString('fr-FR') + ' BIF';
}

function renderCartPage() {
  if (!cartItemsContainer) return; // on n'est pas sur panier.html, on arrête

  const cart = getCart();

  // Si le panier est vide, on cache le layout et on affiche le message vide
  if (cart.length === 0) {
    cartLayout.style.display = 'none';
    cartEmpty.style.display = 'block';
    return;
  }

  cartLayout.style.display = 'grid';
  cartEmpty.style.display = 'none';

  // Génère une ligne par article du panier
  cartItemsContainer.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-image">
        <img src="${item.image}" alt="${item.name}">
      </div>
      <div>
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-price">${formatCartPrice(item.price)}</p>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn qty-decrease" data-id="${item.id}">−</button>
        <span class="qty-value">${item.quantity}</span>
        <button class="qty-btn qty-increase" data-id="${item.id}">+</button>
      </div>
      <span class="cart-item-total">${formatCartPrice(item.price * item.quantity)}</span>
      <button class="cart-item-remove" data-id="${item.id}" aria-label="Supprimer">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `).join('');

  // Calcule et affiche le résumé (sous-total + livraison + total)
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + SHIPPING_COST;

  summarySubtotal.textContent = formatCartPrice(subtotal);
  summaryTotal.textContent = formatCartPrice(total);
}

// Augmente la quantité d'un article
function increaseQty(productId) {
  const cart = getCart();
  const item = cart.find(i => i.id === parseInt(productId));
  if (item) item.quantity += 1;
  saveCart(cart);
  renderCartPage();
}

// Diminue la quantité d'un article (le supprime si ça atteint 0)
function decreaseQty(productId) {
  const cart = getCart();
  const item = cart.find(i => i.id === parseInt(productId));
  if (item) {
    item.quantity -= 1;
    if (item.quantity <= 0) {
      removeFromCart(productId);
      return;
    }
  }
  saveCart(cart);
  renderCartPage();
}

// Supprime complètement un article du panier
function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(i => i.id !== parseInt(productId));
  saveCart(cart);
  renderCartPage();
}

// Délégation d'événements pour les boutons +/- et supprimer
if (cartItemsContainer) {
  cartItemsContainer.addEventListener('click', (e) => {
    const id = e.target.closest('button')?.getAttribute('data-id');
    if (!id) return;

    if (e.target.closest('.qty-increase')) {
      increaseQty(id);
    } else if (e.target.closest('.qty-decrease')) {
      decreaseQty(id);
    } else if (e.target.closest('.cart-item-remove')) {
      removeFromCart(id);
    }
  });
}

// Lance le rendu au chargement de la page
renderCartPage();