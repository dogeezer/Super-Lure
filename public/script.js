/* -------------------------
   CART (from localStorage)
   ------------------------- */
let cart = JSON.parse(localStorage.getItem('cart')) || [];

/* -------------------------
   CONFIG: shipping & tax
   ------------------------- */
const SHIPPING_PER_ITEM = 1.28;
const DEFAULT_COUNTRY_TAX = 0.10;
const countryTaxRates = { "CA":0.0,"US":0.0,"GB":0.20,"FR":0.20,"DE":0.19,"IT":0.22,"ES":0.21,"AU":0.10,"JP":0.10,"IN":0.18,"CN":0.13,"BR":0.12,"MX":0.16,"RU":0.20,"ZA":0.15,"NZ":0.15,"CH":0.077 };
const subdivisions = {
  "CA": {"ON":{name:"Ontario",tax:0.13},"QC":{name:"Quebec",tax:0.14975},"BC":{name:"British Columbia",tax:0.12},"AB":{name:"Alberta",tax:0.05}},
  "US": {"CA":{name:"California",tax:0.0725},"NY":{name:"New York",tax:0.04},"TX":{name:"Texas",tax:0.0625}}
};

/* -------------------------
   DOM refs
   ------------------------- */
const cartSummaryEl = document.getElementById('cart-summary');
const cartSummary2El = document.getElementById('cart-summary-2');
const countryEl = document.getElementById('country');
const subdivisionEl = document.getElementById('subdivision');
const countryCodeEl = document.getElementById('country_code');

/* -------------------------
   Populate countries
   ------------------------- */
const countryOptions = [
  { iso:"CA", name:"Canada (+1)", dial:"+1" },
  { iso:"US", name:"United States (+1)", dial:"+1" },
  { iso:"GB", name:"United Kingdom (+44)", dial:"+44" },
  { iso:"FR", name:"France (+33)", dial:"+33" },
  { iso:"DE", name:"Germany (+49)", dial:"+49" },
  { iso:"IT", name:"Italy (+39)", dial:"+39" }
];

function populateCountries() {
  countryOptions.forEach(co=>{
    const opt = document.createElement('option');
    opt.value = co.iso;
    opt.dataset.dial = co.dial;
    opt.textContent = co.name;
    countryEl.appendChild(opt);
  });
  countryOptions.forEach(co=>{
    const opt = document.createElement('option');
    opt.value = co.dial;
    opt.textContent = co.name;
    countryCodeEl.appendChild(opt);
  });
  countryEl.value='CA'; countryCodeEl.value='+1';
}
populateCountries();

function populateSubdivisions(countryIso) {
  subdivisionEl.innerHTML='';
  if (!countryIso){ subdivisionEl.innerHTML='<option value="">-- Select country first --</option>'; return;}
  if (subdivisions[countryIso]){
    const map=subdivisions[countryIso];
    const empty=document.createElement('option'); empty.value=''; empty.textContent='-- Select state/province --';
    subdivisionEl.appendChild(empty);
    Object.keys(map).forEach(code=>{
      const o=document.createElement('option'); o.value=code; o.textContent=map[code].name + ` (${(map[code].tax*100).toFixed(2)}%)`; subdivisionEl.appendChild(o);
    });
    subdivisionEl.disabled=false;
  } else { const o=document.createElement('option'); o.value='__none'; o.textContent='No state/province'; subdivisionEl.appendChild(o); subdivisionEl.disabled=true;}
}

/* -------------------------
   Cart rendering
   ------------------------- */
function totalQuantity(){ return cart.reduce((s,i)=>s+(i.qty||0),0);}
function calcSubtotal(){ return cart.reduce((s,i)=>s+(i.price*i.qty),0);}
function calcShipping(){ return SHIPPING_PER_ITEM*totalQuantity();}
function getSelectedTaxRate(){ const countryIso=countryEl.value; const sub=subdivisionEl.value; if(subdivisions[countryIso]&&subdivisions[countryIso][sub]) return subdivisions[countryIso][sub].tax||0; if(countryTaxRates[countryIso]) return countryTaxRates[countryIso]; return DEFAULT_COUNTRY_TAX;}
function renderCart(el){
  const target=(typeof el==='string')?document.getElementById(el):el;
  target.innerHTML='';
  if(!cart||cart.length===0){target.innerHTML="<p>Your cart is empty.</p>"; return;}
  cart.forEach(item=>{
    const div=document.createElement('div'); div.className='cart-item';
    const name=document.createElement('div'); name.textContent=`${item.name} x ${item.qty}`;
    const price=document.createElement('div'); price.textContent=`$${(item.price*item.qty).toFixed(2)} CAD`;
    div.appendChild(name); div.appendChild(price); target.appendChild(div);
  });
  const subtotal=calcSubtotal(), shipping=calcShipping(), taxRate=getSelectedTaxRate(), tax=subtotal*taxRate, total=subtotal+shipping+tax;
  const lines=[{label:'Subtotal',value:subtotal},{label:`Shipping (${totalQuantity()}×$${SHIPPING_PER_ITEM.toFixed(2)})`,value:shipping},{label:`Tax (${(taxRate*100).toFixed(2)}%)`,value:tax}];
  lines.forEach(l=>{ const ln=document.createElement('div'); ln.className='summary-line'; ln.innerHTML=`<div class="small">${l.label}</div><div class="small">$${l.value.toFixed(2)} CAD</div>`; target.appendChild(ln); });
  const totalDiv=document.createElement('div'); totalDiv.className='summary-total'; totalDiv.innerHTML=`<div class="summary-line"><div>Total</div