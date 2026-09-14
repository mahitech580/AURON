"use strict";

const AURON_CONFIG = {
    apiBaseUrl: "http://127.0.0.1:8001/api",
    storageKeys: {
        cart: "auron_cart",
        orders: "auron_orders",
        account: "auron_account"
    }
};


/* =========================================================
   STORAGE
   ========================================================= */

function readStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        console.error(`Storage read failed: ${key}`, error);
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Storage write failed: ${key}`, error);
    }
}

function getCart() {
    return readStorage(
        AURON_CONFIG.storageKeys.cart,
        []
    );
}

function saveCart(cart) {
    writeStorage(
        AURON_CONFIG.storageKeys.cart,
        cart
    );
}

function getOrders() {
    return readStorage(
        AURON_CONFIG.storageKeys.orders,
        []
    );
}

function saveOrders(orders) {
    writeStorage(
        AURON_CONFIG.storageKeys.orders,
        orders
    );
}


/* =========================================================
   API
   ========================================================= */

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(
        `${AURON_CONFIG.apiBaseUrl}${endpoint}`,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw new Error(
            data?.detail ||
            `Request failed: ${response.status}`
        );
    }

    return data;
}

async function checkProductService() {
    try {
        const result = await apiRequest(
            "/products/health"
        );

        console.log(
            "AURON Product Service:",
            result
        );

        return true;
    } catch (error) {
        console.warn(
            "Product Service unavailable:",
            error.message
        );

        return false;
    }
}

async function fetchProducts() {
    return apiRequest("/products");
}

async function fetchProduct(productId) {
    return apiRequest(
        `/products/${productId}`
    );
}


/* =========================================================
   PRODUCT STATE
   ========================================================= */

let products = [];


/* =========================================================
   PRODUCT HELPERS
   ========================================================= */

function normalizeProduct(product) {
    return {
        id: Number(product.id),
        name: product.name || "",
        description: product.description || "",
        price: Number(product.price || 0),
        category: product.category || "Uncategorized",
        stock: Number(product.stock || 0)
    };
}

function filterProducts(
    items,
    searchValue,
    categoryValue
) {
    const search =
        searchValue.trim().toLowerCase();

    const category =
        categoryValue.trim().toLowerCase();

    return items.filter((product) => {
        const matchesSearch =
            !search ||
            product.name
                .toLowerCase()
                .includes(search) ||
            product.description
                .toLowerCase()
                .includes(search);

        const matchesCategory =
            !category ||
            product.category
                .toLowerCase() === category;

        return matchesSearch && matchesCategory;
    });
}

function sortProducts(items, sortValue) {
    const sorted = [...items];

    switch (sortValue) {
        case "price-low":
            return sorted.sort(
                (a, b) => a.price - b.price
            );

        case "price-high":
            return sorted.sort(
                (a, b) => b.price - a.price
            );

        case "newest":
            return sorted.sort(
                (a, b) => b.id - a.id
            );

        default:
            return sorted;
    }
}


/* =========================================================
   PRODUCT UI
   ========================================================= */

function productCardMarkup(product) {
    return `
        <article data-product-id="${product.id}">
            <header>
                <h3>${escapeHtml(product.name)}</h3>
            </header>

            <p>${escapeHtml(product.description)}</p>
            <p>Category: ${escapeHtml(product.category)}</p>
            <p>Price: ?${product.price.toFixed(2)}</p>
            <p>Stock: ${product.stock}</p>

            <a
                href="#product-1"
                data-action="view-product"
                data-id="${product.id}"
            >
                View Product
            </a>

            <button
                type="button"
                data-action="add-to-cart"
                data-id="${product.id}"
                ${product.stock <= 0 ? "disabled" : ""}
            >
                ${
                    product.stock > 0
                        ? "Add to Cart"
                        : "Out of Stock"
                }
            </button>
        </article>
    `;
}

function renderProducts(items) {
    const container =
        document.querySelector("#products > div");

    if (!container) {
        return;
    }

    if (items.length === 0) {
        container.innerHTML = `
            <article>
                <h3>No products found</h3>
                <p>
                    Try another search or category.
                </p>
            </article>
        `;

        return;
    }

    container.innerHTML =
        items.map(productCardMarkup).join("");
}

async function loadProducts() {
    try {
        const data = await fetchProducts();

        products = Array.isArray(data)
            ? data.map(normalizeProduct)
            : [];

        renderProducts(products);
        updateCategoryOptions();

        return products;
    } catch (error) {
        console.error(
            "Failed to load products:",
            error
        );

        const container =
            document.querySelector(
                "#products > div"
            );

        if (container) {
            container.innerHTML = `
                <article>
                    <h3>
                        Product service unavailable
                    </h3>

                    <p>
                        Start the AURON Product
                        Service on port 8001.
                    </p>
                </article>
            `;
        }

        return [];
    }
}

function updateCategoryOptions() {
    const select =
        document.querySelector("#category");

    if (!select) {
        return;
    }

    const currentValue = select.value;

    const categories = [
        ...new Set(
            products.map(
                (product) => product.category
            )
        )
    ].sort();

    select.innerHTML = `
        <option value="">
            All Categories
        </option>

        ${categories
            .map(
                (category) => `
                    <option value="${escapeAttribute(
                        category
                    )}">
                        ${escapeHtml(category)}
                    </option>
                `
            )
            .join("")}
    `;

    select.value = currentValue;
}


/* =========================================================
   PRODUCT SEARCH
   ========================================================= */

function initializeProductFilters() {
    const form =
        document.querySelector("#products form");

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();

            const search =
                form.querySelector(
                    "#product-search"
                )?.value || "";

            const category =
                form.querySelector(
                    "#category"
                )?.value || "";

            const sort =
                form.querySelector(
                    "#sort"
                )?.value || "relevance";

            let filtered = filterProducts(
                products,
                search,
                category
            );

            filtered = sortProducts(
                filtered,
                sort
            );

            renderProducts(filtered);
        }
    );
}


/* =========================================================
   PRODUCT DETAILS
   ========================================================= */

function renderProductDetails(product) {
    const section =
        document.querySelector("#product-1");

    if (!section) {
        return;
    }

    section.innerHTML = `
        <header>
            <h2>
                ${escapeHtml(product.name)}
            </h2>
        </header>

        <article>
            <p>
                ${escapeHtml(product.description)}
            </p>

            <p>
                Category:
                ${escapeHtml(product.category)}
            </p>

            <p>
                Price:
                ?${product.price.toFixed(2)}
            </p>

            <p>
                Available stock:
                ${product.stock}
            </p>

            <form id="product-detail-form">
                <label for="quantity">
                    Quantity
                </label>

                <input
                    id="quantity"
                    type="number"
                    min="1"
                    max="${Math.max(
                        product.stock,
                        1
                    )}"
                    value="1"
                    ${
                        product.stock <= 0
                            ? "disabled"
                            : ""
                    }
                >

                <button
                    type="submit"
                    ${
                        product.stock <= 0
                            ? "disabled"
                            : ""
                    }
                >
                    ${
                        product.stock > 0
                            ? "Add to Cart"
                            : "Out of Stock"
                    }
                </button>
            </form>
        </article>
    `;

    const form = section.querySelector(
        "#product-detail-form"
    );

    form?.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();

            const quantity =
                Number(
                    form.querySelector(
                        "#quantity"
                    )?.value
                ) || 1;

            addToCart(
                product,
                quantity
            );
        }
    );
}

async function showProduct(productId) {
    try {
        const product =
            await fetchProduct(productId);

        renderProductDetails(
            normalizeProduct(product)
        );

        window.location.hash =
            "product-1";
    } catch (error) {
        alert(
            `Unable to load product: ${error.message}`
        );
    }
}


/* =========================================================
   CART
   ========================================================= */

function addToCart(
    product,
    quantity = 1
) {
    if (
        !product ||
        product.stock <= 0
    ) {
        return;
    }

    const cart = getCart();

    const existing = cart.find(
        (item) =>
            Number(item.id) ===
            Number(product.id)
    );

    if (existing) {
        existing.quantity = Math.min(
            existing.quantity + quantity,
            product.stock
        );
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category,
            quantity: Math.min(
                quantity,
                product.stock
            )
        });
    }

    saveCart(cart);
    renderCart();

    alert(
        `${product.name} added to cart.`
    );
}

function removeFromCart(productId) {
    const updated = getCart().filter(
        (item) =>
            Number(item.id) !==
            Number(productId)
    );

    saveCart(updated);
    renderCart();
}

function updateCartQuantity(
    productId,
    quantity
) {
    const cart = getCart();

    const item = cart.find(
        (entry) =>
            Number(entry.id) ===
            Number(productId)
    );

    if (!item) {
        return;
    }

    const product = products.find(
        (entry) =>
            Number(entry.id) ===
            Number(productId)
    );

    const maxStock =
        product?.stock ?? quantity;

    item.quantity = Math.max(
        1,
        Math.min(
            Number(quantity),
            maxStock
        )
    );

    saveCart(cart);
    renderCart();
}

function cartSubtotal(cart) {
    return cart.reduce(
        (total, item) =>
            total +
            item.price * item.quantity,
        0
    );
}

function renderCart() {
    const section =
        document.querySelector("#cart");

    if (!section) {
        return;
    }

    const cart = getCart();

    if (cart.length === 0) {
        section.innerHTML = `
            <header>
                <h2>Shopping Cart</h2>
            </header>

            <article>
                <h3>Your cart is empty</h3>

                <p>
                    Add products from the
                    catalog to begin shopping.
                </p>
            </article>
        `;

        return;
    }

    const subtotal =
        cartSubtotal(cart);

    const shipping = 0;
    const tax = subtotal * 0.18;
    const total =
        subtotal +
        shipping +
        tax;

    section.innerHTML = `
        <header>
            <h2>Shopping Cart</h2>
        </header>

        ${cart
            .map(
                (item) => `
                    <article
                        data-cart-id="${item.id}"
                    >
                        <h3>
                            ${escapeHtml(
                                item.name
                            )}
                        </h3>

                        <p>
                            Unit Price:
                            ?${item.price.toFixed(2)}
                        </p>

                        <label
                            for="cart-quantity-${item.id}"
                        >
                            Quantity
                        </label>

                        <input
                            id="cart-quantity-${item.id}"
                            type="number"
                            min="1"
                            value="${item.quantity}"
                            data-cart-quantity="${item.id}"
                        >

                        <p>
                            Subtotal:
                            ?${(
                                item.price *
                                item.quantity
                            ).toFixed(2)}
                        </p>

                        <button
                            type="button"
                            data-action="update-cart"
                            data-id="${item.id}"
                        >
                            Update Cart
                        </button>

                        <button
                            type="button"
                            data-action="remove-cart"
                            data-id="${item.id}"
                        >
                            Remove
                        </button>
                    </article>
                `
            )
            .join("")}

        <div>
            <p>
                <span>Subtotal</span>
                <span>
                    ?${subtotal.toFixed(2)}
                </span>
            </p>

            <p>
                <span>Shipping</span>
                <span>
                    ?${shipping.toFixed(2)}
                </span>
            </p>

            <p>
                <span>Tax</span>
                <span>
                    ?${tax.toFixed(2)}
                </span>
            </p>

            <p>
                <strong>Total</strong>
                <strong>
                    ?${total.toFixed(2)}
                </strong>
            </p>
        </div>

        <a href="#checkout">
            Proceed to Checkout
        </a>
    `;
}


/* =========================================================
   CHECKOUT
   ========================================================= */

function initializeCheckout() {
    const section =
        document.querySelector("#checkout");

    if (!section) {
        return;
    }

    const form =
        section.querySelector("form");

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();

            const cart = getCart();

            if (cart.length === 0) {
                alert(
                    "Your cart is empty."
                );

                return;
            }

            const formData =
                new FormData(form);

            const subtotal =
                cartSubtotal(cart);

            const order = {
                id: generateOrderId(),

                customer: {
                    name:
                        formData
                            .get("full_name")
                            ?.toString()
                            .trim(),

                    email:
                        formData
                            .get("email")
                            ?.toString()
                            .trim(),

                    phone:
                        formData
                            .get("phone")
                            ?.toString()
                            .trim()
                },

                shippingAddress: {
                    address:
                        formData
                            .get("address")
                            ?.toString()
                            .trim(),

                    city:
                        formData
                            .get("city")
                            ?.toString()
                            .trim(),

                    state:
                        formData
                            .get("state")
                            ?.toString()
                            .trim(),

                    postalCode:
                        formData
                            .get("postal_code")
                            ?.toString()
                            .trim()
                },

                paymentMethod:
                    formData.get("payment"),

                items: cart,

                subtotal,

                shipping: 0,

                tax:
                    subtotal * 0.18,

                status: "Confirmed",

                paymentStatus: "Paid",

                fulfillmentStatus:
                    "Processing",

                createdAt:
                    new Date().toISOString()
            };

            order.total =
                order.subtotal +
                order.tax +
                order.shipping;

            const orders = getOrders();

            orders.unshift(order);

            saveOrders(orders);
            saveCart([]);

            renderCart();
            renderOrders();

            form.reset();

            window.location.hash =
                "orders";

            alert(
                `Order ${order.id} created successfully.`
            );
        }
    );
}

function generateOrderId() {
    return `AUR-${Date.now()
        .toString()
        .slice(-8)}`;
}


/* =========================================================
   ORDERS
   ========================================================= */

function renderOrders() {
    const section =
        document.querySelector("#orders");

    if (!section) {
        return;
    }

    const orders = getOrders();

    if (orders.length === 0) {
        section.innerHTML = `
            <header>
                <h2>My Orders</h2>
            </header>

            <article>
                <h3>No orders yet</h3>

                <p>
                    Your completed orders
                    will appear here.
                </p>
            </article>
        `;

        return;
    }

    section.innerHTML = `
        <header>
            <h2>My Orders</h2>
        </header>

        ${orders
            .map(
                (order) => `
                    <article
                        data-order-id="${escapeAttribute(
                            order.id
                        )}"
                    >
                        <h3>
                            Order #${escapeHtml(
                                order.id
                            )}
                        </h3>

                        <p>
                            Status:
                            ${escapeHtml(
                                order.status
                            )}
                        </p>

                        <p>
                            Total:
                            ?${Number(
                                order.total
                            ).toFixed(2)}
                        </p>

                        <p>
                            Placed:
                            ${formatDate(
                                order.createdAt
                            )}
                        </p>

                        <a
                            href="#order-details"
                            data-action="view-order"
                            data-id="${escapeAttribute(
                                order.id
                            )}"
                        >
                            View Order
                        </a>
                    </article>
                `
            )
            .join("")}
    `;
}

function showOrder(orderId) {
    const order =
        getOrders().find(
            (entry) =>
                entry.id === orderId
        );

    if (!order) {
        alert("Order not found.");
        return;
    }

    renderOrderDetails(order);

    window.location.hash =
        "order-details";
}

function renderOrderDetails(order) {
    const section =
        document.querySelector(
            "#order-details"
        );

    if (!section) {
        return;
    }

    section.innerHTML = `
        <header>
            <h2>
                Order #${escapeHtml(
                    order.id
                )}
            </h2>
        </header>

        <dl>
            <dt>Order Status</dt>
            <dd>
                ${escapeHtml(
                    order.status
                )}
            </dd>

            <dt>Payment Status</dt>
            <dd>
                ${escapeHtml(
                    order.paymentStatus
                )}
            </dd>

            <dt>Fulfillment Status</dt>
            <dd>
                ${escapeHtml(
                    order.fulfillmentStatus
                )}
            </dd>

            <dt>Total</dt>
            <dd>
                ?${Number(
                    order.total
                ).toFixed(2)}
            </dd>
        </dl>

        <a
            href="#tracking"
            data-action="track-order"
            data-id="${escapeAttribute(
                order.id
            )}"
        >
            Track Shipment
        </a>
    `;
}


/* =========================================================
   TRACKING
   ========================================================= */

const ORDER_STEPS = [
    "Order Placed",
    "Payment Confirmed",
    "Inventory Reserved",
    "Warehouse Allocated",
    "Picking",
    "Packing",
    "Shipped",
    "Out for Delivery",
    "Delivered"
];

function showTracking(orderId) {
    const order =
        getOrders().find(
            (entry) =>
                entry.id === orderId
        );

    if (!order) {
        alert("Order not found.");
        return;
    }

    renderTracking(order);

    window.location.hash =
        "tracking";
}

function renderTracking(order) {
    const section =
        document.querySelector(
            "#tracking"
        );

    if (!section) {
        return;
    }

    const currentIndex =
        order.status === "Delivered"
            ? ORDER_STEPS.length - 1
            : 2;

    section.innerHTML = `
        <header>
            <h2>Order Tracking</h2>
        </header>

        <p>
            Order:
            <strong>
                ${escapeHtml(order.id)}
            </strong>
        </p>

        <ol>
            ${ORDER_STEPS
                .map(
                    (step, index) => `
                        <li>
                            ${escapeHtml(step)}
                            ${
                                index <=
                                currentIndex
                                    ? " ?"
                                    : ""
                            }
                        </li>
                    `
                )
                .join("")}
        </ol>

        <p>
            Current Status:
            ${escapeHtml(
                order.fulfillmentStatus
            )}
        </p>
    `;
}


/* =========================================================
   ADMIN
   ========================================================= */

function renderAdminStats() {
    const section =
        document.querySelector("#admin");

    if (!section) {
        return;
    }

    const orders = getOrders();

    const revenue = orders.reduce(
        (total, order) =>
            total +
            Number(order.total || 0),
        0
    );

    const stats =
        section.querySelectorAll(
            ":scope > div article"
        );

    if (stats.length >= 2) {
        const element =
            stats[1].querySelector("p");

        if (element) {
            element.textContent =
                String(orders.length);
        }
    }

    if (stats.length >= 4) {
        const element =
            stats[3].querySelector("p");

        if (element) {
            element.textContent =
                String(
                    products.filter(
                        (product) =>
                            product.stock > 0 &&
                            product.stock < 10
                    ).length
                );
        }
    }

    const revenueElement =
        [...section.querySelectorAll("dd")]
            .find(
                (element) =>
                    element
                        .previousElementSibling
                        ?.textContent
                        .trim() ===
                    "Revenue Today"
            );

    if (revenueElement) {
        revenueElement.textContent =
            `?${revenue.toFixed(2)}`;
    }
}


/* =========================================================
   EVENT HANDLING
   ========================================================= */

document.addEventListener(
    "click",
    async (event) => {
        const target =
            event.target.closest(
                "[data-action]"
            );

        if (!target) {
            return;
        }

        const action =
            target.dataset.action;

        const id =
            target.dataset.id;

        if (action === "add-to-cart") {
            const product =
                products.find(
                    (entry) =>
                        Number(entry.id) ===
                        Number(id)
                );

            if (product) {
                addToCart(product, 1);
            }
        }

        if (action === "remove-cart") {
            removeFromCart(
                Number(id)
            );
        }

        if (action === "update-cart") {
            const input =
                document.querySelector(
                    `[data-cart-quantity="${CSS.escape(
                        id
                    )}"]`
                );

            updateCartQuantity(
                Number(id),
                Number(
                    input?.value || 1
                )
            );
        }

        if (action === "view-product") {
            event.preventDefault();

            await showProduct(
                Number(id)
            );
        }

        if (action === "view-order") {
            event.preventDefault();

            showOrder(id);
        }

        if (action === "track-order") {
            event.preventDefault();

            showTracking(id);
        }
    }
);


/* =========================================================
   UTILITIES
   ========================================================= */

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}

function formatDate(value) {
    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Unknown";
    }

    return date.toLocaleString();
}


/* =========================================================
   START AURON
   ========================================================= */

async function initializeAuron() {
    console.log(
        "AURON frontend initializing..."
    );

    await checkProductService();
    await loadProducts();

    initializeProductFilters();
    initializeCheckout();

    renderCart();
    renderOrders();
    renderAdminStats();

    console.log(
        "AURON frontend initialized."
    );
}

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initializeAuron
    );
} else {
    initializeAuron();
}

/* =========================================================
   AURON FRONTEND DEMO MODE
   Works without the backend/database
   ========================================================= */

const AURON_DEMO_PRODUCTS = [
    {
        id: 1,
        name: "AURON Wireless Mouse",
        description: "Ergonomic wireless mouse for everyday productivity.",
        price: 799.99,
        category: "Electronics",
        stock: 50
    },
    {
        id: 2,
        name: "AURON Mechanical Keyboard",
        description: "Mechanical keyboard designed for productivity and gaming.",
        price: 2499.99,
        category: "Accessories",
        stock: 30
    },
    {
        id: 3,
        name: "AURON USB-C Hub",
        description: "Multi-port USB-C hub for modern devices.",
        price: 1299.99,
        category: "Electronics",
        stock: 25
    },
    {
        id: 4,
        name: "AURON Laptop Stand",
        description: "Adjustable aluminum laptop stand.",
        price: 1599.99,
        category: "Computers",
        stock: 18
    },
    {
        id: 5,
        name: "AURON Smart Desk Lamp",
        description: "Adjustable LED desk lamp for focused work.",
        price: 1899.99,
        category: "Home",
        stock: 12
    },
    {
        id: 6,
        name: "AURON Wireless Headphones",
        description: "Noise-isolating wireless headphones.",
        price: 3299.99,
        category: "Electronics",
        stock: 20
    }
];

const AURON_DEMO_MODE = true;

function initializeDemoMode() {
    if (!AURON_DEMO_MODE) {
        return;
    }

    console.log("AURON Demo Mode enabled.");

    if (!products || products.length === 0) {
        products = AURON_DEMO_PRODUCTS.map(normalizeProduct);
        renderProducts(products);
        updateCategoryOptions();
    }

    renderCart();
    renderOrders();
    renderAdminStats();
}

function loadDemoProductData() {
    products = AURON_DEMO_PRODUCTS.map(normalizeProduct);

    renderProducts(products);
    updateCategoryOptions();
}

/*
 * Replace the normal API product loading with demo data
 * when the backend is unavailable.
 */
const originalLoadProducts = loadProducts;

loadProducts = async function () {
    try {
        const data = await originalLoadProducts();

        if (Array.isArray(data) && data.length > 0) {
            return data;
        }
    } catch {
        // Demo fallback below.
    }

    loadDemoProductData();

    return products;
};

/*
 * Add a demo product if none exists.
 */
function ensureDemoCart() {
    const cart = getCart();

    if (cart.length === 0 && products.length > 0) {
        console.log(
            "Demo cart ready. Add products from the catalog."
        );
    }

    return cart;
}

/*
 * Demo account.
 */
function initializeDemoAccount() {
    const accountKey =
        AURON_CONFIG.storageKeys.account;

    const existingAccount =
        readStorage(accountKey, null);

    if (!existingAccount) {
        writeStorage(accountKey, {
            name: "AURON Customer",
            email: "customer@auron.demo",
            type: "Customer"
        });
    }
}

/*
 * Demo startup.
 */
async function initializeAuronDemo() {
    initializeDemoAccount();
    ensureDemoCart();

    if (!products || products.length === 0) {
        loadDemoProductData();
    }

    renderCart();
    renderOrders();
    renderAdminStats();

    console.log(
        "AURON frontend demo is ready."
    );
}

window.AURON_DEMO = {
    products: AURON_DEMO_PRODUCTS,

    resetCart() {
        saveCart([]);
        renderCart();
    },

    resetOrders() {
        saveOrders([]);
        renderOrders();
        renderAdminStats();
    },

    resetAll() {
        localStorage.removeItem(
            AURON_CONFIG.storageKeys.cart
        );

        localStorage.removeItem(
            AURON_CONFIG.storageKeys.orders
        );

        localStorage.removeItem(
            AURON_CONFIG.storageKeys.account
        );

        initializeDemoAccount();
        renderCart();
        renderOrders();
        renderAdminStats();

        console.log(
            "AURON demo storage reset."
        );
    },

    showProducts() {
        console.table(products);
    },

    showCart() {
        console.table(getCart());
    },

    showOrders() {
        console.table(getOrders());
    }
};

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeAuronDemo
    );
} else {
    initializeAuronDemo();
}

