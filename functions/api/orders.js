
async function authorized(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "");

  return !!token && token === env.ADMIN_TOKEN;
}

function jsonError(message, status = 400) {
  return Response.json({ error: message }, { status });
}

function cleanConfig(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return {};
  }

  const serialized = JSON.stringify(config);

  if (serialized.length > 12000) {
    throw new Error("Las opciones del pedido son demasiado extensas.");
  }

  return JSON.parse(serialized);
}

function parseObject(value) {
  try {
    const parsed = typeof value === "string"
      ? JSON.parse(value || "{}")
      : value;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}


export async function onRequestGet({ request, env }) {
  if (!await authorized(request, env)) {
    return new Response("No autorizado", { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");

    let query = `
      SELECT *
      FROM orders
    `;

    let statement;

    if (start && end) {
      query += `
        WHERE datetime(created_at) >= datetime(?)
          AND datetime(created_at) < datetime(?)
      `;

      query += " ORDER BY created_at DESC";

      statement = env.DB.prepare(query).bind(start, end);

    } else {
      query += " ORDER BY created_at DESC";
      statement = env.DB.prepare(query);
    }

    const { results } = await statement.all();

    return Response.json(results.map(order => ({
      ...order,
      items: JSON.parse(order.items_json || "[]")
    })));

  } catch (error) {
    return jsonError("No se pudieron consultar los pedidos.", 500);
  }
}


export async function onRequestPost({ request, env }) {
  try {
    const rawBody = await request.text();

    if (rawBody.length > 50000) {
      return jsonError("El pedido es demasiado extenso.");
    }

    const body = JSON.parse(rawBody);

    if (!Array.isArray(body.items) ||
        body.items.length === 0 ||
        body.items.length > 30) {
      return jsonError("El pedido no contiene productos válidos.");
    }

    if (!["delivery", "pickup"].includes(body.fulfillment_method)) {
      return jsonError("Modalidad de entrega no válida.");
    }
if (!["debit_credit", "cash", "transfer"].includes(body.payment_method)) {
  return jsonError("Selecciona un método de pago válido.");
}
    if (
      body.fulfillment_method === "delivery" &&
      (!body.address || !String(body.address).trim())
    ) {
      return jsonError("La dirección es obligatoria para delivery.");
    }

    const address = body.address
      ? String(body.address).trim().slice(0, 500)
      : null;

    const reference = body.reference
      ? String(body.reference).trim().slice(0, 500)
      : null;

const settingsRow = await env.DB.prepare(`
  SELECT gohan_config, weekly_promos
  FROM store_settings
  WHERE id = 1
`).first();

const gohanSettings = parseObject(settingsRow?.gohan_config);
let weeklyPromos = [];

try {
  const parsedPromos = typeof settingsRow?.weekly_promos === "string"
    ? JSON.parse(settingsRow.weekly_promos || "[]")
    : settingsRow?.weekly_promos;

  weeklyPromos = Array.isArray(parsedPromos)
    ? parsedPromos
    : [];
} catch {
  weeklyPromos = [];
}

const gohanSettings = parseObject(settingsRow?.gohan_config);

    const activeVegetables = (gohanSettings.vegetables || [])
      .filter(item => item && item.active && item.name)
      .map(item => String(item.name));

    const activeProteins = (gohanSettings.proteins || [])
      .filter(item => item && item.active && item.name)
      .map(item => ({
        name: String(item.name),
        surcharge: Number(item.surcharge) || 0
      }));

    let subtotal = 0;
    const validatedItems = [];

    for (const item of body.items) {
      if (!item.id) {
        return jsonError("Falta el identificador de un producto.");
      }

      const quantity = Number(item.quantity);

      if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 50) {
        return jsonError("Cantidad de producto no válida.");
      }

      const product = await env.DB.prepare(`
        SELECT id, name, price, available, product_type, options
        FROM products
        WHERE id = ?
      `).bind(String(item.id)).first();

      if (!product) {
        return jsonError("Uno de los productos ya no existe.");
      }

      if (Number(product.available) !== 1) {
        return jsonError(`El producto ${product.name} no está disponible.`);
      }

      const price = Number(product.price);

      if (!Number.isSafeInteger(price) || price < 0) {
        return jsonError("Precio de producto no válido.", 500);
      }

const productOptions = parseObject(product.options);

const isGohan = product.product_type === "dish" &&
  productOptions.gohan_customizable === true;

const config = cleanConfig(item.config);

      let gohanSurcharge = 0;

      if (isGohan) {
        if (
          !config.gohan ||
          typeof config.gohan !== "object" ||
          Array.isArray(config.gohan)
        ) {
          return jsonError("Debes completar la personalización del Gohan.");
        }

        const gohan = config.gohan;

        if (typeof gohan.creamCheese !== "boolean") {
          return jsonError("La selección de queso crema no es válida.");
        }

        if (typeof gohan.noVegetables !== "boolean") {
          return jsonError("La selección de vegetales no es válida.");
        }

        if (!Array.isArray(gohan.vegetables)) {
          return jsonError("La selección de vegetales no es válida.");
        }

        if (gohan.vegetables.length > 3) {
          return jsonError("Puedes elegir un máximo de 3 vegetales.");
        }

        const selectedVegetables = gohan.vegetables.map(String);

        if (new Set(selectedVegetables).size !== selectedVegetables.length) {
          return jsonError("No puedes repetir vegetales.");
        }

        if (
          gohan.noVegetables &&
          selectedVegetables.length > 0
        ) {
          return jsonError("No puedes combinar Sin vegetal con otros vegetales.");
        }

        for (const vegetable of selectedVegetables) {
          if (!activeVegetables.includes(vegetable)) {
            return jsonError(`El vegetal ${vegetable} ya no está disponible.`);
          }
        }

        const proteinName = String(gohan.protein || "");

        if (proteinName) {
          const selectedProtein = activeProteins.find(
            protein => protein.name === proteinName
          );

          if (!selectedProtein) {
            return jsonError("La proteína seleccionada ya no está disponible.");
          }

          if (
            !Number.isSafeInteger(selectedProtein.surcharge) ||
            selectedProtein.surcharge < 0
          ) {
            return jsonError("El recargo de la proteína no es válido.", 500);
          }

          gohanSurcharge = selectedProtein.surcharge;
        }

        config.gohan = {
          creamCheese: gohan.creamCheese,
          vegetables: selectedVegetables,
          noVegetables: gohan.noVegetables,
          protein: proteinName,
          proteinSurcharge: gohanSurcharge
        };

      } else if (config.gohan !== undefined) {
        return jsonError("La personalización Gohan no corresponde a este producto.");
      }

      let paidSaucesTotal = 0;
      const validatedPaidSauces = [];

      if (config.paidSauces !== undefined &&
          !Array.isArray(config.paidSauces)) {
        return jsonError("Las salsas adicionales no son válidas.");
      }

      for (const sauce of config.paidSauces || []) {
        const sauceQuantity = Number(sauce.quantity);

        if (
          !sauce.id ||
          !Number.isSafeInteger(sauceQuantity) ||
          sauceQuantity < 1 ||
          sauceQuantity > 50
        ) {
          return jsonError("Cantidad de salsa adicional no válida.");
        }

        const sauceProduct = await env.DB.prepare(`
          SELECT id, name, price, available, product_type
          FROM products
          WHERE id = ?
        `).bind(String(sauce.id)).first();

        if (
          !sauceProduct ||
          Number(sauceProduct.available) !== 1 ||
          sauceProduct.product_type !== "sauce"
        ) {
          return jsonError("Una salsa adicional no está disponible.");
        }

        const saucePrice = Number(sauceProduct.price);

        if (!Number.isSafeInteger(saucePrice) || saucePrice < 0) {
          return jsonError("Precio de salsa no válido.", 500);
        }

        const sauceTotal = saucePrice * sauceQuantity;

        paidSaucesTotal += sauceTotal;

        validatedPaidSauces.push({
          id: sauceProduct.id,
          name: sauceProduct.name,
          unit_price: saucePrice,
          quantity: sauceQuantity,
          total: sauceTotal
        });
      }

const productTotal = price * quantity;
const proteinTotal = gohanSurcharge * quantity;
const lineTotal = productTotal + proteinTotal + paidSaucesTotal;

      if (
        !Number.isSafeInteger(productTotal) ||
        !Number.isSafeInteger(proteinTotal) ||
        !Number.isSafeInteger(lineTotal)
      ) {
        return jsonError("El total del producto no es válido.");
      }

      subtotal += lineTotal;

      if (!Number.isSafeInteger(subtotal)) {
        return jsonError("El total del pedido no es válido.");
      }

      validatedItems.push({
        id: product.id,
        name: product.name,
        unit_price: price,
        quantity,
        product_type: product.product_type,
        config,
        paid_sauces: validatedPaidSauces,
        line_total: lineTotal
      });
    }

    const id = crypto.randomUUID();

    await env.DB.prepare(`
     INSERT INTO orders (
  id,
  fulfillment_method,
  payment_method,
  address,
  reference,
  items_json,
  subtotal,
  status
)
VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')
    `).bind(
      id,
      body.fulfillment_method,
      body.payment_method,
      address,
      reference,
      JSON.stringify(validatedItems),
      subtotal
    ).run();
    return Response.json({
      success: true,
      id,
      subtotal,
      message: "Pedido registrado correctamente."
    });

  } catch (error) {
    return jsonError(
      "No se pudo registrar el pedido.",
      500
    );
  }
}

export async function onRequestPatch({ request, env }) {
  if (!await authorized(request, env)) {
    return new Response("No autorizado", { status: 401 });
  }

  try {
    const body = await request.json();

    const allowedStatuses = [
      "pendiente",
      "confirmado",
      "preparando",
      "listo",
      "entregado",
      "cancelado"
    ];

    if (!body.id || !allowedStatuses.includes(body.status)) {
      return jsonError("Pedido o estado no válido.");
    }

    const order = await env.DB.prepare(`
      SELECT id, fulfillment_method, subtotal, delivery_fee
      FROM orders
      WHERE id = ?
    `).bind(body.id).first();

    if (!order) {
      return jsonError("Pedido no encontrado.", 404);
    }

    let deliveryFee = body.delivery_fee === undefined
      ? order.delivery_fee
      : Number(body.delivery_fee);

    if (order.fulfillment_method === "pickup") {
      if (deliveryFee !== null && deliveryFee !== 0) {
        return jsonError("El retiro en local no tiene costo de delivery.");
      }

      deliveryFee = 0;
    }

    if (
      deliveryFee !== null &&
      (!Number.isSafeInteger(deliveryFee) || deliveryFee < 0)
    ) {
      return jsonError("Costo de delivery no válido.");
    }

    if (
      order.fulfillment_method === "delivery" &&
      body.status !== "pendiente" &&
      body.status !== "cancelado" &&
      deliveryFee === null
    ) {
      return jsonError(
        "Debes registrar el costo de delivery antes de confirmar el pedido."
      );
    }

    const total = body.status === "cancelado"
      ? null
      : deliveryFee === null
        ? null
        : order.subtotal + deliveryFee;

    await env.DB.prepare(`
      UPDATE orders
      SET status = ?,
          delivery_fee = ?,
          total = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      body.status,
      deliveryFee,
      total,
      body.id
    ).run();

    return Response.json({
      success: true,
      message: "Pedido actualizado correctamente."
    });

  } catch (error) {
    return jsonError("No se pudo actualizar el pedido.", 500);
  }
}
