-- ============================================================
-- PIXELSTORE (tech-store) : Schéma SQL complet (MySQL / MariaDB)
-- Site e-commerce de matériel informatique (BIF - Francs burundais)
-- Flux complet : users (admin + users), catalogue, stock, commandes
-- Moteur : InnoDB  |  Charset : utf8mb4  |  Devise : BIF
-- Correspond au frontend existant (products.js, filters.js, cart.js)
-- ============================================================
CREATE DATABASE IF NOT EXISTS pixelstore
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pixelstore;

-- ============================================================
-- 1. GESTION DES UTILISATEURS
-- ============================================================

-- Utilisateurs (admin + simple users)
CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(30)  DEFAULT NULL,
  role          ENUM('admin','user') NOT NULL DEFAULT 'user',  -- admin | simple user
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  email_verified_at DATETIME DEFAULT NULL,
  last_login    DATETIME DEFAULT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- Adresses de livraison / facturation
CREATE TABLE addresses (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED NOT NULL,
  address_line1  VARCHAR(255) NOT NULL,
  address_line2  VARCHAR(255) DEFAULT NULL,
  city           VARCHAR(100) NOT NULL,          -- ex: Bujumbura
  province       VARCHAR(100) DEFAULT NULL,
  country        VARCHAR(100) NOT NULL DEFAULT 'Burundi',
  phone          VARCHAR(30) DEFAULT NULL,
  is_default     TINYINT(1) NOT NULL DEFAULT 0,
  type           ENUM('shipping','billing') NOT NULL DEFAULT 'shipping',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_address_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_address_user (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- 2. CATALOGUE PRODUITS
-- ============================================================

-- Catégories (correspondent aux filtres du frontend)
CREATE TABLE categories (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL UNIQUE,
  slug         VARCHAR(110) NOT NULL UNIQUE,
  parent_id    INT UNSIGNED DEFAULT NULL,        -- sous-catégories
  image_url    VARCHAR(255) DEFAULT NULL,
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_category_parent FOREIGN KEY (parent_id)
    REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Marques (correspondent aux filtres du frontend)
CREATE TABLE brands (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  slug       VARCHAR(110) NOT NULL UNIQUE,
  logo_url   VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Produits (les champs correspondent à products.js)
CREATE TABLE products (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id       INT UNSIGNED NOT NULL,
  brand_id          INT UNSIGNED DEFAULT NULL,
  name              VARCHAR(255) NOT NULL,
  slug              VARCHAR(280) NOT NULL UNIQUE,
  sku               VARCHAR(100) DEFAULT NULL,
  description       TEXT DEFAULT NULL,
  image_url         VARCHAR(255) DEFAULT NULL,    -- image principale
  price             DECIMAL(12,2) NOT NULL,       -- prix BIF (ex: 850000)
  old_price         DECIMAL(12,2) DEFAULT NULL,   -- ancien prix -> badge "Promo"
  in_stock          TINYINT(1) NOT NULL DEFAULT 1, -- badge "Rupture"
  rating            DECIMAL(3,1) NOT NULL DEFAULT 0.0, -- note moyenne (ex: 4.8)
  rating_count      INT UNSIGNED NOT NULL DEFAULT 0,
  is_active         TINYINT(1) NOT NULL DEFAULT 1,
  is_featured       TINYINT(1) NOT NULL DEFAULT 0,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_category FOREIGN KEY (category_id)
    REFERENCES categories(id) ON DELETE RESTRICT,
  CONSTRAINT fk_product_brand FOREIGN KEY (brand_id)
    REFERENCES brands(id) ON DELETE SET NULL,
  INDEX idx_product_category (category_id),
  INDEX idx_product_brand (brand_id),
  INDEX idx_product_price (price),
  INDEX idx_product_active (is_active)
) ENGINE=InnoDB;

-- Galerie d'images supplémentaires d'un produit
CREATE TABLE product_images (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  image_url  VARCHAR(255) NOT NULL,
  alt_text   VARCHAR(255) DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_main    TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_pimage_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_pimage_product (product_id)
) ENGINE=InnoDB;

-- ============================================================
-- 3. GESTION DES STOCKS
-- ============================================================

-- Niveau de stock par produit (avec seuil d'alerte)
CREATE TABLE stock (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id         INT UNSIGNED NOT NULL UNIQUE,
  quantity           INT NOT NULL DEFAULT 0,          -- quantité disponible
  reserved_quantity  INT NOT NULL DEFAULT 0,          -- quantité réservée (paniers/commandes en cours)
  low_stock_threshold INT NOT NULL DEFAULT 5,         -- seuil d'alerte admin
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stock_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Historique des mouvements de stock (entrées / sorties)
CREATE TABLE stock_movements (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id    INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED DEFAULT NULL,     -- admin ayant fait le mouvement
  quantity      INT NOT NULL,                  -- >0 entrée, <0 sortie
  movement_type ENUM('purchase','sale','return','adjustment','restock') NOT NULL,
  reference     VARCHAR(255) DEFAULT NULL,     -- n° commande / bon d'appro
  note          VARCHAR(255) DEFAULT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sm_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_sm_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_sm_product (product_id),
  INDEX idx_sm_created (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 4. PANIER & CODES PROMO
-- ============================================================

-- Panier persisté (sauvegarde serveur en plus du localStorage)
CREATE TABLE carts (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_cart_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE cart_items (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cart_id    INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity   INT NOT NULL DEFAULT 1,
  added_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ci_cart FOREIGN KEY (cart_id)
    REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_ci_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_ci (cart_id, product_id)
) ENGINE=InnoDB;

-- Codes promo
CREATE TABLE coupons (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code             VARCHAR(50) NOT NULL UNIQUE,
  discount_type    ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage',
  discount_value   DECIMAL(12,2) NOT NULL,
  min_order_amount DECIMAL(12,2) DEFAULT NULL,
  max_uses         INT DEFAULT NULL,
  times_used       INT NOT NULL DEFAULT 0,
  starts_at        DATETIME DEFAULT NULL,
  expires_at       DATETIME DEFAULT NULL,
  is_active        TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- Liste de souhaits
CREATE TABLE wishlists (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wish_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wish_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_wish (user_id, product_id)
) ENGINE=InnoDB;

-- ============================================================
-- 5. COMMANDES & PAIEMENTS
-- ============================================================

CREATE TABLE orders (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number        VARCHAR(50) NOT NULL UNIQUE,   -- ex: PS-20260829-00001
  user_id             INT UNSIGNED NOT NULL,
  coupon_id           INT UNSIGNED DEFAULT NULL,
  status              ENUM('pending','confirmed','processing','shipped','delivered','cancelled','refunded')
                      NOT NULL DEFAULT 'pending',
  payment_status      ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  payment_method      ENUM('card','paypal','cod','bank_transfer','mobile_money') DEFAULT NULL,
  shipping_address_id INT UNSIGNED DEFAULT NULL,
  billing_address_id  INT UNSIGNED DEFAULT NULL,
  subtotal            DECIMAL(12,2) NOT NULL DEFAULT 0.00,  -- total hors remise (BIF)
  discount_total      DECIMAL(12,2) NOT NULL DEFAULT 0.00,  -- remise coupon
  shipping_cost       DECIMAL(12,2) NOT NULL DEFAULT 5000,  -- frais de livraison (cf cart.js SHIPPING_COST)
  tax_total           DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  grand_total         DECIMAL(12,2) NOT NULL DEFAULT 0.00,  -- montant final
  customer_notes      TEXT DEFAULT NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_order_coupon FOREIGN KEY (coupon_id)
    REFERENCES coupons(id) ON DELETE SET NULL,
  CONSTRAINT fk_order_ship_addr FOREIGN KEY (shipping_address_id)
    REFERENCES addresses(id) ON DELETE SET NULL,
  CONSTRAINT fk_order_bill_addr FOREIGN KEY (billing_address_id)
    REFERENCES addresses(id) ON DELETE SET NULL,
  INDEX idx_order_user (user_id),
  INDEX idx_order_status (status),
  INDEX idx_order_created (created_at)
) ENGINE=InnoDB;

-- Lignes de commande (le prix est figé au moment de l'achat)
CREATE TABLE order_items (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id      INT UNSIGNED NOT NULL,
  product_id    INT UNSIGNED NOT NULL,
  product_name  VARCHAR(255) NOT NULL,          -- copie du nom
  quantity      INT NOT NULL,
  unit_price    DECIMAL(12,2) NOT NULL,         -- prix unitaire BIF figé
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  subtotal      DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_oi_order FOREIGN KEY (order_id)
    REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_oi_order (order_id),
  INDEX idx_oi_product (product_id)
) ENGINE=InnoDB;

-- Historique du statut d'une commande
CREATE TABLE order_status_history (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id   INT UNSIGNED NOT NULL,
  status     ENUM('pending','confirmed','processing','shipped','delivered','cancelled','refunded') NOT NULL,
  changed_by INT UNSIGNED DEFAULT NULL,          -- admin
  note       VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_osh_order FOREIGN KEY (order_id)
    REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_osh_user FOREIGN KEY (changed_by)
    REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_osh_order (order_id)
) ENGINE=InnoDB;

-- Transactions de paiement
CREATE TABLE payments (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id       INT UNSIGNED NOT NULL,
  transaction_id VARCHAR(100) DEFAULT NULL,     -- ID fournisseur
  amount         DECIMAL(12,2) NOT NULL,
  currency       CHAR(3) NOT NULL DEFAULT 'BIF',
  status         ENUM('pending','success','failed','cancelled','refunded') NOT NULL DEFAULT 'pending',
  gateway        VARCHAR(100) DEFAULT NULL,
  paid_at        DATETIME DEFAULT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pay_order FOREIGN KEY (order_id)
    REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_pay_order (order_id),
  INDEX idx_pay_transaction (transaction_id)
) ENGINE=InnoDB;

-- Avis produits
CREATE TABLE reviews (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  rating     TINYINT NOT NULL,                  -- 1 à 5
  title      VARCHAR(150) DEFAULT NULL,
  comment    TEXT DEFAULT NULL,
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rev_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_rev_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_review (product_id, user_id)
) ENGINE=InnoDB;

-- ============================================================
-- VUES UTILES (dashboards admin)
-- ============================================================

-- Produits disponibles à la vente (stock disponible > 0)
CREATE OR REPLACE VIEW v_products_available AS
SELECT p.id, p.name, p.slug, p.price, p.old_price, p.rating,
       c.name AS category, b.name AS brand,
       (s.quantity - s.reserved_quantity) AS available_qty
FROM products p
JOIN categories c ON c.id = p.category_id
LEFT JOIN brands b ON b.id = p.brand_id
LEFT JOIN stock s ON s.product_id = p.id
WHERE p.is_active = 1
  AND (s.quantity - s.reserved_quantity) > 0;

-- Alerte stock faible (pour l'admin)
CREATE OR REPLACE VIEW v_low_stock AS
SELECT p.id, p.name, p.sku, s.quantity, s.reserved_quantity,
       (s.quantity - s.reserved_quantity) AS available,
       s.low_stock_threshold
FROM products p
JOIN stock s ON s.product_id = p.id
WHERE (s.quantity - s.reserved_quantity) <= s.low_stock_threshold;

-- Résumé des commandes par statut
CREATE OR REPLACE VIEW v_order_summary AS
SELECT status, COUNT(*) AS order_count, COALESCE(SUM(grand_total),0) AS total_amount
FROM orders
GROUP BY status;

-- Chiffre d'affaires total
CREATE OR REPLACE VIEW v_revenue AS
SELECT COALESCE(SUM(grand_total),0) AS total_revenue,
       COUNT(*) AS total_orders
FROM orders
WHERE status NOT IN ('cancelled','refunded');

-- ============================================================
-- PROCÉDURE : créer une commande (décrémente le stock)
-- ============================================================
DELIMITER //
CREATE PROCEDURE create_order(
  IN p_user_id INT UNSIGNED,
  IN p_shipping_address_id INT UNSIGNED,
  IN p_billing_address_id INT UNSIGNED,
  IN p_payment_method ENUM('card','paypal','cod','bank_transfer','mobile_money'),
  IN p_coupon_code VARCHAR(50)
)
BEGIN
  DECLARE v_cart_id INT UNSIGNED;
  DECLARE v_order_id INT UNSIGNED;
  DECLARE v_subtotal DECIMAL(12,2) DEFAULT 0;
  DECLARE v_discount DECIMAL(12,2) DEFAULT 0;
  DECLARE v_coupon_id INT UNSIGNED DEFAULT NULL;
  DECLARE v_price, v_price_old DECIMAL(12,2);
  DECLARE v_qty INT;
  DECLARE v_pid INT UNSIGNED;
  DECLARE v_avail INT;
  DECLARE done INT DEFAULT 0;

  DECLARE cur CURSOR FOR
    SELECT ci.product_id, ci.quantity, p.price
    FROM cart_items ci JOIN products p ON p.id = ci.product_id
    WHERE ci.cart_id = v_cart_id;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  -- récupérer le panier de l'utilisateur
  SELECT id INTO v_cart_id FROM carts WHERE user_id = p_user_id;

  -- vérifier le coupon
  IF p_coupon_code IS NOT NULL THEN
    SELECT id, discount_value INTO v_coupon_id, v_discount
    FROM coupons
    WHERE code = p_coupon_code AND is_active = 1
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1;
  END IF;

  -- créer la commande
  INSERT INTO orders (order_number, user_id, coupon_id, payment_method,
                      shipping_address_id, billing_address_id)
  VALUES (CONCAT('PS-', DATE_FORMAT(NOW(),'%Y%m%d'), '-', LPAD(FLOOR(RAND()*99999),5,'0')),
          p_user_id, v_coupon_id, p_payment_method,
          p_shipping_address_id, p_billing_address_id);

  SET v_order_id = LAST_INSERT_ID();

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO v_pid, v_qty, v_price;
    IF done = 1 THEN LEAVE read_loop; END IF;

    -- contrôle de la disponibilité en stock
    SELECT (quantity - reserved_quantity) INTO v_avail
    FROM stock WHERE product_id = v_pid;
    IF v_avail < v_qty THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuffisant';
    END IF;

    -- insérer la ligne de commande
    INSERT INTO order_items (order_id, product_id, product_name, quantity,
                             unit_price, subtotal)
    SELECT v_order_id, p.id, p.name, v_qty, p.price, p.price * v_qty
    FROM products p WHERE p.id = v_pid;

    -- décrémenter le stock
    UPDATE stock SET quantity = quantity - v_qty WHERE product_id = v_pid;

    -- tracer le mouvement de stock
    INSERT INTO stock_movements (product_id, user_id, quantity, movement_type, reference)
    VALUES (v_pid, p_user_id, -v_qty, 'sale', v_order_id);

    SET v_subtotal = v_subtotal + (v_price * v_qty);
  END LOOP;
  CLOSE cur;

  -- application de la remise et calcul du total
  IF v_coupon_id IS NOT NULL AND v_discount > v_subtotal THEN
    SET v_discount = v_subtotal;
  END IF;

  UPDATE orders
  SET subtotal      = v_subtotal,
      discount_total = v_discount,
      shipping_cost = 5000,                    -- frais fixes (cf cart.js)
      grand_total   = v_subtotal - v_discount + 5000
  WHERE id = v_order_id;

  -- traçage du suivi de statut
  INSERT INTO order_status_history (order_id, status, note)
  VALUES (v_order_id, 'pending', 'Commande créée');

  -- incrémenter l'utilisation du coupon
  IF v_coupon_id IS NOT NULL THEN
    UPDATE coupons SET times_used = times_used + 1 WHERE id = v_coupon_id;
  END IF;

  -- vider le panier
  DELETE FROM cart_items WHERE cart_id = v_cart_id;

  SELECT v_order_id AS order_id, v_subtotal, v_discount, v_subtotal - v_discount + 5000 AS grand_total;
END//
DELIMITER ;

-- ============================================================
-- DONNÉES DE DÉMONSTRATION (alignées sur products.js)
-- ============================================================

-- Admin par défaut
INSERT INTO users (first_name, last_name, email, password_hash, role)
VALUES ('Pixel','Admin','admin@pixelstore.com','$2y$10$examplehash_pour_demo', 'admin');

-- Catégories (filtres du frontend)
INSERT INTO categories (name, slug) VALUES
('Ordinateurs','ordinateurs'),
('Claviers','claviers'),
('Souris','souris'),
('Écrans','ecrans'),
('Casques','casques'),
('Composants','composants');

-- Marques (filtres du frontend)
INSERT INTO brands (name, slug) VALUES
('Dell','dell'),('HP','hp'),('Logitech','logitech'),
('Razer','razer'),('Samsung','samsung'),('Sony','sony');

-- Produits (id 1 à 12, identiques à products.js)
INSERT INTO products (id, category_id, brand_id, name, slug, sku, price, old_price, in_stock, rating, rating_count) VALUES
(1, 1, 1, 'Laptop Pro 15 Ultra', 'laptop-pro-15-ultra', 'LAP-PRO15', 850000, 950000, 1, 4.8, 120),
(2, 1, 2, 'UltraBook Air 14', 'ultrabook-air-14', 'UB-AIR14', 720000, NULL, 1, 4.5, 85),
(3, 2, 3, 'Clavier Mécanique RGB', 'clavier-mecanique-rgb', 'CLV-MECRGB', 65000, 85000, 1, 4.7, 210),
(4, 2, 3, 'Clavier Sans Fil Compact', 'clavier-sans-fil-compact', 'CLV-SFCOMP', 38000, NULL, 1, 4.3, 64),
(5, 3, 4, 'Souris Gaming Pro', 'souris-gaming-pro', 'SRS-GAMEPRO', 45000, 58000, 1, 4.6, 140),
(6, 3, 2, 'Souris Ergonomique', 'souris-ergonomique', 'SRS-ERGO', 25000, NULL, 0, 4.2, 51),
(7, 4, 5, 'Écran 27" 4K UHD', 'ecran-27-4k-uhd', 'ECR-274K', 320000, 380000, 1, 4.9, 95),
(8, 4, 1, 'Moniteur Gaming 24" 144Hz', 'moniteur-gaming-24-144hz', 'MON-GAM24', 245000, NULL, 1, 4.6, 77),
(9, 5, 4, 'Casque Gaming Surround', 'casque-gaming-surround', 'CSQ-GAMSUR', 55000, 70000, 1, 4.7, 168),
(10, 5, 6, 'Casque Bluetooth Confort', 'casque-bluetooth-confort', 'CSQ-BTCONF', 48000, NULL, 1, 4.4, 90),
(11, 6, 5, 'SSD NVMe 1TB', 'ssd-nvme-1tb', 'SSD-NVME1', 95000, 110000, 1, 4.8, 133),
(12, 6, 1, 'Carte Graphique RTX', 'carte-graphique-rtx', 'GPU-RTX', 580000, NULL, 0, 4.9, 58);

-- Stocks initiaux (produit 6 et 12 en rupture : quantity 0)
INSERT INTO stock (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES
(1, 25, 0, 5), (2, 18, 0, 5), (3, 40, 0, 5), (4, 12, 0, 5),
(5, 30, 0, 5), (6, 0, 0, 5),  (7, 15, 0, 5), (8, 10, 0, 5),
(9, 22, 0, 5), (10, 3, 0, 5), (11, 28, 0, 5), (12, 0, 0, 5);

-- Mouvements de stock initiaux
INSERT INTO stock_movements (product_id, user_id, quantity, movement_type, note)
SELECT id, 1, quantity, 'purchase', 'Approvisionnement initial' FROM stock;

-- Coupon de démo
INSERT INTO coupons (code, discount_type, discount_value, is_active)
VALUES ('BIENVENUE10', 'percentage', 10, 1);
