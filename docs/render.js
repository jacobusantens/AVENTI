/* render.js - Generador de contenido dinámico */

function renderProducts() {
    const container = document.getElementById('product-container'); // Para index.html
    const detailContainer = document.querySelector('.product-detail-container'); // Para product.html

    // --- 1. LÓGICA PORTADA (INDEX) ---
    if (container) {
        const htmlContent = products.map(product => `
            <div class="product-card">
                <a href="product.html?id=${product.id}" style="text-decoration: none; color: inherit;">
                    <div class="product-img-box">
                        <img src="${product.imgMain}" alt="${product.name}" class="img-main">
                        <img src="${product.imgHover}" alt="${product.name}" class="img-hover">
                    </div>
                    <div class="product-info">
                        <span class="label" style="font-size: 0.65rem; color: #888;">${product.category}</span>
                        <h3>${product.name}</h3>
                        <p class="price">${product.price.toFixed(2)}€</p>
                    </div>
                </a>
            </div>
        `).join('');

        // Inyectamos el contenido triplicado para que el scroll infinito no tenga huecos
        container.innerHTML = htmlContent + htmlContent + htmlContent;
    }

    // --- 2. LÓGICA FICHA DE PRODUCTO (PRODUCT-DETAIL) ---
    if (detailContainer) {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');
        const product = products.find(p => p.id === Number(productId));

        if (product) {
            // Inyectar datos básicos
            const imgElement = document.getElementById('p-img');
            const nameElement = document.getElementById('p-name');
            const priceElement = document.getElementById('p-price');
            const categoryElement = document.getElementById('p-category');
            const descElement = document.getElementById('p-description');

            if (imgElement) imgElement.src = product.imgMain;
            if (nameElement) nameElement.innerText = product.name;
            if (priceElement) priceElement.innerText = `${product.price.toFixed(2)} €`;
            if (categoryElement) categoryElement.innerText = product.category;
            
            if (descElement) {
                descElement.innerText = product.description || "Esta prenda exclusiva ha sido diseñada con atención al detalle y materiales de alta calidad para garantizar durabilidad y estilo atemporal.";
            }

            document.title = `${product.name} | ANVI`;
            
            // Inicializar el selector de tallas
            initSizeSelector();
        } else {
            // Caso: Producto no encontrado (con la clase link-volver que definimos en el CSS)
            detailContainer.innerHTML = `
                <div style='padding:100px; text-align:center;'>
                    <h2 style="font-family: 'Playfair Display'; margin-bottom: 20px;">Producto no encontrado</h2>
                    <a href='index.html' style='text-decoration:none; color:black;'>← Volver a la colección</a>
                </div>`;
        }
    }
}

// --- 3. LÓGICA SELECTOR DE TALLAS ---
function initSizeSelector() {
    const sizeBtns = document.querySelectorAll('.size-btn');
    const addToCartBtn = document.getElementById('add-to-cart-btn');

    sizeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Feedback visual de selección
            sizeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Guardamos la talla en un atributo "data" del botón de compra
            if (addToCartBtn) {
                addToCartBtn.dataset.size = btn.innerText;
            }
        });
    });
}

// Ejecutar la función principal
renderProducts();