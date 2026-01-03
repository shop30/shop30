let products = []; // store parsed products

// CSV Upload
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

// Convert WooCommerce CSV to JSON
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

// Render products
function renderProducts(){
    const container = document.getElementById('products-container');
    if(!container) return;

    container.innerHTML = '';
    products.forEach(product=>{
        const card = document.createElement('div');
        card.className='product-card';

        const imagesHTML = product.images.map(url=>`<img src="${url}" alt="${product.name}">`).join('');
        const variationsHTML = product.variations.map(v=>{
            const options = v.options.map(opt=>`<option value="${opt}">${opt}</option>`).join('');
            return `<label>${v.attribute}: <select data-attr="${v.attribute}">${options}</select></label>`;
        }).join('<br>');
        const videosHTML = product.videos.map(url=>`<video width="200" controls><source src="${url}" type="video/mp4"></video>`).join('');

        card.innerHTML = `
            ${imagesHTML}
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p>Categories: ${product.categories.join(', ')}</p>
            ${variationsHTML}<br><br>
            <p>Price: $${product.price.toFixed(2)}</p>
            <button class="btn" onclick="addToCart(${product.id})">Add to Cart</button>
            ${videosHTML}
        `;
        container.appendChild(card);
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
        div.innerHTML = `<h3>${product.name}</h3><p>Quantity: ${item.quantity}</p><p>Price: $${price.toFixed(2)}</p>`;
        container.appendChild(div);
    });
    document.getElementById('cart-total').textContent=totalPrice.toFixed(2);
}

// Init cart count
updateCartCount();
loadCart();
