// ==================== BASE DE DONNÉES PRODUITS ====================
// Tableau contenant tous les produits du catalogue.
// En conditions réelles, ces données viendraient d'une API/base de données.
// Ici, on les stocke en JS pur puisque le site est 100% frontend.

const products = [
  {
    id: 1,
    name: "Laptop Pro 15 Ultra",
    category: "ordinateurs",
    brand: "Dell",
    price: 850000,
    oldPrice: 950000,
    image: "img/products/1496181133206-80ce9b88a853.jpg",
    inStock: true,
    rating: 4.8
  },
  {
    id: 2,
    name: "UltraBook Air 14",
    category: "ordinateurs",
    brand: "HP",
    price: 720000,
    oldPrice: null,
    image: "img/products/1517336714731-489689fd1ca8.jpg",
    inStock: true,
    rating: 4.5
  },
  {
    id: 3,
    name: "Clavier Mécanique RGB",
    category: "claviers",
    brand: "Logitech",
    price: 65000,
    oldPrice: 85000,
    image: "img/products/1587829741301-dc798b83add3.jpg",
    inStock: true,
    rating: 4.7
  },
  {
    id: 4,
    name: "Clavier Sans Fil Compact",
    category: "claviers",
    brand: "Logitech",
    price: 38000,
    oldPrice: null,
    image: "img/products/1618384887929-16ec33fab9ef.jpg",
    inStock: true,
    rating: 4.3
  },
  {
    id: 5,
    name: "Souris Gaming Pro",
    category: "souris",
    brand: "Razer",
    price: 45000,
    oldPrice: 58000,
    image: "img/products/1527864550417-7fd91fc51a46.jpg",
    inStock: true,
    rating: 4.6
  },
  {
    id: 6,
    name: "Souris Ergonomique",
    category: "souris",
    brand: "HP",
    price: 25000,
    oldPrice: null,
    image: "img/products/1615663245857-ac93bb7c39e7.jpg",
    inStock: false,
    rating: 4.2
  },
  {
    id: 7,
    name: "Écran 27\" 4K UHD",
    category: "ecrans",
    brand: "Samsung",
    price: 320000,
    oldPrice: 380000,
    image: "img/products/1527443224154-c4a3942d3acf.jpg",
    inStock: true,
    rating: 4.9
  },
  {
    id: 8,
    name: "Moniteur Gaming 24\" 144Hz",
    category: "ecrans",
    brand: "Dell",
    price: 245000,
    oldPrice: null,
    image: "img/products/1551645120-d70bfe84c826.jpg",
    inStock: true,
    rating: 4.6
  },
  {
    id: 9,
    name: "Casque Gaming Surround",
    category: "casques",
    brand: "Razer",
    price: 55000,
    oldPrice: 70000,
    image: "img/products/1505740420928-5e560c06d30e.jpg",
    inStock: true,
    rating: 4.7
  },
  {
    id: 10,
    name: "Casque Bluetooth Confort",
    category: "casques",
    brand: "Sony",
    price: 48000,
    oldPrice: null,
    image: "img/products/1546435770-a3e426bf472b.jpg",
    inStock: true,
    rating: 4.4
  },
  {
    id: 11,
    name: "SSD NVMe 1TB",
    category: "composants",
    brand: "Samsung",
    price: 95000,
    oldPrice: 110000,
    image: "img/products/1591370874773-6702e8f12fd8.jpg",
    inStock: true,
    rating: 4.8
  },
  {
    id: 12,
    name: "Carte Graphique RTX",
    category: "composants",
    brand: "Dell",
    price: 580000,
    oldPrice: null,
    image: "img/products/1591488320449-011701bb6704.jpg",
    inStock: false,
    rating: 4.9
  }
];