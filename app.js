const PHONE="56900000000"; // REEMPLAZAR por WhatsApp real, sin + ni espacios
const money=n=>"$"+Number(n||0).toLocaleString("es-CL");
let products=[],category="Todos";
const sample=[
{id:"p1",name:"Golden Ichiban",category:"Rolls Signature",description:"Nuestra preparación especial de la casa.",price:7990,image:"",available:true,featured:true},
{id:"p2",name:"California Ichiban",category:"Rolls clásicos",description:"Una combinación clásica para disfrutar.",price:5990,image:"",available:true,featured:false},
{id:"p3",name:"Crispy Rice",category:"Street Food",description:"Bocados de arroz crocante con topping especial.",price:5990,image:"",available:true,featured:true},
{id:"p4",name:"Gohan Chicken",category:"Gohan",description:"Bowl de arroz con pollo y acompañamientos.",price:6490,image:"",available:true,featured:false},
{id:"p5",name:"Loaded Fries",category:"Street Food",description:"Papas con topping y salsas de la casa.",price:5490,image:"",available:true,featured:true},
{id:"p6",name:"Ebi Crunch",category:"Rolls clásicos",description:"Roll de camarón con textura crocante.",price:6490,image:"",available:true,featured:false}
];
async function load(){try{const r=await fetch("/api/products");if(r.ok)products=await r.json();else throw 0}catch{products=JSON.parse(localStorage.getItem("ichiban-demo-products")||"null")||sample}render()}
function card(p){return `<article class="product"><img src="${p.image||'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800'}" alt="${p.name}"><div class="inside"><h3>${p.name}</h3><p>${p.description||""}</p><div class="price">${money(p.price)}</div></div></article>`}
function render(){const visible=products.filter(p=>p.available!==false);document.querySelector("#promoGrid").innerHTML=visible.filter(p=>p.featured).slice(0,3).map(card).join("")||"<p>Pronto anunciaremos promociones.</p>";const cats=["Todos",...new Set(visible.map(p=>p.category).filter(Boolean))];document.querySelector("#categories").innerHTML=cats.map(c=>`<button class="chip ${category===c?'active':''}" data-cat="${c}">${c}</button>`).join("");document.querySelector("#productGrid").innerHTML=visible.filter(p=>category==="Todos"||p.category===category).map(card).join("")||"<p>No hay productos disponibles en esta categoría.</p>";document.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{category=b.dataset.cat;render()});const url=`https://wa.me/${PHONE}?text=${encodeURIComponent("Hola Ichiban Sushi Maki, quiero hacer un pedido.")}`;["#whatsTop","#whatsBottom"].forEach(s=>document.querySelector(s).href=url);document.querySelector("#year").textContent=new Date().getFullYear()}
load();