
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

  // Mantener categorías antiguas para que no se pierdan
  // al editar productos que ya estaban registrados.
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

// PREVISUALIZACIÓN DE IMÁGENES

ensureProductFields();

previewFile("logoFile", "logoPreview");
previewFile("mobileLogoFile", "mobileLogoPreview");
previewFile("heroFile", "heroPreview");
previewFile("imageFile", "preview");
