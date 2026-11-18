
const DEFAULT_PHONE = "56900000000";
const money = n => "$" + Number(n || 0).toLocaleString("es-CL");

let products = [];
let category = "Todos";

const sample = [
  {id:"p1",name:"Golden Ichiban",category:"Rolls Signature",description:"Nuestra preparación especial de la casa.",price:7990,image:"",available:true,featured:true},
  {id:"p2",name:"California Ichiban",category:"Rolls clásicos",description:"Una combinación clásica para disfrutar.",price:5990,image:"",available:true,featured:false},
  {id:"p3",name:"Crispy Rice",category:"Street Food",description:"Bocados de arroz crocante con topping especial.",price:5990,image:"",available:true,featured:true},
  {id:"p4",name:"Gohan Chicken",category:"Gohan",description:"Bowl de arroz con pollo y acompañamientos.",price:6490,image:"",available:true,featured:false},
  {id:"p5",name:"Loaded Fries",category:"Street Food",description:"Papas con topping y salsas de la casa.",price:5490,image:"",available:true,featured:true},
  {id:"p6",name:"Ebi Crunch",category:"Rolls clásicos",description:"Roll de camarón con textura crocante.",price:6490,image:"",available:false,featured:false}
];

const defaultSettings = {
  store_name: "Ichiban Sushi Maki",
  slogan: "SUSHI · MAKI · SABOR",
  description: "Descubre tus rolls favoritos, promociones y preparaciones hechas para compartir.",
  logo: "",
  mobile_logo: "",
  hero_image: "",
  whatsapp: DEFAULT_PHONE,
  color_primary: "#b51f2b",
  color_background: "#171717",
  color_cream: "#f3eee5",
  color_gold: "#c9a45c"
};

const defaultTypography = {
  desktop: {
    portada: 21,
    seccion: 18,
    producto: 25,
    descripcion: 17,
    precio: 22,
    botones: 15,
    menu: 16,
    categorias: 15,
    footer: 15,
    font: "DM Sans",
    weight: "400",
    spacing: "0",
    lineheight: "1.6"
  },
  mobile: {
    portada: 19,
    seccion: 17,
    producto: 23,
    descripcion: 17,
    precio: 21,
    botones: 14,
    menu: 16,
    categorias: 15,
    footer: 15,
    font: "DM Sans",
    weight: "400",
    spacing: "0",
    lineheight: "1.6"
  }
};

const allowedFonts = [
  "DM Sans",
  "Playfair Display",
  "Montserrat",
  "Lato"
];

const allowedWeights = ["400", "500", "600", "700"];
const allowedSpacing = ["0", "0.5", "1", "1.5", "2"];
const allowedLineHeights = ["1.4", "1.6", "1.8", "2"];

function parseTypography(value) {
  let saved = {};

  try {
    saved = typeof value === "string"
      ? JSON.parse(value || "{}")
      : (value || {});
  } catch {
    saved = {};
  }

  const result = {
    desktop: { ...defaultTypography.desktop },
    mobile: { ...defaultTypography.mobile }
  };

  ["desktop", "mobile"].forEach(device => {
    const savedDevice = saved[device] || {};

    Object.keys(defaultTypography[device]).forEach(key => {
      const fallback = defaultTypography[device][key];
      const current = savedDevice[key];

      if ([
        "portada",
        "seccion",
        "producto",
        "descripcion",
        "precio",
        "botones",
        "menu",
        "categorias",
        "footer"
      ].includes(key)) {
        const number = Number(current);

        result[device][key] = Number.isFinite(number)
          ? Math.max(10, Math.min(40, number))
          : fallback;
      } else if (key === "font") {
        result[device][key] = allowedFonts.includes(current)
          ? current
          : fallback;
      } else if (key === "weight") {
        result[device][key] = allowedWeights.includes(String(current))
          ? String(current)
          : fallback;
      } else if (key === "spacing") {
        result[device][key] = allowedSpacing.includes(String(current))
          ? String(current)
          : fallback;
      } else if (key === "lineheight") {
        result[device][key] = allowedLineHeights.includes(String(current))
          ? String(current)
          : fallback;
      }
    });
  });

  return result;
}

function applyTypography(value) {
  const typography = parseTypography(value);

  const cssVariables = {
    portada: "--texto-portada",
    seccion: "--texto-descripcion-seccion",
    producto: "--texto-producto",
    descripcion: "--texto-descripcion-producto",
    precio: "--texto-precio",
    botones: "--texto-botones",
    menu: "--texto-menu",
    categorias: "--texto-categorias",
    footer: "--texto-footer"
  };

  function createRules(device) {
    const settings = typography[device];

    const font = settings.font === "Playfair Display"
      ? "'Playfair Display', serif"
      : `'${settings.font}', sans-serif`;

    let rules = Object.entries(cssVariables)
      .map(([key, variable]) => {
        return `${variable}:${settings[key]}px;`;
      })
      .join("");

    rules += `
      --font-general:${font};
      --font-display:${font};
      --peso-general:${settings.weight};
      --peso-menu:${settings.weight};
      --peso-botones:${settings.weight};
      --peso-producto:${settings.weight};
      --peso-precio:${settings.weight};
      --peso-titulos:${settings.weight};
      --espaciado-general:${settings.spacing}px;
      --espaciado-titulos:${settings.spacing}px;
      --altura-linea-general:${settings.lineheight};
      --altura-linea-descripcion:${settings.lineheight};
    `;

    return rules;
  }

  let style = document.querySelector("#ichibanDynamicTypography");

  if (!style) {
    style = document.createElement("style");
    style.id = "ichibanDynamicTypography";
    document.head.appendChild(style);
  }

  style.textContent = `
    :root {
      ${createRules("desktop")}
    }

    @media (max-width: 760px) {
      :root {
        ${createRules("mobile")}
      }
    }
  `;
}

function updateBrand(settings) {
  document.querySelectorAll(".brand").forEach(brand => {
    const mark = brand.querySelector(".mark");
    const name = settings.store_name || defaultSettings.store_name;

    if (settings.logo && mark) {
      const img = document.createElement("img");
      img.src = settings.logo;
      img.alt = name;
      img.style.cssText = "width:48px;height:48px;object-fit:contain";
      mark.replaceWith(img);
    }

    const text = brand.querySelector("span:not(.mark)");

    if (text) {
      text.textContent = name;

      const small = document.createElement("small");
      small.textContent = "SUSHI MAKI";
      text.appendChild(small);
    }
  });
}

function applySettings(settings) {
  const root = document.documentElement;

  root.style.setProperty("--red", settings.color_primary || defaultSettings.color_primary);
  root.style.setProperty("--primary", settings.color_primary || defaultSettings.color_primary);
  root.style.setProperty("--dark", settings.color_background || defaultSettings.color_background);
  root.style.setProperty("--cream", settings.color_cream || defaultSettings.color_cream);
  root.style.setProperty("--gold", settings.color_gold || defaultSettings.color_gold);

  applyTypography(settings.typography);

  updateBrand(settings);

  document.title = settings.store_name || defaultSettings.store_name;

  const descriptionMeta = document.querySelector('meta[name="description"]');

  if (descriptionMeta) {
    descriptionMeta.content = settings.description || "";
  }

  const slogan = document.querySelector(".hero-copy .eyebrow");

  if (slogan) {
    slogan.textContent = settings.slogan || "";
  }

  const description = document.querySelector(
    ".hero-copy > p:not(.eyebrow):not(.note)"
  );

  if (description) {
    description.textContent = settings.description || "";
  }

  const hero = document.querySelector(".hero-art");

  if (hero && settings.hero_image) {
    hero.style.backgroundImage = `url("${settings.hero_image}")`;
    hero.style.backgroundSize = "cover";
    hero.style.backgroundPosition = "center";
  }

  const heroLabel = document.querySelector(".hero-label");

  if (heroLabel) {
    heroLabel.textContent = settings.store_name || defaultSettings.store_name;
  }

  const footerText = document.querySelector("footer > p");

  if (footerText) {
    footerText.textContent = "Los Ángeles, Chile · Pedidos y consultas por WhatsApp.";
  }

  const phone = String(settings.whatsapp || DEFAULT_PHONE).replace(/\D/g, "");

  const message = encodeURIComponent(
    "Hola " + (settings.store_name || "Ichiban Sushi Maki") + ", quiero hacer un pedido."
  );

  const url = `https://wa.me/${phone}?text=${message}`;

  ["#whatsTop", "#whatsBottom"].forEach(selector => {
    const button = document.querySelector(selector);

    if (button) {
      button.href = url;
      button.target = "_blank";
      button.rel = "noopener";
    }
  });
}

async function loadSettings() {
  try {
    const response = await fetch("/api/settings");

    if (!response.ok) {
      throw new Error("No se pudo cargar la configuración.");
    }

    const settings = await response.json();

    applySettings({ ...defaultSettings, ...settings });

  } catch (error) {
    applySettings(defaultSettings);
    console.error("Configuración de tienda:", error);
  }
}

function isEnabled(value) {
  return value !== false &&
    value !== 0 &&
    value !== "0" &&
    value !== "false";
}

async function loadProducts() {
  try {
    const response = await fetch("/api/products");

    if (!response.ok) {
      throw new Error("No se pudieron cargar los productos.");
    }

    products = await response.json();

  } catch (error) {
    products = JSON.parse(
      localStorage.getItem("ichiban-demo-products") || "null"
    ) || sample;
  }

  render();
}

function card(product) {
  const article = document.createElement("article");
  article.className = "product";

  const img = document.createElement("img");
  img.src = product.image || "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800";
  img.alt = product.name || "Producto Ichiban";
  img.loading = "lazy";

  const inside = document.createElement("div");
  inside.className = "inside";

  const title = document.createElement("h3");
  title.textContent = product.name || "";

  const description = document.createElement("p");
  description.textContent = product.description || "";

  const price = document.createElement("div");
  price.className = "price";
  price.textContent = money(product.price);

  inside.append(title, description, price);
  article.append(img, inside);

  return article;
}

function render() {
  const visible = products.filter(product => isEnabled(product.available));

  const promoGrid = document.querySelector("#promoGrid");

  if (!promoGrid) return;

  promoGrid.replaceChildren();

  const featured = visible.filter(product => isEnabled(product.featured)).slice(0, 3);

  if (featured.length) {
    featured.forEach(product => promoGrid.appendChild(card(product)));
  } else {
    promoGrid.textContent = "Pronto anunciaremos promociones.";
  }

  const categories = [
    "Todos",
    ...new Set(visible.map(product => product.category).filter(Boolean))
  ];

  const categoryContainer = document.querySelector("#categories");

  if (categoryContainer) {
    categoryContainer.replaceChildren();

    categories.forEach(item => {
      const button = document.createElement("button");
      button.className = "chip" + (category === item ? " active" : "");
      button.textContent = item;

      button.onclick = () => {
        category = item;
        render();
      };

      categoryContainer.appendChild(button);
    });
  }

  const productGrid = document.querySelector("#productGrid");

  if (productGrid) {
    productGrid.replaceChildren();

    const filtered = visible.filter(product =>
      category === "Todos" || product.category === category
    );

    if (filtered.length) {
      filtered.forEach(product => productGrid.appendChild(card(product)));
    } else {
      productGrid.textContent = "No hay productos disponibles en esta categoría.";
    }
  }

  const year = document.querySelector("#year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }
}

async function initialize() {
  await loadSettings();
  await loadProducts();
}

initialize();
