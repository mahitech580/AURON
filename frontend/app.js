"use strict";

/* =========================================================
   AURON FRONTEND
   Commerce platform frontend application
   ========================================================= */

const AURON_CONFIG = {
    apiBaseUrl: "http://127.0.0.1:8001/api",

    storageKeys: {
        cart: "auron_cart",
        orders: "auron_orders",
        account: "auron_account"
    },

    demoMode: true
};


/* =========================================================
   DEMO PRODUCTS
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


/* =========================================================
   APPLICATION STATE
   ========================================================= */

let products = [];
let productServiceAvailable = false;


/* =========================================================
   STORAGE
   ========================================================= */

function readStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);

        return value
            ? JSON.parse(value)
            : fallback;
    } catch (error) {
        console.error(
            `Storage read failed: ${key}`,
            error
        );

        return fallback;
    }
}


function writeStorage(key, value) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );
    } catch (error) {
        console.error(
            `Storage write failed: ${key}`,
            error
        );
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


function getAccount() {
    return readStorage(
        AURON_CONFIG.storageKeys.account,
        null
    );
}


function saveAccount(account) {
    writeStorage(
        AURON_CONFIG.storageKeys.account,
        account
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
            `Request failed with status ${response.status}`
        );
    }

    return data;
}


async function checkProductService() {
    try {
        const result = await apiRequest(
            "/products/health"
        );

        productServiceAvailable = true;

        console.info(
            "AURON Product Service:",
            result
        );

        return true;
    } catch (error) {
        productServiceAvailable = false;

        console.warn(
            "AURON Product Service unavailable:",
            error.message
        );

        return false;
    }
}


async function fetchProducts() {
    return apiRequest(
        "/products"
    );
}


async function fetchProduct(productId) {
    return apiRequest(
        `/products/${productId}`
    );
}


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


function formatCurrency(value) {
    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2
        }
    ).format(Number(value || 0));
}


function filterProducts(
    items,
    searchValue,
    categoryValue
) {
    const search =
        searchValue
            .trim()
            .toLowerCase();

    const category =
        categoryValue
            .trim()
            .toLowerCase();

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

        return (
            matchesSearch &&
            matchesCategory
        );
    });
}


function sortProducts(
    items,
    sortValue
) {
    const sorted = [...items];

    switch (sortValue) {
        case "price-low":
            return sorted.sort(
                (a, b) =>
                    a.price - b.price
            );

        case "price-high":
            return sorted.sort(
                (a, b) =>
                    b.price - a.price
            );

        case "newest":
            return sorted.sort(
                (a, b) =>
                    b.id - a.id
            );

        case "relevance":
        default:
            return sorted;
    }
}


/* =========================================================
   PRODUCT LOADING
   ========================================================= */

async function loadProducts() {
    try {
        const data =
            await fetchProducts();

        if (
            Array.isArray(data) &&
            data.length > 0
        ) {
            products =
                data.map(
                    normalizeProduct
                );

            productServiceAvailable = true;

            console.info(
                "Products loaded from API."
            );
        } else {
            throw new Error(
                "Product API returned no products."
            );
        }
    } catch (error) {
        if (!AURON_CONFIG.demoMode) {
            products = [];

            console.error(
                "Product loading failed:",
                error
            );
        } else {
            products =
                AURON_DEMO_PRODUCTS.map(
                    normalizeProduct
                );

            console.info(
                "AURON Demo Mode: using local products."
            );
        }
    }

    renderProducts(products);
    updateCategoryOptions();

    return products;
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

            <p>
                ${escapeHtml(product.description)}
            </p>

            <p>
                Category:
                ${escapeHtml(product.category)}
            </p>

            <p>
                Price:
                ${formatCurrency(product.price)}
            </p>

            <p>
                Stock:
                ${product.stock}
            </p>

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
        document.querySelector(
            "#products > div"
        );

    if (!container) {
        return;
    }

    if (!items.length) {
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
        items
            .map(productCardMarkup)
            .join("");
}


function updateCategoryOptions() {
    const select =
        document.querySelector(
            "#category"
        );

    if (!select) {
        return;
    }

    const currentValue =
        select.value;

    const categories =
        [
            ...new Set(
                products.map(
                    (product) =>
                        product.category
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
                    <option
                        value="${escapeAttribute(category)}"
                    >
                        ${escapeHtml(category)}
                    </option>
                `
            )
            .join("")}
    `;

    select.value =
        currentValue;
}


/* =========================================================
   PRODUCT SEARCH / FILTER / SORT
   ========================================================= */

function initializeProductFilters() {
    const form =
        document.querySelector(
            "#products form"
        );

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
                )?.value ||
                "relevance";

            let filtered =
                filterProducts(
                    products,
                    search,
                    category
                );

            filtered =
                sortProducts(
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
        document.querySelector(
            "#product-1"
        );

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
                ${escapeHtml(
                    product.description
                )}
            </p>

            <p>
                Category:
                ${escapeHtml(
                    product.category
                )}
            </p>

            <p>
                Price:
                ${formatCurrency(
                    product.price
                )}
            </p>

            <p>
                Available stock:
                ${product.stock}
            </p>

            <form
                id="product-detail-form"
            >
                <label for="quantity">
                    Quantity
                </label>

                <input
                    id="quantity"
                    name="quantity"
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

    const form =
        section.querySelector(
            "#product-detail-form"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
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
        let product;

        if (productServiceAvailable) {
            product =
                await fetchProduct(
                    productId
                );
        } else {
            product =
                products.find(
                    (item) =>
                        Number(item.id) ===
                        Number(productId)
                );
        }

        if (!product) {
            throw new Error(
                "Product not found."
            );
        }

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

    const cart =
        getCart();

    const existing =
        cart.find(
            (item) =>
                Number(item.id) ===
                Number(product.id)
        );

    if (existing) {
        existing.quantity =
            Math.min(
                existing.quantity +
                    quantity,
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


function removeFromCart(
    productId
) {
    const updated =
        getCart().filter(
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
    const cart =
        getCart();

    const item =
        cart.find(
            (entry) =>
                Number(entry.id) ===
                Number(productId)
        );

    if (!item) {
        return;
    }

    const product =
        products.find(
            (entry) =>
                Number(entry.id) ===
                Number(productId)
        );

    const maxStock =
        product?.stock ??
        quantity;

    item.quantity =
        Math.max(
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
            item.price *
                item.quantity,
        0
    );
}


function renderCart() {
    const section =
        document.querySelector(
            "#cart"
        );

    if (!section) {
        return;
    }

    const cart =
        getCart();

    if (!cart.length) {
        section.innerHTML = `
            <header>
                <h2>Shopping Cart</h2>
            </header>

            <article>
                <h3>
                    Your cart is empty
                </h3>

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

    const tax =
        subtotal * 0.18;

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
                            ${formatCurrency(
                                item.price
                            )}
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
                            ${formatCurrency(
                                item.price *
                                item.quantity
                            )}
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
                <span>
                    Subtotal
                </span>

                <span>
                    ${formatCurrency(
                        subtotal
                    )}
                </span>
            </p>

            <p>
                <span>
                    Shipping
                </span>

                <span>
                    ${formatCurrency(
                        shipping
                    )}
                </span>
            </p>

            <p>
                <span>
                    Tax
                </span>

                <span>
                    ${formatCurrency(
                        tax
                    )}
                </span>
            </p>

            <p>
                <strong>
                    Total
                </strong>

                <strong>
                    ${formatCurrency(
                        total
                    )}
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
        document.querySelector(
            "#checkout"
        );

    if (!section) {
        return;
    }

    const form =
        section.querySelector(
            "form"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();

            const cart =
                getCart();

            if (!cart.length) {
                alert(
                    "Your cart is empty."
                );

                return;
            }

            const formData =
                new FormData(form);

            const subtotal =
                cartSubtotal(cart);

            const tax =
                subtotal * 0.18;

            const shipping = 0;

            const order = {
                id:
                    generateOrderId(),

                customer: {
                    name:
                        formData
                            .get(
                                "full_name"
                            )
                            ?.toString()
                            .trim() ||
                        "",

                    email:
                        formData
                            .get("email")
                            ?.toString()
                            .trim() ||
                        "",

                    phone:
                        formData
                            .get("phone")
                            ?.toString()
                            .trim() ||
                        ""
                },

                shippingAddress: {
                    address:
                        formData
                            .get(
                                "address"
                            )
                            ?.toString()
                            .trim() ||
                        "",

                    city:
                        formData
                            .get("city")
                            ?.toString()
                            .trim() ||
                        "",

                    state:
                        formData
                            .get("state")
                            ?.toString()
                            .trim() ||
                        "",

                    postalCode:
                        formData
                            .get(
                                "postal_code"
                            )
                            ?.toString()
                            .trim() ||
                        ""
                },

                paymentMethod:
                    formData.get(
                        "payment"
                    ),

                items:
                    cart,

                subtotal,

                shipping,

                tax,

                total:
                    subtotal +
                    shipping +
                    tax,

                status:
                    "Confirmed",

                paymentStatus:
                    "Paid",

                fulfillmentStatus:
                    "Processing",

                createdAt:
                    new Date().toISOString()
            };

            const orders =
                getOrders();

            orders.unshift(
                order
            );

            saveOrders(
                orders
            );

            saveCart([]);

            renderCart();
            renderOrders();
            renderAdminStats();

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
        document.querySelector(
            "#orders"
        );

    if (!section) {
        return;
    }

    const orders =
        getOrders();

    if (!orders.length) {
        section.innerHTML = `
            <header>
                <h2>
                    My Orders
                </h2>
            </header>

            <article>
                <h3>
                    No orders yet
                </h3>

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
            <h2>
                My Orders
            </h2>
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
                            ${formatCurrency(
                                order.total
                            )}
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
                entry.id ===
                orderId
        );

    if (!order) {
        alert(
            "Order not found."
        );

        return;
    }

    renderOrderDetails(
        order
    );

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
            <dt>
                Order Status
            </dt>

            <dd>
                ${escapeHtml(
                    order.status
                )}
            </dd>

            <dt>
                Payment Status
            </dt>

            <dd>
                ${escapeHtml(
                    order.paymentStatus
                )}
            </dd>

            <dt>
                Fulfillment Status
            </dt>

            <dd>
                ${escapeHtml(
                    order.fulfillmentStatus
                )}
            </dd>

            <dt>
                Total
            </dt>

            <dd>
                ${formatCurrency(
                    order.total
                )}
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
                entry.id ===
                orderId
        );

    if (!order) {
        alert(
            "Order not found."
        );

        return;
    }

    renderTracking(
        order
    );

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
        order.status ===
        "Delivered"
            ? ORDER_STEPS.length - 1
            : 2;

    section.innerHTML = `
        <header>
            <h2>
                Order Tracking
            </h2>
        </header>

        <p>
            Order:
            <strong>
                ${escapeHtml(
                    order.id
                )}
            </strong>
        </p>

        <ol>
            ${ORDER_STEPS
                .map(
                    (step, index) => `
                        <li>
                            ${escapeHtml(
                                step
                            )}

                            ${
                                index <=
                                currentIndex
                                    ? " ✓"
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
   ACCOUNT
   ========================================================= */

function initializeAccount() {
    let account =
        getAccount();

    if (!account) {
        account = {
            name:
                "AURON Customer",

            email:
                "customer@auron.demo",

            type:
                "Customer"
        };

        saveAccount(
            account
        );
    }

    const section =
        document.querySelector(
            "#account"
        );

    if (!section) {
        return;
    }

    const values =
        section.querySelectorAll(
            "dd"
        );

    if (values.length >= 1) {
        values[0].textContent =
            account.name;
    }

    if (values.length >= 2) {
        values[1].textContent =
            account.email;
    }

    if (values.length >= 3) {
        values[2].textContent =
            account.type;
    }
}


/* =========================================================
   ADMIN
   ========================================================= */

function renderAdminStats() {
    const section =
        document.querySelector(
            "#admin"
        );

    if (!section) {
        return;
    }

    const orders =
        getOrders();

    const revenue =
        orders.reduce(
            (total, order) =>
                total +
                Number(
                    order.total || 0
                ),
            0
        );

    const stats =
        section.querySelectorAll(
            ":scope > div article"
        );

    if (stats.length >= 1) {
        const element =
            stats[0].querySelector(
                "p"
            );

        if (element) {
            element.textContent =
                String(
                    products.length
                );
        }
    }

    if (stats.length >= 2) {
        const element =
            stats[1].querySelector(
                "p"
            );

        if (element) {
            element.textContent =
                String(
                    orders.length
                );
        }
    }

    if (stats.length >= 3) {
        const element =
            stats[2].querySelector(
                "p"
            );

        if (element) {
            element.textContent =
                String(
                    orders.filter(
                        (order) =>
                            order.status !==
                            "Delivered"
                    ).length
                );
        }
    }

    if (stats.length >= 4) {
        const element =
            stats[3].querySelector(
                "p"
            );

        if (element) {
            element.textContent =
                String(
                    products.filter(
                        (product) =>
                            product.stock >
                                0 &&
                            product.stock <
                                10
                    ).length
                );
        }
    }

    const revenueElement =
        [
            ...section.querySelectorAll(
                "dd"
            )
        ].find(
            (element) =>
                element
                    .previousElementSibling
                    ?.textContent
                    .trim() ===
                "Revenue Today"
        );

    if (revenueElement) {
        revenueElement.textContent =
            formatCurrency(
                revenue
            );
    }
}


/* =========================================================
   EVENT DELEGATION
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

        switch (action) {
            case "add-to-cart": {
                const product =
                    products.find(
                        (entry) =>
                            Number(
                                entry.id
                            ) ===
                            Number(id)
                    );

                if (product) {
                    addToCart(
                        product,
                        1
                    );
                }

                break;
            }

            case "remove-cart":
                removeFromCart(
                    Number(id)
                );
                break;

            case "update-cart": {
                const input =
                    document.querySelector(
                        `[data-cart-quantity="${CSS.escape(
                            id
                        )}"]`
                    );

                updateCartQuantity(
                    Number(id),
                    Number(
                        input?.value ||
                        1
                    )
                );

                break;
            }

            case "view-product":
                event.preventDefault();

                await showProduct(
                    Number(id)
                );

                break;

            case "view-order":
                event.preventDefault();

                showOrder(id);

                break;

            case "track-order":
                event.preventDefault();

                showTracking(id);

                break;

            default:
                break;
        }
    }
);


/* =========================================================
   UTILITIES
   ========================================================= */

function escapeHtml(value) {
    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


function escapeAttribute(value) {
    return escapeHtml(
        value
    );
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

    return date.toLocaleString(
        "en-IN"
    );
}


/* =========================================================
   DEMO CONTROLS
   ========================================================= */

window.AURON = {
    getProducts() {
        return products;
    },

    getCart() {
        return getCart();
    },

    getOrders() {
        return getOrders();
    },

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

        initializeAccount();
        renderCart();
        renderOrders();
        renderAdminStats();
    }
};


/* =========================================================
   APPLICATION STARTUP
   ========================================================= */

async function initializeAuron() {
    console.log(
        "AURON frontend initializing..."
    );

    await checkProductService();

    await loadProducts();

    initializeProductFilters();

    initializeCheckout();

    initializeAccount();

    renderCart();

    renderOrders();

    renderAdminStats();

    console.log(
        productServiceAvailable
            ? "AURON connected to Product Service."
            : "AURON running in Demo Mode."
    );

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
