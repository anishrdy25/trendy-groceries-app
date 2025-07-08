// script.js (Supabase + SweetAlert2 integration with full Admin CRUD support)
import { supabase } from './supabase.js';

if (typeof Swal === 'undefined') {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
  document.head.appendChild(script);
}

function showAlert(title, text, icon = 'info') {
  Swal.fire({ title, text, icon });
}

function showToast(title, icon = 'success') {
  Swal.fire({ title, icon, timer: 1500, toast: true, position: 'top-end', showConfirmButton: false });
}

let cart = JSON.parse(sessionStorage.getItem('cart')) || [];

async function loadProducts() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) return showAlert('Error', 'Failed to load products', 'error');
  renderProducts(data);
}

function renderProducts(products) {
  const container = document.getElementById('product-list');
  if (!container) return;
  const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
  container.innerHTML = '';
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'bg-gray-800 p-4 rounded-lg shadow-md text-center';
    card.innerHTML = `
      <img src="${p.image_url}" alt="${p.name}" class="w-full h-40 object-cover mb-2 rounded">
      <h3 class="text-lg font-semibold text-coral-400">${p.name}</h3>
      <p class="text-white">NZ$${p.price.toFixed(2)}</p>
      <p class="text-sm text-gray-400 mb-2">Stock: ${p.stock}</p>
      ${isAdmin ? `
        <div class="flex justify-center mt-2 space-x-2">
          <button class="bg-blue-500 px-3 py-1 rounded hover:bg-blue-600 text-white text-sm" onclick="openEditForm(${p.product_id})">
            <i class="fas fa-edit mr-1"></i>Edit
          </button>
          <button class="bg-red-500 px-3 py-1 rounded hover:bg-red-600 text-white text-sm" onclick="deleteProduct(${p.product_id})">
            <i class="fas fa-trash-alt mr-1"></i>Delete
          </button>
        </div>
      ` : `
        <button class="mt-2 bg-coral-400 px-4 py-1 rounded hover:bg-coral-500 text-white text-sm" onclick="addToCart(${p.product_id})">
          <i class="fas fa-cart-plus mr-1"></i>Add to Cart
        </button>
      `}
    `;
    container.appendChild(card);
  });
}

async function openEditForm(productId) {
  const { data, error } = await supabase.from('products').select('*').eq('product_id', productId).single();
  if (error || !data) return showAlert('Error', 'Failed to fetch product', 'error');
  console.log('🛠️ Editing product with ID:', productId);
  const { value: formValues } = await Swal.fire({
    title: 'Edit Product',
    html:
      `<input id="swal-name" class="swal2-input" placeholder="Name" value="${data.name}">` +
      `<input id="swal-price" type="number" class="swal2-input" placeholder="Price" value="${data.price}">` +
      `<input id="swal-stock" type="number" class="swal2-input" placeholder="Stock" value="${data.stock}">`,
    focusConfirm: false,
    showCancelButton: true,
    preConfirm: () => {
      return {
        name: document.getElementById('swal-name').value,
        price: parseFloat(document.getElementById('swal-price').value),
        stock: parseInt(document.getElementById('swal-stock').value),
      };
    }
  });

  if (!formValues) return;

  const { error: updateError } = await supabase
    .from('products')
    .update(formValues)
    .eq('product_id', productId);

  if (updateError) return showAlert('Error', 'Update failed', 'error');
  showToast('Product updated');
  loadProducts();
}

async function addProduct() {
  await Swal.fire({
    title: 'Add New Product',
    html:
      `<input id="add-name" class="swal2-input" placeholder="Product Name">` +
      `<input id="add-price" type="number" class="swal2-input" placeholder="Price">` +
      `<input id="add-stock" type="number" class="swal2-input" placeholder="Stock">` +
      `<input id="add-image" class="swal2-input" placeholder="Image Name (e.g., onions.jpg)">`,
    focusConfirm: false,
    showCancelButton: true,
    preConfirm: () => {
      const name = document.getElementById('add-name').value.trim();
      const price = parseFloat(document.getElementById('add-price').value);
      const stock = parseInt(document.getElementById('add-stock').value);
      const imageName = document.getElementById('add-image').value.trim();

      if (!name || !price || !stock || !imageName) {
        Swal.showValidationMessage('Please fill all fields');
        return false;
      }

      return { name, price, stock, imageName };
    }
  }).then(async (result) => {
    if (!result.isConfirmed) return;

    const { name, price, stock, imageName } = result.value;

    // ✅ Create Supabase public image URL
    const imageUrl = `https://bpigsoahqafsieyvcoru.supabase.co/storage/v1/object/public/product-images/${imageName}`;

    const { error } = await supabase
      .from('products')
      .insert([{ name, price, stock, image_url: imageUrl }])
      .select();
    if (error) {
      Swal.fire('Error', 'Failed to add product', 'error');
    } else {
      Swal.fire('Success', 'Product added!', 'success');
      loadProducts();
    }
  });
}


function renderAdminPanel() {
  const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
  const adminBar = document.getElementById('admin-bar');
  if (isAdmin && adminBar) {
    adminBar.innerHTML = `<button onclick="addProduct()">➕ Add Product</button>`;
  }
}

async function addToCart(productId) {
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('product_id', productId)
    .single();

  if (error || !product) return showAlert('Error', 'Product not found', 'error');

  if (product.stock <= 0) {
    return showAlert('Out of Stock', 'This product is currently unavailable.', 'warning');
  }

  // 1. Add to session cart
  cart.push(product);
  sessionStorage.setItem('cart', JSON.stringify(cart));
  showToast('Product added to cart');
  updateCart();

  // 2. Update stock in database
  const { error: stockError } = await supabase
    .from('products')
    .update({ stock: product.stock - 1 })
    .eq('product_id', productId);

  if (stockError) {
    showAlert('Warning', 'Failed to update stock in database', 'warning');
  } else {
    loadProducts(); // 🔄 Refresh product list
  }
}


function updateCart() {
  cart = JSON.parse(sessionStorage.getItem('cart')) || [];
  const countEls = document.querySelectorAll('#cart-count');
  countEls.forEach(el => el.textContent = cart.length);
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.querySelectorAll('#cart-total');
  const checkoutBtn = document.getElementById('checkout-button');
  if (cartItems) {
    cartItems.innerHTML = '';
    if (cart.length === 0) {
      cartItems.innerHTML = '<p>Your cart is empty.</p>';
    } else {
      const table = document.createElement('table');
      table.innerHTML = `
        <thead><tr><th>Item</th><th>Price</th><th>Action</th></tr></thead>
        <tbody>
          ${cart.map((item, i) => `
            <tr>
              <td>${item.name}</td>
              <td>NZ$${item.price.toFixed(2)}</td>
              <td><button onclick="removeFromCart(${i})">Remove</button></td>
            </tr>
          `).join('')}
        </tbody>
      `;
      cartItems.appendChild(table);
    }
  }
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  cartTotal.forEach(el => el.textContent = total.toFixed(2));
  if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;
}

function removeFromCart(index) {
  cart.splice(index, 1);
  sessionStorage.setItem('cart', JSON.stringify(cart));
  showToast('Removed from cart');
  updateCart();
}

function logout() {
  sessionStorage.clear();
  showToast('Logged out');
  updateNavLinks();
  window.location.href = 'index.html';
}

function updateNavLinks() {
  const link = document.getElementById('login-link');
  const user = sessionStorage.getItem('username');
  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  if (!link) return;
  if (isLoggedIn) {
    link.innerHTML = `Welcome ${user} <a href="#" class="logout-link">Logout</a>`;
    const logoutLink = link.querySelector('.logout-link');
    if (logoutLink) logoutLink.addEventListener('click', e => { e.preventDefault(); logout(); });
  } else {
    link.innerHTML = '<a href="login.html">Login</a>';
  }
}

async function loginUser(username, password) {
  if (username === 'admin' && password === 'admin123') {
    sessionStorage.setItem('isAdmin', 'true');
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('username', 'admin');
    showToast('Admin login successful');
    window.location.href = 'shop.html';
    return;
  }
  const { data, error } = await supabase.from('users').select('*')
    .eq('username', username)
    .eq('password', password).single();
  if (error || !data) return showAlert('Login Failed', 'Invalid credentials', 'error');
  sessionStorage.setItem('isLoggedIn', 'true');
  sessionStorage.setItem('username', data.username);
  showToast('Login successful');
  window.location.href = 'index.html';
}

async function registerUser(user) {
  const { data: existingUser } = await supabase.from('users').select('*').eq('username', user.username).maybeSingle();
  if (existingUser) return showAlert('Error', 'Username already exists', 'warning');
  const { error } = await supabase.from('users').insert([user]);
  if (error) return showAlert('Error', 'Registration failed', 'error');
  showToast('Registered successfully');
  window.location.href = 'login.html';
}
function proceedToCheckout() {
  Swal.fire({
    title: 'Order Placed!',
    text: 'Thank you for shopping with Trendy Groceries NZ 🎉',
    icon: 'success',
    confirmButtonText: 'Return to Home'
  }).then(() => {
    sessionStorage.removeItem('cart'); // clear cart
    window.location.href = 'index.html'; // redirect to home
  });
}


window.addEventListener('DOMContentLoaded', () => {

  updateNavLinks();
   // Show add-product-form only for admin
  const addForm = document.getElementById('add-product-form');
  if (sessionStorage.getItem('isAdmin') === 'true' && addForm) {
    addForm.style.display = 'block';
  }
  updateCart();
  renderAdminPanel();
  loadProducts();

  
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      loginUser(username, password);
    });
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', e => {
      e.preventDefault();
      const user = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
      };
      registerUser(user);
    });
  }

  document.getElementById('add-product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('product-name').value.trim();
    const price = parseFloat(document.getElementById('product-price').value);
    const stock = parseInt(document.getElementById('product-stock').value);
    const imageFile = document.getElementById('product-image').files[0];

    if (!name || isNaN(price) || isNaN(stock) || !imageFile) {
      return showAlert('Error', 'Please fill all fields', 'error');
    }

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, imageFile);

    if (uploadError) {
      return showAlert('Upload Failed', uploadError.message, 'error');
    }

    const { data: imageUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    const imageUrl = imageUrlData.publicUrl;

    const { data: insertedProduct, error: insertError } = await supabase.from('products').insert([{
  name,
  price,
  stock,
  image_url: imageUrl
}]).select();

    if (insertError) {
      return showAlert('Error', 'Product not added', 'error');
    }

    showToast('Product added successfully');
    e.target.reset();
    document.getElementById('add-product-section').style.display = 'none';

    loadProducts();
      const checkoutBtn = document.getElementById('checkout-button');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      Swal.fire({
        icon: 'success',
        title: 'Thank you for your purchase!',
        text: 'Your order has been placed.',
        showConfirmButton: false,
        timer: 2000
      });

      sessionStorage.removeItem('cart');
      updateCart();

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
    });
  }

  });
});

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.logout = logout;
window.deleteProduct = async function(productId) {
  const { error } = await supabase.from('products').delete().eq('product_id', productId);
  if (error) return showAlert('Error', 'Delete failed', 'error');
  showToast('Product deleted');
  loadProducts();
};
window.addProduct = addProduct;
window.openEditForm = openEditForm;
window.proceedToCheckout = proceedToCheckout; // ✅ ADD THIS LINE
