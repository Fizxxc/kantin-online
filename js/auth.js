// Authentication Functions

// Handle login
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Security: Prevent admin login on user app
    if (email === 'admin@kantin.com') {
        showError('Akses Ditolak', 'Gunakan halaman admin untuk login');
        return;
    }
    
    showLoading();
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            hideLoading();
            showSuccess('Login Berhasil!', 'Selamat datang kembali');
        })
        .catch(error => {
            hideLoading();
            showError('Login Gagal', error.message);
        });
}

// Handle register
function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    // Security: Prevent admin registration
    if (email === 'admin@kantin.com') {
        showError('Registrasi Gagal', 'Email ini tidak dapat digunakan');
        return;
    }
    
    showLoading();
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            // Save user data to Firestore
            return db.collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                totalOrders: 0,
                totalSpent: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            hideLoading();
            showSuccess('Registrasi Berhasil!', 'Akun Anda telah dibuat');
        })
        .catch(error => {
            hideLoading();
            showError('Registrasi Gagal', error.message);
        });
}

// Handle admin login
function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    if (email === 'admin@kantin.com' && password === 'admin123') {
        showLoading();
        
        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                hideLoading();
                showSuccess('Login Admin Berhasil!');
            })
            .catch(error => {
                hideLoading();
                showError('Login Gagal', error.message);
            });
    } else {
        showError('Login Gagal', 'Email atau password admin salah');
    }
}

// Logout
function logout() {
    auth.signOut().then(() => {
        cart = [];
        updateCartUI();
    });
}

// Admin logout
function adminLogout() {
    auth.signOut();
}

// Page navigation for user app
function showLogin() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('registerPage').classList.add('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

function showRegister() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('registerPage').classList.remove('hidden');
}

function showMainApp() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('registerPage').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    // Set welcome message
    document.getElementById('welcomeMessage').textContent = getGreeting();
    
    // Load user data
    loadUserData();
    
    // Listen for notifications
    listenForNotifications();
    
    // Initialize queue counter
    initializeQueueCounter();
}

// Page navigation for admin app
function showAdminLogin() {
    document.getElementById('adminLoginPage').classList.remove('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
}

function showAdminDashboard() {
    document.getElementById('adminLoginPage').classList.add('hidden');
    document.getElementById('adminDashboard').classList.remove('hidden');
    
    // Load admin data
    loadAdminData();
    
    // Listen for orders
    listenForOrders();
    
    // Initialize queue counter
    initializeQueueCounter();
}

// Load user data
function loadUserData() {
    if (!validateUserAccess()) return;
    
    db.collection('users').doc(currentUser.uid).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                document.getElementById('profileName').textContent = userData.name;
                document.getElementById('profileEmail').textContent = userData.email;
                document.getElementById('profileTotalOrders').textContent = userData.totalOrders || 0;
                document.getElementById('profileTotalSpent').textContent = formatCurrency(userData.totalSpent || 0);
                document.getElementById('profileMemberSince').textContent = formatDate(userData.createdAt.toDate());
            }
        });
}

// Initialize auth state listener
auth.onAuthStateChanged(user => {
    currentUser = user;
    
    // Check if we're on admin page
    if (window.location.pathname.includes('admin.html')) {
        if (user && user.email === 'admin@kantin.com') {
            showAdminDashboard();
        } else {
            // Redirect to user app if not admin
            window.location.href = 'index.html';
        }
    } else {
        // On user app
        if (user) {
            if (user.email === 'admin@kantin.com') {
                // Redirect admin to admin dashboard
                window.location.href = 'admin.html';
            } else {
                showMainApp();
            }
        } else {
            showLogin();
        }
    }
});