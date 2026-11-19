
export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(`
    SELECT
      id,
      name,
      category,
      description,
      price,
      image,
      available,
      featured,
      product_type,
      options
    FROM products
    ORDER BY category, name
  `).all();

  return Response.json(
    results.map(p => {
      let options = {};

      try {
        options = JSON.parse(p.options || "{}");
      } catch {
        options = {};
      }

      return {
        ...p,
        available: !!p.available,
        featured: !!p.featured,
        product_type: p.product_type || "other",
        options
      };
    })
  );
}

export async function onRequestPost({ request, env }) {
  if (!await authorized(request, env)) {
    return new Response("No autorizado", { status: 401 });
  }

  let p;

  try {
    p = await request.json();
  } catch {
    return new Response("Datos inválidos", { status: 400 });
  }

  if (
    !p.name ||
    !p.category ||
    !Number.isFinite(Number(p.price)) ||
    Number(p.price) < 0
  ) {
    return new Response("Datos inválidos", { status: 400 });
  }

  const id = p.id || crypto.randomUUID();

  const productType = String(p.product_type || "other");

  let options;

  try {
    options = typeof p.options === "string"
      ? JSON.parse(p.options || "{}")
      : (p.options || {});

    if (
      options === null ||
      Array.isArray(options) ||
      typeof options !== "object"
    ) {
      return new Response("Opciones inválidas", { status: 400 });
    }
  } catch {
    return new Response("Formato de opciones inválido", { status: 400 });
  }

  await env.DB.prepare(`
    INSERT INTO products (
      id,
      name,
      category,
      description,
      price,
      image,
      available,
      featured,
      product_type,
      options
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      description = excluded.description,
      price = excluded.price,
      image = excluded.image,
      available = excluded.available,
      featured = excluded.featured,
      product_type = excluded.product_type,
      options = excluded.options
  `).bind(
    id,
    String(p.name),
    String(p.category),
    String(p.description || ""),
    Number(p.price),
    String(p.image || ""),
    p.available ? 1 : 0,
    p.featured ? 1 : 0,
    productType,
    JSON.stringify(options)
  ).run();

  return Response.json({ ok: true, id });
}

export async function onRequestDelete({ request, env, params }) {
  if (!await authorized(request, env)) {
    return new Response("No autorizado", { status: 401 });
  }

  await env.DB.prepare(
    "DELETE FROM products WHERE id = ?"
  ).bind(params.id).run();

  return Response.json({ ok: true });
}

async function authorized(req, env) {
  const h = req.headers.get("Authorization") || "";
  const token = h.replace("Bearer ", "");

  if (!token || !env.ADMIN_TOKEN) return false;

  const a = new TextEncoder().encode(token);
  const b = new TextEncoder().encode(env.ADMIN_TOKEN);

  if (a.length !== b.length) return false;

  let x = 0;

  for (let i = 0; i < a.length; i++) {
    x |= a[i] ^ b[i];
  }

  return x === 0;
}
