let products = [];

document.getElementById('csv-upload')?.addEventListener('change', function(e){
    const file = e.target.files[0];
    if(!file) return;

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results){
            products = convertWooCSVtoJSON(results.data);
            renderProducts();
        }
    });
});

function convertWooCSVtoJSON(rows){
    return rows.map((row,index)=>{
        const categories = row.Categories ? row.Categories.split(',').map(c=>c.trim()) : [];
        const images = row.Images ? row.Images.split(',').map(i=>i.trim()) : [];
        const variations = [];

        if(row.Attributes){
            const attrs = row.Attributes.split(';');
            attrs.forEach(attr => {
                const [name, options] = attr.split(':');
                if(name && options){
                    variations.push({
                        attribute: name.trim(),
                        options: options.split('|').map(o=>o.trim())
                    });
                }
            });
        }

        return {
            id: index+1,
            name: row.Name || "Product "+(index+1),
            sku: row.SKU || "",
            description: row.Description || "",
            categories: categories,
            images: images,
            videos: row.Videos ? row.Videos.split(',').map(v=>v.trim()) : [],
            variations: variations,
            price: parseFloat(row.Price) || 0,
            stock: parseInt(row.Stock) || 0
        };
    });
}

// Render products with carousel
function renderProducts(){
    const container = document.getElementById('products-container');
    if(!container) return;

    container.innerHTML = '';
    products.forEach(product=>{
        const card = document.createElement('div');
        card.className='product-card';

        // Combine images and videos
        const media = [...product.images, ...product.videos];

        let carouselHTML = '<div class="image-carousel">';
        media.forEach(src=>{
            if(src.endsWith('.mp4')){
                carouselHTML += `<video class="carousel-item" controls><source src="${src}" type="video/mp4"></video>`;
            } else {
                carouselHTML += `<img class="carousel-item" src="${src}" alt="${product.name}">`;
            }
        });
        carouselHTML += '</div>';

        // Dots
        carouselHTML += `<div class="carousel-dots">${media.map((_,i)=>`<span data-index="${i}"></span>`).join('')}</div>`;

        // Variations
        const variationsHTML = product.variations.map(v=>{
            const options = v.options.map(opt=>`<option value="${opt}">${opt}</option>`).join('');
            return `<label>${v.attribute}: <select data-attr="${v.attribute}">${options}</select></label>`;
        }).join('<br>');

        card.innerHTML = `
            ${carouselHTML}
            <h3 title="${product.name}">${product.name}</h3>
            ${variationsHTML}<br>
            <p class="price">Rs ${product.price.toFixed(0)}</p>
            <button onclick="addToCart(${product.id})">Add to Cart</button>
        `;
        container.appendChild(card);

        setupCarousel(card);
    });
}

// Setup swipeable carousel with dots
function setupCarousel(card){
    const carousel = card.querySelector('.image-carousel');
    const dots = card.querySelectorAll('.carousel-dots span');
    if(!carousel || dots.length===0) return;

    const updateDots = ()=>{
        const index = Math.round(carousel.scrollLeft / carousel.clientWidth);
        dots.forEach(d=>d.classList.remove('active'));
        if(dots[index]) dots[index].classList.add('active');
    };

    carousel.addEventListener('scroll', updateDots);
    updateDots();

    // Click dots
    dots.forEach((dot,i)=>{
        dot.addEventListener('click', ()=>{ carousel.scrollLeft = i * carousel.clientWidth; });
    });
}

// Cart functions
function getCart(){ return JSON.parse(localStorage.getItem('cart') || '[]'); }
function saveCart(cart){ localStorage.setItem('cart', JSON.stringify(cart)); updateCartCount(); }
function addToCart(productId){ 
    const cart = getCart();
    const existing = cart.find(i=>i.id===productId);
    if(existing){ existing.quantity+=1; } else { cart.push({id:productId, quantity:1}); }
    saveCart(cart);
    alert('Added to cart!');
}
function clearCart(){ localStorage.removeItem('cart'); updateCartCount(); loadCart(); }
function updateCartCount(){ 
    const countEl = document.getElementById('cart-count');
    if(!countEl) return;
    const cart = getCart();
    const total = cart.reduce((sum,i)=>sum+i.quantity,0);
    countEl.textContent = total;
}
async function loadCart(){
    const container = document.getElementById('cart-container');
    if(!container) return;
    const cart = getCart();
    container.innerHTML='';
    let totalPrice=0;
    cart.forEach(item=>{
        const product = products.find(p=>p.id===item.id);
        if(!product) return;
        const price = product.price*item.quantity;
        totalPrice+=price;
        const div = document.createElement('div');
        div.className='product-card';
        div.innerHTML = `<h3>${product.name}</h3><p>Qty: ${item.quantity}</p><p>Price: Rs ${price.toFixed(0)}</p>`;
        container.appendChild(div);
    });
    document.getElementById('cart-total').textContent=totalPrice.toFixed(0);
}

// Initialize
updateCartCount();
loadCart();
