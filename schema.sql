CREATE TABLE IF NOT EXISTS products (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 category TEXT NOT NULL,
 description TEXT DEFAULT '',
 price INTEGER NOT NULL DEFAULT 0,
 image TEXT DEFAULT '',
 available INTEGER NOT NULL DEFAULT 1,
 featured INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO products(id,name,category,description,price,image,available,featured) VALUES
('golden-ichiban','Golden Ichiban','Rolls Signature','Producto insignia de la casa. Actualiza esta descripción.',7990,'',1,1),
('california','California Ichiban','Rolls clásicos','Una combinación clásica para disfrutar.',5990,'',1,0),
('crispy-rice','Crispy Rice','Street Food','Bocados de arroz crocante con topping especial.',5990,'',1,1),
('loaded-fries','Loaded Fries','Street Food','Papas con topping y salsas de la casa.',5490,'',1,1),
('gohan-chicken','Gohan Chicken','Gohan','Bowl de arroz con pollo y acompañamientos.',6490,'',1,0);