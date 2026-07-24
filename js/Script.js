/* ================= Product data ================= */
const categories = ['Clothing','Footwear','Electronics','Accessories','Home & Living'];

const products = [
  {id:1,  name:'Linen Overshirt',            cat:'Clothing',      price:1899, old:2399, rating:4.5, img:'linen-shirt-01'},
  {id:2,  name:'Relaxed Denim Jeans',        cat:'Clothing',      price:2199, old:null, rating:4.2, img:'denim-jeans-02'},
  {id:3,  name:'Everyday Cotton Tee',        cat:'Clothing',      price:599,  old:null, rating:4.6, img:'cotton-tee-03'},
  {id:4,  name:'Wool Blend Blazer',          cat:'Clothing',      price:4599, old:5999, rating:4.7, img:'wool-blazer-04'},
  {id:5,  name:'Canvas Sneakers',            cat:'Footwear',      price:1799, old:null, rating:4.4, img:'canvas-sneakers-05'},
  {id:6,  name:'Leather Loafers',            cat:'Footwear',      price:3299, old:3999, rating:4.5, img:'leather-loafers-06'},
  {id:7,  name:'Trail Running Shoes',        cat:'Footwear',      price:2899, old:null, rating:4.3, img:'trail-shoes-07'},
  {id:8,  name:'Suede Ankle Boots',          cat:'Footwear',      price:3599, old:null, rating:4.6, img:'ankle-boots-08'},
  {id:9,  name:'Wireless Earbuds',           cat:'Electronics',   price:2499, old:3499, rating:4.3, img:'earbuds-09'},
  {id:10, name:'Smart Fitness Band',         cat:'Electronics',   price:1999, old:null, rating:4.1, img:'fitness-band-10'},
  {id:11, name:'Portable Bluetooth Speaker', cat:'Electronics',   price:1599, old:null, rating:4.4, img:'bt-speaker-11'},
  {id:12, name:'Fast Charging Power Bank',   cat:'Electronics',   price:1299, old:null, rating:4.2, img:'power-bank-12'},
  {id:13, name:'Leather Wallet',             cat:'Accessories',   price:899,  old:null, rating:4.5, img:'leather-wallet-13'},
  {id:14, name:'Aviator Sunglasses',         cat:'Accessories',   price:1099, old:1499, rating:4.4, img:'sunglasses-14'},
  {id:15, name:'Canvas Tote Bag',            cat:'Accessories',   price:799,  old:null, rating:4.6, img:'tote-bag-15'},
  {id:16, name:'Ceramic Table Lamp',         cat:'Home & Living', price:1699, old:null, rating:4.3, img:'table-lamp-16'},
  {id:17, name:'Woven Storage Basket',       cat:'Home & Living', price:999,  old:null, rating:4.5, img:'storage-basket-17'},
  {id:18, name:'Scented Soy Candle Set',     cat:'Home & Living', price:699,  old:899,  rating:4.7, img:'soy-candle-18'},
];

const coupons = {
  'SAVE10':    {type:'percent', value:10,  minOrder:0,   label:'10% off'},
  'FLAT200':   {type:'flat',    value:200, minOrder:999, label:'₹200 off'},
  'WELCOME50': {type:'flat',    value:50,  minOrder:0,   label:'₹50 off'},
};

/* ================= State ================= */
let cart = [];              // {productId, qty}
let wishlist = new Set();
let orders = [];
let appliedCoupon = null;   // {code, ...couponData}
let nextOrderNum = 1029;

let filters = { search:'', cats: new Set(), maxPrice: 6000, sort:'featured' };
let currentView = 'shop';

const productById = (id) => products.find(p=>p.id===id);
const imgUrl = (seed) => `https://picsum.photos/seed/${seed}/500/500`;

/* ================= DOM refs ================= */
const productGrid = document.getElementById('productGrid');
const wishlistGrid = document.getElementById('wishlistGrid');
const categoryFilters = document.getElementById('categoryFilters');
const priceRange = document.getElementById('priceRange');
const maxPriceLabel = document.getElementById('maxPriceLabel');
const resultsCount = document.getElementById('resultsCount');
const sortSelect = document.getElementById('sortSelect');
const noResults = document.getElementById('noResults');
const searchInput = document.getElementById('searchInput');

const cartBadge = document.getElementById('cartBadge');
const wishlistBadge = document.getElementById('wishlistBadge');
const cartItemsEl = document.getElementById('cartItems');
const drawerTotals = document.getElementById('drawerTotals');
const cartDrawer = document.getElementById('cartDrawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const couponInput = document.getElementById('couponInput');
const couponMsg = document.getElementById('couponMsg');
const checkoutBtn = document.getElementById('checkoutBtn');

const checkoutItemsEl = document.getElementById('checkoutItems');
const checkoutTotals = document.getElementById('checkoutTotals');
const checkoutForm = document.getElementById('checkoutForm');
const ordersList = document.getElementById('ordersList');
const toastContainer = document.getElementById('toastContainer');

const money = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

/* ================= View switching ================= */
function switchView(view){
  currentView = view;
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+view).classList.add('active');
  document.querySelectorAll('.nav-link').forEach(n=>n.classList.toggle('active', n.dataset.view===view));
  window.scrollTo({top:0, behavior:'smooth'});
  if(view==='wishlist') renderWishlist();
  if(view==='checkout') renderCheckout();
  if(view==='orders') renderOrders();
}
document.querySelectorAll('[data-view]').forEach(el=>{
  el.addEventListener('click', ()=> switchView(el.dataset.view));
});

/* ================= Filters setup ================= */
function buildCategoryFilters(){
  categoryFilters.innerHTML = categories.map(c=>`
    <label><input type="checkbox" value="${c}" class="cat-check"> ${c}</label>
  `).join('');
  categoryFilters.querySelectorAll('.cat-check').forEach(cb=>{
    cb.addEventListener('change', ()=>{
      cb.checked ? filters.cats.add(cb.value) : filters.cats.delete(cb.value);
      renderProducts();
    });
  });
}
buildCategoryFilters();

priceRange.value = filters.maxPrice;
maxPriceLabel.textContent = money(filters.maxPrice);
priceRange.addEventListener('input', ()=>{
  filters.maxPrice = parseInt(priceRange.value,10);
  maxPriceLabel.textContent = money(filters.maxPrice);
  renderProducts();
});
sortSelect.addEventListener('change', ()=>{ filters.sort = sortSelect.value; renderProducts(); });
searchInput.addEventListener('input', ()=>{ filters.search = searchInput.value.trim().toLowerCase(); renderProducts(); });
document.getElementById('clearFiltersBtn').addEventListener('click', ()=>{
  filters = { search:'', cats:new Set(), maxPrice:6000, sort:'featured' };
  searchInput.value=''; priceRange.value=6000; maxPriceLabel.textContent=money(6000); sortSelect.value='featured';
  categoryFilters.querySelectorAll('.cat-check').forEach(cb=>cb.checked=false);
  renderProducts();
});

/* ================= Rendering: products ================= */
function getFilteredProducts(){
  let list = products.filter(p=>{
    if(filters.search && !p.name.toLowerCase().includes(filters.search) && !p.cat.toLowerCase().includes(filters.search)) return false;
    if(filters.cats.size>0 && !filters.cats.has(p.cat)) return false;
    if(p.price > filters.maxPrice) return false;
    return true;
  });
  if(filters.sort==='price-asc') list.sort((a,b)=>a.price-b.price);
  else if(filters.sort==='price-desc') list.sort((a,b)=>b.price-a.price);
  else if(filters.sort==='rating') list.sort((a,b)=>b.rating-a.rating);
  return list;
}

function starRow(rating){
  return `★ ${rating.toFixed(1)} <span>(${Math.round(rating*23)} reviews)</span>`;
}

function productCard(p){
  const inWishlist = wishlist.has(p.id);
  return `
    <div class="product-card" data-id="${p.id}">
      <div class="product-media">
        <img src="${imgUrl(p.img)}" alt="${p.name}" loading="lazy">
        ${p.old ? '<span class="sale-ribbon">SALE</span>' : ''}
        <button class="wishlist-heart ${inWishlist?'active':''}" data-wish="${p.id}" aria-label="Toggle wishlist">
          <svg viewBox="0 0 24 24" fill="${inWishlist?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M12 21s-7.5-4.6-10-9.2C.4 8.4 2.2 4.8 5.7 4.2c2-.3 3.9.7 5.3 2.6 1.4-1.9 3.3-2.9 5.3-2.6 3.5.6 5.3 4.2 3.7 7.6C19.5 16.4 12 21 12 21z"/></svg>
        </button>
      </div>
      <div class="product-body">
        <span class="product-cat">${p.cat}</span>
        <span class="product-name">${p.name}</span>
        <span class="product-rating">${starRow(p.rating)}</span>
        <div class="product-price-row">
          <span class="product-price">${money(p.price)}</span>
          ${p.old ? `<span class="product-price-old">${money(p.old)}</span>` : ''}
        </div>
        <button class="btn btn-primary add-cart-btn" data-add="${p.id}">Add to Cart</button>
      </div>
    </div>
  `;
}

function renderProducts(){
  const list = getFilteredProducts();
  resultsCount.textContent = `${list.length} product${list.length!==1?'s':''}`;
  productGrid.innerHTML = list.map(productCard).join('');
  noResults.style.display = list.length===0 ? 'block' : 'none';
  productGrid.style.display = list.length===0 ? 'none' : 'grid';
  bindGridEvents(productGrid);
}

function renderWishlist(){
  const list = products.filter(p=>wishlist.has(p.id));
  if(list.length===0){
    wishlistGrid.innerHTML = '<p class="empty-state">Your wishlist is empty — tap the heart on any product to save it here.</p>';
    return;
  }
  wishlistGrid.innerHTML = list.map(productCard).join('');
  bindGridEvents(wishlistGrid);
}

function bindGridEvents(container){
  container.querySelectorAll('[data-wish]').forEach(btn=>{
    btn.addEventListener('click', ()=> toggleWishlist(parseInt(btn.dataset.wish,10)));
  });
  container.querySelectorAll('[data-add]').forEach(btn=>{
    btn.addEventListener('click', ()=> addToCart(parseInt(btn.dataset.add,10)));
  });
}

/* ================= Wishlist ================= */
function toggleWishlist(id){
  const p = productById(id);
  if(wishlist.has(id)){ wishlist.delete(id); showToast(`Removed ${p.name} from wishlist`); }
  else { wishlist.add(id); showToast(`Added ${p.name} to wishlist`); }
  wishlistBadge.textContent = wishlist.size;
  renderProducts();
  if(currentView==='wishlist') renderWishlist();
}

/* ================= Cart ================= */
function addToCart(id){
  const item = cart.find(c=>c.productId===id);
  if(item) item.qty++;
  else cart.push({productId:id, qty:1});
  showToast(`Added ${productById(id).name} to cart`);
  renderCartCount();
  renderCartDrawer();
}
function changeQty(id, delta){
  const item = cart.find(c=>c.productId===id);
  if(!item) return;
  item.qty += delta;
  if(item.qty<=0) cart = cart.filter(c=>c.productId!==id);
  renderCartCount();
  renderCartDrawer();
}
function removeFromCart(id){
  cart = cart.filter(c=>c.productId!==id);
  renderCartCount();
  renderCartDrawer();
}
function renderCartCount(){
  cartBadge.textContent = cart.reduce((s,c)=>s+c.qty,0);
}

function calcTotals(){
  const subtotal = cart.reduce((s,c)=> s + productById(c.productId).price * c.qty, 0);
  let discount = 0;
  if(appliedCoupon && subtotal >= appliedCoupon.minOrder){
    discount = appliedCoupon.type==='percent' ? subtotal * appliedCoupon.value/100 : appliedCoupon.value;
    discount = Math.min(discount, subtotal);
  }
  const shipping = subtotal>0 && subtotal < 999 ? 79 : 0;
  const total = Math.max(subtotal - discount + shipping, 0);
  return { subtotal, discount, shipping, total };
}

function cartLineHTML(c){
  const p = productById(c.productId);
  return `
    <div class="cart-item">
      <img src="${imgUrl(p.img)}" alt="${p.name}">
      <div>
        <div class="ci-name">${p.name}</div>
        <div class="ci-meta">${money(p.price)} each</div>
        <div class="qty-stepper">
          <button data-qty-minus="${p.id}">−</button>
          <span>${c.qty}</span>
          <button data-qty-plus="${p.id}">+</button>
        </div>
      </div>
      <span class="ci-amt">${money(p.price*c.qty)}</span>
      <button class="remove-item" data-remove="${p.id}" title="Remove">✕</button>
    </div>
  `;
}

function renderCartDrawer(){
  if(cart.length===0){
    cartItemsEl.innerHTML = '<p class="empty-state">Your cart is empty.</p>';
  } else {
    cartItemsEl.innerHTML = cart.map(cartLineHTML).join('');
  }
  const t = calcTotals();
  drawerTotals.innerHTML = `
    <div class="row"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
    ${t.discount>0 ? `<div class="row discount-row"><span>Coupon (${appliedCoupon.code})</span><span>-${money(t.discount)}</span></div>` : ''}
    <div class="row"><span>Shipping</span><span>${t.shipping>0?money(t.shipping):'Free'}</span></div>
    <div class="row grand"><span>Total</span><span>${money(t.total)}</span></div>
  `;
  checkoutBtn.disabled = cart.length===0;

  cartItemsEl.querySelectorAll('[data-qty-plus]').forEach(b=>b.addEventListener('click',()=>changeQty(parseInt(b.dataset.qtyPlus,10),1)));
  cartItemsEl.querySelectorAll('[data-qty-minus]').forEach(b=>b.addEventListener('click',()=>changeQty(parseInt(b.dataset.qtyMinus,10),-1)));
  cartItemsEl.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>removeFromCart(parseInt(b.dataset.remove,10))));
}

/* ---- Coupon ---- */
document.getElementById('applyCouponBtn').addEventListener('click', ()=>{
  const code = couponInput.value.trim().toUpperCase();
  if(!code) return;
  const c = coupons[code];
  const { subtotal } = calcTotals();
  if(!c){
    couponMsg.textContent = 'Invalid coupon code.';
    couponMsg.className = 'coupon-msg error';
    return;
  }
  if(subtotal < c.minOrder){
    couponMsg.textContent = `Add items worth ${money(c.minOrder)} or more to use this code.`;
    couponMsg.className = 'coupon-msg error';
    return;
  }
  appliedCoupon = { code, ...c };
  couponMsg.textContent = `"${code}" applied — ${c.label}.`;
  couponMsg.className = 'coupon-msg success';
  renderCartDrawer();
});

/* ---- Drawer open/close ---- */
function openCart(){ cartDrawer.classList.add('open'); drawerOverlay.classList.add('open'); }
function closeCart(){ cartDrawer.classList.remove('open'); drawerOverlay.classList.remove('open'); }
document.getElementById('cartBtn').addEventListener('click', openCart);
document.getElementById('closeCartBtn').addEventListener('click', closeCart);
drawerOverlay.addEventListener('click', closeCart);
checkoutBtn.addEventListener('click', ()=>{
  if(cart.length===0) return;
  closeCart();
  switchView('checkout');
});

/* ================= Checkout ================= */
function renderCheckout(){
  checkoutItemsEl.innerHTML = cart.map(c=>{
    const p = productById(c.productId);
    return `
      <div class="receipt-line">
        <img src="${imgUrl(p.img)}" alt="${p.name}">
        <div>
          <div class="ri-name">${p.name}</div>
          <div class="ri-meta">Qty ${c.qty} × ${money(p.price)}</div>
        </div>
        <span class="ri-amt">${money(p.price*c.qty)}</span>
      </div>
    `;
  }).join('') || '<p class="empty-state">No items yet.</p>';

  const t = calcTotals();
  checkoutTotals.innerHTML = `
    <div class="row"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
    ${t.discount>0 ? `<div class="row discount-row"><span>Coupon (${appliedCoupon.code})</span><span>-${money(t.discount)}</span></div>` : ''}
    <div class="row"><span>Shipping</span><span>${t.shipping>0?money(t.shipping):'Free'}</span></div>
    <div class="row grand"><span>Total</span><span>${money(t.total)}</span></div>
  `;
}

checkoutForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  if(cart.length===0) return;
  const t = calcTotals();
  const payment = checkoutForm.querySelector('input[name="payment"]:checked').value;
  const order = {
    id: 'DKN-' + (nextOrderNum++),
    date: new Date(),
    items: cart.map(c=>({ ...productById(c.productId), qty:c.qty })),
    totals: t,
    payment,
    status: 'Placed',
    address: {
      name: document.getElementById('custName').value,
      city: document.getElementById('custCity').value,
      pin: document.getElementById('custPin').value,
    }
  };
  orders.unshift(order);
  cart = [];
  appliedCoupon = null;
  couponInput.value = '';
  couponMsg.textContent = '';
  renderCartCount();
  renderCartDrawer();
  checkoutForm.reset();
  showToast(`Order ${order.id} placed successfully!`);
  switchView('orders');
});

/* ================= Orders ================= */
function renderOrders(){
  if(orders.length===0){
    ordersList.innerHTML = '<p class="empty-state">No orders yet — your placed orders will show up here.</p>';
    return;
  }
  ordersList.innerHTML = orders.map(o=>`
    <div class="order-card">
      <div class="order-card-top">
        <div>
          <div class="order-id">#${o.id}</div>
          <div class="order-date">${o.date.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})} · ${o.payment}</div>
        </div>
        <span class="status-badge">${o.status}</span>
      </div>
      <div class="order-items-mini">
        ${o.items.map(it=>`<div class="oi-row"><span>${it.name} × ${it.qty}</span><span>${money(it.price*it.qty)}</span></div>`).join('')}
      </div>
      <div class="order-total-row"><span>Total paid</span><span>${money(o.totals.total)}</span></div>
    </div>
  `).join('');
}

/* ================= Toasts ================= */
function showToast(msg){
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  toastContainer.appendChild(t);
  setTimeout(()=> t.remove(), 2400);
}

/* ================= Theme toggle ================= */
const sunIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8"/></svg>`;
const moonIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/></svg>`;
const themeToggle = document.getElementById('themeToggle');
function applyTheme(dark){
  document.documentElement.classList.toggle('dark', dark);
  themeToggle.innerHTML = dark ? sunIcon : moonIcon;
}
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(prefersDark);
themeToggle.addEventListener('click', ()=> applyTheme(!document.documentElement.classList.contains('dark')));

/* ================= Init ================= */
renderProducts();
renderCartDrawer();