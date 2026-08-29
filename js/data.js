// ==================== BASE DE DONNÉES PRODUITS PIXELSTORE ====================
// Produits « maison » de l'entreprise, présentés sur la page d'accueil (vitrine)
// et sur leur fiche technique dédiée (produit.html).
// En conditions réelles, ces données viendraient d'une API/base de données.

const pixelProducts = [
  {
    id: 1,
    name: "OrdiPro Pixel X15",
    brand: "PixelStore",
    tag: "Nouveau",
    reference: "ORD-PX-X15",
    price: 850000,
    oldPrice: 950000,
    rating: 4.8,
    image: "img/products/1496181133206-80ce9b88a853.jpg",
    gallery: [
      "img/products/1496181133206-80ce9b88a853.jpg",
      "img/products/1531297484001-80022131f5a1.jpg",
      "img/products/1504639725590-34d0984388bd.jpg"
    ],
    desc: "L'ultrabook signature de PixelStore : puissance, finesse et autonomie pour travailler et jouer sans compromis.",
    stock: 8,
    warranty: "2 ans",
    cert: {
      title: "Certificat de conformité CE",
      number: "PC-2026-0015",
      authority: "Bureau Burundais de Normalisation (BBN)",
      date: "12/06/2026",
      points: [
        "Conforme aux exigences essentielles de la directive CEM 2014/30/UE",
        "Certifié RoHS : fabrication sans substances dangereuses",
        "Sécurité électrique selon la norme CEI 62368-1"
      ]
    },
    specs: [
      ["Processeur", "Intel Core i7-13700H"],
      ["Mémoire RAM", "16 Go DDR5"],
      ["Stockage", "SSD NVMe 1 To"],
      ["Écran", "15,6'' FHD 144 Hz"],
      ["Carte graphique", "RTX 4060 8 Go"],
      ["Système d'exploitation", "Windows 11 Pro"],
      ["Connectique", "USB-C, HDMI 2.1, Jack 3,5 mm"],
      ["Autonomie", "Jusqu'à 12 h"]
    ]
  },
  {
    id: 2,
    name: "Clavier MécaK Pixel K68",
    brand: "PixelStore",
    tag: "Top vente",
    reference: "CLV-K68-RGB",
    price: 65000,
    oldPrice: 85000,
    rating: 4.7,
    image: "img/products/1587829741301-dc798b83add3.jpg",
    gallery: [
      "img/products/1587829741301-dc798b83add3.jpg",
      "img/products/1618384887929-16ec33fab9ef.jpg",
      "img/products/1595225476474-87563907a212.jpg"
    ],
    desc: "Un clavier mécanique compact aux switchs tactiles, conçu pour une frappe précise et un rétroéclairage RGB vibrant.",
    stock: 15,
    warranty: "1 an",
    cert: {
      title: "Certificat de conformité CEM",
      number: "PC-2026-0032",
      authority: "Bureau Burundais de Normalisation (BBN)",
      date: "03/04/2026",
      points: [
        "Conforme à la directive CEM 2014/30/UE",
        "Certifié RoHS : matériaux sans plomb",
        "Clavier usé et testé 1 000 000 de frappes"
      ]
    },
    specs: [
      ["Format", "68 touches (65%)"],
      ["Switchs", "Mécaniques rouges"],
      ["Rétroéclairage", "RGB par touche"],
      ["Connexion", "USB-C / 2.4 GHz"],
      ["Matériaux", "Châssis aluminium"],
      ["Touches", "PBT double injection"],
      ["Anti-ghosting", "NKRO plein clavier"]
    ]
  },
  {
    id: 3,
    name: "PixelMouse Pro",
    brand: "PixelStore",
    tag: "Nouveau",
    reference: "SOU-PX-PRO",
    price: 45000,
    oldPrice: 58000,
    rating: 4.6,
    image: "img/products/1527864550417-7fd91fc51a46.jpg",
    gallery: [
      "img/products/1527864550417-7fd91fc51a46.jpg",
      "img/products/1615663245857-ac93bb7c39e7.jpg",
      "img/products/1592899677977-9c10ca588bbd.jpg"
    ],
    desc: "Notre souris gaming référence : capteur haute précision, poids optimisé et grip confortable pour les longues sessions.",
    stock: 20,
    warranty: "2 ans",
    cert: {
      title: "Certificat de conformité CE",
      number: "PC-2026-0041",
      authority: "Bureau Burundais de Normalisation (BBN)",
      date: "21/05/2026",
      points: [
        "Conforme à la directive basse tension 2014/35/UE",
        "Certifié RoHS et REACH",
        "Testée à 150 millions de clics"
      ]
    },
    specs: [
      ["Capteur", "25 600 DPI"],
      ["Boutons", "8 programmables"],
      ["Taux de rapport", "1000 Hz"],
      ["Connexion", "Sans fil 2.4 GHz"],
      ["Poids", "58 g"],
      ["Autonomie", "70 h"],
      ["Compatibilité", "Windows, macOS, Linux"]
    ]
  },
  {
    id: 4,
    name: "Écran UltraPixel 27''",
    brand: "PixelStore",
    tag: "4K Ultra HD",
    reference: "ECR-UP-27K",
    price: 320000,
    oldPrice: 380000,
    rating: 4.9,
    image: "img/products/1527443224154-c4a3942d3acf.jpg",
    gallery: [
      "img/products/1527443224154-c4a3942d3acf.jpg",
      "img/products/1547082299-de196ea013d6.jpg",
      "img/products/1585792180666-f7347c490ee2.jpg"
    ],
    desc: "Un moniteur 4K aux couleurs ultra-fidèles, parfait pour la création comme pour le home-cinéma.",
    stock: 6,
    warranty: "2 ans",
    cert: {
      title: "Certificat de conformité sécurité",
      number: "PC-2026-0058",
      authority: "Bureau Burundais de Normalisation (BBN)",
      date: "09/02/2026",
      points: [
        "Conforme à la norme CEI 62368-1 (sécurité électrique)",
        "Certifié TÜV (filtre de lumière bleue, anti-scintillement)",
        "Respecte la directive EEE 2012/19/UE (recyclage)"
      ]
    },
    specs: [
      ["Dalle", "IPS 27 pouces"],
      ["Résolution", "4K UHD 3840x2160"],
      ["Taux de rafraîch.", "120 Hz"],
      ["Colorimétrie", "100% sRGB"],
      ["Connectique", "HDMI 2.1, DisplayPort"],
      ["HDR", "HDR400"],
      ["Angle de vue", "178° / 178°"]
    ]
  },
  {
    id: 5,
    name: "Casque PixelSound H90",
    brand: "PixelStore",
    tag: "Son immersif",
    reference: "CSQ-PS-H90",
    price: 95000,
    oldPrice: 110000,
    rating: 4.7,
    image: "img/products/1505740420928-5e560c06d30e.jpg",
    gallery: [
      "img/products/1505740420928-5e560c06d30e.jpg",
      "img/products/1546435770-a3e426bf472b.jpg",
      "img/products/1583394838336-acd977736f90.jpg"
    ],
    desc: "Un casque surround à réduction de bruit active pour une immersion totale, au gaming comme à la musique.",
    stock: 12,
    warranty: "1 an",
    cert: {
      title: "Certificat de conformité acoustique",
      number: "PC-2026-0069",
      authority: "Bureau Burundais de Normalisation (BBN)",
      date: "17/03/2026",
      points: [
        "Conforme à la directive CEM 2014/30/UE",
        "Limitation du niveau sonore (norme EN 50332)",
        "Certifié RoHS pour les composants électroniques"
      ]
    },
    specs: [
      ["Transducteurs", "50 mm"],
      ["Réduction bruit", "ANC active"],
      ["Son", "Surround 7.1 virtuel"],
      ["Micro", "Amovible antibruit"],
      ["Connexion", "USB / Sans fil"],
      ["Autonomie", "40 h"],
      ["Poids", "320 g"]
    ]
  },
  {
    id: 6,
    name: "SSD PixelStore 1To NVMe",
    brand: "PixelStore",
    tag: "Performance",
    reference: "SSD-PX-1TB",
    price: 55000,
    oldPrice: 65000,
    rating: 4.8,
    image: "img/products/1591370874773-6702e8f12fd8.jpg",
    gallery: [
      "img/products/1591370874773-6702e8f12fd8.jpg",
      "img/products/1600267185393-e158a98703de.jpg",
      "img/products/1563770660941-20978e870e26.jpg"
    ],
    desc: "Un SSD ultra-rapide pour des chargements instantanés et une capacité généreuse, à petits prix.",
    stock: 30,
    warranty: "5 ans",
    cert: {
      title: "Certificat de conformité CE",
      number: "PC-2026-0081",
      authority: "Bureau Burundais de Normalisation (BBN)",
      date: "28/05/2026",
      points: [
        "Conforme à la directive CEM 2014/30/UE",
        "Certifié RoHS : sans plomb ni cadmium",
        "Endurance testée (600 TBW)"
      ]
    },
    specs: [
      ["Capacité", "1 To"],
      ["Interface", "NVMe PCIe 4.0"],
      ["Lecture", "7 300 Mo/s"],
      ["Écriture", "6 800 Mo/s"],
      ["Format", "M.2 2280"],
      ["Endurance", "600 TBW"],
      ["Garantie", "5 ans"]
    ]
  },
  {
    id: 7,
    name: "PixelBook 14",
    brand: "PixelStore",
    tag: "Ultra mobile",
    reference: "PC-PB-14",
    price: 720000,
    oldPrice: 800000,
    rating: 4.6,
    image: "img/products/1517336714731-489689fd1ca8.jpg",
    gallery: [
      "img/products/1517336714731-489689fd1ca8.jpg",
      "img/products/1531297484001-80022131f5a1.jpg",
      "img/products/1504639725590-34d0984388bd.jpg"
    ],
    desc: "Un ultrabook léger et endurant, pensé pour la mobilité : écran OLED éclatant et autonomie record.",
    stock: 10,
    warranty: "2 ans",
    cert: {
      title: "Certificat de conformité CE",
      number: "PC-2026-0094",
      authority: "Bureau Burundais de Normalisation (BBN)",
      date: "14/07/2026",
      points: [
        "Conforme à la directive CEM 2014/30/UE",
        "Certifié RoHS : fabrication sans substances dangereuses",
        "Sécurité électrique selon la norme CEI 62368-1"
      ]
    },
    specs: [
      ["Processeur", "Intel Core i5-1340P"],
      ["Mémoire RAM", "16 Go LPDDR5"],
      ["Stockage", "SSD NVMe 512 Go"],
      ["Écran", "14'' 2.8K OLED"],
      ["Poids", "1,2 kg"],
      ["Autonomie", "Jusqu'à 14 h"],
      ["Système d'exploitation", "Windows 11 Pro"]
    ]
  },
  {
    id: 8,
    name: "Clavier PixelK Air 75",
    brand: "PixelStore",
    tag: "Confort",
    reference: "CLV-K75-AIR",
    price: 78000,
    oldPrice: 90000,
    rating: 4.5,
    image: "img/products/1618384887929-16ec33fab9ef.jpg",
    gallery: [
      "img/products/1618384887929-16ec33fab9ef.jpg",
      "img/products/1595225476474-87563907a212.jpg",
      "img/products/1541140532154-b024d705b90a.jpg"
    ],
    desc: "Un clavier compact 75% au châssis fin, idéal pour un bureau épuré avec une frappe silencieuse et précise.",
    stock: 22,
    warranty: "1 an",
    cert: {
      title: "Certificat de conformité CEM",
      number: "PC-2026-0102",
      authority: "Bureau Burundais de Normalisation (BBN)",
      date: "22/07/2026",
      points: [
        "Conforme à la directive CEM 2014/30/UE",
        "Certifié RoHS : matériaux sans plomb",
        "Switchs testés à 70 millions de frappes"
      ]
    },
    specs: [
      ["Format", "75% (82 touches)"],
      ["Switchs", "Mécaniques bruns"],
      ["Hot-swap", "Compatible 3/5 broches"],
      ["Rétroéclairage", "RGB 16,8 M"],
      ["Connexion", "Bluetooth / 2.4 GHz / USB-C"],
      ["Multi-appareils", "Jusqu'à 3 appareils"],
      ["Touches", "PBT double injection"]
    ]
  },
  {
    id: 9,
    name: "Souris PixelEase",
    brand: "PixelStore",
    tag: "Confort",
    reference: "SOU-PX-EASE",
    price: 28000,
    oldPrice: 35000,
    rating: 4.4,
    image: "img/products/1615663245857-ac93bb7c39e7.jpg",
    gallery: [
      "img/products/1615663245857-ac93bb7c39e7.jpg",
      "img/products/1527864550417-7fd91fc51a46.jpg",
      "img/products/1592899677977-9c10ca588bbd.jpg"
    ],
    desc: "Une souris silencieuse et légère, conçue pour un confort de travail durable au quotidien.",
    stock: 18,
    warranty: "1 an",
    cert: {
      title: "Certificat de conformité CE",
      number: "PC-2026-0111",
      authority: "Bureau Burundais de Normalisation (BBN)",
      date: "05/08/2026",
      points: [
        "Conforme à la directive basse tension 2014/35/UE",
        "Certifié RoHS : sans plomb ni mercure",
        "Clics testés à 50 millions d'opérations"
      ]
    },
    specs: [
      ["Capteur", "12 000 DPI"],
      ["Boutons", "6 programmables"],
      ["Clics", "Silencieux"],
      ["Connexion", "Sans fil 2.4 GHz"],
      ["Poids", "75 g"],
      ["Autonomie", "Jusqu'à 90 h"],
      ["Recharge", "USB-C"]
    ]
  },
  {
    id: 10,
    name: "Écran VisionPixel 24''",
    brand: "PixelStore",
    tag: "Essentiel",
    reference: "ECR-VP-24F",
    price: 145000,
    oldPrice: 175000,
    rating: 4.5,
    image: "img/products/1551645120-d70bfe84c826.jpg",
    gallery: [
      "img/products/1551645120-d70bfe84c826.jpg",
      "img/products/1527443224154-c4a3942d3acf.jpg",
      "img/products/1547082299-de196ea013d6.jpg"
    ],
    desc: "Un écran FHD polyvalent au suivi fluide, parfait pour la bureautique et le divertissement.",
    stock: 14,
    warranty: "2 ans",
    cert: {
      title: "Certificat de conformité sécurité",
      number: "PC-2026-0120",
      authority: "Bureau Burundais de Normalisation (BBN)",
      date: "19/08/2026",
      points: [
        "Conforme à la norme CEI 62368-1 (sécurité électrique)",
        "Certifié TÜV (filtre de lumière bleue)",
        "Respecte la directive EEE 2012/19/UE (recyclage)"
      ]
    },
    specs: [
      ["Dalle", "IPS 24 pouces"],
      ["Résolution", "FHD 1920x1080"],
      ["Taux de rafraîch.", "100 Hz"],
      ["Colorimétrie", "99% sRGB"],
      ["Connectique", "HDMI, DisplayPort"],
      ["Protection", "Anti-lumière bleue"],
      ["Angle de vue", "178° / 178°"]
    ]
  },
  {
    id: 11,
    name: "Casque PixelStudio",
    brand: "PixelStore",
    tag: "Créateurs",
    reference: "CSQ-PS-STUDIO",
    price: 120000,
    oldPrice: 140000,
    rating: 4.8,
    image: "img/products/1546435770-a3e426bf472b.jpg",
    gallery: [
      "img/products/1546435770-a3e426bf472b.jpg",
      "img/products/1583394838336-acd977736f90.jpg",
      "img/products/1484704849700-f032a568e944.jpg"
    ],
    desc: "Un casque Hi-Fi à réduction de bruit hybride, fidèle aux créateurs comme aux mélomanes.",
    stock: 7,
    warranty: "2 ans",
    cert: {
      title: "Certificat de conformité acoustique",
      number: "PC-2026-0129",
      authority: "Bureau Burundais de Normalisation (BBN)",
      date: "10/06/2026",
      points: [
        "Conforme à la directive CEM 2014/30/UE",
        "Limitation du niveau sonore (norme EN 50332)",
        "Certifié RoHS pour les composants électroniques"
      ]
    },
    specs: [
      ["Transducteurs", "45 mm Hi-Fi"],
      ["Réduction bruit", "ANC hybride"],
      ["Son", "Audio haute résolution"],
      ["Micro", "Studio intégré"],
      ["Connexion", "Bluetooth 5.3 / Jack"],
      ["Autonomie", "45 h"],
      ["Recharge", "USB-C"]
    ]
  },
  {
    id: 12,
    name: "PixelGPU RTX 4070",
    brand: "PixelStore",
    tag: "Puissance",
    reference: "GPU-PX-4070",
    price: 620000,
    oldPrice: 680000,
    rating: 4.9,
    image: "img/products/1591488320449-011701bb6704.jpg",
    gallery: [
      "img/products/1591488320449-011701bb6704.jpg",
      "img/products/1587202372634-32705e3bf49c.jpg",
      "img/products/1591799264318-7e6ef8ddb7ea.jpg"
    ],
    desc: "La carte graphique nouvelle génération pour du gaming 1440p-4K et de la création sans compromis.",
    stock: 4,
    warranty: "3 ans",
    cert: {
      title: "Certificat de conformité CE",
      number: "PC-2026-0138",
      authority: "Bureau Burundais de Normalisation (BBN)",
      date: "27/08/2026",
      points: [
        "Conforme à la directive CEM 2014/30/UE",
        "Certifié RoHS : sans plomb ni cadmium",
        "Alimentation conforme EN 62368-1"
      ]
    },
    specs: [
      ["GPU", "NVIDIA GeForce RTX 4070"],
      ["Mémoire", "12 Go GDDR6X"],
      ["Cœurs CUDA", "5 888"],
      ["Fréquence boost", "2,5 GHz"],
      ["Refroidissement", "Triple ventilateur"],
      ["TGP", "200 W"],
      ["Connectique", "HDMI 2.1, DisplayPort 1.4a"]
    ]
  }
];