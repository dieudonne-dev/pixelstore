// ==========================================================================
// PIXELSTORE — WISHLIST / FAVORIS (localStorage)
// ==========================================================================

const PixelWishlist = (function () {
  const STORAGE_KEY = 'pixelstore_wishlist';

  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) { return []; }
  }

  function save(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function has(productId) {
    return getAll().indexOf(productId) !== -1;
  }

  function toggle(productId) {
    var list = getAll();
    var idx = list.indexOf(productId);
    if (idx === -1) {
      list.push(productId);
    } else {
      list.splice(idx, 1);
    }
    save(list);
    updateBadge();
    return idx === -1;
  }

  function count() {
    return getAll().length;
  }

  function updateBadge() {
    var badges = document.querySelectorAll('.wishlist-count');
    var n = count();
    badges.forEach(function (el) {
      el.textContent = n;
      el.style.display = n > 0 ? 'flex' : 'none';
    });
  }

  return { getAll: getAll, has: has, toggle: toggle, count: count, updateBadge: updateBadge };
})();

document.addEventListener('DOMContentLoaded', function () { PixelWishlist.updateBadge(); });
