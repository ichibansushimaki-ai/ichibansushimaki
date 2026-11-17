# Ichiban Sushi Maki — sitio para Cloudflare Pages

Este proyecto contiene una web adaptable y un panel inicial para administrar productos. **No publiques hasta completar la configuración indicada aquí.** Los precios y descripciones incluidos son ejemplos de partida y deben revisarse.

## 1. Crear el proyecto Pages
En Cloudflare: Workers & Pages → Create → Pages → Connect to Git. Selecciona el repositorio `ichibansushimaki`.
- Framework preset: None
- Build command: dejar vacío
- Build output directory: `/` (si el panel no acepta `/`, usa `.`)
- Root directory: dejar vacío
Guarda e implementa.

## 2. Crear base de datos D1
En Cloudflare Dashboard → Storage & databases → D1 SQL Database → Create database. Nombre sugerido: `ichiban-db`.
Abre la base de datos, pestaña Console y ejecuta todo el contenido de `schema.sql`.

Luego, en el proyecto Pages → Settings → Functions → D1 database bindings:
- Variable name: `DB`
- Database: `ichiban-db`
Guarda y vuelve a implementar.

## 3. Variables secretas
En Pages → Settings → Variables and Secrets agrega:
- `ADMIN_PASSWORD`: una contraseña larga y exclusiva para el panel.
- `ADMIN_TOKEN`: una cadena aleatoria larga distinta (mínimo 32 caracteres).
Agrega ambas como secrets para Production y Preview. No las escribas en archivos del repositorio. Vuelve a implementar después de guardarlas.

## 4. Panel
Visita `https://TU-DOMINIO/admin.html`. Ingresa `ADMIN_PASSWORD`. Desde ahí puedes agregar, editar y eliminar productos. En esta primera versión las imágenes se agregan mediante URL pública https; la carga directa de archivos requiere configurar almacenamiento R2 y se puede incorporar en una siguiente iteración.

## 5. WhatsApp
En `app.js`, reemplaza `56900000000` por el número real de pedidos en formato internacional, solo números, sin `+` ni espacios.

## 6. Dominio de Namecheap
Cuando la web esté publicada, en Pages → Custom domains agrega primero `ichibansushimaki.com` y después `www.ichibansushimaki.com`. Sigue exactamente las instrucciones DNS que entregue Cloudflare. No cambies nameservers ni borres registros de correo sin revisar los registros existentes.

## Nota técnica
El panel usa un token compartido para operaciones administrativas. Es una versión inicial de administración, adecuada para una instalación privada pequeña, pero antes de manejar información sensible o pagos se recomienda añadir un sistema de identidad robusto (por ejemplo Cloudflare Access) y almacenamiento de imágenes R2. La web pública funciona sin iniciar sesión.
