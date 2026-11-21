
const DEFAULT_PHONE = "56900000000";
const money = n => "$" + Number(n || 0).toLocaleString("es-CL");
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}
const $ = selector => document.querySelector(selector);

let products = [];
let category = "";
let settings = {};
let cart = JSON.parse(localStorage.getItem("ichiban-cart") || "[]");
let currentProduct = null;

const sample = [
  {id:"p1",name:"Golden Ichiban",category:"Rolls Signature",description:"Nuestra preparación especial de la casa.",price:7990,image:"",available:true,featured:true,product_type:"roll"},
  {id:"p2",name:"California Ichiban",category:"Rolls clásicos",description:"Una combinación clásica para disfrutar.",price:5990,image:"",available:true,featured:false,product_type:"roll"},
  {id:"p3",name:"Crispy Rice",category:"Street Food",description:"Bocados de arroz crocante con topping especial.",price:5990,image:"",available:true,featured:true,product_type:"side"},
  {id:"p4",name:"Gohan Chicken",category:"Street Food",description:"Bowl de arroz con pollo y acompañamientos.",price:6490,image:"",available:true,featured:false,product_type:"dish"},
  {id:"p5",name:"Loaded Fries",category:"Entradas & para compartir",description:"Papas con topping y salsas de la casa.",price:5490,image:"",available:true,featured:true,product_type:"side"},
  {id:"p6",name:"Ebi Crunch",category:"Rolls clásicos",description:"Roll de camarón con textura crocante.",price:6490,image:"",available:false,featured:false,product_type:"roll"}
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
    portada: 21, seccion: 18, producto: 25,
    descripcion: 17, precio: 22, botones: 15,
    menu: 16, categorias: 15, footer: 15,
    font: "DM Sans", weight: "400",
    spacing: "0", lineheight: "1.6"
  },
  mobile: {
    portada: 19, seccion: 17, producto: 23,
    descripcion: 17, precio: 21, botones: 14,
    menu: 16, categorias: 15, footer: 15,
    font: "DM Sans", weight: "400",
    spacing: "0", lineheight: "1.6"
  }
};

const allowedFonts = ["DM Sans", "Playfair Display", "Montserrat", "Lato"];
const allowedWeights = ["400", "500", "600", "700"];
const allowedSpacing = ["0", "0.5", "1", "1.5", "2"];
const allowedLineHeights = ["1.4", "1.6", "1.8", "2"];

function parseTypography(value) {
  let saved = {};

  try {
    saved = typeof value === "string"
      ? JSON.parse(value || "{}")
      : (value || {});
  } catch {}

  const result = {
    desktop: { ...defaultTypography.desktop },
    mobile: { ...defaultTypography.mobile }
  };

  ["desktop", "mobile"].forEach(device => {
    const savedDevice = saved[device] || {};

    Object.keys(defaultTypography[device]).forEach(key => {
      const current = savedDevice[key];
      const fallback = defaultTypography[device][key];

      if ([
        "portada", "seccion", "producto", "descripcion",
        "precio", "botones", "menu", "categorias", "footer"
      ].includes(key)) {
        const number = Number(current);
        result[device][key] = Number.isFinite(number)
          ? Math.max(10, Math.min(40, number))
          : fallback;
      } else if (key === "font") {
        result[device][key] = allowedFonts.includes(current) ? current : fallback;
      } else if (key === "weight") {
        result[device][key] = allowedWeights.includes(String(current)) ? String(current) : fallback;
      } else if (key === "spacing") {
        result[device][key] = allowedSpacing.includes(String(current)) ? String(current) : fallback;
      } else if (key === "lineheight") {
        result[device][key] = allowedLineHeights.includes(String(current)) ? String(current) : fallback;
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
      .map(([key, variable]) => `${variable}:${settings[key]}px;`)
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

  let style = $("#ichibanDynamicTypography");

  if (!style) {
    style = document.createElement("style");
    style.id = "ichibanDynamicTypography";
    document.head.appendChild(style);
  }

  style.textContent = `
    :root { ${createRules("desktop")} }
    @media (max-width:760px) {
      :root { ${createRules("mobile")} }
    }
  `;
}


function updateBrand(data) {
  document.querySelectorAll(".brand").forEach(brand => {
    const mark = brand.querySelector(".mark");
    const name = data.store_name || defaultSettings.store_name;

    if (data.logo && mark && mark.tagName !== "IMG") {
      const img = document.createElement("img");
      img.src = data.logo;
      img.alt = name;
      img.style.cssText = "width:48px;height:48px;object-fit:contain";
      mark.replaceWith(img);
    }

    const text = brand.querySelector("span:not(.mark)");

    if (text) {
      text.textContent = name;
    }
  });
}


function applySettings(data) {
  settings = { ...defaultSettings, ...data };

  const root = document.documentElement;

  root.style.setProperty("--red", settings.color_primary);
  root.style.setProperty("--primary", settings.color_primary);
  root.style.setProperty("--dark", settings.color_background);
  root.style.setProperty("--cream", settings.color_cream);
  root.style.setProperty("--gold", settings.color_gold);

  applyTypography(settings.typography);
  updateBrand(settings);

  document.title = settings.store_name;

  const descriptionMeta = $('meta[name="description"]');
  if (descriptionMeta) descriptionMeta.content = settings.description || "";

  const slogan = $(".hero-copy .eyebrow");
  if (slogan) slogan.textContent = settings.slogan || "";

  const description = $(".hero-copy > p:not(.eyebrow):not(.note)");
  if (description) description.textContent = settings.description || "";

  const hero = $(".hero-art");

  if (hero && settings.hero_image) {
    hero.style.backgroundImage = `url("${settings.hero_image}")`;
    hero.style.backgroundSize = "cover";
    hero.style.backgroundPosition = "center";
  }



  const phone = String(settings.whatsapp || DEFAULT_PHONE).replace(/\D/g, "");
  const message = encodeURIComponent(
    `Hola ${settings.store_name}, quiero hacer un pedido.`
  );

  ["#whatsTop", "#whatsBottom"].forEach(selector => {
    const button = $(selector);
    if (button) {
      button.href = `https://wa.me/${phone}?text=${message}`;
      button.target = "_blank";
      button.rel = "noopener";
    }
  });
}

async function loadSettings() {
  try {
    const response = await fetch("/api/settings");
    if (!response.ok) throw new Error("No se pudo cargar la configuración.");
    applySettings(await response.json());
  } catch (error) {
    applySettings(defaultSettings);
    console.error("Configuración de tienda:", error);
  }
}

function isEnabled(value) {
  return value !== false && value !== 0 && value !== "0" && value !== "false";
}

function parseOptions(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function getType(product) {
  if (product.product_type && product.product_type !== "other") {
    return product.product_type;
  }

  const category = String(product.category || "").toLowerCase();
  const name = String(product.name || "").toLowerCase();

  if (category.includes("promoc")) return "promotion";
  if (name.includes("handroll")) return "handroll";
  if (name.includes("gohan") || name.includes("bowl") ||
      name.includes("sushi burger") || name.includes("plato")) return "dish";
  if (category.includes("roll")) return "roll";
  if (category.includes("bebida")) return "beverage";
  if (category.includes("salsa")) return "sauce";

  return "other";
}

async function loadProducts() {
  try {
    const response = await fetch("/api/products");
    if (!response.ok) throw new Error("No se pudieron cargar los productos.");
    products = await response.json();
  } catch (error) {
    products = JSON.parse(localStorage.getItem("ichiban-demo-products") || "null") || sample;
  }

  render();
}

// DISEÑO DEL CARRITO Y VENTANAS

function addStoreStyles() {
  if ($("#ichibanStoreStyles")) return;

  const style = document.createElement("style");
  style.id = "ichibanStoreStyles";

  style.textContent = `
    .product .inside { display:flex; flex-direction:column; gap:10px; }
    

.product-add {
  position: relative;
  border: 1px solid #c9a45c;
  border-radius: 6px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #b51f2b, #861923);
  color: #fffaf2;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
  width: 100%;
  box-shadow:
    inset 0 1px 0 #ffffff25,
    0 4px 12px #00000025;
  transition: all .25s ease;
}

.product-add:hover {
  background: linear-gradient(135deg, #d33138, #a51d27);
  border-color: #e4c47d;
  transform: translateY(-2px);
  box-shadow:
    inset 0 1px 0 #ffffff30,
    0 7px 18px #00000035;
}

.product-add:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px #00000025;
}


    
.ichiban-cart-button {
  position:fixed;
  right:22px;
  bottom:22px;
  z-index:900;
  display:flex;
  align-items:center;
  gap:10px;
  border:1px solid #d4b56f;
  border-radius:7px;
  padding:15px 23px;
  background:linear-gradient(135deg,#b51f2b,#801722);
  color:#fffaf2;
  font-size:14px;
  font-weight:800;
  letter-spacing:.6px;
  cursor:pointer;
  box-shadow:0 5px 20px #0005;
  transition:all .25s ease;
}

.ichiban-cart-button:hover {
  background:linear-gradient(135deg,#d33138,#a51d27);
  border-color:#f0d18b;
  transform:translateY(-3px);
  box-shadow:0 9px 25px #0006;
}

    .ichiban-cart-count {
      display:inline-flex; align-items:center; justify-content:center;
      min-width:23px; height:23px; margin-left:7px;
      border-radius:50%; background:white; color:#222;
    }
    .ichiban-overlay {
      display:none; position:fixed; inset:0; z-index:1000;
      background:#000a; padding:16px; overflow-y:auto;
      align-items:center; justify-content:center;
    }
    .ichiban-overlay.open { display:flex; }
    .ichiban-dialog {
      width:min(100%,560px); max-height:92vh; overflow:auto;
      background:var(--cream,#f3eee5); color:#28231f;
      border-radius:16px; padding:23px;
      box-shadow:0 15px 50px #0005;
    }
    .ichiban-dialog h2 { margin:0 35px 8px 0; }
    .ichiban-dialog p { line-height:1.5; }
    .ichiban-dialog label { display:block; font-weight:600; margin:13px 0 6px; }
    .ichiban-dialog select,.ichiban-dialog input {
      width:100%; min-height:42px; padding:9px;
      border:1px solid #c9bfb2; border-radius:7px;
      background:white; color:#222; font:inherit;
    }
    .ichiban-dialog button { cursor:pointer; }
    .ichiban-dialog .dialog-close {
      float:right; border:0; background:transparent;
      font-size:26px; color:#333;
    }
 

.ichiban-dialog .dialog-primary,.cart-checkout {
  border:1px solid #c9a45c;
  border-radius:6px;
  padding:15px 18px;
  background:linear-gradient(135deg,#b51f2b,#861923);
  color:#fffaf2;
  font-size:13px;
  font-weight:800;
  letter-spacing:1px;
  text-transform:uppercase;
  width:100%;
  margin-top:16px;
  cursor:pointer;
  box-shadow:inset 0 1px 0 #ffffff25,0 4px 12px #00000025;
  transition:all .25s ease;
}

.ichiban-dialog .dialog-primary:hover,
.cart-checkout:hover {
  background:linear-gradient(135deg,#d33138,#a51d27);
  border-color:#e4c47d;
  transform:translateY(-2px);
  box-shadow:inset 0 1px 0 #ffffff30,0 7px 18px #00000035;
}

.ichiban-dialog .dialog-primary:active,
.cart-checkout:active {
  transform:translateY(0);
}
  

.dialog-secondary {
  border:1px solid #b89b60;
  border-radius:6px;
  padding:13px 16px;
  background:#211e1a;
  color:#eadcc5;
  font-size:12px;
  font-weight:700;
  letter-spacing:.7px;
  text-transform:uppercase;
  width:100%;
  margin-top:9px;
  cursor:pointer;
  transition:all .25s ease;
}

.dialog-secondary:hover {
  background:#302923;
  border-color:#e4c47d;
  color:#fffaf2;
  transform:translateY(-2px);
}
    .dialog-note {
      padding:12px; background:#e9e0d4; border-radius:8px;
      font-size:14px; margin:12px 0;
    }
    .dialog-grid {
      display:grid; grid-template-columns:1fr 1fr; gap:12px;
    }
   
.cart-heading {
  padding:4px 0 18px;
  border-bottom:1px solid #c9a45c;
  margin-bottom:12px;
}

.cart-heading h2 {
  margin:4px 0 6px;
  font-family:var(--font-display);
  font-size:27px;
  color:#211d19;
}

.cart-heading > p:last-child {
  margin:0;
  color:#766b60;
  font-size:14px;
}

.cart-eyebrow {
  margin:0;
  color:#a51f29;
  font-size:11px;
  font-weight:800;
  letter-spacing:2px;
}

.cart-items {
  margin-top:8px;
}

.cart-line {
  padding:17px 0;
  border-bottom:1px solid #d8cbbb;
}

.cart-line-top {
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px;
}

.cart-line-info h3 {
  margin:0 0 5px;
  color:#28231f;
  font-size:16px;
  font-weight:800;
}

.cart-line-info small {
  color:#81766b;
  font-size:12px;
}

.cart-line-price {
  color:#9d2029;
  font-size:16px;
  white-space:nowrap;
}

.cart-line-description {
  margin-top:12px;
  padding:12px;
  background:#f3ece1;
  border:1px solid #e0d3c1;
  border-left:3px solid #c9a45c;
  border-radius:8px;
  color:#62584e;
  font-size:12px;
  line-height:1.5;
  display:grid;
  gap:10px;
}

.cart-config-section {
  display:flex;
  flex-direction:column;
  gap:7px;
  padding:9px 10px;
  background:#fffaf2;
  border:1px solid #e2d6c6;
  border-radius:7px;
}

.cart-config-title {
  display:block;
  color:#9d2029;
  font-size:11px;
  font-weight:800;
  letter-spacing:.5px;
  text-transform:uppercase;
}

.cart-config-row {
  display:grid;
  grid-template-columns:95px minmax(0,1fr);
  align-items:start;
  gap:8px;
}

.cart-config-label {
  color:#81766b;
  font-size:11px;
  font-weight:700;
  padding-top:4px;
}

.cart-options {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  min-width:0;
}

.cart-option {
  display:inline-flex;
  align-items:center;
  max-width:100%;
  padding:5px 9px;
  border:1px solid #dfd0b9;
  border-radius:20px;
  background:#f7f0e5;
  color:#453b32;
  font-size:11px;
  font-weight:700;
  line-height:1.35;
  overflow-wrap:anywhere;
}

.cart-option-muted {
  background:#eee9e2;
  border-color:#d8cfc3;
  color:#80766c;
  font-weight:600;
}

.cart-line-actions {
  display:flex;
  align-items:center;
  flex-wrap:wrap;
  gap:8px;
  margin-top:13px;
}

.cart-line-actions button {
  border:1px solid #c9b99f;
  border-radius:5px;
  padding:8px 11px;
  background:#fffaf2;
  color:#302820;
  font-size:12px;
  font-weight:700;
  transition:all .2s ease;
}

.cart-line-actions button:hover {
  background:#a51f29;
  border-color:#a51f29;
  color:white;
}

.cart-line-actions strong {
  min-width:18px;
  text-align:center;
  color:#28231f;
}

.cart-summary {
  margin-top:15px;
  padding:15px;
  background:#eee6da;
  border:1px solid #d8cbbb;
  border-radius:7px;
}

.cart-total {
  display:flex;
  justify-content:space-between;
  align-items:center;
  font-size:19px;
  font-weight:800;
  color:#28231f;
}

.cart-total strong {
  color:#9d2029;
}

.cart-empty {
  text-align:center;
  padding:28px 8px;
}

.cart-empty h2 {
  color:#28231f;
}

    .cart-line-head {
      display:flex; justify-content:space-between; gap:12px;
      font-weight:700;
    }
    .cart-line small { display:block; margin-top:5px; line-height:1.5; }
    .cart-line-actions {
      display:flex; align-items:center; gap:9px; margin-top:9px;
    }
    .cart-line-actions button {
      border:1px solid #b7aa9c; border-radius:6px;
      padding:5px 10px; background:white; color:#222;
    }
    .cart-total {
      display:flex; justify-content:space-between;
      font-size:20px; font-weight:800; padding-top:17px;
    }
    .cart-empty { text-align:center; padding:28px 8px; }
    .ichiban-dialog .veg-row {
  display:flex !important;
  flex-direction:row !important;
  align-items:center !important;
  justify-content:flex-start !important;
  gap:12px !important;
  width:100%;
  margin:8px 0 !important;
  padding:8px 10px;
  box-sizing:border-box;
  text-align:left;
  cursor:pointer;
}

.ichiban-dialog .veg-row input[type="checkbox"] {
  display:inline-block !important;
  width:22px !important;
  min-width:22px !important;
  height:22px !important;
  min-height:22px !important;
  flex:0 0 22px !important;
  margin:0 !important;
  padding:0 !important;
}
    .veg-row { display:grid; grid-template-columns:1fr 1.2fr; gap:8px; align-items:center; margin:8px 0; }
    .veg-row label { margin:0; }
    .cart-checkout:disabled { opacity:.5; cursor:not-allowed; }
   

@media(max-width:600px) {
  .ichiban-cart-button {
    right:14px;
    bottom:14px;
  }

  .ichiban-dialog {
    padding:16px;
  }

  .dialog-grid {
    grid-template-columns:1fr;
  }

  .cart-line {
    padding:16px 0;
  }

  .cart-line-top {
    flex-wrap:wrap;
    gap:8px;
  }

  .cart-line-info {
    min-width:0;
    flex:1;
  }

  .cart-line-info h3 {
    font-size:15px;
  }

  .cart-line-price {
    font-size:15px;
  }

  .cart-line-actions {
    gap:8px;
  }

  .cart-line-actions button {
    min-height:42px;
    padding:10px 14px;
    font-size:13px;
  }

  .cart-line-description {
    font-size:12px;
  }
.cart-line-description {
  padding:10px;
  gap:8px;
}

.cart-config-section {
  padding:8px;
}

.cart-config-row {
  grid-template-columns:1fr;
  gap:4px;
}

.cart-config-label {
  padding-top:0;
}

.cart-options {
  gap:5px;
}

.cart-option {
  padding:5px 8px;
  font-size:11px;
}
  .cart-summary {
    padding:13px;
  }

  .cart-total {
    font-size:18px;
  }

    .cart-total strong {
    font-size:20px;
  }

  .ichiban-dialog .dialog-primary,
  .cart-checkout {
    min-height: 50px;
    padding: 16px;
    font-size: 13px;
    letter-spacing: .7px;
  }
}


  `;

  document.head.appendChild(style);
}

function ensureCartUI() {
  if ($("#ichibanCartButton")) return;

  const button = document.createElement("button");
  button.id = "ichibanCartButton";
  button.className = "ichiban-cart-button";
  button.type = "button";
  button.innerHTML = `🛒 Mi pedido <span class="ichiban-cart-count" id="cartCount">0</span>`;
  button.addEventListener("click", openCart);

  const overlay = document.createElement("div");
  overlay.id = "ichibanOverlay";
  overlay.className = "ichiban-overlay";
  overlay.innerHTML = `
    <section class="ichiban-dialog" role="dialog" aria-modal="true">
      <button type="button" class="dialog-close" data-close aria-label="Cerrar">×</button>
      <div id="ichibanDialogContent"></div>
    </section>
  `;

  overlay.addEventListener("click", event => {
    if (event.target === overlay || event.target.closest("[data-close]")) {
      closeDialog();
    }
  });

  document.body.append(button, overlay);
  updateCartCount();
}

function openDialog(content) {
  $("#ichibanDialogContent").innerHTML = content;
  $("#ichibanOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeDialog() {
  $("#ichibanOverlay").classList.remove("open");
  document.body.style.overflow = "";
  currentProduct = null;
}
function askPendingCart() {
  if (!cart.length) return;

  openDialog(`
    <h2>Tienes un pedido pendiente</h2>
    <p>
      Encontramos un pedido anterior en tu carrito.
      ¿Qué deseas hacer?
    </p>

    <button type="button" class="dialog-primary" id="continueSavedCart">
      Continuar pedido
    </button>

    <button type="button" class="dialog-secondary" id="startNewCart">
      Nuevo pedido
    </button>
  `);

  $("#continueSavedCart").addEventListener("click", () => {
    closeDialog();
  });

  $("#startNewCart").addEventListener("click", () => {
    cart = [];
    saveCart();
    closeDialog();
  });
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  const badge = $("#cartCount");
  if (badge) badge.textContent = count;
}

function saveCart() {
  localStorage.setItem("ichiban-cart", JSON.stringify(cart));
  updateCartCount();
}
function getPaidSaucesTotal(item) {
  return (item.config?.paidSauces || []).reduce((total, sauce) => {
    const product = products.find(
      p => String(p.id) === String(sauce.id)
    );

    if (!product) return total;

    return total + Number(product.price || 0) * Number(sauce.quantity || 0);
  }, 0);
}


function cartTotal() {
  return cart.reduce((sum, item) => {
    const quantity = Number(item.quantity || 1);

    const productsTotal =
      Number(item.price || 0) * quantity;

    const gohanSurcharge =
      Number(item.config?.gohan?.proteinSurcharge || 0) * quantity;

    return sum +
      productsTotal +
      gohanSurcharge +
      getPaidSaucesTotal(item);
  }, 0);
}


function cartItemDescription(item) {
  const config = item.config || {};
  const sections = [];

  if (config.gohan) {
    const gohan = config.gohan;

    const vegetables = gohan.noVegetables
      ? `<span class="cart-option cart-option-muted">Sin vegetal</span>`
      : (gohan.vegetables || []).map(vegetable =>
          `<span class="cart-option">${escapeHTML(vegetable)}</span>`
        ).join("");

    const protein = gohan.protein
      ? `<span class="cart-option">${escapeHTML(gohan.protein)}${gohan.proteinSurcharge > 0 ? ` (+${money(gohan.proteinSurcharge)})` : ""}</span>`
      : `<span class="cart-option cart-option-muted">Sin proteína</span>`;

    sections.push(`
      <div class="cart-config-section">
        <strong class="cart-config-title">Personalización Gohan</strong>
        <div class="cart-config-row">
          <span class="cart-config-label">Arroz</span>
          <span class="cart-option">Incluido</span>
        </div>
        <div class="cart-config-row">
          <span class="cart-config-label">Queso crema</span>
          <span class="cart-option">${gohan.creamCheese ? "Con queso crema" : "Sin queso crema"}</span>
        </div>
        <div class="cart-config-row">
          <span class="cart-config-label">Vegetales</span>
          <div class="cart-options">${vegetables || `<span class="cart-option cart-option-muted">Sin selección</span>`}</div>
        </div>
        <div class="cart-config-row">
          <span class="cart-config-label">Proteína</span>
          <div class="cart-options">${protein}</div>
        </div>
      </div>
    `);
  }

  if (config.vegetables?.length) {
    sections.push(`
      <div class="cart-config-section">
        <strong class="cart-config-title">Vegetales por roll</strong>
        <div class="cart-options">
          ${config.vegetables.map((vegetable, index) =>
            `<span class="cart-option">Roll ${index + 1}: ${escapeHTML(vegetable)}</span>`
          ).join("")}
        </div>
      </div>
    `);
  }

  if (config.soy || config.teriyaki) {
    sections.push(`
      <div class="cart-config-section">
        <strong class="cart-config-title">Salsas de cortesía</strong>
        <div class="cart-options">
          <span class="cart-option">${config.soy || 0} soya</span>
          <span class="cart-option">${config.teriyaki || 0} teriyaki</span>
        </div>
      </div>
    `);
  }

  if (config.note) {
    sections.push(`<div class="cart-config-section">${escapeHTML(config.note)}</div>`);
  }

  if (config.paidSauces?.length) {
    const sauces = config.paidSauces.map(sauce => {
      const product = products.find(
        p => String(p.id) === String(sauce.id)
      );

      if (!product) return "";

      return `<span class="cart-option">${escapeHTML(product.name)}: ${sauce.quantity} × ${money(product.price)} = ${money(product.price * sauce.quantity)}</span>`;
    }).join("");

    sections.push(`
      <div class="cart-config-section">
        <strong class="cart-config-title">Salsas adicionales</strong>
        <div class="cart-options">${sauces}</div>
      </div>
    `);
  }

  return sections.join("");
}

// PERSONALIZACIÓN DE PRODUCTOS


function openProduct(product, editingItem = null) {
  currentProduct = product;

  const type = getType(product);
  const options = parseOptions(product.options);
  const initialConfig = editingItem?.config || {};

  const isPromo = type === "promotion";
  const isRoll = type === "roll";
  const isHandroll = type === "handroll";
  const isDish = type === "dish";
const isGohan = isDish && options.gohan_customizable === true;
  const rollCount = isPromo
    ? Math.max(1, Number(options.rolls_count || 1))
    : 1;

  const freePerUnit = isPromo
    ? rollCount
    : isRoll || isHandroll
      ? 1
      : isDish
        ? 2
        : 0;

  const paidSauceProducts = (isRoll || isPromo || isHandroll || isDish)
    ? products.filter(p =>
        isEnabled(p.available) &&
        getType(p) === "sauce"
      )
    : [];

  let configuration = "";

  const chopsticksChoice = (isRoll || isPromo) ? `
    <h3>¿Deseas palitos chinos?</h3>
    <p>Puedes elegir si deseas recibir palitos con tu pedido.</p>
    <select id="wantsChopsticks">
      <option value="yes" ${initialConfig.wantsChopsticks === true ? "selected" : ""}>Sí, deseo palitos</option>
      <option value="no" ${initialConfig.wantsChopsticks !== true ? "selected" : ""}>No, gracias</option>
    </select>
    <div class="dialog-note">
      Si los deseas, calcularemos 1 par por cada roll, con un máximo de 6 pares por pedido.
    </div>
  ` : "";

  if (isPromo) {
    configuration = `
      <div class="dialog-note">
        <strong>Promoción de ${rollCount} rolls.</strong><br>
        Los rellenos y envolturas son fijos. Puedes elegir el vegetal de cada roll.
        Incluye una salsa por roll y palitos según las reglas de la tienda.
      </div>
      <div id="vegetableChoices">
        ${Array.from({length: rollCount * Number(editingItem?.quantity || 1)}, (_, i) => {
          const vegetable = initialConfig.vegetables?.[i] || "Cebollín";

          return `
            <div class="veg-row">
              <label for="veg${i}">Roll ${i + 1}</label>
              <select id="veg${i}" class="veg-choice">
                ${["Cebollín", "Pimentón", "Palta", "Sin vegetal"].map(value =>
                  `<option ${vegetable === value ? "selected" : ""}>${value}</option>`
                ).join("")}
              </select>
            </div>
          `;
        }).join("")}
      </div>
    `;
  } else if (isRoll) {
    configuration = `<div class="dialog-note">Incluye una salsa de cortesía y un par de palitos por roll. Máximo 6 pares de palitos por pedido.</div>`;
  } else if (isHandroll) {
    configuration = `<div class="dialog-note">Incluye una salsa de cortesía por handroll. No incluye palitos.</div>`;
  
} else if (isGohan) {
  const gohanSettings = parseOptions(settings.gohan_config);

  const vegetables = (gohanSettings.vegetables || [])
    .filter(item => item.active && item.name);

  const proteins = (gohanSettings.proteins || [])
    .filter(item => item.active && item.name);

  const savedGohan = initialConfig.gohan || {};
  const savedVegetables = savedGohan.vegetables || [];

  configuration = `
    <div class="dialog-note">
      <strong>Personaliza tu Gohan</strong><br>
      Incluye arroz sushi. Elige tus ingredientes a tu gusto.
    </div>

    <h3>Queso crema</h3>
    <select id="gohanCreamCheese">
      <option value="yes" ${savedGohan.creamCheese !== false ? "selected" : ""}>Con queso crema</option>
      <option value="no" ${savedGohan.creamCheese === false ? "selected" : ""}>Sin queso crema</option>
    </select>

    <h3>Elige tus vegetales (máximo 3)</h3>
    <div id="gohanVegetableChoices">
      ${vegetables.map((item, index) => `
        <label class="veg-row">
          <input
            type="checkbox"
            class="gohan-vegetable"
            value="${escapeHTML(item.name)}"
            ${savedVegetables.includes(item.name) ? "checked" : ""}
          >
          ${escapeHTML(item.name)}
        </label>
      `).join("")}

      <label class="veg-row">
        <input
          type="checkbox"
          id="gohanNoVegetables"
          ${savedGohan.noVegetables ? "checked" : ""}
        >
        Sin vegetal
      </label>
    </div>

    <p class="dialog-note" id="gohanVegetableValidation">
      Puedes elegir hasta 3 vegetales o seleccionar Sin vegetal.
    </p>

    <h3>Elige tu proteína (opcional)</h3>
    <select id="gohanProtein">
      <option value="">Sin proteína</option>
      ${proteins.map(item => `
        <option
          value="${escapeHTML(item.name)}"
          data-surcharge="${Number(item.surcharge) || 0}"
          ${savedGohan.protein === item.name ? "selected" : ""}
        >
          ${escapeHTML(item.name)}
          ${Number(item.surcharge) > 0 ? ` (+${money(item.surcharge)})` : ""}
        </option>
      `).join("")}
    </select>

    <p class="dialog-note" id="gohanPriceNote">
      El precio base no cambia según los ingredientes, salvo los recargos de proteína.
    </p>
  `;
} else if (isDish) {
  configuration = `<div class="dialog-note">Incluye hasta 2 salsas de cortesía por unidad. No incluye palitos.</div>`;
}


  const initialQuantity = editingItem?.quantity || 1;

  const initialSoy = editingItem
    ? Number(initialConfig.soy || 0)
    : freePerUnit;

  const initialTeriyaki = Number(initialConfig.teriyaki || 0);

  const sauceFields = freePerUnit > 0 ? `
    <h3>Salsas de cortesía</h3>
    <p>Elige cómo distribuir las ${freePerUnit} salsas incluidas por unidad.</p>
    <div class="dialog-grid">
      <div>
        <label for="soyCount">Soya</label>
        <input id="soyCount" type="number" min="0" value="${initialSoy}">
      </div>
      <div>
        <label for="teriyakiCount">Teriyaki</label>
        <input id="teriyakiCount" type="number" min="0" value="${initialTeriyaki}">
      </div>
    </div>
    <p id="sauceValidation" class="dialog-note">
      Total de cortesía: ${freePerUnit}. No se pueden superar las unidades incluidas.
    </p>
  ` : `<div class="dialog-note">Este producto no incluye salsas de cortesía.</div>`;

  const paidSauceFields = paidSauceProducts.length ? `
    <h3>Salsas adicionales (con costo)</h3>
    <p>Selecciona las cantidades adicionales que deseas para este producto.</p>
    <div class="dialog-note">
      Estas salsas tienen un costo adicional y no reemplazan las de cortesía.
    </div>

    ${paidSauceProducts.map(sauce => {
      const savedSauce = (initialConfig.paidSauces || []).find(
        item => String(item.id) === String(sauce.id)
      );

      return `
        <div class="veg-row">
          <label>${escapeHTML(sauce.name)} · ${money(sauce.price)}</label>
          <input
            type="number"
            class="paid-sauce-quantity"
            data-sauce-id="${escapeHTML(sauce.id)}"
            min="0"
            value="${Number(savedSauce?.quantity || 0)}"
          >
        </div>
      `;
    }).join("")}
  ` : `
    <div class="dialog-note">
      No hay salsas adicionales disponibles.
    </div>
  `;

  openDialog(`
    <h2>${editingItem ? "Editar producto" : escapeHTML(product.name)}</h2>
    <p>${escapeHTML(product.description || "")}</p>
    <h3>${money(product.price)}</h3>
    ${configuration}
    ${chopsticksChoice}

    <label for="productQuantity">Cantidad de productos</label>
    <small class="quantity-help">
      Indica cuántas unidades deseas llevar de este producto. Puedes agregar promociones, rolls, gohan, bowls y otros productos. La cantidad seleccionada se sumará a tu carrito.
    </small>
    <input id="productQuantity" type="number" min="1" max="20" value="${initialQuantity}">

    ${sauceFields}
    ${paidSauceFields}

    <button type="button" class="dialog-primary" id="confirmAdd">
      ${editingItem ? "Guardar cambios" : "Agregar al carrito"}
    </button>
    <button type="button" class="dialog-secondary" data-close>Seguir mirando la carta</button>
  `);

  if (isGohan) {
    const vegetableChecks = Array.from(
      document.querySelectorAll(".gohan-vegetable")
    );
    const noVegetables = $("#gohanNoVegetables");
    const vegetableValidation = $("#gohanVegetableValidation");

    function validateGohanVegetables() {
      const selected = vegetableChecks.filter(input => input.checked);

      if (selected.length > 3) {
        const lastSelected = selected[selected.length - 1];
        lastSelected.checked = false;
      }

      const hasNoVegetables = noVegetables.checked;

      vegetableChecks.forEach(input => {
        input.disabled = hasNoVegetables;
      });

      noVegetables.disabled = vegetableChecks.some(
        input => input.checked
      );

      vegetableValidation.textContent = hasNoVegetables
        ? "Has elegido Sin vegetal."
        : `${vegetableChecks.filter(input => input.checked).length} de 3 vegetales seleccionados.`;
    }

    vegetableChecks.forEach(input => {
      input.addEventListener("change", validateGohanVegetables);
    });

    noVegetables.addEventListener("change", validateGohanVegetables);

    validateGohanVegetables();
  }

  const soy = $("#soyCount");
  const teriyaki = $("#teriyakiCount");
  const quantity = $("#productQuantity");
  
  if (isGohan) {
    const proteinSelect = $("#gohanProtein");
    const priceNote = $("#gohanPriceNote");

    function updateGohanProteinPrice() {
      const selectedOption =
        proteinSelect.options[proteinSelect.selectedIndex];

      const surcharge = Number(
        selectedOption.dataset.surcharge || 0
      );

      priceNote.textContent = surcharge > 0
        ? `Recargo por proteína: ${money(surcharge)} por Gohan.`
        : "Sin recargo adicional por proteína.";
    }

    proteinSelect.addEventListener(
      "change",
      updateGohanProteinPrice
    );

    updateGohanProteinPrice();
  }

    if (isPromo) {
    quantity.addEventListener("input", () => {
      const container = $("#vegetableChoices");
      if (!container) return;

      const totalRolls = rollCount * Math.max(
        1,
        Math.min(20, Number(quantity.value) || 1)
      );

      const previousVegetables = Array.from(
        container.querySelectorAll(".veg-choice")
      ).map(select => select.value);

      const vegetables = Array.from(
        { length: totalRolls },
        (_, i) => previousVegetables[i] ||
          initialConfig.vegetables?.[i] ||
          "Cebollín"
      );

      container.innerHTML = vegetables.map((vegetable, i) => `
        <div class="veg-row">
          <label for="veg${i}">Roll ${i + 1}</label>
          <select id="veg${i}" class="veg-choice">
            ${["Cebollín", "Pimentón", "Palta", "Sin vegetal"].map(value =>
              `<option ${vegetable === value ? "selected" : ""}>${value}</option>`
            ).join("")}
          </select>
        </div>
      `).join("");
    });
  }

  function validateSauces() {
    if (!soy || !teriyaki) return true;

    const total = Number(soy.value || 0) + Number(teriyaki.value || 0);
    const maximum = freePerUnit * Number(quantity.value || 1);
    const valid = total === maximum;

    $("#sauceValidation").textContent = valid
      ? `Correcto: ${total} salsas de cortesía seleccionadas.`
      : `Debes distribuir exactamente ${maximum} salsas entre soya y teriyaki.`;

    return valid;
  }

  [soy, teriyaki, quantity].filter(Boolean).forEach(field => {
    field.addEventListener("input", validateSauces);
  });

  validateSauces();

  $("#confirmAdd").addEventListener("click", () => {
    const qty = Math.max(1, Math.min(20, Number(quantity.value) || 1));
    const config = {};

    if (freePerUnit > 0) {
      const soyValue = Math.max(0, Number(soy.value) || 0);
      const teriyakiValue = Math.max(0, Number(teriyaki.value) || 0);

      if (soyValue + teriyakiValue !== freePerUnit * qty) {
        alert("Distribuye todas las salsas de cortesía entre soya y teriyaki.");
        return;
      }

      config.soy = soyValue;
      config.teriyaki = teriyakiValue;
    }

    if (isPromo) {
      config.vegetables = Array.from(
        document.querySelectorAll(".veg-choice")
      ).map(select => select.value);
    }

    if (isGohan) {
      const selectedVegetables = Array.from(
        document.querySelectorAll(".gohan-vegetable:checked")
      ).map(input => input.value);

      const noVegetables = $("#gohanNoVegetables").checked;

      const proteinSelect = $("#gohanProtein");
      const selectedProtein =
        proteinSelect.options[proteinSelect.selectedIndex];

      config.gohan = {
        creamCheese: $("#gohanCreamCheese").value === "yes",
        vegetables: noVegetables ? [] : selectedVegetables,
        noVegetables,
        protein: proteinSelect.value,
        proteinSurcharge: Number(
          selectedProtein.dataset.surcharge || 0
        )
      };
    }

    if (isRoll || isPromo) {
      config.wantsChopsticks =
        $("#wantsChopsticks").value === "yes";
    }

    config.paidSauces = Array.from(
      document.querySelectorAll(".paid-sauce-quantity")
    )
      .map(input => ({
        id: input.dataset.sauceId,
        quantity: Math.max(0, Number(input.value) || 0)
      }))
      .filter(sauce => sauce.quantity > 0);

    const item = {
      key: editingItem?.key ||
        Date.now().toString() + Math.random().toString(16).slice(2),
      id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: qty,
      product_type: type,
      config
    };

    if (editingItem) {
      const index = cart.findIndex(entry => entry.key === editingItem.key);

      if (index !== -1) {
        cart[index] = item;
      } else {
        cart.push(item);
      }
    } else {
      cart.push(item);
    }

    saveCart();
    closeDialog();
    openCart();
  });
}


// CARRITO



function openFulfillment() {
  openDialog(`
    <h2>¿Cómo deseas recibir tu pedido?</h2>

    <p>Selecciona la modalidad de entrega de tu pedido.</p>

    <label for="fulfillmentMethod">Modalidad de entrega</label>
    <select id="fulfillmentMethod">
      <option value="">Selecciona una opción</option>
      <option value="delivery">Delivery</option>
      <option value="pickup">Retiro en local</option>
    </select>

    <div id="deliveryFields" style="display:none">

      <div class="dialog-note">
        El delivery está disponible dentro de la zona urbana de Los Ángeles.
        El costo dependerá de la distancia desde nuestro local y será confirmado por WhatsApp.
      </div>

      <label for="deliveryAddress">Dirección de entrega</label>
      <input
        id="deliveryAddress"
        type="text"
        placeholder="Ej.: Calle, número y población"
      >

      <label for="deliveryReference">Referencia (opcional)</label>
      <input
        id="deliveryReference"
        type="text"
        placeholder="Casa, departamento, pasaje, etc."
      >

      <label style="display:flex;gap:9px;align-items:flex-start;font-weight:400">
        <input
          id="confirmUrbanZone"
          type="checkbox"
          style="width:20px;min-height:20px;margin-top:2px"
        >
        Confirmo que mi dirección está dentro de la zona urbana de Los Ángeles.
      </label>
    </div>

    <div id="pickupFields" style="display:none">
      <div class="dialog-note">
        Puedes retirar tu pedido en nuestro local.
        Te avisaremos por WhatsApp cuando esté listo.
        No se cobra delivery.
      </div>
    </div>

    <hr>

    <h3>¿Cómo deseas pagar?</h3>

    <label for="paymentMethod">Método de pago</label>
    <select id="paymentMethod">
      <option value="">Selecciona una opción</option>
      <option value="debit_credit">Tarjeta de débito / crédito</option>
      <option value="cash">Efectivo</option>
      <option value="transfer">Transferencia bancaria</option>
    </select>

    <div id="transferFields" style="display:none">
      <div class="dialog-note">
        <strong>Datos para transferencia bancaria</strong><br><br>
        Titular: ICHIBAN SUSHI<br>
        RUT: 77.883.241-0<br>
        Banco: Banco Estado<br>
        Tipo de cuenta: Cuenta Vista<br>
        Número de cuenta: 90276039953<br><br>
        Después de realizar la transferencia, envía el comprobante por WhatsApp para confirmar tu pedido.
      </div>
    </div>

    <div class="cart-total">
      <span>Subtotal productos</span>
      <span>${money(cartTotal())}</span>
    </div>

    <button type="button" class="dialog-primary" id="confirmFulfillment">
      Continuar por WhatsApp
    </button>

    <button type="button" class="dialog-secondary" id="backToCart">
      Volver al carrito
    </button>
  `);

  const method = $("#fulfillmentMethod");
  const deliveryFields = $("#deliveryFields");
  const pickupFields = $("#pickupFields");
  const paymentMethod = $("#paymentMethod");
  const transferFields = $("#transferFields");

  method.addEventListener("change", () => {
    deliveryFields.style.display =
      method.value === "delivery" ? "block" : "none";

    pickupFields.style.display =
      method.value === "pickup" ? "block" : "none";
  });

  paymentMethod.addEventListener("change", () => {
    transferFields.style.display =
      paymentMethod.value === "transfer" ? "block" : "none";
  });

  $("#backToCart").addEventListener("click", openCart);

  $("#confirmFulfillment").addEventListener("click", () => {
    if (!method.value) {
      alert("Selecciona Delivery o Retiro en local.");
      return;
    }

    if (!paymentMethod.value) {
      alert("Selecciona un método de pago.");
      return;
    }

    const fulfillment = {
      method: method.value,
      payment_method: paymentMethod.value,
      address: "",
      reference: ""
    };

    if (method.value === "delivery") {
      fulfillment.address = $("#deliveryAddress").value.trim();
      fulfillment.reference = $("#deliveryReference").value.trim();

      if (!fulfillment.address) {
        alert("Ingresa la dirección donde deseas recibir tu pedido.");
        return;
      }

      if (!$("#confirmUrbanZone").checked) {
        alert("Debes confirmar que tu dirección está dentro de la zona urbana de Los Ángeles.");
        return;
      }
    }

    sendOrder(fulfillment);
  });
}

function openCart() {
  if (!cart.length) {
    openDialog(`
      <div class="cart-empty">
        <div style="font-size:48px">🛒</div>
        <p class="cart-eyebrow">ICHIBAN SUSHI MAKI</p>
        <h2>Tu pedido está vacío</h2>
        <p>Descubre nuestras preparaciones y agrega tus favoritas.</p>
        <button type="button" class="dialog-primary" data-close>
          Volver a la carta
        </button>
      </div>
    `);
    return;
  }

const lines = cart.map(item => {
  const description = cartItemDescription(item);
  const quantity = Number(item.quantity || 1);

  const gohanSurcharge =
    Number(item.config?.gohan?.proteinSurcharge || 0) * quantity;

  const itemTotal =
    Number(item.price || 0) * quantity +
    gohanSurcharge +
    getPaidSaucesTotal(item);

  const unitPrice =
    Number(item.price || 0) +
    Number(item.config?.gohan?.proteinSurcharge || 0);

  return `
    <div class="cart-line">
      <div class="cart-line-top">
        <div class="cart-line-info">
          <h3>${escapeHTML(item.name)}</h3>
          <small>${quantity} × ${money(unitPrice)}</small>
        </div>
        <strong class="cart-line-price">${money(itemTotal)}</strong>
      </div>

      ${description ? `
        <div class="cart-line-description">
  ${description}
</div>
      ` : ""}

      <div class="cart-line-actions">
        <button type="button" data-cart-minus="${item.key}" aria-label="Disminuir cantidad">−</button>
        <strong>${item.quantity}</strong>
        <button type="button" data-cart-plus="${item.key}" aria-label="Aumentar cantidad">+</button>
        <button type="button" data-cart-edit="${item.key}">Editar</button>
        <button type="button" data-cart-remove="${item.key}">Eliminar</button>
      </div>
    </div>
  `;
}).join("");

  openDialog(`
    <div class="cart-heading">
      <p class="cart-eyebrow">ICHIBAN SUSHI MAKI</p>
      <h2>Mi pedido</h2>
      <p>Revisa tus preparaciones antes de continuar.</p>
    </div>

    <div class="cart-items">
      ${lines}
    </div>

    <div class="cart-summary">
      <div class="cart-total">
        <span>Subtotal</span>
        <strong>${money(cartTotal())}</strong>
      </div>

      <p class="dialog-note">
        El costo del delivery se calcula según la distancia desde nuestro local y será informado por nuestro equipo.
      </p>
    </div>

    <button type="button" class="cart-checkout" id="sendWhatsApp">
      Continuar pedido
    </button>

    <button type="button" class="dialog-secondary" data-close>
      Seguir comprando
    </button>
  `);

  $("#sendWhatsApp").addEventListener("click", openFulfillment);
}



function updateCartQuantity(key, change) {
  const item = cart.find(entry => entry.key === key);
  if (!item) return;

  const previousQuantity = item.quantity;
  const next = previousQuantity + change;

  if (next <= 0) {
    cart = cart.filter(entry => entry.key !== key);
  } else {
    const hasFreeSauces =
      item.config &&
      (item.config.soy !== undefined ||
       item.config.teriyaki !== undefined);

    let editSauces = false;

    if (change > 0 && hasFreeSauces) {
      editSauces = window.confirm(
        "Has aumentado la cantidad de productos.\n\n" +
        "¿Deseas redistribuir las salsas de cortesía?\n\n" +
        "Aceptar: Editar las salsas.\n" +
        "Cancelar: Continuar con la distribución anterior."
      );
    }

    item.quantity = Math.min(20, next);

    if (item.config?.vegetables && item.product_type === "promotion") {
      const product = products.find(
        p => String(p.id) === String(item.id)
      );

      const rollsPerPromo = Number(
        parseOptions(product?.options).rolls_count || 1
      );

      const totalRolls = rollsPerPromo * item.quantity;

      while (item.config.vegetables.length < totalRolls) {
        item.config.vegetables.push("Cebollín");
      }

      item.config.vegetables =
        item.config.vegetables.slice(0, totalRolls);
    }

    if (hasFreeSauces && !editSauces) {
      const totalSauces =
        getFreeSaucesPerUnit(item) * item.quantity;

      const oldSoy = Number(item.config.soy || 0);
      const oldTeriyaki = Number(item.config.teriyaki || 0);
      const oldTotal = oldSoy + oldTeriyaki;

      if (oldTotal > 0) {
        item.config.soy = Math.round(
          totalSauces * oldSoy / oldTotal
        );

        item.config.teriyaki =
          totalSauces - item.config.soy;
      } else {
        item.config.soy = totalSauces;
        item.config.teriyaki = 0;
      }
    }

    saveCart();

    if (editSauces) {
      const product = products.find(
        p => String(p.id) === String(item.id)
      );

      if (product) {
        openProduct(product, item);
        return;
      }
    }
  }

  saveCart();
  openCart();
}

function getFreeSaucesPerUnit(item) {
  if (item.product_type === "promotion") {
    const product = products.find(p => String(p.id) === String(item.id));
    return Number(parseOptions(product?.options).rolls_count || 1);
  }

  if (item.product_type === "roll" || item.product_type === "handroll") return 1;
  if (item.product_type === "dish") return 2;
  return 0;
}

function calculateChopsticks() {
  let total = 0;

  cart.forEach(item => {
    if (item.config?.wantsChopsticks !== true) return;

    if (item.product_type === "roll") {
      total += item.quantity;
    }

    if (item.product_type === "promotion") {
      const product = products.find(
        p => String(p.id) === String(item.id)
      );

      const rolls = Number(
        parseOptions(product?.options).rolls_count || 1
      );

      total += rolls * item.quantity;
    }
  });

  return Math.min(6, total);
}




async function sendOrder(fulfillment = {}) {
  if (!cart.length) return;

  if (!fulfillment.method) {
    alert("Selecciona cómo deseas recibir tu pedido.");
    return;
  }

  if (!["debit_credit", "cash", "transfer"].includes(fulfillment.payment_method)) {
    alert("Selecciona un método de pago válido.");
    return;
  }

  const paymentLabels = {
    debit_credit: "Tarjeta de débito / crédito",
    cash: "Efectivo",
    transfer: "Transferencia bancaria"
  };

  const paymentLabel = paymentLabels[fulfillment.payment_method];

  const details = cart.map(item => {
    const config = item.config || {};
    const quantity = Number(item.quantity || 1);

    const gohanSurcharge =
      Number(config.gohan?.proteinSurcharge || 0) * quantity;

    const itemPrice =
      Number(item.price || 0) * quantity + gohanSurcharge;

    const lines = [
      `${quantity} × ${item.name} — ${money(itemPrice)}`
    ];

    if (config.gohan) {
      const gohan = config.gohan;

      lines.push("PERSONALIZACIÓN GOHAN:");

      lines.push(
        gohan.creamCheese ? "Queso crema: Sí" : "Queso crema: No"
      );

      lines.push(
        gohan.noVegetables
          ? "Vegetales: Sin vegetal"
          : "Vegetales: " + (
              gohan.vegetables?.length
                ? gohan.vegetables.join(", ")
                : "Ninguno"
            )
      );

      lines.push(
        gohan.protein
          ? `Proteína: ${gohan.protein}` +
            (gohan.proteinSurcharge > 0
              ? ` (+${money(gohan.proteinSurcharge)})`
              : "")
          : "Proteína: Sin proteína"
      );
    }

    if (config.vegetables?.length) {
      lines.push("Vegetales por roll: " + config.vegetables.join(", "));
    }

    if (config.soy !== undefined || config.teriyaki !== undefined) {
      lines.push(
        `Salsas de cortesía: ${config.soy || 0} soya y ${config.teriyaki || 0} teriyaki`
      );
    }

    if (config.paidSauces?.length) {
      config.paidSauces.forEach(sauce => {
        const product = products.find(
          p => String(p.id) === String(sauce.id)
        );

        if (product) {
          lines.push(
            `Salsa adicional: ${product.name} × ${sauce.quantity} = ${money(product.price * sauce.quantity)}`
          );
        }
      });
    }

    return lines.join("\n");
  });

  const subtotal = cartTotal();

  const fulfillmentDetails = fulfillment.method === "delivery"
    ? [
        "MODALIDAD: DELIVERY",
        `DIRECCIÓN: ${fulfillment.address}`,
        `REFERENCIA: ${fulfillment.reference || "No indicada"}`,
        "",
        "DISPONIBILIDAD: POR CONFIRMAR",
        "COSTO DELIVERY: PENDIENTE DE CONFIRMACIÓN",
        `SUBTOTAL PRODUCTOS: ${money(subtotal)}`,
        "TOTAL FINAL: PENDIENTE DE CONFIRMAR",
        "",
        "Confirmar internamente disponibilidad y costo del reparto antes de informar el total al cliente."
      ]
    : [
        "MODALIDAD: RETIRO EN LOCAL",
        "DELIVERY: SIN COSTO",
        `TOTAL DEL PEDIDO: ${money(subtotal)}`,
        "",
        "Avisar al cliente por WhatsApp cuando el pedido esté listo para retirar."
      ];

  const paymentDetails = [
    `MÉTODO DE PAGO: ${paymentLabel}`
  ];

  if (fulfillment.payment_method === "transfer") {
    paymentDetails.push(
      "",
      "DATOS PARA TRANSFERENCIA:",
      "Titular: ICHIBAN SUSHI",
      "RUT: 77.883.241-0",
      "Banco: Banco Estado",
      "Tipo de cuenta: Cuenta Vista",
      "Número de cuenta: 90276039953",
      "",
      "Después de realizar la transferencia, envía el comprobante por WhatsApp para confirmar tu pedido."
    );
  }

  const message = [
    `Hola ${settings.store_name || "Ichiban Sushi Maki"}, quiero realizar este pedido:`,
    "",
    ...details,
    "",
    `Palitos: ${calculateChopsticks()} pares`,
    "",
    ...fulfillmentDetails,
    "",
    ...paymentDetails,
    "",
    "Quedo atento/a a la confirmación de mi pedido. ¡Gracias!"
  ].join("\n");

  const phone = String(settings.whatsapp || DEFAULT_PHONE).replace(/\D/g, "");

  const whatsappWindow = window.open("about:blank", "_blank");

  if (!whatsappWindow) {
    alert("Permite las ventanas emergentes para continuar con WhatsApp.");
    return;
  }

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fulfillment_method: fulfillment.method,
        payment_method: fulfillment.payment_method,
        address: fulfillment.address || null,
        reference: fulfillment.reference || null,
        subtotal,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          config: item.config || {}
        }))
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "No se pudo registrar el pedido.");
    }

    whatsappWindow.opener = null;
    whatsappWindow.location.href =
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  } catch (error) {
    whatsappWindow.close();

    alert(
      "No se pudo registrar tu pedido. Inténtalo nuevamente. " +
      (error.message || "")
    );
  }
}

// EVENTOS DEL CARRITO

document.addEventListener("click", event => {
  const plus = event.target.closest("[data-cart-plus]");
  const minus = event.target.closest("[data-cart-minus]");
  const remove = event.target.closest("[data-cart-remove]");
  const edit = event.target.closest("[data-cart-edit]");

  if (plus) updateCartQuantity(plus.dataset.cartPlus, 1);
  if (minus) updateCartQuantity(minus.dataset.cartMinus, -1);

  if (edit) {
    const item = cart.find(entry => entry.key === edit.dataset.cartEdit);

    if (!item) return;

    const product = products.find(
      p => String(p.id) === String(item.id)
    );

    if (!product) {
      alert("No se encontró este producto en la carta.");
      return;
    }

    openProduct(product, item);
  }

  if (remove) {
    cart = cart.filter(item => item.key !== remove.dataset.cartRemove);
    saveCart();
    openCart();
  }
});

  
// CATÁLOGO Y TARJETAS

function card(product) {
  const article = document.createElement("article");
  article.className = "product";

  const img = document.createElement("img");
  img.src = product.image ||
    "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800";
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

  const addButton = document.createElement("button");
  addButton.className = "product-add";
  addButton.type = "button";
  addButton.textContent = "Agregar al pedido";
  addButton.addEventListener("click", () => openProduct(product));

  inside.append(title, description, price, addButton);
  article.append(img, inside);

  return article;
}


function render() {
  const visible = products.filter(product => isEnabled(product.available));

  // PRODUCTOS DESTACADOS
  const featuredGrid = $("#featuredGrid");

  if (featuredGrid) {
    featuredGrid.replaceChildren();

    const featured = visible
      .filter(product => isEnabled(product.featured))
      .slice(0, 3);

    if (featured.length) {
      featured.forEach(product => featuredGrid.appendChild(card(product)));
    } else {
      featuredGrid.textContent = "Pronto anunciaremos nuestros productos destacados.";
    }
  }

  // PROMOCIONES REALES
  const promoGrid = $("#promoGrid");

  if (promoGrid) {
    promoGrid.replaceChildren();

    const promotions = visible.filter(
  product =>
    getType(product) === "promotion" &&
    product.options?.weekly_promotion === true
);

    if (promotions.length) {
      promotions.forEach(product => promoGrid.appendChild(card(product)));
    } else {
      promoGrid.textContent = "Pronto anunciaremos promociones.";
    }
  }

const standardCategories = [
  "Rolls Signature",
  "Rolls clásicos",
  "Street Food",
  "Promociones Ichiban",
  "Entradas & para compartir",
  "Gohan",
  "Tortas Ichiban",
  "Bebidas",
  "Salsas y extras"
];

  const usedCategories = standardCategories.filter(item =>
    visible.some(product => product.category === item)
  );

  const otherCategories = [...new Set(visible.map(product => product.category).filter(Boolean))]
    .filter(item => !standardCategories.includes(item));

  const categories = ["Todos", ...usedCategories, ...otherCategories];

  const categoryContainer = $("#categories");

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

  const productGrid = $("#productGrid");

  if (productGrid) {
    productGrid.replaceChildren();

    if (!category) {
      productGrid.textContent =
        "Selecciona una categoría para descubrir nuestros productos.";
    } else {
      const filtered = visible.filter(product =>
        category === "Todos" || product.category === category
      );

      if (filtered.length) {
        filtered.forEach(product => productGrid.appendChild(card(product)));
      } else {
        productGrid.textContent =
          "No hay productos disponibles en esta categoría.";
      }
    }
  }

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
}



function setupMobileMenu() {
  const menuToggle = document.querySelector("#menuToggle");
  const siteNav = document.querySelector("#siteNav");

  if (!menuToggle || !siteNav) return;

  menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Cerrar menú" : "Abrir menú"
    );
  });

  siteNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Abrir menú");
    });
  });
}

async function initialize() {
  addStoreStyles();
  setupMobileMenu();
  ensureCartUI();
  await loadSettings();
  await loadProducts();
  updateCartCount();
  askPendingCart();
}

initialize();
