export async function onRequestPost({ request, env }) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "");

  if (!token || token !== env.ADMIN_TOKEN) {
    return new Response("No autorizado", { status: 401 });
  }

  if (!env.IMAGENES) {
    return new Response("Almacenamiento R2 no configurado", { status: 500 });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!file || typeof file === "string") {
    return new Response("Falta seleccionar una imagen", { status: 400 });
  }

  const types = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
  };

  const ext = types[file.type];

  if (!ext) {
    return new Response("Formato no permitido. Usa JPG, PNG o WebP.", { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return new Response("La imagen supera el límite de 5 MB", { status: 400 });
  }

  const key = `${crypto.randomUUID()}.${ext}`;

  await env.IMAGENES.put(key, file.stream(), {
    httpMetadata: { contentType: file.type }
  });

  // Preview usa su propia URL pública; producción conserva la dirección actual.
  const publicBase = (
    env.IMAGENES_PUBLIC_URL || "https://imagenes.ichibansushimaki.com"
  ).replace(/\/+$/, "");

  return Response.json({
    ok: true,
    url: `${publicBase}/${key}`
  });
}
