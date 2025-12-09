// Main Application Functions (User App)

// Load menu
function loadMenu() {
    if (!validateUserAccess()) return;

    const menuGrid = document.getElementById('menuGrid');
    menuGrid.innerHTML = '';

    const filteredItems = currentCategory === 'all'
        ? menuItems
        : menuItems.filter(item => item.category === currentCategory);

    filteredItems.forEach(item => {
        const menuCard = document.createElement('div');
        menuCard.className = 'menu-card bg-white rounded-lg shadow-md overflow-hidden cursor-pointer no-select';
        menuCard.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="w-full h-48 object-cover no-copy">
            <div class="p-4">
                <h3 class="text-lg font-semibold mb-2">${item.name}</h3>
                <p class="text-blue-500 font-bold text-xl mb-3">${formatCurrency(item.price)}</p>
                <button onclick="addToCart(${item.id})" class="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition">
                    <i class="fas fa-plus mr-2"></i>Tambah ke Keranjang
                </button>
            </div>
        `;
        menuGrid.appendChild(menuCard);
    });
}

// Filter menu
function filterMenu(category) {
    if (!validateUserAccess()) return;

    currentCategory = category;

    // Update button styles
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('bg-blue-500', 'text-white');
        btn.classList.add('bg-gray-300', 'text-gray-700');
    });

    event.target.classList.remove('bg-gray-300', 'text-gray-700');
    event.target.classList.add('bg-blue-500', 'text-white');

    loadMenu();
}

// Cart functions
function addToCart(itemId) {
    if (!validateUserAccess()) return;

    const item = menuItems.find(m => m.id === itemId);
    const existingItem = cart.find(c => c.id === itemId);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...item, quantity: 1 });
    }

    updateCartUI();

    showSuccess('Ditambahkan!', `${item.name} telah ditambahkan ke keranjang`);
}

function removeFromCart(itemId) {
    if (!validateUserAccess()) return;

    cart = cart.filter(item => item.id !== itemId);
    updateCartUI();
}

function updateQuantity(itemId, change) {
    if (!validateUserAccess()) return;

    const item = cart.find(c => c.id === itemId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(itemId);
        } else {
            updateCartUI();
        }
    }
}

function updateCartUI() {
    if (!validateUserAccess()) return;

    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const emptyCart = document.getElementById('emptyCart');

    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    // Update cart items
    if (cart.length === 0) {
        cartItems.innerHTML = '';
        emptyCart.classList.remove('hidden');
        cartTotal.textContent = 'Rp 0';
    } else {
        emptyCart.classList.add('hidden');
        cartItems.innerHTML = '';

        let total = 0;
        cart.forEach(item => {
            total += item.price * item.quantity;

            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item flex items-center justify-between p-4 bg-gray-50 rounded-lg';
            cartItem.innerHTML = `
                <div class="flex items-center space-x-4">
                    <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded no-copy">
                    <div>
                        <h4 class="font-semibold">${item.name}</h4>
                        <p class="text-blue-500 font-bold">${formatCurrency(item.price)}</p>
                    </div>
                </div>
                
                <div class="flex items-center space-x-3">
                    <button                             onclick="updateQuantity(${item.id}, 1)" class="bg-gray-300 text-gray-700 w-8 h-8 rounded-full hover:bg-gray-400 transition">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button onclick="removeFromCart(${item.id})" class="text-red-500 hover:text-red-600 ml-4">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
            cartItems.appendChild(cartItem);
        });

        cartTotal.textContent = formatCurrency(total);
    }
}

function showCart() {
    if (!validateUserAccess()) return;
    document.getElementById('cartModal').classList.remove('hidden');
}

function hideCart() {
    document.getElementById('cartModal').classList.add('hidden');
}

// Profile functions
function showProfile() {
    if (!validateUserAccess()) return;
    document.getElementById('profileModal').classList.remove('hidden');
}

function hideProfile() {
    document.getElementById('profileModal').classList.add('hidden');
}

// Checkout functions
function checkout() {
    if (!validateUserAccess()) return;

    if (cart.length === 0) {
        showWarning('Keranjang Kosong', 'Silakan tambahkan item ke keranjang terlebih dahulu');
        return;
    }

    hideCart();
    document.getElementById('checkoutModal').classList.remove('hidden');
}

function hideCheckout() {
    document.getElementById('checkoutModal').classList.add('hidden');
}

async function processPayment() {
    if (!validateUserAccess()) return;

    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');

    if (!paymentMethod) {
        showWarning('Pilih Metode Pembayaran', 'Silakan pilih metode pembayaran terlebih dahulu');
        return;
    }

    showLoading();

    try {
        // Generate queue number
        const queueNumber = await generateQueueNumber();

        // Calculate total
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Create order
        const order = {
            userId: currentUser.uid,
            items: cart,
            total: total,
            paymentMethod: paymentMethod.value,
            queueNumber: queueNumber,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Save order to Firestore
        const docRef = await db.collection('orders').add(order);

        // Update user statistics
        const userRef = db.collection('users').doc(currentUser.uid);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            await userRef.update({
                totalOrders: (userData.totalOrders || 0) + 1,
                totalSpent: (userData.totalSpent || 0) + total
            });
        }

        // Clear cart
        cart = [];
        updateCartUI();

        // Show success modal
        hideCheckout();
        showPaymentSuccess(paymentMethod.value, queueNumber);

        // Play notification sound
        playNotificationSound();

    } catch (error) {
        hideLoading();
        showError('Error', 'Gagal memproses pesanan: ' + error.message);
    }
}

function showPaymentSuccess(method, queueNumber) {
    if (!validateUserAccess()) return;

    const modal = document.getElementById('paymentSuccessModal');
    const qrisCode = document.getElementById('qrisCode');
    const cashCode = document.getElementById('cashCode');
    const finalQueueNumber = document.getElementById('finalQueueNumber');

    finalQueueNumber.textContent = queueNumber;

    if (method === 'qris') {
        qrisCode.classList.remove('hidden');
        cashCode.classList.add('hidden');
    } else {
        qrisCode.classList.add('hidden');
        cashCode.classList.remove('hidden');
        document.getElementById('queueNumber').textContent = queueNumber;
    }

    modal.classList.remove('hidden');
}

function closePaymentSuccess() {
    document.getElementById('paymentSuccessModal').classList.add('hidden');
}

// Initialize menu on load
document.addEventListener('DOMContentLoaded', function () {
    // Only initialize if on user app
    if (!window.location.pathname.includes('admin.html')) {
        loadMenu();

        // Setup event listeners
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
        document.getElementById('registerForm').addEventListener('submit', handleRegister);
    }
});