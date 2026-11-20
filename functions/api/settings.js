
export async function onRequestGet({ env }) {
  try {
    const result = await env.DB
      .prepare("SELECT * FROM store_settings WHERE id = 1")
      .first();

    return Response.json(result || {});
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function onRequestPut({ request, env }) {
  try {
    const auth = request.headers.get("Authorization") || "";
    const token = auth.replace("Bearer ", "");

    if (!token || token !== env.ADMIN_TOKEN) {
      return Response.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const data = await request.json();

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

    if (!String(data.store_name || "").trim()) {
      return Response.json(
        { error: "Falta completar el nombre de la tienda" },
        { status: 400 }
      );
    }

    if (!String(data.whatsapp || "").trim()) {
      return Response.json(
        { error: "Falta completar whatsapp" },
        { status: 400 }
      );
    }

    let typography = "{}";

    if (data.typography !== undefined) {
      try {
        const parsed = typeof data.typography === "string"
          ? JSON.parse(data.typography)
          : data.typography;

        if (
          !parsed ||
          typeof parsed !== "object" ||
          Array.isArray(parsed)
        ) {
          throw new Error("Formato de tipografía inválido");
        }

        typography = JSON.stringify(parsed);
      } catch {
        return Response.json(
          { error: "La configuración de tipografía no es válida" },
          { status: 400 }
        );
      }
    }

    let gohanConfig = "{}";

    if (data.gohan_config !== undefined) {
      try {
        const parsed = typeof data.gohan_config === "string"
          ? JSON.parse(data.gohan_config)
          : data.gohan_config;

        if (
          !parsed ||
          typeof parsed !== "object" ||
          Array.isArray(parsed)
        ) {
          throw new Error("Formato de configuración Gohan inválido");
        }

        gohanConfig = JSON.stringify(parsed);
      } catch {
        return Response.json(
          { error: "La configuración del Gohan no es válida" },
          { status: 400 }
        );
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
        color_gold = ?,
        typography = ?,
        gohan_config = ?
      WHERE id = 1
    `).bind(...values, typography, gohanConfig).run();

    return Response.json({ ok: true });

  } catch (error) {
    return Response.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
