
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
const DEFAULT_HOURS_MESSAGE = "Recuerda nuestro horarios de atención Lunes a jueves de 13:00 a 23:00 y viernes y sábado de 13:00 a 00:00 te esperamos";
function storeStatus() {
 const op=settings.store_operation||{};
 if(op.manual_closed===true||op.manual_closed===1||op.manual_closed==="1") return {open:false,manual:true,message:String(op.closed_message||"En estos momentos tenemos cerrado. Pronto volveremos a nuestro horario habitual.")};
 const enabled=op.hours_enabled!==false&&op.hours_enabled!==0&&op.hours_enabled!=="0"&&op.hours_enabled!=="false";
 if(!enabled)return {open:true,manual:false,message:""};
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Santiago",weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date());
 const v=Object.fromEntries(parts.map(p=>[p.type,p.value])),day=v.weekday,minutes=Number(v.hour)*60+Number(v.minute),closing=day==="Fri"||day==="Sat"?1440:1380;
 return {open:["Mon","Tue","Wed","Thu","Fri","Sat"].includes(day)&&minutes>=780&&minutes<closing,manual:false,message:DEFAULT_HOURS_MESSAGE};
}
function showStoreClosedNotice(status=storeStatus()){
 if(status.open)return;
 const title=status.manual?"En estos momentos estamos cerrados":"Fuera de nuestro horario de atención";
 openDialog(`
  <div class="cart-heading">
   <p class="cart-eyebrow">ICHIBAN SUSHI MAKI</p>
   <h2>${title}</h2>
   <p>Gracias por tu interés en nuestros productos</p>
  </div>
  <div class="dialog-note">${escapeHTML(status.message)}</div>
  <p>Podrás revisar nuestro menú y volver a realizar tu pedido cuando estemos atendiendo.</p>
  <button type="button" class="dialog-primary" data-close>Entendido</button>
 `);
}
function requireStoreOpen(){const s=storeStatus();if(!s.open){showStoreClosedNotice(s);return false;}return true;}
function showManualClosedNotice(){const s=storeStatus();if(!s.manual)return;showStoreClosedNotice(s);}

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


function renderHeroCarousel(images) {
  const container = $("#heroCarousel"), dots = $("#heroDots");
  const previous = $("#heroPrev"), next = $("#heroNext"), frame = $(".hero-art");
  if (!container || !dots || !frame) return;
  const validImages = (Array.isArray(images) ? images : []).filter(Boolean).slice(0, 4);
  container.innerHTML = ""; dots.innerHTML = "";
  frame.classList.toggle("has-slides", validImages.length > 0);
  if (!validImages.length) { if (previous) previous.hidden = true; if (next) next.hidden = true; return; }
  let active = 0;
  validImages.forEach((src, index) => {
    const slide = document.createElement("div");
    slide.className = "hero-slide" + (index === 0 ? " active" : "");
    const img = document.createElement("img");
    img.src = src; img.alt = "Preparaciones de Ichiban Sushi Maki"; img.loading = index === 0 ? "eager" : "lazy";
    slide.appendChild(img); container.appendChild(slide);
    const dot = document.createElement("button");
    dot.type = "button"; dot.className = "hero-dot" + (index === 0 ? " active" : "");
    dot.setAttribute("aria-label", "Ver fotografía " + (index + 1));
    dot.addEventListener("click", () => show(index)); dots.appendChild(dot);
  });
  const slides = [...container.children], indicators = [...dots.children];
  function show(index) {
    active = (index + validImages.length) % validImages.length;
    slides.forEach((slide, i) => slide.classList.toggle("active", i === active));
    indicators.forEach((dot, i) => dot.classList.toggle("active", i === active));
  }
  if (previous) { previous.hidden = validImages.length < 2; previous.onclick = () => show(active - 1); }
  if (next) { next.hidden = validImages.length < 2; next.onclick = () => show(active + 1); }
  if (window.ichibanHeroTimer) clearInterval(window.ichibanHeroTimer);
  if (validImages.length > 1) {
    window.ichibanHeroTimer = setInterval(() => show(active + 1), 4500);
    frame.onmouseenter = () => clearInterval(window.ichibanHeroTimer);
    frame.onmouseleave = () => { clearInterval(window.ichibanHeroTimer); window.ichibanHeroTimer = setInterval(() => show(active + 1), 4500); };
  }
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
  if (hero) {
    let heroImages = [];
    try { heroImages = Array.isArray(settings.hero_images) ? settings.hero_images : JSON.parse(settings.hero_images || "[]"); }
    catch { heroImages = []; }
    if (!heroImages.length && settings.hero_image) heroImages = [settings.hero_image];
    renderHeroCarousel(heroImages);
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
      name.includes("burger") || name.includes("plato")) return "dish";
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
  margin:14px 0;
  padding:18px;
  border:1px solid #e0d3c1;
  border-radius:12px;
  background:#fffaf2;
  box-shadow:0 4px 14px #3827190b;
}

.cart-line-top {
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:14px;
  padding-bottom:12px;
  border-bottom:1px solid #eee4d7;
}

.cart-line-info h3 {
  margin:0 0 6px;
  color:#28231f;
  font-size:17px;
  line-height:1.3;
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
  margin-top:13px;
  padding:13px;
  background:#f7f1e8;
  border:1px solid #e8ddce;
  border-radius:9px;
  color:#62584e;
  font-size:14px;
  line-height:1.65;
  display:grid;
  gap:12px;
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
  font-size:13px;
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
  font-size:13px;
  font-weight:700;
  padding-top:4px;
}

.cart-options {
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  min-width:0;
}

.cart-promotion-rolls {
  display:grid;
  grid-template-columns:1fr;
  gap:9px;
}

.cart-promotion-rolls .cart-option {
  display:block !important;
  box-sizing:border-box;
  width:100%;
  max-width:none;
  min-width:0;
  padding:13px 15px;
  border-radius:11px;
  font-size:14px;
  line-height:1.65;
  white-space:normal;
  text-align:left;
  overflow-wrap:break-word;
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
  font-size:13px;
  font-weight:700;
  line-height:1.5;
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
  margin-top:18px;
  padding:18px;
  background:#f7f0e6;
  border:1px solid #dfd0bb;
  border-radius:12px;
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
    font-size:17px;
  }

  .cart-line-price {
    font-size:17px;
  }

  .cart-line-actions {
    gap:8px;
  }

  .cart-line-actions button {
    min-height:42px;
    padding:10px 14px;
    font-size:14px;
  }

   .cart-line-description {
    font-size:14px;
    line-height:1.65;
  }

  .cart-config-title { font-size:13px; }
  .cart-config-label { font-size:14px; }
  .cart-option { font-size:14px; line-height:1.55; }
  .cart-promotion-rolls .cart-option { font-size:14px; padding:11px 12px; }
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
  padding:6px 9px;
  font-size:14px;
  line-height:1.55;
}
  .cart-summary {
    padding:13px;
  }

   .cart-total {
    font-size:20px;
  }

  .cart-total strong {
    font-size:22px;
  }

  .ichiban-dialog .dialog-primary,
  .cart-checkout {
    min-height: 50px;
    padding: 16px;
    font-size: 13px;
    letter-spacing: .7px;
  }
}

/* Presentación uniforme de todas las personalizaciones del carrito */
.cart-line-info small {
  font-size:13px;
  line-height:1.5;
}

.cart-config-section {
  gap:9px;
  padding:12px;
  border-radius:10px;
}

.cart-config-title {
  font-size:13px;
  line-height:1.45;
}

.cart-config-row {
  grid-template-columns:105px minmax(0,1fr);
  gap:10px;
  align-items:start;
}

.cart-config-row > .cart-option {
  display:block;
  box-sizing:border-box;
  width:100%;
  max-width:100%;
  min-width:0;
  padding:8px 11px;
  border-radius:10px;
  font-size:14px;
  line-height:1.6;
  white-space:normal;
  text-align:left;
  overflow-wrap:anywhere;
}

.cart-config-row > .cart-options {
  display:flex;
  flex-wrap:wrap;
  align-items:flex-start;
  gap:7px;
}

.cart-config-row > .cart-options .cart-option {
  display:inline-flex;
  width:auto;
  max-width:100%;
  padding:7px 10px;
  border-radius:10px;
  font-size:14px;
  line-height:1.5;
  white-space:normal;
  text-align:left;
}

.cart-promotion-rolls .cart-option {
  padding:13px 15px;
  border-radius:10px;
  font-size:14px;
  line-height:1.7;
}

.cart-line-actions {
  gap:9px;
}

.cart-line-actions button {
  min-height:38px;
  padding:9px 12px;
  font-size:13px;
}

@media(max-width:600px) {
  .cart-line {
    padding:14px 0;
  }

  .cart-line-description {
    padding:11px;
    gap:9px;
  }

  .cart-config-section {
    padding:10px;
    gap:8px;
  }

  .cart-config-row {
    grid-template-columns:minmax(0,1fr);
    gap:5px;
  }

  .cart-config-label {
    padding-top:0;
    font-size:14px;
  }

  .cart-config-row > .cart-option {
    font-size:14px;
    padding:8px 10px;
  }

  .cart-config-row > .cart-options {
    gap:6px;
  }

  .cart-promotion-rolls {
    gap:8px;
  }

  .cart-promotion-rolls .cart-option {
    padding:11px 12px;
  }

  .cart-line-actions button {
    min-height:42px;
    padding:10px 13px;
    font-size:14px;
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
    const sushiBurgerSurcharge =
      Number(item.config?.sushiBurger?.proteinSurcharge || 0) * quantity;
const customRollSurcharge =
  (
    Number(item.config?.customRoll?.coveringSurcharge || 0) +
    Number(item.config?.customRoll?.proteinSurcharge || 0)
  ) * quantity;
return sum +
  productsTotal +
  gohanSurcharge +
  sushiBurgerSurcharge +
  customRollSurcharge +
  getPaidSaucesTotal(item);
  }, 0);
}


function cartItemDescription(item) {
  const config = item.config || {};
  const sections = [];
    if (
    config.weeklyPromo &&
    config.weeklyPromo.offerType === "simple" &&
    Array.isArray(config.weeklyPromo.simpleOffers)
  ) {
    const weekly = config.weeklyPromo;

    sections.push(`
      <div class="cart-config-section">
        <strong class="cart-config-title">Personalización de la promoción</strong>

        ${weekly.simpleOffers.map((offer, index) => `
          <div class="cart-config-row">
            <span class="cart-config-label">Unidad ${index + 1}</span>
            <span class="cart-option">
              Proteína: ${escapeHTML(offer.protein || "Sin proteína")}
              <br>
              Vegetales: ${
                offer.vegetables?.length
                  ? offer.vegetables.map(value => escapeHTML(value)).join(", ")
                  : "Sin vegetales"
              }
              <br>
              Queso crema: ${escapeHTML(offer.cheese || "Sin selección")}
              <br>
              Nori: ${escapeHTML(offer.nori || "Sin selección")}
            </span>
          </div>
        `).join("")}
      </div>
    `);
  }
  if (config.weeklyPromo && config.weeklyPromo.offerType === "sushi_burger_combo") {
    const weekly = config.weeklyPromo;
    sections.push(`
      <div class="cart-config-section">
        <strong class="cart-config-title">Personalización Sushi Burger</strong>
        <div class="cart-config-row">
          <span class="cart-config-label">Proteína</span>
          <span class="cart-option">${escapeHTML(weekly.protein || "Sin proteína")}</span>
        </div>
        <div class="cart-config-row">
          <span class="cart-config-label">Queso crema</span>
          <span class="cart-option">${escapeHTML(weekly.cheese || "Sin selección")}</span>
        </div>
        <div class="cart-config-row">
          <span class="cart-config-label">Vegetales</span>
          <span class="cart-option">${weekly.vegetables?.length ? weekly.vegetables.map(escapeHTML).join(", ") : "Sin vegetales"}</span>
        </div>
        ${Number(weekly.proteinSurcharge ?? weekly.shrimpExtra) > 0 ? `
          <div class="cart-config-row">
            <span class="cart-config-label">Recargo por proteína</span>
            <span class="cart-option">+${money(weekly.proteinSurcharge ?? weekly.shrimpExtra)}</span>
          </div>
        ` : ""}
      </div>
      <div class="cart-config-section">
        <strong class="cart-config-title">Detalles de la promoción semanal</strong>
        ${weekly.day ? `
          <div class="cart-config-row">
            <span class="cart-config-label">Día</span>
            <span class="cart-option">${escapeHTML(weekly.day)}</span>
          </div>
        ` : ""}
        ${weekly.accompaniment ? `
          <div class="cart-config-row">
            <span class="cart-config-label">Acompañamiento incluido</span>
            <span class="cart-option">${escapeHTML(weekly.accompaniment)} × ${Number(item.quantity || 1)}</span>
          </div>
        ` : ""}
      </div>
    `);
  }
  if (config.weeklyPromo && config.weeklyPromo.offerType !== "simple" && config.weeklyPromo.offerType !== "sushi_burger_combo") {
    const weekly = config.weeklyPromo;

    sections.push(`
      <div class="cart-config-section">
        <strong class="cart-config-title">Detalle de la promoción</strong>

        ${weekly.day ? `
          <div class="cart-config-row">
            <span class="cart-config-label">Día</span>
            <span class="cart-option">${escapeHTML(weekly.day)}</span>
          </div>
        ` : ""}

        ${weekly.protein ? `
          <div class="cart-config-row">
            <span class="cart-config-label">Proteína</span>
            <span class="cart-option">${escapeHTML(weekly.protein)}</span>
          </div>
        ` : ""}

      ${weekly.offerType !== "gohan_combo" && weekly.offerType !== "handroll_combo" ? (
  weekly.vegetables?.length ? `
    <div class="cart-config-row">
      <span class="cart-config-label">Vegetales</span>
      <span class="cart-option">${weekly.vegetables.map(escapeHTML).join(", ")}</span>
    </div>
  ` : `
    <div class="cart-config-row">
      <span class="cart-config-label">Vegetales</span>
      <span class="cart-option">Sin vegetales</span>
    </div>
  `
) : ""}

        ${weekly.cheese ? `
          <div class="cart-config-row">
            <span class="cart-config-label">Queso crema</span>
            <span class="cart-option">${escapeHTML(weekly.cheese)}</span>
          </div>
        ` : ""}

        ${Number(weekly.proteinSurcharge ?? weekly.shrimpExtra) > 0 ? `
          <div class="cart-config-row">
            <span class="cart-config-label">Recargo por proteína</span>
            <span class="cart-option">+${money(weekly.proteinSurcharge ?? weekly.shrimpExtra)}</span>
          </div>
        ` : ""}
                ${Array.isArray(weekly.gohans) && weekly.gohans.length ? `
          <div class="cart-config-row">
            <span class="cart-config-label">Personalización de Gohan</span>
            <span class="cart-option">
              ${weekly.gohans.map((gohan, index) => `
                Gohan ${index + 1}: ${escapeHTML(gohan.protein || "Sin proteína")}
                · Vegetales: ${
                  Array.isArray(gohan.vegetables) && gohan.vegetables.length
                    ? gohan.vegetables.map(value => escapeHTML(value)).join(", ")
                    : "Sin vegetales"
                }
                ${gohan.cheese ? ` · ${escapeHTML(gohan.cheese)}` : ""}
              `).join("<br>")}
            </span>
          </div>
                ` : ""}
        ${Array.isArray(weekly.handrolls) && weekly.handrolls.length ? `
          <div class="cart-config-row">
            <span class="cart-config-label">Personalización de Handroll</span>
            <span class="cart-option">
             ${weekly.handrolls.map((handroll, index) => `
  Handroll ${index + 1}: ${escapeHTML(handroll.protein || "Sin proteína")}
  · Vegetal: ${escapeHTML(handroll.vegetable || "Sin vegetal")}
  · ${escapeHTML(handroll.cheese || "Sin selección de queso")}
  · ${escapeHTML(handroll.nori || "Con nori")}
  · Salsa: ${escapeHTML(handroll.sauce || "Sin salsa")}
`).join("<br>")}
            </span>
          </div>
        ` : ""}
        ${Array.isArray(weekly.customCombo) && weekly.customCombo.length ? `
  <div class="cart-config-row">
    <span class="cart-config-label">Productos del combo</span>
    <span class="cart-option">
      ${weekly.customCombo.map((unit, index) => `
        Producto ${index + 1}:
        ${escapeHTML(unit.productType || "Producto")}
        ${unit.protein ? ` · Proteína: ${escapeHTML(unit.protein)}` : ""}
        ${unit.vegetable ? ` · Vegetal: ${escapeHTML(unit.vegetable)}` : ""}
        ${unit.cheese ? ` · ${escapeHTML(unit.cheese)}` : ""}
        ${unit.nori ? ` · ${escapeHTML(unit.nori)}` : ""}
      `).join("<br>")}
    </span>
  </div>
` : ""}
        ${weekly.accompaniment ? `
          <div class="cart-config-row">
            <span class="cart-config-label">Acompañamiento incluido</span>
            <span class="cart-option">
              ${escapeHTML(weekly.accompaniment)} × ${Number(item.quantity || 1)}
            </span>
          </div>
        ` : ""}
      </div>
    `);
  }
if (config.handroll) {
  const handroll = config.handroll;

  sections.push(`
    <div class="cart-config-section">
      <strong class="cart-config-title">Personalización Handroll</strong>

      ${handroll.vegetable ? `
        <div class="cart-config-row">
          <span class="cart-config-label">Vegetal</span>
          <span class="cart-option">${escapeHTML(handroll.vegetable)}</span>
        </div>
      ` : ""}

      ${handroll.cheese ? `
        <div class="cart-config-row">
          <span class="cart-config-label">Queso crema</span>
          <span class="cart-option">${escapeHTML(handroll.cheese)}</span>
        </div>
      ` : ""}

      ${handroll.nori ? `
        <div class="cart-config-row">
          <span class="cart-config-label">Nori</span>
          <span class="cart-option">${escapeHTML(handroll.nori)}</span>
        </div>
      ` : ""}
    </div>
  `);
}
  if (config.customRoll) {
    const roll = config.customRoll;

    sections.push(`
      <div class="cart-config-section">
        <strong class="cart-config-title">Personalización Arma tu Roll</strong>

        <div class="cart-config-row">
          <span class="cart-config-label">Base</span>
          <span class="cart-option">${escapeHTML(roll.rice)}</span>
        </div>

        <div class="cart-config-row">
          <span class="cart-config-label">Nori</span>
          <span class="cart-option">${escapeHTML(roll.nori)}</span>
        </div>

        <div class="cart-config-row">
          <span class="cart-config-label">Queso crema</span>
          <span class="cart-option">${escapeHTML(roll.creamCheese)}</span>
        </div>

        <div class="cart-config-row">
          <span class="cart-config-label">Cobertura</span>
          <span class="cart-option">
            ${escapeHTML(roll.covering)}
            ${Number(roll.coveringSurcharge) > 0
              ? ` (+${money(roll.coveringSurcharge)})`
              : ""}
          </span>
        </div>

        <div class="cart-config-row">
          <span class="cart-config-label">Proteína</span>
          <span class="cart-option">
            ${escapeHTML(roll.protein)}
            ${Number(roll.proteinSurcharge) > 0
              ? ` (+${money(roll.proteinSurcharge)})`
              : ""}
          </span>
        </div>

        <div class="cart-config-row">
          <span class="cart-config-label">Vegetales</span>
          <span class="cart-option">${escapeHTML(roll.vegetable)}</span>
        </div>
      </div>
    `);
  }
  if (config.sushiBurger) {
    const burger = config.sushiBurger;
    sections.push(`<div class="cart-config-section"><strong class="cart-config-title">Personalización Sushi Burger</strong>
      <div class="cart-config-row"><span class="cart-config-label">Proteína</span><span class="cart-option">${escapeHTML(burger.protein || "Sin proteína")}</span></div>
      <div class="cart-config-row"><span class="cart-config-label">Queso crema</span><span class="cart-option">${burger.creamCheese ? "Con queso crema" : "Sin queso crema"}</span></div>
      <div class="cart-config-row"><span class="cart-config-label">Vegetales</span><span class="cart-option">${burger.noVegetables ? "Sin vegetal" : (burger.vegetables || []).map(escapeHTML).join(", ") || "Sin vegetales"}</span></div>
    </div>`);
  }
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
   
    if (
    config.cheeses?.length ||
    config.noris?.length
  ) {
    const totalRolls = Math.max(
      config.vegetables?.length || 0,
      config.cheeses?.length || 0,
      config.noris?.length || 0
    );

    sections.push(`
      <div class="cart-config-section">
        <strong class="cart-config-title">Personalización Promoción Ichiban</strong>
        <div class="cart-options cart-promotion-rolls">
          ${Array.from({ length: totalRolls }, (_, index) => `
            <span class="cart-option">
              <strong>Roll ${index + 1}</strong><br>
              Vegetal: ${escapeHTML(config.vegetables?.[index] || "Sin vegetal")}<br>
              Queso crema: ${escapeHTML(config.cheeses?.[index] || "Sin selección")}<br>
              Nori: ${escapeHTML(config.noris?.[index] || "Sin selección")}
            </span>
          `).join("")}
        </div>
      </div>
    `);
  } else if (config.vegetables?.length) {
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

  if (config.soy !== undefined || config.teriyaki !== undefined) {
    sections.push(`
      <div class="cart-config-section">
        <strong class="cart-config-title">Salsas de cortesía</strong>
        <span class="cart-option">${Number(config.soy || 0)} soya · ${Number(config.teriyaki || 0)} teriyaki</span>
      </div>
    `);
  }

  return sections.join("");
}

// PERSONALIZACIÓN DE PRODUCTOS


function openWeeklyPromo(promo, editingItem = null) {
  if (!requireStoreOpen()) return;
  const components = promo.components || {};
  const type = promo.offer_type || "simple";

  const handrollProteins = components.handroll_proteins || [];
  const handrollVegetables = components.handroll_vegetables || [];
  const sharedDishIngredients = parseOptions(settings.gohan_config);
  const sharedProteins = (sharedDishIngredients.proteins || []).filter(item => item.active !== false && item.name);
  const sharedVegetables = (sharedDishIngredients.vegetables || []).filter(item => item.active !== false && item.name);
  const burgerProteins = sharedProteins.map(item => item.name);
  const burgerVegetables = sharedVegetables.map(item => item.name);
  const gohanProteins = sharedProteins.map(item => item.name);
  const gohanVegetables = sharedVegetables.map(item => item.name);
  const savedConfig = editingItem?.config?.weeklyPromo || {};
    const customComboComponents = Array.isArray(
    components.custom_combo_components
  )
    ? components.custom_combo_components
    : [];

  const savedCustomCombo = Array.isArray(savedConfig.customCombo)
    ? savedConfig.customCombo
    : [];

  const customFriesIncluded = components.custom_fries === true;
  const customDrinkIncluded = components.custom_drink === true;
  
  // Opciones dinámicas de Oferta simple
  const simpleProteins = (
    components.simple_proteins_config ||
    (components.simple_protein_options || []).map(name => ({
      name,
      active: true
    }))
  ).filter(item => item && item.active !== false && item.name);

  const simpleVegetables = (
    components.simple_vegetables_config ||
    (components.simple_vegetable_options || []).map(name => ({
      name,
      active: true
    }))
  ).filter(item => item && item.active !== false && item.name);

  const simpleCheese = components.simple_cheese === true;
  const simpleNori = components.simple_nori === true;

  const savedSimpleOffers = savedConfig.simpleOffers || [];


  const savedProtein = savedConfig.protein || "";
  const savedVegetables = savedConfig.vegetables || [];
  const savedCheese = savedConfig.cheese || "";
const choices = (
  items,
  name,
  required = false,
  selected = "",
  selectFirst = true,
  className = ""
) =>
  items.map((value, index) => `
    <label class="${className}">
      <input
        type="radio"
        name="${name}"
        value="${escapeHTML(value)}"
        ${value === selected || (!selected && index === 0 && selectFirst) ? "checked" : ""}
        ${required ? "required" : ""}
      >
      ${escapeHTML(value)}
    </label>
  `).join("");
  
  let options = "";
  
  const renderSimpleOffers = () => {
    const container = form?.querySelector("#weeklySimpleConfigs");
    if (!container) return;

    const currentOffers = Array.from(
      container.querySelectorAll(".weekly-simple-config")
    ).map((card, index) => ({
      protein: card.querySelector(
        `[name="simpleProtein-${index}"]:checked`
      )?.value || "",
      vegetables: Array.from(
        card.querySelectorAll(".simpleVegetable:checked")
      ).map(input => input.value),
      cheese: card.querySelector(
        `[name="simpleCheese-${index}"]:checked`
      )?.value || "Con queso crema",
      nori: card.querySelector(
        `[name="simpleNori-${index}"]:checked`
      )?.value || "Con nori"
    }));

    currentOffers.forEach((offer, index) => {
      savedSimpleOffers[index] = offer;
    });

    container.innerHTML = `
      ${Array.from({ length: quantity }, (_, index) => {
        const saved = savedSimpleOffers[index] || {};

        return `
          <div class="weekly-simple-config">
            <h3>Unidad ${index + 1}</h3>

            <strong>Elige tu proteína</strong>
            ${simpleProteins.map(item => `
              <label>
                <input
                  type="radio"
                  name="simpleProtein-${index}"
                  value="${escapeHTML(item.name)}"
                  ${saved.protein === item.name ? "checked" : ""}
                  ${!saved.protein && item === simpleProteins[0] ? "checked" : ""}
                >
                ${escapeHTML(item.name)}
              </label>
            `).join("")}

            <strong>Elige tus vegetales</strong>
            ${simpleVegetables.map(item => `
              <label>
                <input
  type="radio"
  class="simpleVegetable"
  name="simpleVegetable-${index}"
  value="${escapeHTML(item.name)}"
  ${saved.vegetables?.includes(item.name) ? "checked" : ""}
>
                ${escapeHTML(item.name)}
              </label>
            `).join("")}

            ${simpleCheese ? `
              <strong>Queso crema</strong>
              <label>
                <input type="radio"
                  name="simpleCheese-${index}"
                  value="Con queso crema"
                  ${saved.cheese !== "Sin queso crema" ? "checked" : ""}>
                Con queso crema
              </label>
              <label>
                <input type="radio"
                  name="simpleCheese-${index}"
                  value="Sin queso crema"
                  ${saved.cheese === "Sin queso crema" ? "checked" : ""}>
                Sin queso crema
              </label>
            ` : ""}

            ${simpleNori ? `
              <strong>Nori</strong>
              <label>
                <input type="radio"
                  name="simpleNori-${index}"
                  value="Con nori"
                  ${saved.nori !== "Sin nori" ? "checked" : ""}>
                Con nori
              </label>
              <label>
                <input type="radio"
                  name="simpleNori-${index}"
                  value="Sin nori"
                  ${saved.nori === "Sin nori" ? "checked" : ""}>
                Sin nori
              </label>
            ` : ""}
          </div>
        `;
      }).join("")}
    `;
  };


if (type === "simple") {
  options = `
    <div id="weeklySimpleConfigs">
      <h3>Personaliza tu promoción</h3>
      <p>Elige los ingredientes de cada unidad por separado.</p>
    </div>
  `;
} else if (type === "handroll_combo") {
  options = `
    <div id="weeklyHandrollConfigs">
      <h3>Personaliza tus Handroll</h3>
      <p>Podrás elegir los ingredientes de cada handroll por separado.</p>
    </div>

  `;
}


if (type === "sushi_burger_combo") {
   options = `
     <div class="dialog-note">
       <strong>Personaliza tu Sushi Burger</strong><br>
       Elige una proteína disponible, hasta 2 vegetales y queso crema con o sin.
     </div>
     <h3>Queso crema</h3>
     <select id="weeklyBurgerCheese">
       <option value="Con queso crema" ${savedCheese !== "Sin queso crema" ? "selected" : ""}>Con queso crema</option>
       <option value="Sin queso crema" ${savedCheese === "Sin queso crema" ? "selected" : ""}>Sin queso crema</option>
     </select>
     <h3>Elige tus vegetales (máximo 2)</h3>
     <div id="weeklyBurgerVegetableChoices">
       ${sharedVegetables.map(item => `
         <label class="veg-row">
           <input type="checkbox" class="weekly-burger-vegetable" value="${escapeHTML(item.name)}" ${savedVegetables.includes(item.name) ? "checked" : ""}>
           ${escapeHTML(item.name)}
         </label>
       `).join("")}
     </div>
     <p class="dialog-note" id="weeklyBurgerVegetableValidation">${savedVegetables.length} de 2 vegetales seleccionados.</p>
     <h3>Elige exactamente una proteína (obligatoria)</h3>
     <select id="weeklyBurgerProtein" required>
       <option value="">Selecciona una proteína</option>
       ${sharedProteins.map(item => `
         <option value="${escapeHTML(item.name)}" data-surcharge="${Number(item.surcharge) || 0}" ${savedProtein === item.name || (!savedProtein && sharedProteins[0] === item) ? "selected" : ""}>
           ${escapeHTML(item.name)}${Number(item.surcharge) > 0 ? ` (+${money(item.surcharge)})` : ""}
         </option>
       `).join("")}
     </select>
     <p class="dialog-note" id="weeklyBurgerPriceNote">El precio base no cambia según los ingredientes, salvo recargos de proteína.</p>
   `;
 } else if (type === "gohan_combo") {
  const savedGohans = savedConfig.gohans || [];
  const gohanCount = Math.max(1, Number(editingItem?.quantity || 1));

options = `
    <div id="weeklyGohanConfigs">
      <h3>Personaliza tus Gohan</h3>
    <p>Personaliza cada Gohan por separado.</p>

    ${Array.from({ length: gohanCount }, (_, index) => {
      const saved = savedGohans[index] || {};

      return `
        <div class="weekly-gohan-config">
          <h3>Gohan ${index + 1}</h3>

          <strong>Elige tu proteína</strong>
          ${gohanProteins.map(protein => `
            <label>
              <input
                type="radio"
                name="weeklyGohanProtein-${index}"
                value="${escapeHTML(protein)}"
                ${saved.protein === protein ? "checked" : ""}
              >
              ${escapeHTML(protein)}
            </label>
          `).join("")}

          <strong>Elige hasta 3 vegetales</strong>
          ${gohanVegetables.map(vegetable => `
            <label>
              <input
                type="checkbox"
                class="weeklyGohanVegetable"
                data-gohan="${index}"
                value="${escapeHTML(vegetable)}"
                ${(saved.vegetables || []).includes(vegetable) ? "checked" : ""}
              >
              ${escapeHTML(vegetable)}
            </label>
          `).join("")}

          ${true ? `
            <strong>Queso crema</strong>
            <label>
              <input
                type="radio"
                name="weeklyGohanCheese-${index}"
                value="Con queso crema"
                ${saved.cheese !== "Sin queso crema" ? "checked" : ""}
              >
              Con queso crema
            </label>
            <label>
              <input
                type="radio"
                name="weeklyGohanCheese-${index}"
                value="Sin queso crema"
                ${saved.cheese === "Sin queso crema" ? "checked" : ""}
              >
              Sin queso crema
            </label>
          ` : ""}
        </div>
      `;
    }).join("")}
        </div>
  `;
}
  else if (type === "custom_combo") {
  options = `
    <div id="weeklyCustomComboConfigs">
      <h3>Personaliza tu promoción</h3>
      <p>Configura cada producto de tu combo según las opciones disponibles.</p>
    </div>
  `;
}

  const initialWeeklySauceCount = ["gohan_combo", "sushi_burger_combo"].includes(type)
    ? 2 * Math.max(1, Number(editingItem?.quantity || 1))
    : 0;

  // Mostrar el acompañamiento fijo incluido en la promoción
  const accompanimentOptions = Array.isArray(components.weekly_accompaniments)
    ? components.weekly_accompaniments
    : String(components.weekly_accompaniments || promo.accompaniment || "")
        .split(/\r?\n/)
        .map(item => item.trim())
        .filter(Boolean);
  const accompaniment = accompanimentOptions.find(item => String(item).trim()) || "";

  if (type !== "simple" && accompaniment) {
    options += `
      <p class="weekly-included-accompaniment">
        <strong>Incluye:</strong>
        ${escapeHTML(accompaniment)} por cada promoción.
      </p>
    `;
  }
  openDialog(`
    <div class="weekly-promo-dialog">
      <h2>${escapeHTML(promo.name || "Promoción Ichiban")}</h2>
      <p>${escapeHTML(promo.description || "")}</p>

      ${options}

      <div class="weekly-quantity">
        <strong>Cantidad</strong>
        <button type="button" id="weeklyMinus">−</button>
        <span id="weeklyQuantity">1</span>
        <button type="button" id="weeklyPlus">+</button>
      </div>

      <p>Precio unitario: <strong id="weeklyUnitPrice"></strong></p>
      <h3>Total: <span id="weeklyTotal"></span></h3>
      ${initialWeeklySauceCount ? `
        <div class="weekly-complimentary-sauces">
          <h3>Salsas de cortesía</h3>
          <p>Incluye exactamente 2 salsas por producto. Distribúyelas entre soya y teriyaki.</p>
          <label>Soya <input id="weeklySoyCount" type="number" min="0" value="${Number(editingItem?.config?.soy ?? savedConfig.soy ?? initialWeeklySauceCount)}"></label>
          <label>Teriyaki <input id="weeklyTeriyakiCount" type="number" min="0" value="${Number(editingItem?.config?.teriyaki ?? savedConfig.teriyaki ?? 0)}"></label>
          <p id="weeklySauceValidation" class="dialog-note">Debes seleccionar exactamente ${initialWeeklySauceCount} salsas.</p>
        </div>
      ` : ""}

      <button type="button" class="dialog-primary" id="weeklyAddCart">
        Agregar al pedido
      </button>

      <button type="button" class="dialog-secondary" data-close>
        Cancelar
      </button>
    </div>
  `);

  let quantity = Number(editingItem?.quantity || 1);
  const updateWeeklySauceCounts = () => {
    const soyInput = $("#weeklySoyCount");
    const teriyakiInput = $("#weeklyTeriyakiCount");
    if (!soyInput || !teriyakiInput) return;
    const total = 2 * quantity;
    const teriyaki = Math.max(0, Math.min(total, Number(teriyakiInput.value) || 0));
    soyInput.value = total - teriyaki;
    $("#weeklySauceValidation").textContent = `Debes distribuir exactamente ${total} salsas entre soya y teriyaki.`;
  };
let weeklyGohanDrafts = (savedConfig.gohans || []).map(gohan => ({
  ...gohan,
  vegetables: [...(gohan.vegetables || [])]
}));
let weeklyHandrollDrafts = (savedConfig.handrolls || []).map(handroll => ({
  ...handroll
}));


const renderWeeklyHandrollConfigs = () => {
  const container = form.querySelector("#weeklyHandrollConfigs");
  if (!container) return;

  const currentHandrolls = Array.from(
    container.querySelectorAll(".weekly-handroll-config")
  ).map((card, index) => ({
    protein: card.querySelector(
      `[name="weeklyHandrollProtein-${index}"]:checked`
    )?.value || "",
    vegetable: card.querySelector(
      `[name="weeklyHandrollVegetable-${index}"]:checked`
    )?.value || "",
    cheese: card.querySelector(
      `[name="weeklyHandrollCheese-${index}"]:checked`
    )?.value || "",
    nori: card.querySelector(
      `[name="weeklyHandrollNori-${index}"]:checked`
    )?.value || "Con nori",
    sauce: card.querySelector(
      `[name="weeklyHandrollSauce-${index}"]:checked`
    )?.value || "Sin salsa"
  }));

  currentHandrolls.forEach((handroll, index) => {
    weeklyHandrollDrafts[index] = handroll;
  });

  const proteins = components.handroll_proteins || [];
  const vegetables = components.handroll_vegetables || [];

  const handrollQuantity = Math.max(
    1,
    Number(components.handroll_quantity || 1)
  );

  const totalHandrolls = quantity * handrollQuantity;

  container.innerHTML = `
    <h3>Personaliza tus Handroll</h3>
    <p>Configura cada unidad por separado.</p>

    ${Array.from({ length: totalHandrolls }, (_, index) => {
      const saved = weeklyHandrollDrafts[index] || {};

      return `
        <div class="weekly-handroll-config">
          <h3>Handroll ${index + 1}</h3>

          <strong>Proteína</strong>
         ${choices(
  proteins,
  `weeklyHandrollProtein-${index}`,
  true,
  saved.protein || "",
  false,
  "veg-row"
)}

          <strong>Vegetal</strong>
          ${choices(
  vegetables,
  `weeklyHandrollVegetable-${index}`,
  true,
  saved.vegetable || "",
  false,
  "veg-row"
)}

          ${components.handroll_cheese ? `
           <strong>Queso crema</strong>
<label class="veg-row">
  <input type="radio"
    name="weeklyHandrollCheese-${index}"
    value="Con queso crema"
    ${saved.cheese !== "Sin queso crema" ? "checked" : ""}>
  Con queso crema
</label>
<label class="veg-row">
  <input type="radio"
    name="weeklyHandrollCheese-${index}"
    value="Sin queso crema"
    ${saved.cheese === "Sin queso crema" ? "checked" : ""}>
  Sin queso crema
</label>
          ` : ""}

        <strong>Nori</strong>
<label class="veg-row">
  <input type="radio"
    name="weeklyHandrollNori-${index}"
    value="Con nori"
    ${saved.nori !== "Sin nori" ? "checked" : ""}>
  Con nori
</label>
<label class="veg-row">
  <input type="radio"
    name="weeklyHandrollNori-${index}"
    value="Sin nori"
    ${saved.nori === "Sin nori" ? "checked" : ""}>
  Sin nori
</label>

         <strong>Salsa de cortesía</strong>
<label class="veg-row">
  <input type="radio"
    name="weeklyHandrollSauce-${index}"
    value="Soya"
    ${saved.sauce === "Soya" ? "checked" : ""}>
  Soya
</label>
<label class="veg-row">
  <input type="radio"
    name="weeklyHandrollSauce-${index}"
    value="Teriyaki"
    ${saved.sauce === "Teriyaki" ? "checked" : ""}>
  Teriyaki
</label>
<label class="veg-row">
  <input type="radio"
    name="weeklyHandrollSauce-${index}"
    value="Sin salsa"
    ${!saved.sauce || saved.sauce === "Sin salsa" ? "checked" : ""}>
  Sin salsa
</label>
        </div>
      `;
    }).join("")}
  `;
};

const renderWeeklyGohanConfigs = () => {
  const container = form.querySelector("#weeklyGohanConfigs");
  if (!container) return;

  const currentGohans = Array.from(
    container.querySelectorAll(".weekly-gohan-config")
  ).map((card, index) => ({
    protein: card.querySelector(
      `[name="weeklyGohanProtein-${index}"]:checked`
    )?.value || "",
    vegetables: Array.from(
      card.querySelectorAll(".weeklyGohanVegetable:checked")
    ).map(input => input.value),
    cheese: card.querySelector(
      `[name="weeklyGohanCheese-${index}"]:checked`
    )?.value || "Con queso crema"
  }));

  currentGohans.forEach((gohan, index) => {
    weeklyGohanDrafts[index] = gohan;
  });

  const proteins = gohanProteins;
  const vegetables = gohanVegetables;

  container.innerHTML = `
    <h3>Personaliza tus Gohan</h3>
    <p>Personaliza cada Gohan por separado.</p>

    ${Array.from({ length: quantity }, (_, index) => {
     const saved = weeklyGohanDrafts[index] || {};

      return `
        <div class="weekly-gohan-config">
          <h3>Gohan ${index + 1}</h3>

          <strong>Elige tu proteína</strong>
          ${proteins.map(protein => `
            <label>
              <input
                type="radio"
                name="weeklyGohanProtein-${index}"
                value="${escapeHTML(protein)}"
                ${saved.protein === protein ? "checked" : ""}
              >
              ${escapeHTML(protein)}
            </label>
          `).join("")}

          <strong>Elige hasta 3 vegetales</strong>
          ${vegetables.map(vegetable => `
            <label>
              <input
                type="checkbox"
                class="weeklyGohanVegetable"
                data-gohan="${index}"
                value="${escapeHTML(vegetable)}"
                ${(saved.vegetables || []).includes(vegetable) ? "checked" : ""}
              >
              ${escapeHTML(vegetable)}
            </label>
          `).join("")}

          ${true ? `
            <strong>Queso crema</strong>
            <label>
              <input
                type="radio"
                name="weeklyGohanCheese-${index}"
                value="Con queso crema"
                ${saved.cheese !== "Sin queso crema" ? "checked" : ""}
              >
              Con queso crema
            </label>
            <label>
              <input
                type="radio"
                name="weeklyGohanCheese-${index}"
                value="Sin queso crema"
                ${saved.cheese === "Sin queso crema" ? "checked" : ""}
              >
              Sin queso crema
            </label>
          ` : ""}
        </div>
      `;
    }).join("")}
  `;
};
  let weeklyCustomComboDrafts = savedCustomCombo.map(item => ({
  ...item
}));

const renderCustomComboConfigs = () => {
  const container = form.querySelector("#weeklyCustomComboConfigs");
  if (!container) return;

  // Guardar selecciones actuales
  const currentConfigs = Array.from(
    container.querySelectorAll(".weekly-custom-unit")
  ).map(card => ({
    componentIndex: Number(card.dataset.component),
    unitIndex: Number(card.dataset.unit),
    protein: card.querySelector('[name^="customProtein-"]')?.value || "",
    vegetable: card.querySelector('[name^="customVegetable-"]')?.value || "",
    cheese: card.querySelector('[name^="customCheese-"]')?.value || "",
    nori: card.querySelector('[name^="customNori-"]')?.value || ""
  }));

  currentConfigs.forEach(item => {
    const index = weeklyCustomComboDrafts.findIndex(saved =>
      saved.componentIndex === item.componentIndex &&
      saved.unitIndex === item.unitIndex
    );

    if (index >= 0) {
      weeklyCustomComboDrafts[index] = item;
    } else {
      weeklyCustomComboDrafts.push(item);
    }
  });

  container.innerHTML = `
    <h3>Personaliza tu promoción</h3>

    ${customComboComponents.map((component, componentIndex) => {
      const productNames = {
        handroll: "Handroll",
        gohan: "Gohan",
        roll: "Roll",
        sushi_burger: "Sushi Burger",
        other: "Producto"
      };

      const productName =
        productNames[component.product_type] || "Producto";

      const totalUnits =
        Math.max(1, Number(component.quantity || 1)) * quantity;

      const proteins = Array.isArray(component.proteins)
        ? component.proteins
        : [];

      const vegetables = Array.isArray(component.vegetables)
        ? component.vegetables
        : [];

      return `
        <div class="weekly-custom-component">
          <div class="dialog-note">
            <strong>${escapeHTML(productName)} (${totalUnits})</strong>
          </div>

          ${Array.from({ length: totalUnits }, (_, unitIndex) => {
            const saved = weeklyCustomComboDrafts.find(item =>
              item.componentIndex === componentIndex &&
              item.unitIndex === unitIndex
            ) || {};

            const usedProteins = weeklyCustomComboDrafts
              .filter(item =>
                item.componentIndex === componentIndex &&
                item.unitIndex < unitIndex &&
                item.protein
              )
              .map(item => item.protein);

            const availableProteins = proteins.filter(
              protein =>
                !usedProteins.includes(protein) ||
                protein === saved.protein
            );

            return `
              <div
                class="promo-roll weekly-custom-unit"
                data-component="${componentIndex}"
                data-unit="${unitIndex}"
              >
                <h3>${escapeHTML(productName)} ${unitIndex + 1}</h3>

                <div class="form">

                  ${component.protein_mode === "fixed" ? `
                    <label>
                      Proteína
                      <p>${escapeHTML(component.fixed_protein || "Proteína fija")}</p>
                    </label>
                  ` : `
                    <label>
                      Proteína
                      <select name="customProtein-${componentIndex}-${unitIndex}" required>
                        <option value="">Selecciona una proteína</option>
                        ${availableProteins.map(protein => `
                          <option
                            value="${escapeHTML(protein)}"
                            ${saved.protein === protein ? "selected" : ""}
                          >
                            ${escapeHTML(protein)}
                          </option>
                        `).join("")}
                      </select>
                    </label>
                  `}

                  ${vegetables.length ? `
                    <label>
                      Vegetal
                      <select name="customVegetable-${componentIndex}-${unitIndex}">
                        <option value="">Selecciona un vegetal</option>
                        ${vegetables.map(vegetable => `
                          <option
                            value="${escapeHTML(vegetable)}"
                            ${saved.vegetable === vegetable ? "selected" : ""}
                          >
                            ${escapeHTML(vegetable)}
                          </option>
                        `).join("")}
                      </select>
                    </label>
                  ` : ""}

                  ${component.cheese ? `
                    <label>
                      Queso crema
                      <select name="customCheese-${componentIndex}-${unitIndex}">
                        <option value="Con queso crema" ${saved.cheese !== "Sin queso crema" ? "selected" : ""}>
                          Con queso crema
                        </option>
                        <option value="Sin queso crema" ${saved.cheese === "Sin queso crema" ? "selected" : ""}>
                          Sin queso crema
                        </option>
                      </select>
                    </label>
                  ` : ""}

                  ${component.nori ? `
                    <label>
                      Nori
                      <select name="customNori-${componentIndex}-${unitIndex}">
                        <option value="Con nori" ${saved.nori !== "Sin nori" ? "selected" : ""}>
                          Con nori
                        </option>
                        <option value="Sin nori" ${saved.nori === "Sin nori" ? "selected" : ""}>
                          Sin nori
                        </option>
                      </select>
                    </label>
                  ` : ""}

                </div>
              </div>
            `;
          }).join("")}
        </div>
      `;
    }).join("")}

    ${customFriesIncluded ? "<p><strong>Incluye:</strong> Papas fritas individuales.</p>" : ""}
    ${customDrinkIncluded ? "<p><strong>Incluye:</strong> Bebida mini.</p>" : ""}
  `;
};

  const basePrice = Number(savedConfig.basePrice ?? promo.price ?? 0);
  const burgerProteinConfig = sharedProteins;

 const form = $("#ichibanDialogContent");


if (type === "simple") {
  renderSimpleOffers();
}

if (type === "handroll_combo") {
  renderWeeklyHandrollConfigs();
}
  if (type === "custom_combo") {
  renderCustomComboConfigs();
}
  const getProtein = () => form.querySelector("#weeklyBurgerProtein")?.value || "";

  const getExtra = () => {
    if (type !== "sushi_burger_combo") return 0;
    const selected = burgerProteinConfig.find(item =>
      String(item.name).trim().toLowerCase() === getProtein().trim().toLowerCase()
    );
    return Math.max(0, Number(selected?.surcharge || 0));
  };

  const updatePrice = () => {
    const unitPrice = basePrice + getExtra();

    $("#weeklyQuantity").textContent = quantity;
    $("#weeklyUnitPrice").textContent = money(unitPrice);
    $("#weeklyTotal").textContent = money(unitPrice * quantity);
      const selectedProtein = form.querySelector("#weeklyBurgerProtein");
    const priceNote = $("#weeklyBurgerPriceNote");
    const surcharge = Number(selectedProtein?.selectedOptions?.[0]?.dataset.surcharge || 0);
    if (priceNote) priceNote.textContent = surcharge > 0
      ? `Recargo por proteína: ${money(surcharge)} por unidad.`
      : "Sin recargo adicional por proteína.";
  };

 $("#weeklyMinus").addEventListener("click", () => {
  if (quantity > 1) quantity--;

  
   updateWeeklySauceCounts();
updatePrice();
     if (type === "simple") {
    renderSimpleOffers();
  }
    
  if (type === "gohan_combo") {
  renderWeeklyGohanConfigs();
}

if (type === "handroll_combo") {
  renderWeeklyHandrollConfigs();
}
   if (type === "custom_combo") {
  renderCustomComboConfigs();
}
});

$("#weeklyPlus").addEventListener("click", () => {
  quantity++;

  
   updateWeeklySauceCounts();
updatePrice();
    if (type === "simple") {
    renderSimpleOffers();
  }

 if (type === "gohan_combo") {
  renderWeeklyGohanConfigs();
}

if (type === "handroll_combo") {
  renderWeeklyHandrollConfigs();
}
  if (type === "custom_combo") {
  renderCustomComboConfigs();
}
});

  form.addEventListener("change", event => {
    if (event.target.classList.contains("weekly-burger-vegetable") && type === "sushi_burger_combo") {
      const selected = form.querySelectorAll(".weekly-burger-vegetable:checked");
      if (selected.length > 2) {
        event.target.checked = false;
        alert("Puedes elegir máximo 2 vegetales.");
      }
      const count = form.querySelectorAll(".weekly-burger-vegetable:checked").length;
      const message = $("#weeklyBurgerVegetableValidation");
      if (message) message.textContent = `${count} de 2 vegetales seleccionados.`;
    }

    if (
      type === "gohan_combo" &&
      event.target.classList.contains("weeklyGohanVegetable") &&
      event.target.checked
    ) {
      const gohanIndex = event.target.dataset.gohan;

      const selectedVegetables = form.querySelectorAll(
        `.weeklyGohanVegetable[data-gohan="${gohanIndex}"]:checked`
      );

      if (selectedVegetables.length > 3) {
        event.target.checked = false;
        alert("Puedes elegir máximo 3 vegetales por cada Gohan.");
      }
    }
if (
  type === "custom_combo" &&
  event.target.name?.startsWith("customProtein-")
) {
  renderCustomComboConfigs();
}
    updatePrice();
  });

  $("#weeklyAddCart").addEventListener("click", () => {
    if (!requireStoreOpen()) return;
    const protein = getProtein();
    const weeklySauceSoy = Math.max(0, Number($("#weeklySoyCount")?.value || 0));
    const weeklySauceTeriyaki = Math.max(0, Number($("#weeklyTeriyakiCount")?.value || 0));
    const expectedWeeklySauces = ["gohan_combo", "sushi_burger_combo"].includes(type) ? 2 * quantity : 0;
    if (expectedWeeklySauces && weeklySauceSoy + weeklySauceTeriyaki !== expectedWeeklySauces) {
      alert(`Debes distribuir exactamente ${expectedWeeklySauces} salsas entre soya y teriyaki.`);
      return;
    }

    const vegetables = type === "handroll_combo"
      ? []
      : [...form.querySelectorAll(type === "sushi_burger_combo" ? ".weekly-burger-vegetable:checked" : '[name="weeklyVegetable"]:checked')]
          .map(el => el.value);

   const handrolls = type === "handroll_combo"
  ? Array.from(
      {
        length: quantity * Math.max(
          1,
          Number(components.handroll_quantity || 1)
        )
      },
      (_, index) => ({
        protein: form.querySelector(
          `[name="weeklyHandrollProtein-${index}"]:checked`
        )?.value || "",

        vegetable: form.querySelector(
          `[name="weeklyHandrollVegetable-${index}"]:checked`
        )?.value || "",

        cheese: form.querySelector(
          `[name="weeklyHandrollCheese-${index}"]:checked`
        )?.value || "",

        nori: form.querySelector(
          `[name="weeklyHandrollNori-${index}"]:checked`
        )?.value || "Con nori",

        sauce: form.querySelector(
          `[name="weeklyHandrollSauce-${index}"]:checked`
        )?.value || "Sin salsa"
      })
    )
  : [];
    
const simpleOffers = type === "simple"
  ? Array.from({ length: quantity }, (_, index) => ({
      protein: form.querySelector(
        `[name="simpleProtein-${index}"]:checked`
      )?.value || "",

     vegetables: Array.from(
  form.querySelectorAll(".weekly-simple-config")[index]
    ?.querySelectorAll(".simpleVegetable:checked") || []
).map(input => input.value),

      cheese: form.querySelector(
        `[name="simpleCheese-${index}"]:checked`
      )?.value || "Con queso crema",

      nori: form.querySelector(
        `[name="simpleNori-${index}"]:checked`
      )?.value || "Con nori"
    }))
  : [];
const customCombo = type === "custom_combo"
  ? customComboComponents.flatMap((component, componentIndex) => {
      const totalUnits =
        Math.max(1, Number(component.quantity || 1)) * quantity;

      return Array.from({ length: totalUnits }, (_, unitIndex) => {
        const saved = weeklyCustomComboDrafts.find(item =>
          item.componentIndex === componentIndex &&
          item.unitIndex === unitIndex
        ) || {};

        const protein = component.protein_mode === "fixed"
  ? component.fixed_protein || ""
  : form.querySelector(
      `[name="customProtein-${componentIndex}-${unitIndex}"]`
    )?.value || "";

        return {
          componentIndex,
          unitIndex,
          productType: component.product_type || "other",
          protein,
         vegetable: form.querySelector(
  `[name="customVegetable-${componentIndex}-${unitIndex}"]`
)?.value || "",
cheese: form.querySelector(
  `[name="customCheese-${componentIndex}-${unitIndex}"]`
)?.value || "",
nori: form.querySelector(
  `[name="customNori-${componentIndex}-${unitIndex}"]`
)?.value || ""
        };
      });
    })
  : [];
if (
  type === "simple" &&
  (
    simpleProteins.length === 0 ||
    simpleOffers.some(offer => !offer.protein)
  )
) {
  alert(
    simpleProteins.length === 0
      ? "Esta promoción no tiene proteínas disponibles. Contacta con el local."
      : "Selecciona una proteína para cada unidad de la promoción."
  );
  return;
}


    if (
  type !== "simple" &&
  type !== "gohan_combo" &&
  type !== "handroll_combo" &&
  type !== "custom_combo" &&
  !protein
) {
  alert("Selecciona una proteína.");
  return;
}
    if (
  type === "custom_combo" &&
  customCombo.some(item => {
    const component = customComboComponents[item.componentIndex];
    return component?.protein_mode === "choose_unique" && !item.protein;
  })
) {
  alert("Selecciona una proteína para cada producto del combo.");
  return;
}
    if (
      type === "handroll_combo" &&
      handrolls.some(handroll => !handroll.protein || !handroll.vegetable)
    ) {
      alert("Selecciona proteína y vegetal para cada Handroll.");
      return;
    }

    const cheese = type === "sushi_burger_combo"
      ? (form.querySelector("#weeklyBurgerCheese")?.value || "Con queso crema")
      : (form.querySelector('[name="weeklyCheese"]:checked')?.value || "");

    const extra = getExtra();

    const gohans = type === "gohan_combo"
      ? Array.from({ length: quantity }, (_, index) => ({
          protein: form.querySelector(
            `[name="weeklyGohanProtein-${index}"]:checked`
          )?.value || "",
          vegetables: Array.from(
            form.querySelectorAll(
              `.weeklyGohanVegetable[data-gohan="${index}"]:checked`
            )
          ).map(input => input.value),
          cheese: form.querySelector(
            `[name="weeklyGohanCheese-${index}"]:checked`
          )?.value || ""
        }))
      : [];

    if (
      type === "gohan_combo" &&
      gohans.some(gohan => !gohan.protein)
    ) {
      alert("Selecciona una proteína para cada Gohan.");
      return;
    }
   

   const updatedItem = {
  key: editingItem?.key || "weekly-" + promo.id + "-" + Date.now(),
  id: "weekly-" + promo.id,
  name: promo.name,
  price: basePrice + extra,
  quantity,
  product_type: "weekly_promo",
  config: {
    ...(expectedWeeklySauces ? {
      soy: weeklySauceSoy,
      teriyaki: weeklySauceTeriyaki
    } : {}),
    weeklyPromo: {
          promoId: promo.id,
          day: promo.day || "",
          offerType: type,
          protein,
vegetables,
cheese,
gohans,
handrolls,
simpleOffers,
customCombo,
proteinSurcharge: extra,
basePrice,
          accompaniment,
          accompanimentOptions
        },

    
  }
};

if (editingItem) {
  const index = cart.findIndex(item => item.key === editingItem.key);

  if (index !== -1) {
    cart[index] = updatedItem;
  } else {
    cart.push(updatedItem);
  }
} else {
  cart.push(updatedItem);
}

    saveCart();
    closeDialog();
    openCart();
  });

  updatePrice();
}

function openProduct(product, editingItem = null) {
  if (!requireStoreOpen()) return;
  currentProduct = product;

  const type = getType(product);
  const options = parseOptions(product.options);
  const initialConfig = editingItem?.config || {};

  const isPromo = type === "promotion";
  const isRoll = type === "roll";
  const isHandroll = type === "handroll";
  const isDish = type === "dish";
  const isGohan = isDish && options.gohan_customizable === true;
  const isSushiBurger = isDish && String(product.name || "").toLowerCase().includes("burger");
    const isCustomRoll = isRoll && options.custom_roll === true;
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
      Los rellenos y envolturas son fijos. Puedes elegir el vegetal,
      queso crema y nori de cada roll.
      Incluye una salsa por roll y palitos según las reglas de la tienda.
    </div>

    <div id="vegetableChoices">
      ${Array.from({length: rollCount * Number(editingItem?.quantity || 1)}, (_, i) => {
        const vegetable = initialConfig.vegetables?.[i] || "Cebollín";
        const cheese = initialConfig.cheeses?.[i] || "Con queso crema";
        const nori = initialConfig.noris?.[i] || "Con nori";

        return `
          <div class="promo-roll">
            <h3>Roll ${i + 1}</h3>

            <div class="form">
              <label>
                Vegetales
                <select id="veg${i}" class="veg-choice">
                  ${["Cebollín", "Pimentón", "Palta", "Sin vegetal"].map(value =>
                    `<option ${vegetable === value ? "selected" : ""}>${value}</option>`
                  ).join("")}
                </select>
              </label>

              <label>
                Queso crema
                <select id="cheese${i}" class="cheese-choice">
                  ${["Con queso crema", "Sin queso crema"].map(value =>
                    `<option ${cheese === value ? "selected" : ""}>${value}</option>`
                  ).join("")}
                </select>
              </label>

              <label>
                Nori
                <select id="nori${i}" class="nori-choice">
                  ${["Con nori", "Sin nori"].map(value =>
                    `<option ${nori === value ? "selected" : ""}>${value}</option>`
                  ).join("")}
                </select>
              </label>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
 } else if (isCustomRoll) {
 const customConfig = parseOptions(settings.custom_roll_config);
  const customSelection = initialConfig.customRoll || {};

  const renderCustomOptions = (items, selected, fallback, noneLabel) => {
    const activeItems = (Array.isArray(items) ? items : [])
      .filter(item => item && item.active !== false);

    const list = [
      ...activeItems,
      { name: noneLabel, surcharge: 0 }
    ];

    const selectedValue = selected || fallback;

    return list.map(item => {
      const name = escapeHTML(item.name);
      const surcharge = Number(item.surcharge || 0);
      const label = surcharge > 0
        ? `${name} (+${money(surcharge)})`
        : name;

      return `<option value="${name}" data-surcharge="${surcharge}" ${item.name === selectedValue ? "selected" : ""}>${label}</option>`;
    }).join("");
  };

  configuration = `
    <div class="dialog-note">
      Arma tu roll a tu gusto. Precio base: ${money(product.price)}.
      Incluye una salsa de cortesía y un par de palitos.
    </div>

    <div class="form">
      <label>
        Base
        <select id="customRollRice">
          <option value="Con arroz" ${customSelection.rice !== "Sin arroz" ? "selected" : ""}>Con arroz</option>
          <option value="Sin arroz" ${customSelection.rice === "Sin arroz" ? "selected" : ""}>Sin arroz</option>
        </select>
      </label>

      <label>
        Nori
        <select id="customRollNori">
          <option value="Con Nori" ${customSelection.nori !== "Sin Nori" ? "selected" : ""}>Con Nori</option>
          <option value="Sin Nori" ${customSelection.nori === "Sin Nori" ? "selected" : ""}>Sin Nori</option>
        </select>
      </label>

      <label>
        Queso crema
        <select id="customRollCreamCheese">
          <option value="Con queso crema" ${customSelection.creamCheese !== "Sin queso crema" ? "selected" : ""}>Con queso crema</option>
          <option value="Sin queso crema" ${customSelection.creamCheese === "Sin queso crema" ? "selected" : ""}>Sin queso crema</option>
        </select>
      </label>

      <label>
        Cobertura
        <select id="customRollCovering">
          ${renderCustomOptions(customConfig.coverings, customSelection.covering, "Panko (frito)", "Sin cobertura")}
        </select>
      </label>

      <label>
        Proteína
        <select id="customRollProtein">
          ${renderCustomOptions(customConfig.proteins, customSelection.protein, "Pollo furay", "Sin proteína")}
        </select>
      </label>

           <label>
        Vegetales
        <select id="customRollVegetable">
          ${renderCustomOptions(customConfig.vegetables, customSelection.vegetable, "Cebollín", "Sin vegetales")}
        </select>
      </label>

      <div id="customRollLivePrice" style="margin-top:16px;font-size:20px;font-weight:700;text-align:center;">
        Precio: ${money(product.price)}
      </div>
    </div>
  `;
} else if (isRoll) {
  configuration = `<div class="dialog-note">Incluye una salsa de cortesía y un par de palitos por roll. Máximo 6 pares de palitos por pedido.</div>`;
} else if (isHandroll) {
  const handrollVegetables = (
    Array.isArray(options.handroll_vegetables)
      ? options.handroll_vegetables
      : []
  ).filter(item => item && item.active !== false && item.name);

  const savedHandroll = initialConfig.handroll || {};

  configuration = `
    <div class="dialog-note">
      <strong>Personaliza tu Handroll</strong><br>
      Elige las opciones disponibles para tu preparación.
      Incluye una salsa de cortesía por handroll. No incluye palitos.
    </div>

    ${handrollVegetables.length ? `
      <h3>Elige tu vegetal</h3>
      <select id="handrollVegetable">
        ${handrollVegetables.map(item => `
          <option
            value="${escapeHTML(item.name)}"
            ${savedHandroll.vegetable === item.name ? "selected" : ""}
          >
            ${escapeHTML(item.name)}
          </option>
        `).join("")}
      </select>
    ` : ""}

    ${options.handroll_cheese === true ? `
      <h3>Queso crema</h3>
      <select id="handrollCheese">
        <option value="Con queso crema"
          ${savedHandroll.cheese !== "Sin queso crema" ? "selected" : ""}>
          Con queso crema
        </option>
        <option value="Sin queso crema"
          ${savedHandroll.cheese === "Sin queso crema" ? "selected" : ""}>
          Sin queso crema
        </option>
      </select>
    ` : ""}

    ${options.handroll_nori === true ? `
      <h3>Nori</h3>
      <select id="handrollNori">
        <option value="Con nori"
          ${savedHandroll.nori !== "Sin nori" ? "selected" : ""}>
          Con nori
        </option>
        <option value="Sin nori"
          ${savedHandroll.nori === "Sin nori" ? "selected" : ""}>
          Sin nori
        </option>
      </select>
    ` : ""}
  `;
  
} else if (isGohan || isSushiBurger) {
  const ingredientSettings = parseOptions(settings.gohan_config);
  const vegetables = (ingredientSettings.vegetables || []).filter(item => item.active !== false && item.name);
  const proteins = (ingredientSettings.proteins || []).filter(item => item.active !== false && item.name);
  const savedSelection = isGohan ? (initialConfig.gohan || {}) : (initialConfig.sushiBurger || {});
  const savedVegetables = savedSelection.vegetables || [];
  const maxVegetables = isGohan ? 3 : 2;
  configuration = `
    <div class="dialog-note"><strong>Personaliza tu ${isGohan ? "Gohan" : "Sushi Burger"}</strong><br>
    ${isGohan ? "Incluye arroz sushi." : "Personaliza tu Sushi Burger."}
    Elige una proteína disponible, hasta ${maxVegetables} vegetales y queso crema con o sin.</div>
    <h3>Queso crema</h3>
    <select id="dishCreamCheese">
      <option value="yes" ${savedSelection.creamCheese !== false ? "selected" : ""}>Con queso crema</option>
      <option value="no" ${savedSelection.creamCheese === false ? "selected" : ""}>Sin queso crema</option>
    </select>
    <h3>Elige tus vegetales (máximo ${maxVegetables})</h3>
    <div id="gohanVegetableChoices">
      ${vegetables.map(item => `<label class="veg-row"><input type="checkbox" class="gohan-vegetable" value="${escapeHTML(item.name)}" ${savedVegetables.includes(item.name) ? "checked" : ""}>${escapeHTML(item.name)}</label>`).join("")}
      ${isGohan ? `<label class="veg-row"><input type="checkbox" id="gohanNoVegetables" ${savedSelection.noVegetables ? "checked" : ""}>Sin vegetal</label>` : ""}
    </div>
    <p class="dialog-note" id="gohanVegetableValidation">Puedes elegir hasta ${maxVegetables} vegetales.</p>
    <h3>Elige exactamente una proteína (obligatoria)</h3>
    <select id="dishProtein" required>
      <option value="">Selecciona una proteína</option>
      ${proteins.map(item => `<option value="${escapeHTML(item.name)}" data-surcharge="${Number(item.surcharge) || 0}" ${savedSelection.protein === item.name ? "selected" : ""}>${escapeHTML(item.name)}${Number(item.surcharge) > 0 ? ` (+${money(item.surcharge)})` : ""}</option>`).join("")}
    </select>
    <p class="dialog-note" id="gohanPriceNote">El precio base no cambia según los ingredientes, salvo recargos de proteína.</p>
  `;
} else if (isDish) {
  configuration = `<div class="dialog-note">Incluye exactamente 2 salsas de cortesía por unidad. No incluye palitos.</div>`;
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

  if (isGohan || isSushiBurger) {
    const checks = Array.from(document.querySelectorAll(".gohan-vegetable"));
    const noVegetables = $("#gohanNoVegetables");
    const message = $("#gohanVegetableValidation");
    const max = isGohan ? 3 : 2;
    const validate = () => {
      const selected = checks.filter(input => input.checked);
      if (selected.length > max) selected[selected.length - 1].checked = false;
      if (noVegetables) {
        noVegetables.disabled = selected.length > 0;
        checks.forEach(input => { input.disabled = noVegetables.checked; });
      }
      if (message) message.textContent = noVegetables?.checked ? "Has elegido Sin vegetal." : `${checks.filter(input => input.checked).length} de ${max} vegetales seleccionados.`;
    };
    checks.forEach(input => input.addEventListener("change", validate));
    noVegetables?.addEventListener("change", validate);
    validate();
    const proteinSelect = $("#dishProtein");
    const priceNote = $("#gohanPriceNote");
    const updateProteinPrice = () => {
      const selected = proteinSelect.options[proteinSelect.selectedIndex];
      const surcharge = Number(selected?.dataset.surcharge || 0);
      if (priceNote) priceNote.textContent = surcharge > 0 ? `Recargo por proteína: ${money(surcharge)} por unidad.` : "Sin recargo adicional por proteína.";
    };
    proteinSelect?.addEventListener("change", updateProteinPrice);
    updateProteinPrice();
  }

  const soy = $("#soyCount");
  const teriyaki = $("#teriyakiCount");
  const quantity = $("#productQuantity");

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

    const previousCheeses = Array.from(
      container.querySelectorAll(".cheese-choice")
    ).map(select => select.value);

    const previousNoris = Array.from(
      container.querySelectorAll(".nori-choice")
    ).map(select => select.value);

    const vegetables = Array.from(
      { length: totalRolls },
      (_, i) => previousVegetables[i] ||
        initialConfig.vegetables?.[i] ||
        "Cebollín"
    );

    const cheeses = Array.from(
      { length: totalRolls },
      (_, i) => previousCheeses[i] ||
        initialConfig.cheeses?.[i] ||
        "Con queso crema"
    );

    const noris = Array.from(
      { length: totalRolls },
      (_, i) => previousNoris[i] ||
        initialConfig.noris?.[i] ||
        "Con nori"
    );

   container.innerHTML = vegetables.map((vegetable, i) => `
  <div class="promo-roll">
    <h3>Roll ${i + 1}</h3>

    <div class="form">
      <label>
        Vegetales
        <select id="veg${i}" class="veg-choice">
          ${["Cebollín", "Pimentón", "Palta", "Sin vegetal"].map(value =>
            `<option ${vegetable === value ? "selected" : ""}>${value}</option>`
          ).join("")}
        </select>
      </label>

      <label>
        Queso crema
        <select id="cheese${i}" class="cheese-choice">
          ${["Con queso crema", "Sin queso crema"].map(value =>
            `<option ${cheeses[i] === value ? "selected" : ""}>${value}</option>`
          ).join("")}
        </select>
      </label>

      <label>
        Nori
        <select id="nori${i}" class="nori-choice">
          ${["Con nori", "Sin nori"].map(value =>
            `<option ${noris[i] === value ? "selected" : ""}>${value}</option>`
          ).join("")}
        </select>
      </label>
    </div>
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
if (isCustomRoll) {
  const coveringSelect = $("#customRollCovering");
  const proteinSelect = $("#customRollProtein");
  const livePrice = $("#customRollLivePrice");

  const updateCustomRollPrice = () => {
    const coveringSurcharge = Number(
      coveringSelect.options[coveringSelect.selectedIndex].dataset.surcharge || 0
    );

    const proteinSurcharge = Number(
      proteinSelect.options[proteinSelect.selectedIndex].dataset.surcharge || 0
    );

    const total =
      Number(product.price || 0) +
      coveringSurcharge +
      proteinSurcharge;

    livePrice.textContent = `Precio: ${money(total)}`;
  };

  coveringSelect.addEventListener("change", updateCustomRollPrice);
  proteinSelect.addEventListener("change", updateCustomRollPrice);

  updateCustomRollPrice();
}
  $("#confirmAdd").addEventListener("click", () => {
    if (!requireStoreOpen()) return;
    const qty = Math.max(1, Math.min(20, Number(quantity.value) || 1));
    const config = {};
if (isCustomRoll) {
  const coveringSelect = $("#customRollCovering");
  const proteinSelect = $("#customRollProtein");

  config.customRoll = {
    rice: $("#customRollRice").value,
    nori: $("#customRollNori").value,
    creamCheese: $("#customRollCreamCheese").value,
    covering: coveringSelect.value,
    coveringSurcharge: Number(
      coveringSelect.options[coveringSelect.selectedIndex].dataset.surcharge || 0
    ),
    protein: proteinSelect.value,
    proteinSurcharge: Number(
      proteinSelect.options[proteinSelect.selectedIndex].dataset.surcharge || 0
    ),
    vegetable: $("#customRollVegetable").value
  };
}
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

  config.cheeses = Array.from(
    document.querySelectorAll(".cheese-choice")
  ).map(select => select.value);

  config.noris = Array.from(
    document.querySelectorAll(".nori-choice")
  ).map(select => select.value);
}
if (isHandroll) {
  config.handroll = {
    vegetable: $("#handrollVegetable")?.value || "",
    cheese: $("#handrollCheese")?.value || "Con queso crema",
    nori: $("#handrollNori")?.value || "Con nori"
  };
}

    if (isGohan || isSushiBurger) {
      const selectedVegetables = Array.from(document.querySelectorAll(".gohan-vegetable:checked")).map(input => input.value);
      const noVegetables = Boolean($("#gohanNoVegetables")?.checked);
      const proteinSelect = $("#dishProtein");
      if (!proteinSelect?.value) { alert("Debes seleccionar exactamente una proteína disponible."); return; }
      const selectedProtein = proteinSelect.options[proteinSelect.selectedIndex];
      const selection = {
        creamCheese: $("#dishCreamCheese").value === "yes",
        vegetables: noVegetables ? [] : selectedVegetables,
        noVegetables,
        protein: proteinSelect.value,
        proteinSurcharge: Number(selectedProtein.dataset.surcharge || 0)
      };
      if (isGohan) config.gohan = selection;
      else config.sushiBurger = selection;
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
  if (!requireStoreOpen()) return;
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
  const sushiBurgerSurcharge =
    Number(item.config?.sushiBurger?.proteinSurcharge || 0) * quantity;
const customRollSurcharge =
  (
    Number(item.config?.customRoll?.coveringSurcharge || 0) +
    Number(item.config?.customRoll?.proteinSurcharge || 0)
  ) * quantity;
 const itemTotal =
  Number(item.price || 0) * quantity +
  gohanSurcharge +
  sushiBurgerSurcharge +
  customRollSurcharge +
  getPaidSaucesTotal(item);

const unitPrice =
  Number(item.price || 0) +
  Number(item.config?.gohan?.proteinSurcharge || 0) +
  Number(item.config?.sushiBurger?.proteinSurcharge || 0) +
  Number(item.config?.customRoll?.coveringSurcharge || 0) +
  Number(item.config?.customRoll?.proteinSurcharge || 0);

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
        <button type="button" data-cart-edit="${item.key}">
  Personalizar / Editar
</button>
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



function updateCartQuantity(key, change, keepIngredientsConfirmed = false) {
  const item = cart.find(entry => entry.key === key);
  if (!item) return;

  const previousQuantity = item.quantity;
  const next = previousQuantity + change;

  if (next <= 0) {
    cart = cart.filter(entry => entry.key !== key);
  } else {
    const hasFreeSauces =
  item.config &&
  (
    item.config.soy !== undefined ||
    item.config.teriyaki !== undefined 
    
  );

    if (change > 0 && !keepIngredientsConfirmed) {
  openDialog(`
    <h2>Estás agregando otro producto a tu compra</h2>

    <p>
      ¿Deseas mantener tu siguiente producto igual que el anterior
      o quieres modificar sus ingredientes y componentes?
    </p>

    <button type="button" class="dialog-primary" id="keepSameProduct">
      SÍ, mantener igual
    </button>

    <button type="button" class="dialog-secondary" id="modifyNewProduct">
      NO, quiero modificarlo
    </button>
  `);

  $("#keepSameProduct").addEventListener("click", () => {
    closeDialog();
    updateCartQuantity(key, change, true);
  });

  $("#modifyNewProduct").addEventListener("click", () => {
    closeDialog();

    if (item.product_type === "weekly_promo") {
      let weeklyPromos = [];

      try {
        const data = settings.weekly_promos;
        weeklyPromos = typeof data === "string"
          ? JSON.parse(data || "[]")
          : data || [];
      } catch {
        weeklyPromos = [];
      }

      const promoId = item.config?.weeklyPromo?.promoId;

      const promo = weeklyPromos.find(
        p => String(p.id) === String(promoId)
      );

      if (!promo) {
        alert("No se encontró esta promoción semanal.");
        return;
      }

      openWeeklyPromo(promo);
      return;
    }

    const product = products.find(
      p => String(p.id) === String(item.id)
    );

    if (!product) {
      alert("No se encontró este producto en la carta.");
      return;
    }

    openProduct(product);
  });

  return;
}

    item.quantity = Math.min(20, next);
if (
  item.config?.weeklyPromo?.offerType === "handroll_combo" &&
  Array.isArray(item.config.weeklyPromo.handrolls)
) {
  const handrolls = item.config.weeklyPromo.handrolls;

  const handrollsPerPromo = Math.max(
    1,
    Math.round(handrolls.length / previousQuantity)
  );

  const totalHandrolls = handrollsPerPromo * item.quantity;

while (handrolls.length < totalHandrolls) {
  const sourceIndex = handrolls.length - handrollsPerPromo;
  const previousHandroll = handrolls[sourceIndex];

  handrolls.push(
    previousHandroll
      ? { ...previousHandroll }
      : {
          protein: "",
          vegetable: "",
          cheese: "",
          nori: "Con nori",
          sauce: "Sin salsa"
        }
  );
}

handrolls.length = totalHandrolls;
}
    if (
  item.config?.weeklyPromo?.offerType === "simple" &&
  Array.isArray(item.config.weeklyPromo.simpleOffers)
) {
  const simpleOffers = item.config.weeklyPromo.simpleOffers;

  while (simpleOffers.length < item.quantity) {
    const previousOffer = simpleOffers[simpleOffers.length - 1];

    simpleOffers.push(
      previousOffer
        ? {
            ...previousOffer,
            vegetables: [...(previousOffer.vegetables || [])]
          }
        : {
            protein: "",
            vegetables: [],
            cheese: "Con queso crema",
            nori: "Con nori"
          }
    );
  }

  simpleOffers.length = item.quantity;
}
    if (
  item.config?.weeklyPromo?.offerType === "gohan_combo" &&
  Array.isArray(item.config.weeklyPromo.gohans)
) {
  const gohans = item.config.weeklyPromo.gohans;

  while (gohans.length < item.quantity) {
    const previousGohan = gohans[gohans.length - 1];

    gohans.push(
      previousGohan
        ? {
            ...previousGohan,
            vegetables: [...(previousGohan.vegetables || [])]
          }
        : {
            protein: "",
            vegetables: [],
            cheese: ""
          }
    );
  }

  gohans.length = item.quantity;
}
    if (item.config?.vegetables && item.product_type === "promotion") {
      const product = products.find(
        p => String(p.id) === String(item.id)
      );

      const rollsPerPromo = Number(
        parseOptions(product?.options).rolls_count || 1
      );

      const totalRolls = rollsPerPromo * item.quantity;

           while (item.config.vegetables.length < totalRolls) {
        const previousVegetable =
          item.config.vegetables[
            item.config.vegetables.length - rollsPerPromo
          ];

        item.config.vegetables.push(
          previousVegetable || "Cebollín"
        );
      }

      item.config.vegetables =
        item.config.vegetables.slice(0, totalRolls);
    }

   if (
  hasFreeSauces &&
    item.config?.weeklyPromo?.offerType !== "handroll_combo"
) {
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

    }

  saveCart();
  openCart();
}


function getFreeSaucesPerUnit(item) {
  if (item.product_type === "weekly_promo") {
    const weekly = item.config?.weeklyPromo;
    if (weekly?.offerType === "handroll_combo" && Array.isArray(weekly.handrolls)) return weekly.handrolls.length / Math.max(1, Number(item.quantity || 1));
    if (weekly?.offerType === "gohan_combo" || weekly?.offerType === "sushi_burger_combo") return 2;
    return 0;
  }

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
    const today = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado"
  ][new Date().getDay()];

  let currentWeeklyPromos = [];

  try {
    const data = settings.weekly_promos;
    currentWeeklyPromos = typeof data === "string"
      ? JSON.parse(data || "[]")
      : data || [];
  } catch {
    currentWeeklyPromos = [];
  }

  const invalidWeeklyPromo = cart.find(item => {
    if (item.product_type !== "weekly_promo") return false;

    const promoId = item.config?.weeklyPromo?.promoId;

    const currentPromo = currentWeeklyPromos.find(
      promo => String(promo.id) === String(promoId)
    );

    return !currentPromo ||
      !isEnabled(currentPromo.active) ||
      currentPromo.day !== today;
  });

  if (invalidWeeklyPromo) {
    alert(
      "Una promoción de tu carrito ya no está disponible hoy. " +
      "Elimina esa promoción del carrito para continuar con tu pedido."
    );
    return;
  }

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
const sushiBurgerSurcharge =
  Number(config.sushiBurger?.proteinSurcharge || 0) * quantity;

const customRollSurcharge =
  (
    Number(config.customRoll?.coveringSurcharge || 0) +
    Number(config.customRoll?.proteinSurcharge || 0)
  ) * quantity;

const itemPrice =
  Number(item.price || 0) * quantity +
  gohanSurcharge +
  sushiBurgerSurcharge +
  customRollSurcharge;
       const lines = [
      `${quantity} × ${item.name} — ${money(itemPrice)}`
    ];
   if (config.weeklyPromo) {
      const weekly = config.weeklyPromo;

 
lines.push("PERSONALIZACIÓN PROMOCIÓN SEMANAL:");
     if (
  weekly.offerType === "simple" &&
  Array.isArray(weekly.simpleOffers)
) {
  weekly.simpleOffers.forEach((offer, index) => {
    lines.push(`Unidad ${index + 1}:`);
    lines.push(`Proteína: ${offer.protein || "Sin proteína"}`);
    lines.push(
      `Vegetales: ${
        offer.vegetables?.length
          ? offer.vegetables.join(", ")
          : "Sin vegetales"
      }`
    );
    lines.push(`Queso crema: ${offer.cheese || "Sin selección"}`);
    lines.push(`Nori: ${offer.nori || "Sin selección"}`);
  });
}
if (
  weekly.offerType === "custom_combo" &&
  Array.isArray(weekly.customCombo)
) {
  lines.push("PRODUCTOS DEL COMBO:");

  weekly.customCombo.forEach((unit, index) => {
    lines.push(`Producto ${index + 1}: ${unit.productType || "Producto"}`);

    if (unit.protein) {
      lines.push(`Proteína: ${unit.protein}`);
    }

    if (unit.vegetable) {
      lines.push(`Vegetal: ${unit.vegetable}`);
    }

    if (unit.cheese) {
      lines.push(`Queso crema: ${unit.cheese}`);
    }

    if (unit.nori) {
      lines.push(`Nori: ${unit.nori}`);
    }
  });
}
if (weekly.offerType === "handroll_combo" && Array.isArray(weekly.handrolls)) {
  weekly.handrolls.forEach((handroll, index) => {
    lines.push(`Handroll ${index + 1}:`);
    lines.push(`Proteína: ${handroll.protein || "Sin proteína"}`);
    lines.push(`Vegetal: ${handroll.vegetable || "Sin vegetal"}`);
    lines.push(`Queso crema: ${handroll.cheese || "Sin selección"}`);
    lines.push(`Nori: ${handroll.nori || "Con nori"}`);
    lines.push(`Salsa: ${handroll.sauce || "Sin salsa"}`);
  });
} else if (Array.isArray(weekly.gohans) && weekly.gohans.length) {
  weekly.gohans.forEach((gohan, index) => {
    lines.push(`Gohan ${index + 1}:`);
    lines.push(`Proteína: ${gohan.protein || "Sin proteína"}`);
    lines.push(
      `Vegetales: ${gohan.vegetables?.length
        ? gohan.vegetables.join(", ")
        : "Sin vegetales"}`
    );

    if (gohan.cheese) {
      lines.push(`Queso crema: ${gohan.cheese}`);
    }
  });
} else if (weekly.offerType !== "simple") {
  if (weekly.protein) {
    lines.push(`Proteína: ${weekly.protein}`);
  }

  if (weekly.offerType !== "gohan_combo") {
    lines.push(
      `Vegetales: ${
        weekly.vegetables?.length
          ? weekly.vegetables.join(", ")
          : "Sin vegetales"
      }`
    );
  }

  if (weekly.cheese) {
    lines.push(`Queso crema: ${weekly.cheese}`);
  }
}

if (Number(weekly.proteinSurcharge ?? weekly.shrimpExtra) > 0) {
  lines.push(`Recargo por proteína: +${money(weekly.proteinSurcharge ?? weekly.shrimpExtra)}`);
}

if (weekly.day) {
  lines.push(`Día de la promoción: ${weekly.day}`);
}

if (weekly.accompaniment) {
  lines.push(
    `Acompañamiento incluido: ${weekly.accompaniment} × ${quantity}`
  );
}

    }
    if (config.customRoll) {
      const roll = config.customRoll;

      lines.push("PERSONALIZACIÓN ARMA TU ROLL:");
      lines.push(`Base: ${roll.rice}`);
      lines.push(`Nori: ${roll.nori}`);
      lines.push(`Queso crema: ${roll.creamCheese}`);
      lines.push(
        `Cobertura: ${roll.covering}` +
        (Number(roll.coveringSurcharge) > 0
          ? ` (+${money(roll.coveringSurcharge)})`
          : "")
      );
      lines.push(
        `Proteína: ${roll.protein}` +
        (Number(roll.proteinSurcharge) > 0
          ? ` (+${money(roll.proteinSurcharge)})`
          : "")
      );
      lines.push(`Vegetales: ${roll.vegetable}`);
    }
if (config.handroll) {
  const handroll = config.handroll;

  lines.push("PERSONALIZACIÓN HANDROLL:");

  if (handroll.vegetable) {
    lines.push(`Vegetal: ${handroll.vegetable}`);
  }

  if (handroll.cheese) {
    lines.push(`Queso crema: ${handroll.cheese}`);
  }

  if (handroll.nori) {
    lines.push(`Nori: ${handroll.nori}`);
  }
}
    if (config.sushiBurger) {
      const burger = config.sushiBurger;
      lines.push("PERSONALIZACIÓN SUSHI BURGER:");
      lines.push(`Proteína: ${burger.protein || "Sin proteína"}${burger.proteinSurcharge > 0 ? ` (+${money(burger.proteinSurcharge)})` : ""}`);
      lines.push(burger.creamCheese ? "Queso crema: Sí" : "Queso crema: No");
      lines.push(burger.noVegetables ? "Vegetales: Sin vegetal" : "Vegetales: " + ((burger.vegetables || []).join(", ") || "Ninguno"));
    }
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

  
if (config.cheeses?.length || config.noris?.length) {
  lines.push("PERSONALIZACIÓN PROMOCIÓN ICHIBAN:");

  const totalRolls = Math.max(
    config.vegetables?.length || 0,
    config.cheeses?.length || 0,
    config.noris?.length || 0
  );

  for (let i = 0; i < totalRolls; i++) {
    lines.push(`Roll ${i + 1}:`);
    lines.push(`Vegetal: ${config.vegetables?.[i] || "Sin vegetal"}`);
    lines.push(`Queso crema: ${config.cheeses?.[i] || "Sin selección"}`);
    lines.push(`Nori: ${config.noris?.[i] || "Sin selección"}`);
  }
} else if (config.vegetables?.length) {
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
      "RECUERDA ENVIAR VOUCHER PARA CONFIRMACIÓN."
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
          product_type: item.product_type || "",
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

if (item.product_type === "weekly_promo") {
  let weeklyPromos = [];

  try {
    const data = settings.weekly_promos;
    weeklyPromos = typeof data === "string"
      ? JSON.parse(data || "[]")
      : data || [];
  } catch {
    weeklyPromos = [];
  }

  const promoId = item.config?.weeklyPromo?.promoId;

  const promo = weeklyPromos.find(
    p => String(p.id) === String(promoId)
  );

  if (!promo) {
    alert("No se encontró esta promoción semanal.");
    return;
  }

  openWeeklyPromo(promo, item);
  return;
}

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

  const status = document.createElement("span");
  if (!isEnabled(product.available)) {
    status.textContent = "AGOTADO";
    status.style.cssText = "display:inline-block;width:max-content;margin:2px 0;padding:5px 10px;border-radius:4px;background:#6f2525;color:#fff;font-size:11px;font-weight:800;letter-spacing:1px;";
  }

  const description = document.createElement("p");
  description.textContent = product.description || "";

  const price = document.createElement("div");
  price.className = "price";
  price.textContent = money(product.price);

  const addButton = document.createElement("button");
  addButton.className = "product-add";
  addButton.type = "button";
  addButton.textContent = isEnabled(product.available) ? "Agregar al pedido" : "Agotado";
  addButton.disabled = !isEnabled(product.available);
  if (addButton.disabled) {
    addButton.style.cssText = "opacity:.55;cursor:not-allowed;filter:grayscale(.45);";
  } else {
    addButton.addEventListener("click", () => openProduct(product));
  }

  inside.append(title);
  if (!isEnabled(product.available)) inside.append(status);
  inside.append(description, price, addButton);
  article.append(img, inside);

  return article;
}


function render() {
  // Mostrar también los productos agotados para informar al cliente.
  const visible = products;

  // PRODUCTOS DESTACADOS
  const featuredGrid = $("#featuredGrid");

  if (featuredGrid) {
    featuredGrid.replaceChildren();

    const featured = visible
      .filter(product => isEnabled(product.available) && isEnabled(product.featured))
      .slice(0, 3);

    if (featured.length) {
      featured.forEach(product => featuredGrid.appendChild(card(product)));
    } else {
      featuredGrid.textContent = "Pronto anunciaremos nuestros productos destacados.";
    }
  }


  // PROMOCIONES SEMANALES DESDE EL ADMINISTRADOR
  const promoGrid = $("#promoGrid");

  if (promoGrid) {
    promoGrid.replaceChildren();

    let weeklyPromos = [];

    try {
      const data = settings.weekly_promos;
      weeklyPromos = typeof data === "string"
        ? JSON.parse(data || "[]")
        : data || [];

      if (!Array.isArray(weeklyPromos)) {
        weeklyPromos = [];
      }
    } catch {
      weeklyPromos = [];
    }

    const days = [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado"
    ];

    const activePromos = weeklyPromos.filter(promo =>
      isEnabled(promo.active) &&
      days.includes(promo.day)
    );

    days.forEach(day => {
      const dayPromos = activePromos.filter(
        promo => promo.day === day
      );

      if (!dayPromos.length) return;

      const section = document.createElement("div");
      section.className = "weekly-promo-day";

      const heading = document.createElement("h3");
      heading.textContent = day;

      const dayGrid = document.createElement("div");
      dayGrid.className = "grid";

      dayPromos.forEach(promo => {
        const article = document.createElement("article");
        article.className = "product";

        const img = document.createElement("img");
        img.src = promo.image ||
          "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800";
        img.alt = promo.name || "Promoción Ichiban";
        img.loading = "lazy";

        const inside = document.createElement("div");
        inside.className = "inside";

        const title = document.createElement("h3");
        title.textContent = promo.name || "Promoción Ichiban";

        const description = document.createElement("p");
        description.textContent = promo.description || "";

        const price = document.createElement("div");
        price.className = "price";
        price.textContent = money(promo.price);

         const today = [
          "Domingo",
          "Lunes",
          "Martes",
          "Miércoles",
          "Jueves",
          "Viernes",
          "Sábado"
        ][new Date().getDay()];

        const canBuyToday = promo.day === today;

        const addButton = document.createElement("button");
addButton.type = "button";
addButton.className = "product-add";
        addButton.disabled = !canBuyToday;
        addButton.textContent = canBuyToday
          ? "Elegir opciones"
          : `Disponible el ${promo.day.toLowerCase()}`;

        addButton.addEventListener("click", () => {
          if (canBuyToday) {
            openWeeklyPromo(promo);
          }
        });

inside.append(title, description, price, addButton);
        article.append(img, inside);
        dayGrid.appendChild(article);
      });

      section.append(heading, dayGrid);
      promoGrid.appendChild(section);
    });

    if (!activePromos.length) {
      promoGrid.textContent =
        "Pronto anunciaremos nuestras promociones.";
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
function setupSectionToggles() {
  const toggles = [
    {
      button: $("#toggleFeatured"),
      content: $("#featuredGrid"),
      openText: "Ver destacados",
      closeText: "Ocultar destacados"
    },
    {
      button: $("#togglePromos"),
      content: $("#promoGrid"),
      openText: "Ver promociones",
      closeText: "Ocultar promociones"
    }
  ];

  toggles.forEach(({ button, content, openText, closeText }) => {
    if (!button || !content) return;

    button.addEventListener("click", () => {
      const isOpen = !content.hidden;
      content.hidden = isOpen;
      button.setAttribute("aria-expanded", String(!isOpen));
      button.textContent = isOpen ? openText : closeText;
    });
  });
}
async function initialize() {
  addStoreStyles();
  setupMobileMenu();
  setupSectionToggles();
  ensureCartUI();
  await loadSettings();
  await loadProducts();
  updateCartCount();
  askPendingCart();
  showManualClosedNotice();
}

initialize();
