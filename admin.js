
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

async function api(path, options = {}) {
  const headers = {
    "Authorization": "Bearer " + token,
    ...(options.body instanceof FormData
      ? {}
      : options.body
        ? { "Content-Type": "application/json" }
        : {}),
    ...options.headers
  };

  return fetch(path, { ...options, headers });
}

async function uploadImage(file) {
  if (!file) return "";

  const form = new FormData();
  form.append("file", file);

  const response = await api("/api/upload", {
    method: "POST",
    body: form
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || "No se pudo subir la imagen.");
  }

  if (!data.url) throw new Error("El servidor no devolvió la dirección de la imagen.");

  return data.url;
}

function previewFile(inputId, previewId) {
  const input = $("#" + inputId);
  const preview = $("#" + previewId);

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

    if (settings[key]) {
      preview.src = settings[key];
      preview.style.display = "block";
    } else {
      preview.style.display = "none";
    }
  });
}

async function loadSettings() {
  const response = await api("/api/settings");

  if (!response.ok) {
  const detail = await response.text();
  throw new Error(`Error ${response.status}: ${detail}`);
}

  fillSettings(await response.json());
}

$("#loginBtn").onclick = async () => {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: $("#password").value })
  });

  if (!response.ok) {
    $("#loginMsg").textContent = "No se pudo ingresar. Revisa la contraseña.";
    return;
  }

  const data = await response.json();
  token = data.token;

  $("#login").hidden = true;
  $("#editor").hidden = false;

  try {
    await loadSettings();
    await load();
  } catch (error) {
    alert(error.message);
  }
};

$("#settingsForm").onsubmit = async event => {
  event.preventDefault();

  const form = event.target;
  const button = form.querySelector('button[type="submit"]');
  const message = $("#settingsMsg");

  button.disabled = true;
  message.textContent = "Guardando identidad...";

  try {
    const data = Object.fromEntries(new FormData(form));
    data.whatsapp = form.elements.whatsapp.value.trim() || settings.whatsapp || "";

    data.logo = settings.logo || "";
    data.mobile_logo = settings.mobile_logo || "";
    data.hero_image = settings.hero_image || "";

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
  const detail = await response.text();
  throw new Error(`Error ${response.status}: ${detail}`);
}

    settings = data;
    fillSettings(data);

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

let products = [];

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

async function load() {
  const response = await api("/api/products");

  if (!response.ok) {
    throw new Error("No se pudieron cargar los productos.");
  }

  products = await response.json();

  $("#items").innerHTML = products.map(product => `
    <div class="rowitem">
      <span>
        <b>${escapeHTML(product.name)}</b>
        · $${Number(product.price).toLocaleString("es-CL")}
        <br><small>${escapeHTML(product.category)}</small>
      </span>
      <span>
        <button type="button" data-edit="${escapeHTML(product.id)}">Editar</button>
        <button type="button" data-del="${escapeHTML(product.id)}">Eliminar</button>
      </span>
    </div>
  `).join("");

  products.forEach(product => {
    const editButton = document.querySelector(
      `[data-edit="${CSS.escape(String(product.id))}"]`
    );

    const deleteButton = document.querySelector(
      `[data-del="${CSS.escape(String(product.id))}"]`
    );

    editButton.onclick = () => {
      const form = $("#productForm");

      Object.entries(product).forEach(([key, value]) => {
        if (form.elements[key]) {
          if (form.elements[key].type === "checkbox") {
            form.elements[key].checked = !!value;
          } else {
            form.elements[key].value = value ?? "";
          }
        }
      });

      $("#preview").style.display = product.image ? "block" : "none";
      $("#preview").src = product.image || "";
      $("#imageFile").value = "";

      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    deleteButton.onclick = async () => {
      if (!confirm("¿Eliminar este producto?")) return;

      const response = await api(
        "/api/products/" + encodeURIComponent(product.id),
        { method: "DELETE" }
      );

      if (!response.ok) {
        alert("No se pudo eliminar el producto.");
        return;
      }

      await load();
    };
  });
}

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

    const file = $("#imageFile").files[0];

    if (file) {
      $("#uploadMsg").textContent = "Subiendo fotografía...";
      data.image = await uploadImage(file);
    }

    const response = await api("/api/products", {
      method: "POST",
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error("No se pudo guardar el producto.");

    form.reset();
    form.elements.id.value = "";
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

previewFile("logoFile", "logoPreview");
previewFile("mobileLogoFile", "mobileLogoPreview");
previewFile("heroFile", "heroPreview");
previewFile("imageFile", "preview");
