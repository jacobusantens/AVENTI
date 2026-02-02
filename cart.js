/* cart.js */

document.addEventListener('DOMContentLoaded', () => {
    renderCart();
});

function renderCart() {
    // 1. Recuperar datos
    const cart = JSON.parse(localStorage.getItem('anvi_cart')) || [];
    
    // 2. Referencias a elementos del HTML
    const tableBody = document.getElementById('cart-items-body');
    const totalPriceElement = document.getElementById('total-price');
    const itemsCountElement = document.getElementById('items-count');
    const cartContent = document.getElementById('cart-content');
    const emptyMsg = document.getElementById('empty-cart-msg');

    // 3. Verificar si el carrito está vacío
    if (cart.length === 0) {
        if (cartContent) cartContent.style.display = 'none';
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    } else {
        if (cartContent) cartContent.style.display = 'block';
        if (emptyMsg) emptyMsg.style.display = 'none';
    }

    // 4. ACTUALIZAR CONTADOR REAL
    if (itemsCountElement) {
        const num = cart.length;
        itemsCountElement.innerText = `${num} ${num === 1 ? 'ARTÍCULO' : 'ARTÍCULOS'}`;
    }

    // 5. RENDERIZAR TABLA
    let total = 0;
    tableBody.innerHTML = ''; 

    cart.forEach((item) => {
        total += item.price;
        
        const row = document.createElement('tr');
        row.className = 'cart-item';
        
        // Aquí inyectamos el HTML que respeta el CSS de centrado vertical
        row.innerHTML = `
            <td>
                <div class="cart-product-info">
                    <img src="${item.img}" class="cart-img" alt="${item.name}">
                    <div class="product-name-details">
                        <strong>${item.name}</strong>
                        <span>Talla: ${item.size}</span>
                    </div>
                </div>
            </td>
            <td>${item.size}</td>
            <td>${item.price.toFixed(2)}€</td>
            <td>
                <button class="remove-btn" onclick="removeItem(${item.cartId})">
                    Eliminar
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // 6. ACTUALIZAR TOTAL
    if (totalPriceElement) {
        totalPriceElement.innerText = `${total.toFixed(2)} €`;
    }
}

/**
 * Elimina un producto específico usando su ID único de sesión (cartId)
 */
function removeItem(cartId) {
    let cart = JSON.parse(localStorage.getItem('anvi_cart')) || [];
    
    // Filtrar el carrito
    cart = cart.filter(item => item.cartId !== cartId);
    
    // Guardar cambios
    localStorage.setItem('anvi_cart', JSON.stringify(cart));
    
    // Volver a renderizar la página
    renderCart();
    
    // Opcional: Si tienes un contador en el header del index, puedes avisar que actualice
    // window.dispatchEvent(new Event('storage')); 
}