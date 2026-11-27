
export async function onRequestGet({ env }) {
  try {
    const result = await env.DB
      .prepare("SELECT * FROM store_settings WHERE id = 1")
      .first();

    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS store_operation (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      hours_enabled INTEGER NOT NULL DEFAULT 1,
      manual_closed INTEGER NOT NULL DEFAULT 0,
      closed_message TEXT NOT NULL DEFAULT 'En estos momentos tenemos cerrado. Pronto volveremos a nuestro horario habitual.'
    )`).run();
    await env.DB.prepare("INSERT OR IGNORE INTO store_operation (id) VALUES (1)").run();
    const operation = await env.DB.prepare("SELECT hours_enabled, manual_closed, closed_message FROM store_operation WHERE id = 1").first();
    return Response.json({
      ...(result || {}),
      weekly_promos: result?.weekly_promos || "[]",
      store_operation: {
        hours_enabled: operation?.hours_enabled !== 0,
        manual_closed: operation?.manual_closed === 1,
        closed_message: operation?.closed_message || "En estos momentos tenemos cerrado. Pronto volveremos a nuestro horario habitual."
      }
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function onRequestPut({ request, env }) {
  try {
    await ensureHeroImagesColumn(env.DB);
    const auth = request.headers.get("Authorization") || "";
    const token = auth.replace("Bearer ", "");

    if (!token || token !== env.ADMIN_TOKEN) {
      return Response.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const data = await request.json();
    let storeOperation = null;
    if (data.store_operation !== undefined) {
      const value = data.store_operation;
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return Response.json({ error: "La configuración de horario no es válida" }, { status: 400 });
      }
      storeOperation = {
        hours_enabled: value.hours_enabled === true ? 1 : 0,
        manual_closed: value.manual_closed === true ? 1 : 0,
        closed_message: String(value.closed_message || "").trim().slice(0, 1000)
      };
      if (storeOperation.manual_closed && !storeOperation.closed_message) {
        return Response.json({ error: "Debes escribir un mensaje para el cierre manual" }, { status: 400 });
      }
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

let weeklyPromos = null;

if (data.weekly_promos !== undefined) {
  try {
    weeklyPromos = typeof data.weekly_promos === "string"
      ? JSON.parse(data.weekly_promos)
      : data.weekly_promos;

    if (!Array.isArray(weeklyPromos)) {
      throw new Error("Formato inválido");
    }
  } catch {
    return Response.json(
      { error: "La configuración de promociones semanales no es válida" },
      { status: 400 }
    );
  }
}

    const hasStoreSettings = fields.some(field => data[field] !== undefined) || data.typography !== undefined || data.gohan_config !== undefined || data.custom_roll_config !== undefined || data.weekly_promos !== undefined;

    if (hasStoreSettings && !String(data.store_name || "").trim()) {
      return Response.json(
        { error: "Falta completar el nombre de la tienda" },
        { status: 400 }
      );
    }

    if (hasStoreSettings && !String(data.whatsapp || "").trim()) {
      return Response.json(
        { error: "Falta completar whatsapp" },
        { status: 400 }
      );
    }

   let typography = null;

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

  let gohanConfig = null;

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
    let customRollConfig = null;

    if (data.custom_roll_config !== undefined) {
      try {
        const parsed = typeof data.custom_roll_config === "string"
          ? JSON.parse(data.custom_roll_config)
          : data.custom_roll_config;

        if (
          !parsed ||
          typeof parsed !== "object" ||
          Array.isArray(parsed)
        ) {
          throw new Error("Formato de configuración de roll inválido");
        }

        customRollConfig = JSON.stringify(parsed);
      } catch {
        return Response.json(
          { error: "La configuración de Arma tu Roll clásico no es válida" },
          { status: 400 }
        );
      }
    }
    const values = fields.map(field => data[field] ?? "");

    if (storeOperation !== null) {
      await env.DB.prepare(`CREATE TABLE IF NOT EXISTS store_operation (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        hours_enabled INTEGER NOT NULL DEFAULT 1,
        manual_closed INTEGER NOT NULL DEFAULT 0,
        closed_message TEXT NOT NULL DEFAULT 'En estos momentos tenemos cerrado. Pronto volveremos a nuestro horario habitual.'
      )`).run();
      await env.DB.prepare(`INSERT INTO store_operation (id, hours_enabled, manual_closed, closed_message)
        VALUES (1, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          hours_enabled = excluded.hours_enabled,
          manual_closed = excluded.manual_closed,
          closed_message = excluded.closed_message
      `).bind(storeOperation.hours_enabled, storeOperation.manual_closed, storeOperation.closed_message).run();
    }

    if (hasStoreSettings) {
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
          typography = COALESCE(?, typography),
          gohan_config = COALESCE(?, gohan_config),
          custom_roll_config = COALESCE(?, custom_roll_config),
          weekly_promos = COALESCE(?, weekly_promos)
        WHERE id = 1
      `).bind(
        ...values,
        typography,
        gohanConfig,
        customRollConfig,
        weeklyPromos === null ? null : JSON.stringify(weeklyPromos)
      ).run();
    }

    return Response.json({ ok: true });

  } catch (error) {
    return Response.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
