
export async function onRequestGet({ env }) {
  const result = await env.DB
    .prepare("SELECT * FROM store_settings WHERE id = 1")
    .first();

  return Response.json(result || {});
}

export async function onRequestPut({ request, env }) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "");

  if (!token || token !== env.ADMIN_TOKEN) {
    return new Response("No autorizado", { status: 401 });
  }

  let data;

  try {
    data = await request.json();
  } catch {
    return new Response("Datos inválidos", { status: 400 });
  }

  const fields = [
    "store_name",
    "slogan",
    "description",
    "logo",
    "mobile_logo",
    "hero_image",
    "whatsapp",
    "color_primary",
    "color_background",
    "color_cream",
    "color_gold"
  ];

  const required = ["store_name", "whatsapp"];

  for (const field of required) {
    if (!String(data[field] || "").trim()) {
      return new Response(`Falta completar ${field}`, { status: 400 });
    }
  }

  const values = fields.map(field => data[field] ?? "");

  await env.DB.prepare(`
    UPDATE store_settings SET
      store_name = ?,
      slogan = ?,
      description = ?,
      logo = ?,
      mobile_logo = ?,
      hero_image = ?,
      whatsapp = ?,
      color_primary = ?,
      color_background = ?,
      color_cream = ?,
      color_gold = ?
    WHERE id = 1
  `).bind(...values).run();

  return Response.json({ ok: true });
}
