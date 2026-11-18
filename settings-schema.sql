
CREATE TABLE IF NOT EXISTS store_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  store_name TEXT NOT NULL DEFAULT 'Ichiban Sushi Maki',
  slogan TEXT DEFAULT 'El sabor de compartir',
  description TEXT DEFAULT 'Descubre nuestros rolls favoritos y preparaciones especiales.',
  logo TEXT DEFAULT '',
  mobile_logo TEXT DEFAULT '',
  hero_image TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '56900000000',
  color_primary TEXT DEFAULT '#b51f2b',
  color_background TEXT DEFAULT '#171717',
  color_cream TEXT DEFAULT '#f3eee5',
  color_gold TEXT DEFAULT '#c9a45c'
);

INSERT OR IGNORE INTO store_settings (id) VALUES (1);
