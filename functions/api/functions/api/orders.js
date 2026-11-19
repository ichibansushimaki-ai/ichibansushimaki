
async function authorized(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "");
  return !!token && token === env.ADMIN_TOKEN;
}

export async function onRequestGet({ request, env }) {
  if (!await authorized(request, env)) {
    return new Response("No autorizado", { status: 401 });
  }

  const { results } = await env.DB.prepare(`
    SELECT *
    FROM orders
    ORDER BY created_at DESC
  `).all();

  return Response.json(results.map(order => ({
    ...order,
    items: JSON.parse(order.items_json || "[]")
  })));
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    if (!body.items || !Array.isArray(body.items) || !body.items.length) {
      return Response.json(
        { error: "El pedido no contiene productos." },
        { status: 400 }
      );
    }

    if (!["delivery", "pickup"].includes(body.fulfillment_method)) {
      return Response.json(
        { error: "Modalidad de entrega no válida." },
        { status: 400 }
      );
    }

    const subtotal = Number(body.subtotal);

    if (!Number.isSafeInteger(subtotal) || subtotal < 0) {
      return Response.json(
        { error: "Subtotal no válido." },
        { status: 400 }
      );
    }

    if (body.fulfillment_method === "delivery" &&
        (!body.address || !String(body.address).trim())) {
      return Response.json(
        { error: "La dirección es obligatoria para delivery." },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO orders (
        id,
        fulfillment_method,
        address,
        reference,
        items_json,
        subtotal,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, 'pendiente')
    `).bind(
      id,
      body.fulfillment_method,
      body.address || null,
      body.reference || null,
      JSON.stringify(body.items),
      subtotal
    ).run();

    return Response.json({
      success: true,
      id,
      message: "Pedido registrado correctamente."
    });

  } catch (error) {
    return Response.json(
      { error: "No se pudo registrar el pedido." },
      { status: 500 }
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
      return Response.json(
        { error: "Pedido o estado no válido." },
        { status: 400 }
      );
    }

    const order = await env.DB.prepare(`
      SELECT id, fulfillment_method, subtotal
      FROM orders
      WHERE id = ?
    `).bind(body.id).first();

    if (!order) {
      return Response.json(
        { error: "Pedido no encontrado." },
        { status: 404 }
      );
    }

    const deliveryFee = body.delivery_fee === undefined
      ? null
      : Number(body.delivery_fee);

    if (deliveryFee !== null &&
        (!Number.isSafeInteger(deliveryFee) || deliveryFee < 0)) {
      return Response.json(
        { error: "Costo de delivery no válido." },
        { status: 400 }
      );
    }

    if (order.fulfillment_method === "pickup" && deliveryFee !== null && deliveryFee !== 0) {
      return Response.json(
        { error: "El retiro en local no tiene costo de delivery." },
        { status: 400 }
      );
    }

    const total = body.status === "cancelado"
      ? null
      : order.subtotal + (deliveryFee || 0);

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
    return Response.json(
      { error: "No se pudo actualizar el pedido." },
      { status: 500 }
    );
  }
}
