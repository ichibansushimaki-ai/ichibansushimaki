
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
  {id:"p6",name:"Ebi Crunch",category:"Rolls clásicos",description:"Roll de camarón con textura crocante.",price:6490,image:"",available:true,featured:false}
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

function updateBrand(settings) {
  document.querySelectorAll(".brand").forEach(brand => {
    const mark = brand.querySelector(".mark");
    const name = settings.store_name || defaultSettings.store_name;

    if (settings.logo) {
      const img = document.createElement("img");
      img.src = settings.logo;
      img.alt = name;
      img.style.cssText = "width:48px;height:48px;object-fit:contain";

      if (mark) mark.replaceWith(img);
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

  root.style.setProperty("--red", settings.color_primary);
  root.style.setProperty("--primary", settings.color_primary);
  root.style.setProperty("--dark", settings.color_background);
  root.style.setProperty("--cream", settings.color_cream);
  root.style.setProperty("--gold", settings.color_gold);

  updateBrand(settings);

  document.title = settings.store_name || defaultSettings.store_name;

  const descriptionMeta = document.querySelector('meta[name="description"]');
  if (descriptionMeta) {
    descriptionMeta.content = settings.description || "";
  }

  const slogan = document.querySelector(".hero-copy .eyebrow");
  if (slogan) slogan.textContent = settings.slogan || "";

  const description = document.querySelector(".hero-copy > p:not(.eyebrow):not(.note)");
  if (description) description.textContent = settings.description || "";

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

    if (!response.ok) throw new Error("No se pudo cargar la configuración.");

    const settings = await response.json();
    applySettings({ ...defaultSettings, ...settings });
  } catch (error) {
    applySettings(defaultSettings);
    console.error("Configuración de tienda:", error);
  }
}

async function loadProducts() {
  try {
    const response = await fetch("/api/products");

    if (!response.ok) throw new Error("No se pudieron cargar los productos.");

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
  const visible = products.filter(product => product.available !== false);

  const promoGrid = document.querySelector("#promoGrid");
  promoGrid.replaceChildren();

  const featured = visible.filter(product => product.featured).slice(0, 3);

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

  const productGrid = document.querySelector("#productGrid");
  productGrid.replaceChildren();

  const filtered = visible.filter(product =>
    category === "Todos" || product.category === category
  );

  if (filtered.length) {
    filtered.forEach(product => productGrid.appendChild(card(product)));
  } else {
    productGrid.textContent = "No hay productos disponibles en esta categoría.";
  }

  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();
}

async function initialize() {
  await loadSettings();
  await loadProducts();
}

initialize();
