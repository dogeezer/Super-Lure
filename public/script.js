let cart = JSON.parse(localStorage.getItem('cart')) || [];

/* -------------------------
   DOM refs
------------------------- */
const cartIcon=document.getElementById('cart-icon');
const cartPage=document.getElementById('cart-page');
const mainSections=document.getElementById('main-content-sections');
const backBtn=document.getElementById('back-to-shop-btn');
const cartList=document.getElementById('cart-items-list');
const cartSummaryEl=document.getElementById('cart-summary');
const proceedBtn=document.getElementById('proceed-to-checkout-btn');

/* -------------------------
   Cart functions
------------------------- */
function toggleCart(show){
  if(show===undefined) show=cartPage.style.display==='none'||cartPage.style.display===''; 
  if(show){ mainSections.style.display='none'; cartPage.style.display='block'; renderCart(); }
  else { mainSections.style.display='block'; cartPage.style.display='none'; }
}

function addToCart(product){
  const index=cart.findIndex(p=>p.name===product.name);
  if(index>-1){ cart[index].qty+=1; }
  else { cart.push({...product,qty:1}); }
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
}

function removeItem(index){ cart.splice(index,1); localStorage.setItem('cart', JSON.stringify(cart)); renderCart(); }

function calcSubtotal(){ return cart.reduce((s,i)=>s+(i.price*i.qty),0); }
function totalQuantity(){ return cart.reduce((s,i)=>s+(i.qty||0),0); }

/* -------------------------
   Canada Post API
------------------------- */
async function fetchCanadaPostRate(destinationPostal, weight=0.2, length=10, width=5, height=3){
  try {
    const res = await fetch('/shipping',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({destination_postal:destinationPostal, weight, length, width, height})
    });
    const data = await res.json();
    if(data.success && data.rates.length>0){ return parseFloat(data.rates[0].price); }
    return 1.28;
  } catch(err){
    console.error(err);
    return 1.28;
  }
}

/* -------------------------
   Render cart
------------------------- */
async function renderCart(){
  cartList.innerHTML='';
  if(!cart || cart.length===0){ cartList.innerHTML="<p>Your cart is empty.</p>"; return; }
  cart.forEach((item,index)=>{
    const div=document.createElement('div'); div.className='cart-item';
    div.innerHTML=`<div>${item.name} x ${item.qty}</div><div>$${(item.price*item.qty).toFixed(2)} CAD</div>
      <button onclick="removeItem(${index})">Remove</button>`;
    cartList.appendChild(div);
  });

  const subtotal = calcSubtotal();
  const shipping = await fetchCanadaPostRate('N0B1M0'); // Example: destination postal
  const tax = subtotal*0.13; // example 13% tax
  const total = subtotal+shipping+tax;

  cartSummaryEl.innerHTML=`<div>Subtotal: $${subtotal.toFixed(2)} CAD</div>
    <div>Shipping: $${shipping.toFixed(2)} CAD</div>
    <div>Tax: $${tax.toFixed(2)} CAD</div>
    <div><strong>Total: $${total.toFixed(2)} CAD</strong></div>`;
}

/* -------------------------
   Event listeners
------------------------- */
document.querySelectorAll('.buy-button').forEach(btn=>{
  btn.addEventListener('click',()=>{ 
    const prod=btn.closest('.product');
    addToCart({name:prod.dataset.name, price:parseFloat(prod.dataset.price), img:prod.dataset.img});
    toggleCart(true);
  });
});

cartIcon.addEventListener('click',()=>toggleCart(true));
backBtn.addEventListener('click',()=>toggleCart(false));

proceedBtn.addEventListener('click',()=>{ window.location.href='checkout.html'; });
