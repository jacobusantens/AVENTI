/* checkout.js - Versión Final con Descuento + Envío Gratis (>100€) */

document.addEventListener('DOMContentLoaded', () => {
    const cart = JSON.parse(localStorage.getItem('anvi_cart')) || [];
    if (cart.length === 0) {
        window.location.href = 'index.html';
        return;
    }
    renderSummary(cart);
    initPayPalButton(cart);
});

function getCalculatedTotal(cart) {
    // 1. Subtotal base de los productos
    const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
    
    // 2. Cálculo de envío con tope de 15€
    let envioAcumulado = cart.reduce((acc, item) => acc + (item.shippingCost || 0), 0);
    
    // PROMOCIÓN: Envío gratis si supera los 100€
    let promocionEnvioGratis = false;
    if (subtotal >= 100) {
        envioAcumulado = 0;
        promocionEnvioGratis = true;
    } else if (envioAcumulado > 15) {
        envioAcumulado = 15; // Tarifa plana máxima
    }

    // 3. Descuento aplicado al subtotal de ropa
    const dto = parseFloat(sessionStorage.getItem('activeDiscount')) || 0;
    const ahorroEuros = subtotal * dto;
    
    // 4. Total Final (Ropa con descuento + Envío)
    const totalFinal = (subtotal - ahorroEuros) + envioAcumulado;

    return {
        subtotal: subtotal,
        envio: envioAcumulado,
        ahorro: ahorroEuros,
        total: totalFinal,
        porcentajeDto: dto * 100,
        promocionEnvioGratis: promocionEnvioGratis
    };
}

function renderSummary(cart) {
    const listContainer = document.getElementById('checkout-items-list');
    const totalEl = document.getElementById('final-total');
    
    if (!listContainer || !totalEl) return;

    const calc = getCalculatedTotal(cart);

    // 1. Renderizamos la lista de productos
    let html = cart.map(item => `
        <div class="summary-item">
            <img src="${item.img}" class="summary-img">
            <div class="summary-info">
                <strong>${item.name}</strong>
                <span>Talla: ${item.size}</span>
            </div>
            <div style="font-size: 0.9rem;">${item.price.toFixed(2)}€</div>
        </div>
    `).join('');

    // 2. Fila de Gastos de Envío (con aviso de Gratis si aplica)
    html += `
        <div class="summary-item" style="border-top: 1px solid #eee; margin-top: 10px; padding-top: 10px;">
            <div class="summary-info">
                <span>GASTOS DE ENVÍO</span>
                ${calc.promocionEnvioGratis ? '<small style="display:block; color: #27ae60; font-weight:bold;">¡PROMO: ENVÍO GRATUITO!</small>' : ''}
                ${!calc.promocionEnvioGratis && calc.envio === 15 ? '<small style="display:block; color: #888;">(Tarifa plana aplicada)</small>' : ''}
            </div>
            <div style="${calc.promocionEnvioGratis ? 'color: #27ae60; font-weight: bold;' : ''}">
                ${calc.promocionEnvioGratis ? 'GRATIS' : calc.envio.toFixed(2) + '€'}
            </div>
        </div>
    `;

    // 3. Fila de Descuento (si existe)
    if (calc.porcentajeDto > 0) {
        html += `
            <div class="summary-item discount-row" style="color: #27ae60; font-weight: 600;">
                <div class="summary-info">
                    <strong>Descuento (${calc.porcentajeDto}%)</strong>
                </div>
                <div>-${calc.ahorro.toFixed(2)}€</div>
            </div>
        `;
    }

    listContainer.innerHTML = html;
    totalEl.innerText = `${calc.total.toFixed(2)} €`;
}

function initPayPalButton(cart) {
    const calc = getCalculatedTotal(cart);

    if (!window.paypal) return;

    paypal.Buttons({
        style: { layout: 'vertical', color: 'black', shape: 'rect', label: 'pay' },
        createOrder: (data, actions) => {
            return actions.order.create({
                purchase_units: [{
                    amount: { 
                        value: calc.total.toFixed(2) 
                    }
                }]
            });
        },
        onApprove: (data, actions) => {
            return actions.order.capture().then(async details => {
                const orderData = {
                    data: [{
                        fecha: new Date().toLocaleString(),
                        cliente: document.getElementById('nombre').value,
                        email: document.getElementById('email').value,
                        direccion: document.getElementById('direccion').value,
                        ciudad: document.getElementById('ciudad').value,
                        cp: document.getElementById('cp').value,
                        productos: cart.map(i => `${i.name} (${i.size})`).join(', '),
                        envio: calc.envio.toFixed(2),
                        descuento: calc.porcentajeDto + "%",
                        total: calc.total.toFixed(2),
                        id_transaccion: details.id
                    }]
                };

                try {
                    await fetch('TU_URL_DE_SHEETDB_AQUI', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(orderData)
                    });
                } catch (e) { console.error("Error SheetDB:", e); }

                localStorage.removeItem('anvi_cart');
                sessionStorage.removeItem('activeDiscount');
                alert("¡Compra realizada con éxito! Recibirás un correo de confirmación.");
                window.location.href = "index.html"; 
            });
        }
    }).render('#paypal-button-container');
}