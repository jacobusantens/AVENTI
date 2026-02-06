// main.js - Lógica Global con PayPal, Desglose de Gastos y Registro Automatizado

document.addEventListener('DOMContentLoaded', () => {
    if (typeof renderProducts === 'function') renderProducts();
    startInfiniteScroll();
    updateCartCount();
    initAddToCart();

    const displayTotal = document.getElementById('total-price') || document.getElementById('total-checkout') || document.getElementById('final-total');
    if (displayTotal) {
        actualizarPrecioPantalla();
    }

    if (document.getElementById('paypal-button-container')) {
        initPayPal();
    }
});

// --- 1. ANIMACIÓN DEL CARRUSEL ---
function startInfiniteScroll() {
    const container = document.getElementById('product-container');
    if (!container) return;
    let scrollPos = 0;
    const speed = 1.5; 
    let animationId;
    function step() {
        scrollPos += speed;
        const firstSetWidth = container.scrollWidth / 3; 
        if (scrollPos >= firstSetWidth) scrollPos = 0;
        container.style.transform = `translateX(-${scrollPos}px)`;
        animationId = requestAnimationFrame(step);
    }
    animationId = requestAnimationFrame(step);
    container.addEventListener('mouseenter', () => cancelAnimationFrame(animationId));
    container.addEventListener('mouseleave', () => animationId = requestAnimationFrame(step));
}

// --- 2. LÓGICA DEL CARRITO (Actualizada con Printful ID) ---
function initAddToCart() {
    const addBtn = document.getElementById('add-to-cart-btn');
    if (!addBtn) return;
    addBtn.addEventListener('click', () => {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');
        const selectedSize = addBtn.dataset.size;
        if (!selectedSize) { alert('Por favor, selecciona una talla.'); return; }
        
        const productData = products.find(p => p.id === Number(productId));
        
        const cartItem = {
            cartId: Date.now(),
            id: productData.id,
            printful_id: productData.printful_id, // <--- CAPTURAMOS EL ID DE PRINTFUL
            name: productData.name,
            price: Number(productData.price),
            shippingCost: Number(productData.shippingCost) || 0,
            img: productData.imgMain,
            size: selectedSize
        };

        let cart = JSON.parse(localStorage.getItem('anvi_cart')) || [];
        cart.push(cartItem);
        localStorage.setItem('anvi_cart', JSON.stringify(cart));
        
        updateCartCount();
        
        const originalText = addBtn.innerText;
        addBtn.innerText = "¡AÑADIDO!";
        setTimeout(() => {
            addBtn.innerText = originalText;
        }, 2000);
    });
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('anvi_cart')) || [];
    const countElement = document.getElementById('cart-count');
    if (countElement) countElement.innerText = cart.length;
}

// --- 3. SISTEMA DE DESCUENTOS Y ENVÍOS ---
function applyDiscount() {
    const input = document.getElementById('discount-input');
    const msg = document.getElementById('discount-message');
    if (!input || !msg) return;

    const code = input.value.trim().toUpperCase();
    let porcentaje = 0;

    if (code === 'ANVI10') {
        porcentaje = 0.10;
        msg.innerText = "CÓDIGO ANVI10 APLICADO (-10%)";
        msg.style.color = "#27ae60";
        sessionStorage.setItem('activeDiscount', porcentaje);
    } else if (code === 'FOUNDER20') {
        porcentaje = 0.20;
        msg.innerText = "CÓDIGO FOUNDER20 APLICADO (-20%)";
        msg.style.color = "#27ae60";
        sessionStorage.setItem('activeDiscount', porcentaje);
    } else {
        msg.innerText = "CÓDIGO NO VÁLIDO";
        msg.style.color = "#c0392b";
        sessionStorage.removeItem('activeDiscount');
    }
    actualizarPrecioPantalla();
}

function actualizarPrecioPantalla() {
    const cart = JSON.parse(localStorage.getItem('anvi_cart')) || [];
    let subtotalProductos = 0;
    let envioAcumulado = 0;

    cart.forEach(item => {
        subtotalProductos += Number(item.price) || 0;
        let ship = Number(item.shippingCost);
        if (isNaN(ship) || ship === 0) {
            const original = products.find(p => p.id === item.id);
            ship = original ? Number(original.shippingCost) : 0;
        }
        envioAcumulado += ship;
    });

    const esGratis = subtotalProductos >= 100;
    if (esGratis) envioAcumulado = 0; 
    else if (envioAcumulado > 15) envioAcumulado = 15;
    
    if (cart.length === 0) { envioAcumulado = 0; subtotalProductos = 0; }

    const dto = parseFloat(sessionStorage.getItem('activeDiscount')) || 0;
    const ahorro = subtotalProductos * dto;
    const totalFinal = (subtotalProductos - ahorro) + envioAcumulado;

    const subEle = document.getElementById('cart-subtotal');
    if (subEle) subEle.innerText = subtotalProductos.toFixed(2) + " €";

    const shipEle = document.getElementById('cart-shipping');
    if (shipEle) {
        shipEle.innerText = (esGratis && subtotalProductos > 0) ? "GRATIS" : envioAcumulado.toFixed(2) + " €";
        shipEle.style.color = (esGratis && subtotalProductos > 0) ? "#27ae60" : "inherit";
    }

    const dtoRow = document.getElementById('descuento-fila');
    const dtoEle = document.getElementById('cart-discount');
    if (dtoRow && dtoEle) {
        if (ahorro > 0) {
            dtoRow.style.display = "flex";
            dtoEle.innerText = "- " + ahorro.toFixed(2) + " €";
        } else {
            dtoRow.style.display = "none";
        }
    }

    const display = document.getElementById('total-price') || document.getElementById('total-checkout') || document.getElementById('final-total');
    if (display) display.innerText = totalFinal.toFixed(2) + " €";

    return totalFinal.toFixed(2);
}

// --- 4. INTEGRACIÓN DE PAYPAL (Actualizada para Printful Multi-Producto) ---
function initPayPal() {
    const container = document.getElementById('paypal-button-container');
    if (!container) return;

    container.innerHTML = '';

    paypal.Buttons({
        createOrder: function(data, actions) {
            const totalParaPayPal = actualizarPrecioPantalla();
            if (parseFloat(totalParaPayPal) <= 0) {
                alert("El carrito está vacío");
                return;
            }
            return actions.order.create({
                purchase_units: [{
                    amount: {
                        currency_code: 'EUR',
                        value: totalParaPayPal
                    }
                }]
            });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                
                const emailUser = document.getElementById('email').value;
                const nombreUser = document.getElementById('nombre').value;
                const direccionUser = document.getElementById('direccion').value;
                const ciudadUser = document.getElementById('ciudad').value;
                const cpUser = document.getElementById('cp').value;
                
                const cart = JSON.parse(localStorage.getItem('anvi_cart')) || [];

                // LISTA PARA PRINTFUL (ARRAY)
                const productosParaPrintful = cart.map(item => ({
                    "sync_variant_id": item.printful_id,
                    "quantity": 1
                }));

                // RESUMEN PARA EXCEL
                const articulosLista = cart.map(item => `- ${item.name} (Talla: ${item.size})`).join('\n');

                // OBJETO FINAL PARA MAKE
                const pedidoData = {
                    "nombre": nombreUser,
                    "email": emailUser,
                    "direccion": direccionUser,
                    "ciudad": ciudadUser,
                    "cp": cpUser,
                    "total": details.purchase_units[0].amount.value + " €",
                    "transaccion_id": details.id,
                    "articulos_excel": articulosLista,
                    "productos": productosParaPrintful // <--- LA LISTA QUE MAPEAREMOS EN MAKE
                };

                fetch('https://hook.eu1.make.com/5t656w17gy5s10gctqkg3lbndpqmebgr', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pedidoData)
                })
                .then(response => {
                    localStorage.removeItem('anvi_cart');
                    sessionStorage.removeItem('activeDiscount');
                    window.location.href = "confirmacion.html";
                })
                .catch(err => {
                    console.error('Error enviando pedido:', err);
                    window.location.href = "confirmacion.html";
                });
            });
        }
    }).render('#paypal-button-container');
}

function removeFromCart(index) {
    let cart = JSON.parse(localStorage.getItem('anvi_cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('anvi_cart', JSON.stringify(cart));
    if (cart.length === 0) sessionStorage.removeItem('activeDiscount');
    if (typeof renderCart === 'function') renderCart();
    actualizarPrecioPantalla();
    updateCartCount();
    if (document.getElementById('paypal-button-container')) {
        initPayPal();
    }
}