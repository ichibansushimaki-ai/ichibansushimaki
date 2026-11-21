
let token = "";
let settings = {};

const $ = selector => document.querySelector(selector);

const defaults = {
  store_name: "Ichiban Sushi Maki",
  slogan: "El sabor de compartir",
  description: "Descubre nuestros rolls favoritos y preparaciones especiales.",
  logo: "",
  mobile_logo: "",
  hero_image: "",
  whatsapp: "56900000000",
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

const commercialCategories = [
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
const productTypes = [
  ["roll", "Roll"],
  ["promotion", "Promoción"],
  ["handroll", "Handroll"],
  ["dish", "Plato / Gohan / Bowl / Sushi Burger"],
  ["side", "Acompañamiento"],
  ["beverage", "Bebida"],
  ["sauce", "Salsa"],
  ["extra", "Extra"],
  ["other", "Otro"]
];

let currentTypography = JSON.parse(JSON.stringify(defaultTypography));
let products = [];
let orders = [];

const orderStatuses = [
  ["pendiente", "Pendiente"],
  ["confirmado", "Confirmado"],
  ["preparando", "Preparando"],
  ["listo", "Listo"],
  ["entregado", "Entregado"],
  ["cancelado", "Cancelado"]
];

async function api(path, options = {}) {
  const headers = {
    Authorization: "Bearer " + token,
    ...(options.body instanceof FormData
      ? {}
      : options.body
        ? { "Content-Type": "application/json" }
        : {}),
    ...options.headers
  };

  return fetch(path, { ...options, headers });
}

// CONFIGURACIÓN DE LOS NUEVOS CAMPOS DEL CATÁLOGO

function ensureProductFields() {
  const form = $("#productForm");
  if (!form || form.elements.product_type) return;

  const categoryField = form.elements.category;

  if (categoryField) {
    const categorySelect = document.createElement("select");
    categorySelect.name = "category";
    categorySelect.required = true;
    categorySelect.innerHTML =
      '<option value="">Seleccionar categoría comercial</option>' +
      commercialCategories.map(category =>
        `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`
      ).join("");

    categoryField.replaceWith(categorySelect);
  }

  const typeField = document.createElement("div");
  typeField.className = "product-rules-fields";
  typeField.innerHTML = `
    <label for="productType">
      Tipo interno de producto
    </label>

    <select name="product_type" id="productType" required>
      ${productTypes.map(([value, label]) =>
        `<option value="${value}">${label}</option>`
      ).join("")}
    </select>

    <div id="productRules" class="product-rules-box">
      <label for="rollsCount">Cantidad de rolls que incluye</label>
      <input
        type="number"
        id="rollsCount"
        min="1"
        max="100"
        value="1"
      >
      <p id="productRulesHelp">
        Las reglas de salsas y palitos se aplicarán según el tipo de producto.
      </p>
    </div>
  `;

  const priceField = form.elements.price;

  if (priceField) {
    const priceContainer = priceField.parentElement;
    if (priceContainer && priceContainer !== form) {
      priceContainer.before(typeField);
    } else {
      priceField.before(typeField);
    }
  } else {
    form.appendChild(typeField);
  }

  $("#productType").addEventListener("change", updateProductRules);
  updateProductRules();
}

function updateProductRules() {
  const type = $("#productType")?.value || "other";
  const rules = $("#productRules");
  const count = $("#rollsCount");
  const help = $("#productRulesHelp");

  if (!rules || !count || !help) return;

  if (type === "promotion") {
    rules.style.display = "block";
    count.disabled = false;
    help.textContent =
      "Promoción: rellenos y envolturas fijos. Vegetal elegible por roll: cebollín, pimentón, palta o sin vegetal. Una salsa de cortesía por roll y un par de palitos por roll, con máximo 6 pares por pedido.";
  } else if (type === "roll") {
    rules.style.display = "block";
    count.value = "1";
    count.disabled = true;
    help.textContent =
      "Roll: una salsa de cortesía y un par de palitos. Máximo 6 pares de palitos por pedido.";
  } else if (type === "handroll") {
    rules.style.display = "none";
    help.textContent =
      "Handroll: una salsa de cortesía por unidad. No incluye palitos.";
  } else if (type === "dish") {
    rules.style.display = "none";
    help.textContent =
      "Plato, Gohan, Bowl o Sushi Burger: hasta 2 salsas de cortesía por unidad. No incluye palitos.";
  } else {
    rules.style.display = "none";
    help.textContent =
      "Este tipo de producto no incluye salsas ni palitos de cortesía automáticamente.";
  }
}

function buildProductOptions(type, rollsCount) {
  if (type === "promotion") {
    return {
      rolls_count: rollsCount,
      fillings_fixed: true,
      wrap_fixed: true,
      vegetable_choice: true,
      vegetable_options: [
        "Cebollín",
        "Pimentón",
        "Palta",
        "Sin vegetal"
      ],
      complimentary_sauces_per_roll: 1,
      chopsticks_per_roll: 1,
      chopsticks_order_limit: 6
    };
  }

  if (type === "roll") {
    return {
      rolls_count: 1,
      complimentary_sauces_per_roll: 1,
      chopsticks_per_roll: 1,
      chopsticks_order_limit: 6
    };
  }

  if (type === "handroll") {
    return {
      complimentary_sauces_per_unit: 1,
      chopsticks_per_unit: 0
    };
  }

  if (type === "dish") {
    return {
      complimentary_sauces_per_unit: 2,
      chopsticks_per_unit: 0
    };
  }

  return {
    complimentary_sauces_per_unit: 0,
    chopsticks_per_unit: 0
  };
}

function parseOptions(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  return {};
}

async function uploadImage(file) {
  if (!file) return "";

  const form = new FormData();
  form.append("file", file);

  const response = await api("/api/upload", {
    method: "POST",
    body: form
  });

  const detail = await response.text();
  let data = {};

  try {
    data = JSON.parse(detail);
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      `Error ${response.status}: ${
        data.error || data.message || detail || "Error al subir imagen"
      }`
    );
  }

  if (!data.url) {
    throw new Error("El servidor no devolvió la dirección de la imagen.");
  }

  return data.url;
}

function previewFile(inputId, previewId) {
  const input = $("#" + inputId);
  const preview = $("#" + previewId);

  if (!input || !preview) return;

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen supera el límite de 5 MB.");
      input.value = "";
      return;
    }

    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  });
}

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
    Object.keys(result[device]).forEach(key => {
      if (saved[device]?.[key] !== undefined) {
        result[device][key] = saved[device][key];
      }
    });
  });

  return result;
}

function fillTypography(value) {
  currentTypography = parseTypography(value);

  const form = $("#typographyForm");
  if (!form) return;

  ["desktop", "mobile"].forEach(device => {
    Object.entries(currentTypography[device]).forEach(([key, value]) => {
      const field = form.elements[`${device}_${key}`];
      if (field) field.value = value;
    });
  });
}

function readTypography() {
  const form = $("#typographyForm");
  const result = { desktop: {}, mobile: {} };

  ["desktop", "mobile"].forEach(device => {
    Object.keys(defaultTypography[device]).forEach(key => {
      const field = form.elements[`${device}_${key}`];

      if (!field) {
        result[device][key] = defaultTypography[device][key];
        return;
      }

      if (["font", "weight", "spacing", "lineheight"].includes(key)) {
        result[device][key] = field.value;
        return;
      }

      const minimum = Number(field.min);
      const maximum = Number(field.max);
      let value = Number.parseInt(field.value, 10);

      if (!Number.isFinite(value)) {
        value = defaultTypography[device][key];
      }

      value = Math.max(minimum, Math.min(maximum, value));
      field.value = value;
      result[device][key] = value;
    });
  });

  return result;
}

function fillSettings(data) {
  settings = { ...defaults, ...data };
gohanConfig = normalizeGohanConfig(settings.gohan_config);
renderGohanConfig();
  const form = $("#settingsForm");

  Object.entries(settings).forEach(([key, value]) => {
    if (form.elements[key]) {
      form.elements[key].value = value ?? "";
    }
  });

  [
    ["logo", "logoPreview"],
    ["mobile_logo", "mobileLogoPreview"],
    ["hero_image", "heroPreview"]
  ].forEach(([key, previewId]) => {
    const preview = $("#" + previewId);
    if (!preview) return;

    if (settings[key]) {
      preview.src = settings[key];
      preview.style.display = "block";
    } else {
      preview.style.display = "none";
    }
  });

  fillTypography(settings.typography);
}

async function loadSettings() {
  const response = await api("/api/settings");

  if (!response.ok) {
    throw new Error(
      `Error ${response.status}: ${await response.text()}`
    );
  }

  fillSettings(await response.json());
}

// INGRESO AL PANEL

$("#loginBtn").onclick = async () => {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: $("#password").value })
  });

  if (!response.ok) {
    $("#loginMsg").textContent =
      "No se pudo ingresar. Revisa la contraseña.";
    return;
  }

  const data = await response.json();
  token = data.token;

  $("#login").hidden = true;
  $("#editor").hidden = false;

  try {
    ensureProductFields();
    await loadSettings();
    await load();
    await loadOrders();
  } catch (error) {
    alert(error.message);
  }
};

// GUARDAR IDENTIDAD

$("#settingsForm").onsubmit = async event => {
  event.preventDefault();

  const form = event.target;
  const button = form.querySelector('button[type="submit"]');
  const message = $("#settingsMsg");

  button.disabled = true;
  message.textContent = "Guardando identidad...";

  try {
    const data = Object.fromEntries(new FormData(form));

    data.whatsapp =
      form.elements.whatsapp.value.trim() || settings.whatsapp || "";

    data.logo = settings.logo || "";
    data.mobile_logo = settings.mobile_logo || "";
    data.hero_image = settings.hero_image || "";
    data.typography = JSON.stringify(currentTypography);
data.gohan_config = settings.gohan_config || "{}";
    const images = [
      ["logoFile", "logo"],
      ["mobileLogoFile", "mobile_logo"],
      ["heroFile", "hero_image"]
    ];

    for (const [inputId, field] of images) {
      const file = $("#" + inputId).files[0];

      if (file) {
        message.textContent = "Subiendo fotografías...";
        data[field] = await uploadImage(file);
      }
    }

    const response = await api("/api/settings", {
      method: "PUT",
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    settings = { ...settings, ...data };
    fillSettings(settings);

    ["logoFile", "mobileLogoFile", "heroFile"].forEach(id => {
      $("#" + id).value = "";
    });

    message.textContent = "Identidad guardada correctamente.";

  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
  }
};

// GUARDAR TIPOGRAFÍA

$("#typographyForm").onsubmit = async event => {
  event.preventDefault();

  const form = event.target;
  const button = form.querySelector('button[type="submit"]');
  const message = $("#typographyMsg");

  button.disabled = true;
  message.textContent = "Guardando diseño y tipografía...";

  try {
    currentTypography = readTypography();

    const data = {
      ...settings,
      typography: JSON.stringify(currentTypography)
    };

    const response = await api("/api/settings", {
      method: "PUT",
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    settings.typography = data.typography;
    message.textContent = "Diseño y tipografía guardados correctamente.";

  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
  }
};

// CATÁLOGO DE PRODUCTOS

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function isTrue(value) {
  return value === true || value === 1 || value === "1";
}

function money(value) {
  return "$" + Number(value || 0).toLocaleString("es-CL");
}

function safeImageURL(value) {
  try {
    const url = new URL(String(value || ""), location.origin);
    if (url.protocol === "https:" || url.origin === location.origin) {
      return url.href;
    }
  } catch {}
  return "";
}

function productTypeLabel(type) {
  return productTypes.find(item => item[0] === type)?.[1] || "Otro";
}

function renderProducts() {
  const container = $("#items");

  if (!products.length) {
    container.innerHTML = `
      <div class="rowitem">
        <span>No hay productos registrados todavía.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(product => {
    const id = escapeHTML(product.id);
    const name = escapeHTML(product.name);
    const category = escapeHTML(product.category);
    const type = escapeHTML(productTypeLabel(product.product_type));
    const price = money(product.price);
    const available = isTrue(product.available);
    const featured = isTrue(product.featured);
    const image = safeImageURL(product.image);

    return `
      <div class="rowitem product-admin-card">

        <div class="product-admin-photo">
          ${
            image
              ? `<img src="${escapeHTML(image)}"
                    alt="${name}"
                    loading="lazy"
                    onerror="this.style.display='none'">`
              : `<div class="product-no-photo">🍣</div>`
          }
        </div>

        <div class="product-admin-info">
          <b>${name}</b>
          <small>${category}</small>
          <small>Tipo: ${type}</small>

          <strong class="product-admin-price">${price}</strong>

          <div class="product-admin-status">
            <span class="${available ? "status-available" : "status-unavailable"}">
              ${available ? "● Disponible" : "● Agotado"}
            </span>

            ${
              featured
                ? `<span class="status-featured">★ Destacado</span>`
                : ""
            }
          </div>
        </div>

        <div class="product-admin-actions">
          <button type="button" data-toggle-available="${id}">
            ${available ? "Marcar agotado" : "Activar"}
          </button>

          <button type="button" data-toggle-featured="${id}">
            ${featured ? "Quitar destacado" : "Destacar"}
          </button>

          <button type="button" data-edit="${id}">
            Editar
          </button>

          <button type="button" data-del="${id}">
            Eliminar
          </button>
        </div>

      </div>
    `;
  }).join("");
}

async function load() {
  const response = await api("/api/products");

  if (!response.ok) {
    throw new Error("No se pudieron cargar los productos.");
  }

  products = await response.json();
  renderProducts();
}

// ACTUALIZAR DISPONIBILIDAD O DESTACADO

async function updateProduct(product, changes) {
  const buttons = $("#items").querySelectorAll("button");
  buttons.forEach(button => button.disabled = true);

  try {
    const updated = {
      ...product,
      ...changes,
      options: parseOptions(product.options),
      available: changes.available !== undefined
        ? changes.available
        : isTrue(product.available),
      featured: changes.featured !== undefined
        ? changes.featured
        : isTrue(product.featured)
    };

    const response = await api("/api/products", {
      method: "POST",
      body: JSON.stringify(updated)
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    await load();

  } catch (error) {
    alert("No se pudo actualizar el producto: " + error.message);
    buttons.forEach(button => button.disabled = false);
  }
}

// CARGAR PRODUCTO PARA EDITAR

function fillProductForm(product) {
  const form = $("#productForm");

  ensureProductFields();

  Object.entries(product).forEach(([key, value]) => {
    if (!form.elements[key]) return;

    const field = form.elements[key];

    if (field.type === "checkbox") {
      field.checked = isTrue(value);
    } else if (key !== "options") {
      field.value = value ?? "";
    }
  });
// Recuperar selección de promociones semanales
form.elements.weekly_promotion.checked =
  isTrue(product.options?.weekly_promotion);
  // Recuperar identificación de Gohan configurable
form.elements.gohan_customizable.checked =
  isTrue(product.options?.gohan_customizable);
  const categoryField = form.elements.category;

  if (
    product.category &&
    !Array.from(categoryField.options).some(
      option => option.value === product.category
    )
  ) {
    const option = document.createElement("option");
    option.value = product.category;
    option.textContent = product.category;
    categoryField.appendChild(option);
  }

  categoryField.value = product.category || "";

  const type = product.product_type || "other";
  form.elements.product_type.value = type;

  const options = parseOptions(product.options);

  if (type === "promotion") {
    $("#rollsCount").value = Math.max(
      1,
      Number(options.rolls_count || 1)
    );
  } else {
    $("#rollsCount").value = "1";
  }

  updateProductRules();

  $("#preview").style.display = product.image ? "block" : "none";
  $("#preview").src = product.image || "";
  $("#imageFile").value = "";

  $("#uploadMsg").textContent = "Editando producto existente.";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ACCIONES DEL CATÁLOGO

$("#items").addEventListener("click", async event => {
  const button = event.target.closest("button");
  if (!button) return;

  const id = button.dataset.toggleAvailable ||
             button.dataset.toggleFeatured ||
             button.dataset.edit ||
             button.dataset.del;

  if (!id) return;

  const product = products.find(item => String(item.id) === id);
  if (!product) return;

  if (button.dataset.toggleAvailable !== undefined) {
    await updateProduct(product, {
      available: !isTrue(product.available)
    });
    return;
  }

  if (button.dataset.toggleFeatured !== undefined) {
    await updateProduct(product, {
      featured: !isTrue(product.featured)
    });
    return;
  }

  if (button.dataset.edit !== undefined) {
    fillProductForm(product);
    return;
  }

  if (button.dataset.del !== undefined) {
    if (!confirm("¿Eliminar este producto?")) return;

    button.disabled = true;

    try {
      const response = await api(
        "/api/products/" + encodeURIComponent(product.id),
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await load();

    } catch (error) {
      alert("No se pudo eliminar: " + error.message);
      button.disabled = false;
    }
  }
});

// CREAR O EDITAR PRODUCTOS

$("#productForm").onsubmit = async event => {
  event.preventDefault();

  const form = event.target;
  const button = form.querySelector('button[type="submit"]');

  button.disabled = true;

  try {
    const data = Object.fromEntries(new FormData(form));

    data.price = Number(data.price);
    data.available = form.elements.available.checked;
    data.featured = form.elements.featured.checked;
    data.product_type = form.elements.product_type.value;

    const rollsCount = Math.max(
      1,
      Math.min(100, Number($("#rollsCount").value) || 1)
    );

   data.options = buildProductOptions(
  data.product_type,
  rollsCount
);

// Guardar selección de promociones semanales
data.options.weekly_promotion =
  form.elements.weekly_promotion.checked;
// Identificar Gohan configurable
data.options.gohan_customizable =
  form.elements.gohan_customizable.checked;
    const file = $("#imageFile").files[0];

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("La imagen supera el límite de 5 MB.");
      }

      $("#uploadMsg").textContent = "Subiendo fotografía...";
      data.image = await uploadImage(file);
    } else if (!data.image) {
      data.image = "";
    }

    const response = await api("/api/products", {
      method: "POST",
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    form.reset();
    form.elements.id.value = "";
    form.elements.product_type.value = "roll";
    $("#rollsCount").value = "1";
    updateProductRules();

    $("#preview").style.display = "none";
    $("#preview").src = "";
    $("#imageUrl").value = "";
    $("#imageFile").value = "";
    $("#uploadMsg").textContent = "";

    await load();

    alert("Producto guardado correctamente.");

  } catch (error) {
    alert(error.message);
  } finally {
    button.disabled = false;
  }
};

// ======================================================
// PANEL DE PEDIDOS Y VENTAS
// ======================================================

function orderStatusLabel(status) {
  return orderStatuses.find(item => item[0] === status)?.[1] || status;
}

function orderDateValue(value) {
  if (!value) return null;

  let dateString = String(value);

  // Las fechas de D1 suelen venir sin zona horaria.
  if (!/[zZ]|[+-]\d{2}:\d{2}$/.test(dateString)) {
    dateString = dateString.replace(" ", "T") + "Z";
  }

  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : date;
}

function orderDateKey(value) {
  const date = orderDateValue(value);
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatOrderDate(value) {
  const date = orderDateValue(value);

  if (!date) return "Fecha no disponible";

  return date.toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function orderIsSale(order) {
  return [
    "confirmado",
    "preparando",
    "listo",
    "entregado"
  ].includes(order.status);
}

function getFilteredOrders() {
  return orders;
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function renderOrderStats(filteredOrders) {
  const pending = filteredOrders.filter(
    order => order.status === "pendiente"
  ).length;

  const delivery = filteredOrders.filter(
    order => order.fulfillment_method === "delivery"
  ).length;

  const pickup = filteredOrders.filter(
    order => order.fulfillment_method === "pickup"
  ).length;

  const cancelled = filteredOrders.filter(
    order => order.status === "cancelado"
  ).length;

  const salesOrders = filteredOrders.filter(order =>
    orderIsSale(order) &&
    order.total !== null &&
    order.total !== undefined
  );

  const totalSales = list =>
    list.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

  const deliverySales = salesOrders.filter(
    order => order.fulfillment_method === "delivery"
  );

  const pickupSales = salesOrders.filter(
    order => order.fulfillment_method === "pickup"
  );

  $("#statOrders").textContent = filteredOrders.length;
  $("#statPending").textContent = pending;
  $("#statSales").textContent = money(totalSales(salesOrders));
  $("#statDelivery").textContent = delivery;
  $("#statPickup").textContent = pickup;

  $("#statDeliverySales").textContent =
    money(totalSales(deliverySales));

  $("#statPickupSales").textContent =
    money(totalSales(pickupSales));

  $("#statCancelled").textContent = cancelled;
}


function describeOrderConfig(config) {
  if (!config || typeof config !== "object") return "";

  const details = [];

  const vegetables = config.vegetables || config.vegetableChoices;

  if (Array.isArray(vegetables) && vegetables.length) {
    details.push(
      "Vegetales: " + vegetables.map(item =>
        typeof item === "string"
          ? item
          : item?.vegetable || item?.choice || item?.name || ""
      ).filter(Boolean).join(", ")
    );
  }

  if (config.sauceDistribution && typeof config.sauceDistribution === "object") {
    const distribution = Object.entries(config.sauceDistribution)
      .map(([name, quantity]) => `${name}: ${quantity}`)
      .join(", ");

    if (distribution) details.push("Salsas de cortesía: " + distribution);
  }

  if (config.sauces && typeof config.sauces === "object") {
    const sauces = Object.entries(config.sauces)
      .map(([name, quantity]) => `${name}: ${quantity}`)
      .join(", ");

    if (sauces) details.push("Salsas: " + sauces);
  }

  if (config.chopsticks !== undefined) {
    details.push(
      "Palitos: " +
      (config.chopsticks ? "Sí" : "No")
    );
  }

  if (config.note) {
    details.push("Nota: " + config.note);
  }

  return details.map(item => escapeHTML(item)).join("<br>");
}

function renderOrderItem(item) {
  const name = escapeHTML(item.name || "Producto");
  const quantity = Number(item.quantity || 0);
  const unitPrice = Number(item.unit_price || 0);
  const lineTotal = Number(item.line_total || unitPrice * quantity);

  const configDetails = describeOrderConfig(item.config);

  const paidSauces = Array.isArray(item.paid_sauces)
    ? item.paid_sauces
    : [];

  const paidSaucesHTML = paidSauces.map(sauce => `
    <small>
      Salsa adicional: ${escapeHTML(sauce.name)}
      × ${Number(sauce.quantity || 0)}
      — ${money(sauce.total)}
    </small>
  `).join("");

  return `
    <div class="order-item">
      <strong>
        ${quantity} × ${name}
      </strong>

      <small>
        Precio unitario: ${money(unitPrice)}
        — Total: ${money(lineTotal)}
      </small>

      ${configDetails ? `<small>${configDetails}</small>` : ""}
      ${paidSaucesHTML}
    </div>
  `;
}



function renderOrderCard(order) {
  const id = escapeHTML(order.id || "");
  const shortId = id.slice(0, 8);

  const method = order.fulfillment_method === "delivery"
    ? "Delivery"
    : "Retiro en local";

  const paymentLabels = {
    debit_credit: "Tarjeta de débito / crédito",
    cash: "Efectivo",
    transfer: "Transferencia bancaria"
  };

  const paymentMethod = paymentLabels[order.payment_method]
    || "No informado";

  const address = order.fulfillment_method === "delivery"
    ? `<div class="order-meta">Dirección: ${escapeHTML(order.address || "No registrada")}</div>`
    : "";

  const reference = order.reference
    ? `<div class="order-meta">Referencia: ${escapeHTML(order.reference)}</div>`
    : "";

  const items = Array.isArray(order.items) ? order.items : [];

  const itemsHTML = items.length
    ? items.map(renderOrderItem).join("")
    : '<p>No hay detalle de productos disponible.</p>';

  const deliveryFee = order.delivery_fee === null ||
    order.delivery_fee === undefined
      ? "Por definir"
      : money(order.delivery_fee);

  const total = order.total === null ||
    order.total === undefined
      ? "Por definir"
      : money(order.total);

  const statusOptions = orderStatuses.map(([value, label]) => `
    <option value="${value}" ${order.status === value ? "selected" : ""}>
      ${label}
    </option>
  `).join("");

  const feeValue = order.delivery_fee === null ||
    order.delivery_fee === undefined
      ? ""
      : Number(order.delivery_fee);

  const feeField = order.fulfillment_method === "delivery"
    ? `
      <label>
        Costo delivery ($)
        <input
          type="number"
          min="0"
          step="1"
          data-order-fee="${id}"
          value="${feeValue}"
          placeholder="Ej. 1500"
        >
      </label>
    `
    : `
      <label>
        Costo delivery
        <input type="text" value="$0 (retiro)" disabled>
      </label>
    `;

  return `
    <details class="order-card">

      <summary>
        <div>
          <h3>Pedido #${shortId}</h3>
          <div class="order-meta">${formatOrderDate(order.created_at)}</div>
          <div class="order-meta">${method}</div>
          <div class="order-meta">
            Método de pago: ${paymentMethod}
          </div>
        </div>

        <span class="order-badge">
          ${escapeHTML(orderStatusLabel(order.status))}
        </span>

        <div>
          <strong>Total: ${total}</strong>
          <div class="order-meta">Ver detalle del pedido</div>
        </div>
      </summary>

      <div class="order-header">
        <div>
          <h3>Pedido #${shortId}</h3>
          <div class="order-meta">${formatOrderDate(order.created_at)}</div>
          <div class="order-meta">${method}</div>
          <div class="order-meta">
            <strong>Método de pago:</strong> ${paymentMethod}
          </div>
          ${address}
          ${reference}
        </div>

        <span class="order-badge">
          ${escapeHTML(orderStatusLabel(order.status))}
        </span>
      </div>

      <div class="order-items">
        ${itemsHTML}
      </div>

      <div class="order-totals">
        <div class="order-total-line">
          <span>Subtotal</span>
          <strong>${money(order.subtotal)}</strong>
        </div>

        <div class="order-total-line">
          <span>Delivery</span>
          <strong>${deliveryFee}</strong>
        </div>

        <div class="order-total-line final">
          <span>Total</span>
          <strong>${total}</strong>
        </div>
      </div>

      <div class="order-actions">
        <label>
          Estado del pedido
          <select data-order-status="${id}">
            ${statusOptions}
          </select>
        </label>

        ${feeField}

        <button
          type="button"
          class="btn btn-red"
          data-save-order="${id}"
        >
          Guardar cambios
        </button>
      </div>

    </details>
  `;
}


function renderOrders() {
  const container = $("#ordersList");
  if (!container) return;

  const filteredOrders = getFilteredOrders();

  renderOrderStats(filteredOrders);

  if (!filteredOrders.length) {
    container.innerHTML = `
      <div class="order-empty">
        No hay pedidos registrados para el día seleccionado.
      </div>
    `;
    return;
  }

  container.innerHTML = filteredOrders
    .map(renderOrderCard)
    .join("");
}

async function loadOrders() {
  const message = $("#ordersMessage");
  const dateField = $("#ordersDate");

  if (message) {
    message.textContent = "Cargando pedidos...";
  }

  try {
    // Si no hay fecha seleccionada, utilizar el día actual.
    if (dateField && !dateField.value) {
      dateField.value = getLocalDateKey(new Date());
    }

    const selectedDate = dateField?.value;

    if (!selectedDate) {
      throw new Error("Debes seleccionar una fecha.");
    }

    // Crear el inicio y término del día según la hora local de Chile.
    const [year, month, day] = selectedDate.split("-").map(Number);

    const startDate = new Date(year, month - 1, day);
    const endDate = new Date(year, month - 1, day + 1);

    const start = startDate.toISOString().slice(0, 19).replace("T", " ");
    const end = endDate.toISOString().slice(0, 19).replace("T", " ");

    const params = new URLSearchParams({
      start,
      end
    });

    const response = await api("/api/orders?" + params.toString());

    if (!response.ok) {
      throw new Error(
        `Error ${response.status}: ${await response.text()}`
      );
    }

    orders = await response.json();

    renderOrders();

    if (message) {
      message.textContent =
        `${orders.length} pedido(s) para el ${startDate.toLocaleDateString("es-CL")}.`;
    }

  } catch (error) {
    if (message) {
      message.textContent = "No se pudieron cargar los pedidos.";
    }

    throw error;
  }
}

async function saveOrder(orderId) {
  const order = orders.find(item => String(item.id) === orderId);

  if (!order) {
    alert("No se encontró el pedido.");
    return;
  }

  const statusField = document.querySelector(
    `[data-order-status="${CSS.escape(orderId)}"]`
  );

  const feeField = document.querySelector(
    `[data-order-fee="${CSS.escape(orderId)}"]`
  );

  if (!statusField) return;

  const status = statusField.value;

  let deliveryFee = null;

  if (order.fulfillment_method === "pickup") {
    deliveryFee = 0;
  } else if (feeField && feeField.value.trim() !== "") {
    deliveryFee = Number(feeField.value);
  } else if (
    status !== "pendiente" &&
    status !== "cancelado"
  ) {
    const answer = prompt(
      "Ingresa el costo de delivery en pesos chilenos:"
    );

    if (answer === null) return;

    deliveryFee = Number(answer);
  }

  if (
    deliveryFee !== null &&
    (!Number.isSafeInteger(deliveryFee) || deliveryFee < 0)
  ) {
    alert("El costo de delivery debe ser un número válido igual o mayor a cero.");
    return;
  }

  if (
    order.fulfillment_method === "delivery" &&
    status !== "pendiente" &&
    status !== "cancelado" &&
    deliveryFee === null
  ) {
    alert("Debes ingresar el costo de delivery antes de confirmar el pedido.");
    return;
  }

  const button = document.querySelector(
    `[data-save-order="${CSS.escape(orderId)}"]`
  );

  if (button) {
    button.disabled = true;
    button.textContent = "Guardando...";
  }

  try {
    const response = await api("/api/orders", {
      method: "PATCH",
      body: JSON.stringify({
        id: orderId,
        status,
        delivery_fee: deliveryFee
      })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.error || "No se pudo actualizar el pedido."
      );
    }

    await loadOrders();

    alert("Pedido actualizado correctamente.");

  } catch (error) {
    alert(error.message);

    if (button) {
      button.disabled = false;
      button.textContent = "Guardar cambios";
    }
  }
}

// FILTROS Y ACTUALIZACIÓN DE PEDIDOS

$("#ordersDate")?.addEventListener("change", async () => {
  try {
    await loadOrders();
  } catch (error) {
    alert(error.message);
  }
});

$("#refreshOrders")?.addEventListener("click", async () => {
  const button = $("#refreshOrders");
  button.disabled = true;
  button.textContent = "Actualizando...";

  try {
    await loadOrders();
  } catch (error) {
    alert(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Actualizar pedidos";
  }
});

$("#ordersList")?.addEventListener("click", event => {
  const button = event.target.closest("[data-save-order]");
  if (!button) return;

  saveOrder(button.dataset.saveOrder);
});

// PREVISUALIZACIÓN DE IMÁGENES

ensureProductFields();

previewFile("logoFile", "logoPreview");
previewFile("mobileLogoFile", "mobileLogoPreview");
previewFile("heroFile", "heroPreview");
previewFile("imageFile", "preview");

// ======================================
// CONFIGURACIÓN ADMINISTRABLE DEL GOHAN
// ======================================

let gohanConfig = {
  vegetables: [
    { name: "Palta", active: true },
    { name: "Cebollín", active: true },
    { name: "Maíz", active: true },
    { name: "Lechuga", active: true },
    { name: "Pimentón", active: true },
    { name: "Cebolla morada", active: true }
  ],
  proteins: [
    { name: "POLLO", surcharge: 0, active: true },
    { name: "POLLO FURAY", surcharge: 0, active: true },
    { name: "POLLO TERIYAKI", surcharge: 0, active: true },
    { name: "CAMARÓN", surcharge: 0, active: true },
    { name: "CAMARÓN FURAY", surcharge: 0, active: true },
    { name: "SALMÓN", surcharge: 1000, active: true }
  ],
  max_vegetables: 3,
  max_proteins: 1
};

function normalizeGohanConfig(value) {
  try {
    const saved = typeof value === "string"
      ? JSON.parse(value || "{}")
      : (value || {});

    return {
      vegetables: Array.isArray(saved.vegetables)
        ? saved.vegetables
        : gohanConfig.vegetables,

      proteins: Array.isArray(saved.proteins)
        ? saved.proteins
        : gohanConfig.proteins,

      max_vegetables: 3,
      max_proteins: 1
    };
  } catch {
    return {
      vegetables: [...gohanConfig.vegetables],
      proteins: [...gohanConfig.proteins],
      max_vegetables: 3,
      max_proteins: 1
    };
  }
}

function renderGohanConfig() {
  const vegetablesContainer = $("#gohanVegetables");
  const proteinsContainer = $("#gohanProteins");

  if (!vegetablesContainer || !proteinsContainer) return;

  vegetablesContainer.innerHTML = gohanConfig.vegetables.map((item, index) => `
    <div class="gohan-admin-row">
      <input
        type="text"
        class="gohan-vegetable-name"
        data-index="${index}"
        value="${String(item.name || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")}"
        placeholder="Nombre del vegetal"
      >
      <label>
        <input
          type="checkbox"
          class="gohan-vegetable-active"
          data-index="${index}"
          ${item.active !== false ? "checked" : ""}
        >
        Activo
      </label>
      <button type="button" class="gohan-remove-vegetable" data-index="${index}">
        Eliminar
      </button>
    </div>
  `).join("");

  proteinsContainer.innerHTML = gohanConfig.proteins.map((item, index) => `
    <div class="gohan-admin-row">
      <input
        type="text"
        class="gohan-protein-name"
        data-index="${index}"
        value="${String(item.name || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")}"
        placeholder="Nombre de la proteína"
      >
      <input
        type="number"
        class="gohan-protein-price"
        data-index="${index}"
        min="0"
        step="100"
        value="${Number(item.surcharge || 0)}"
        placeholder="Recargo"
        title="Recargo adicional en pesos"
      >
      <label>
        <input
          type="checkbox"
          class="gohan-protein-active"
          data-index="${index}"
          ${item.active !== false ? "checked" : ""}
        >
        Activo
      </label>
      <button type="button" class="gohan-remove-protein" data-index="${index}">
        Eliminar
      </button>
    </div>
  `).join("");
}

function readGohanConfig() {
  const vegetables = Array.from(
    document.querySelectorAll(".gohan-vegetable-name")
  ).map((input, index) => ({
    name: input.value.trim(),
    active: document.querySelector(
      `.gohan-vegetable-active[data-index="${index}"]`
    )?.checked === true
  })).filter(item => item.name);

  const proteins = Array.from(
    document.querySelectorAll(".gohan-protein-name")
  ).map((input, index) => ({
    name: input.value.trim(),
    surcharge: Math.max(0, Number(
      document.querySelector(
        `.gohan-protein-price[data-index="${index}"]`
      )?.value || 0
    )),
    active: document.querySelector(
      `.gohan-protein-active[data-index="${index}"]`
    )?.checked === true
  })).filter(item => item.name);

  return {
    vegetables,
    proteins,
    max_vegetables: 3,
    max_proteins: 1
  };
}

// Agregar vegetal
$("#addGohanVegetable")?.addEventListener("click", () => {
  gohanConfig = readGohanConfig();
  gohanConfig.vegetables.push({
    name: "",
    active: true
  });
  renderGohanConfig();
});

// Agregar proteína
$("#addGohanProtein")?.addEventListener("click", () => {
  gohanConfig = readGohanConfig();
  gohanConfig.proteins.push({
    name: "",
    surcharge: 0,
    active: true
  });
  renderGohanConfig();
});

// Eliminar ingredientes
document.addEventListener("click", event => {
  const removeVegetable = event.target.closest(".gohan-remove-vegetable");
  const removeProtein = event.target.closest(".gohan-remove-protein");

  if (removeVegetable) {
    gohanConfig = readGohanConfig();
    gohanConfig.vegetables.splice(
      Number(removeVegetable.dataset.index), 1
    );
    renderGohanConfig();
  }

  if (removeProtein) {
    gohanConfig = readGohanConfig();
    gohanConfig.proteins.splice(
      Number(removeProtein.dataset.index), 1
    );
    renderGohanConfig();
  }
});

// Guardar configuración
$("#saveGohanConfig")?.addEventListener("click", async () => {
  const config = readGohanConfig();

  if (!config.vegetables.length || !config.proteins.length) {
    alert("Debes mantener al menos un vegetal y una proteína.");
    return;
  }

  const data = {
    ...settings,
    gohan_config: JSON.stringify(config)
  };

  try {
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    gohanConfig = config;
    settings = {
      ...settings,
      gohan_config: JSON.stringify(config)
    };

    alert("Configuración del Gohan guardada correctamente.");

  } catch (error) {
    alert("No se pudo guardar la configuración: " + error.message);
  }
});
