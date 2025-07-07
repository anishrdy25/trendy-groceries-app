const products = JSON.parse(localStorage.getItem('products')) || [
    { id: 1, name: "Fresh Kiwifruit", price: 4.99, image: "images/kiwifruit.jpg", stock: 100 },
    { id: 2, name: "Organic Kumara", price: 2.49, image: "images/kumara.jpg", stock: 200 },
    { id: 3, name: "Full Cream Milk", price: 3.29, image: "images/milk.jpg", stock: 150 },
    { id: 4, name: "Sourdough Bread", price: 3.99, image: "images/bread.jpg", stock: 120 },
    { id: 5, name: "Manuka Honey", price: 19.99, image: "images/honey.jpg", stock: 50 },
    { id: 6, name: "Hokey Pokey Ice Cream", price: 6.49, image: "images/icecream.jpg", stock: 80 }
];

let users = JSON.parse(localStorage.getItem('users')) || [
    { username: "customer", password: "password123", name: "Customer One", email: "customer@example.com", phone: "", address: "" },
    { username: "Arun", password: "@Arun@", name: "Arun Kumar", email: "arun@example.com", phone: "", address: "" },
    { username: "Mike", password: "@Mike@", name: "Mike Smith", email: "mike@example.com", phone: "", address: "" }
];

const adminCredentials = { username: "admin", password: "admin123" };

let cart = JSON.parse(sessionStorage.getItem('cart')) || [];

function saveProducts() {
    localStorage.setItem('products', JSON.stringify(products));
    // Generate SQL insert statements for new products
    const existingProductIds = products.map(p => p.id);
    const sqlStatements = products
        .filter(p => p.id > 6) // Only include products added after initial set
        .map(p => `INSERT INTO products (name, price, image_url, stock) VALUES ('${p.name.replace(/'/g, "''")}', ${p.price.toFixed(2)}, '${p.image}', ${p.stock});`)
        .join('\n');
    console.log('SQL Insert Statements for new products:\n' + (sqlStatements || 'No new products to add to SQL.'));
}

function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

function displayProducts(containerId, limit = products.length) {
    const productList = document.getElementById(containerId);
    if (!productList) return;
    productList.innerHTML = '';
    products.slice(0, limit).forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card p-4 rounded-lg shadow-md';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image mb-4">
            <h3 class="text-lg font-semibold text-white">${product.name}</h3>
            <p class="text-gray-200">NZ$${product.price.toFixed(2)}</p>
            <button onclick="addToCart(${product.id})" class="bg-coral-400 text-white px-4 py-2 rounded mt-2 hover:bg-coral-500 transition-colors">Add to Cart</button>
        `;
        productList.appendChild(productCard);
    });
}

function displayAdminProducts() {
    const productList = document.getElementById('admin-product-list');
    if (!productList) return;
    productList.innerHTML = '';
    products.forEach(product => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-300';
        row.innerHTML = `
            <td class="py-2">${product.name}</td>
            <td class="py-2 text-right">${product.price.toFixed(2)}</td>
            <td class="py-2 text-right">${product.stock}</td>
            <td class="py-2 text-right">
                <button onclick="editProduct(${product.id})" class="text-coral-400 hover:text-coral-500 mr-2">Edit</button>
                <button onclick="removeProduct(${product.id})" class="text-red-400 hover:text-red-500">Remove</button>
            </td>
        `;
        productList.appendChild(row);
    });
}

function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const editForm = document.getElementById('edit-product-form');
    const addForm = document.getElementById('add-product-form');
    if (editForm && addForm) {
        editForm.classList.remove('hidden');
        addForm.classList.add('hidden');

        document.getElementById('edit-product-id').value = product.id;
        document.getElementById('edit-product-name').value = product.name;
        document.getElementById('edit-product-price').value = product.price;
        document.getElementById('edit-product-stock').value = product.stock;
        document.getElementById('edit-product-image').value = ''; // File inputs cannot be pre-filled
    }
}

function removeProduct(productId) {
    if (!confirm(`Are you sure you want to remove "${products.find(p => p.id === productId).name}"?`)) return;

    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
        products.splice(productIndex, 1);
        cart = cart.filter(item => item.id !== productId); // Remove from cart
        sessionStorage.setItem('cart', JSON.stringify(cart));
        saveProducts();
        displayAdminProducts();
        updateCart();
        alert('Product removed successfully!');
    }
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product && product.stock > 0) {
        cart.push(product);
        product.stock--;
        sessionStorage.setItem('cart', JSON.stringify(cart));
        saveProducts();
        updateCart();
        displayAdminProducts();
    } else {
        alert('Product is out of stock!');
    }
}

function updateCart() {
    const cartCountElements = document.querySelectorAll('#cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotalElements = document.querySelectorAll('#cart-total');
    const checkoutButton = document.getElementById('checkout-button');

    cartCountElements.forEach(el => el.textContent = cart.length);

    if (cartItems) {
        cartItems.innerHTML = '';
        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="text-white text-center">Your cart is empty.</p>';
        } else {
            const table = document.createElement('table');
            table.className = 'w-full text-white';
            table.innerHTML = `
                <thead>
                    <tr class="border-b border-gray-300">
                        <th class="py-2 text-left">Item</th>
                        <th class="py-2 text-right">Price (NZ$)</th>
                        <th class="py-2 text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${cart.map((item, index) => `
                        <tr class="border-b border-gray-300">
                            <td class="py-2">${item.name}</td>
                            <td class="py-2 text-right">${item.price.toFixed(2)}</td>
                            <td class="py-2 text-right">
                                <button onclick="removeFromCart(${index})" class="text-coral-400 hover:text-coral-500">Remove</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
            cartItems.appendChild(table);
        }
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    cartTotalElements.forEach(el => el.textContent = total.toFixed(2));

    if (checkoutButton) {
        checkoutButton.disabled = cart.length === 0;
    }
}

function removeFromCart(index) {
    const product = cart[index];
    const productInStock = products.find(p => p.id === product.id);
    if (productInStock) productInStock.stock++;
    cart.splice(index, 1);
    sessionStorage.setItem('cart', JSON.stringify(cart));
    saveProducts();
    updateCart();
    displayAdminProducts();
}

function proceedToCheckout() {
    if (cart.length === 0) return;
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        alert('Please log in to proceed with checkout.');
        window.location.href = 'login.html';
        return;
    }
    alert('Order placed successfully! Kia ora for shopping with Trendy Groceries NZ.');
    cart = [];
    sessionStorage.setItem('cart', JSON.stringify(cart));
    saveProducts();
    updateCart();
    displayAdminProducts();
    window.location.href = 'shop.html'; // Redirect to shop.html after successful checkout
}

function updateNavLinks() {
    const navLinks = document.getElementById('nav-links');
    const loginLink = document.getElementById('login-link');
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const username = sessionStorage.getItem('username') || '';

    if (navLinks && loginLink) {
        if (isLoggedIn && username) {
            loginLink.innerHTML = `
                <span class="hover:text-coral-400 transition-colors">
                    <i class="fas fa-user mr-1"></i> Welcome ${username}
                    <span class="ml-2 cursor-pointer text-coral-400 hover:text-coral-500" onclick="logout()">Logout</span>
                </span>
            `;
            loginLink.href = '#';
        } else {
            loginLink.href = 'login.html';
            loginLink.innerHTML = '<i class="fas fa-user mr-1"></i> Login';
        }
    }
}

function logout() {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('isAdmin');
    alert('Logged out successfully! Kia ora.');
    window.location.href = 'index.html';
    updateNavLinks();
}

document.addEventListener('DOMContentLoaded', () => {
    updateNavLinks();

    if (document.getElementById('featured-products')) {
        displayProducts('featured-products', 4);
    }
    if (document.getElementById('product-list')) {
        displayProducts('product-list');
    }
    updateCart();

    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', proceedToCheckout);
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            // Check if admin
        if (username === adminCredentials.username && password === adminCredentials.password) {
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('username', username);
            sessionStorage.setItem('isAdmin', 'true');
            alert('Admin login successful!');
            window.location.href = 'admin.html';
            return;
        }
            const user = users.find(u => u.username === username && u.password === password);
            if (user) {
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('username', username);
                alert('Login successful! Kia ora.');
                updateNavLinks();
                window.location.href = 'index.html';
            } else {
                alert('Invalid username or password. Please try again.');
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const address = document.getElementById('address').value;
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (users.some(u => u.username === username)) {
                alert('Username already exists. Please choose another.');
                return;
            }
            if (users.some(u => u.email === email)) {
                alert('Email already registered. Please use another email.');
                return;
            }

            users.push({ username, password, name, email, phone, address });
            saveUsers();
            alert('Registration successful! Please log in.');
            window.location.href = 'login.html';
        });
    }

    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('admin-username').value;
            const password = document.getElementById('admin-password').value;

            if (username === adminCredentials.username && password === adminCredentials.password) {
                sessionStorage.setItem('isAdmin', 'true');
                document.getElementById('admin-login').classList.add('hidden');
                document.getElementById('admin-panel').classList.remove('hidden');
                displayAdminProducts();
            } else {
                alert('Invalid admin credentials. Please try again.');
            }
        });
    }

    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('product-name').value;
            const price = parseFloat(document.getElementById('product-price').value);
            const imageFile = document.getElementById('product-image').files[0];
            const stock = parseInt(document.getElementById('product-stock').value);

            if (imageFile) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    const imageDataUrl = event.target.result;
                    const newProduct = {
                        id: products.length ? Math.max(...products.map(p => p.id)) + 1 : 1,
                        name,
                        price,
                        image: imageDataUrl,
                        stock
                    };
                    products.push(newProduct);
                    saveProducts();
                    displayAdminProducts();
                    addProductForm.reset();
                    alert('Product added successfully! Check the Shop page to view it.');
                };
                reader.readAsDataURL(imageFile);
            } else {
                alert('Please select an image file.');
            }
        });
    }

    const editProductForm = document.getElementById('edit-product-form');
    if (editProductForm) {
        editProductForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const productId = parseInt(document.getElementById('edit-product-id').value);
            const name = document.getElementById('edit-product-name').value;
            const price = parseFloat(document.getElementById('edit-product-price').value);
            const stock = parseInt(document.getElementById('edit-product-stock').value);
            const imageFile = document.getElementById('edit-product-image').files[0];

            const product = products.find(p => p.id === productId);
            if (product) {
                product.name = name;
                product.price = price;
                product.stock = stock;

                if (imageFile) {
                    const reader = new FileReader();
                    reader.onload = function (event) {
                        product.image = event.target.result;
                        saveProducts();
                        displayAdminProducts();
                        editProductForm.reset();
                        editProductForm.classList.add('hidden');
                        document.getElementById('add-product-form').classList.remove('hidden');
                        alert('Product updated successfully!');
                    };
                    reader.readAsDataURL(imageFile);
                } else {
                    saveProducts();
                    displayAdminProducts();
                    editProductForm.reset();
                    editProductForm.classList.add('hidden');
                    document.getElementById('add-product-form').classList.remove('hidden');
                    alert('Product updated successfully!');
                }
            }
        });
    }

    const cancelEditButton = document.getElementById('cancel-edit');
    if (cancelEditButton) {
        cancelEditButton.addEventListener('click', () => {
            const editForm = document.getElementById('edit-product-form');
            const addForm = document.getElementById('add-product-form');
            editForm.classList.add('hidden');
            editForm.reset();
            addForm.classList.remove('hidden');
        });
    }

    if (sessionStorage.getItem('isAdmin') === 'true') {
        const adminLogin = document.getElementById('admin-login');
        const adminPanel = document.getElementById('admin-panel');
        if (adminLogin && adminPanel) {
            adminLogin.classList.add('hidden');
            adminPanel.classList.remove('hidden');
            displayAdminProducts();
        }
    }
});