// Load products
async function loadProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;

    const response = await fetch('products.json');
    const products = await response.json();

    container.innerHTML = '';
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';

        // Multiple images
        const imagesHTML = product.images.map(url => `<img src="${url}" alt="${product.name}">`).join('');

        // Variations select
        const variationsHTML = product.variations.map(v => {
            const options = v.options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
            return `<label>${v.attribute}: <select data-attr="${v.attribute}">${options}</select></label>`;
        }).join('<br>');

        // Videos
        const videosHTML = product.videos.map(url => `<video width="200" controls><source src="${url}" type="video/mp4">Your browser does not support video.</video>`).join('');

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

// Cart logic
function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(productId) {
    const cart = getCart();
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id: productId, quantity: 1 });
    }
    saveCart(cart);
    alert('Added to cart!');
}

function clearCart() {
    localStorage.removeItem('cart');
    updateCartCount();
    loadCart();
}

// Update cart count in header
function updateCartCount() {
    const countEl = document.getElementById('cart-count');
    if (!countEl) return;
    const cart = getCart();
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    countEl.textContent = total;
}

// Load cart items for cart.html
async function loadCart() {
    const container = document.getElementById('cart-container');
    if (!container) return;

    const cart = getCart();
    const response = await fetch('products.json');
    const products = await response.json();

    container.innerHTML = '';
    let totalPrice = 0;

    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        const price = product.price * item.quantity;
        totalPrice += price;
        const div = document.createElement('div');
        div.className = 'product-card';
        div.innerHTML = `
            <h3>${product.name}</h3>
            <p>Quantity: ${item.quantity}</p>
            <p>Price: $${price.toFixed(2)}</p>
        `;
        container.appendChild(div);
    });

    document.getElementById('cart-total').textContent = totalPrice.toFixed(2);
}

// Initialize
loadProducts();
loadCart();
updateCartCount();
