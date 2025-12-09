// Admin Dashboard Functions

// Load admin data
function loadAdminData() {
    if (!validateAdminAccess()) return;
    
    // Load stats
    loadAdminStats();
    
    // Load orders
    loadOrders();
}

// Load admin statistics
function loadAdminStats() {
    if (!validateAdminAccess()) return;
    
    const today = getTodayMidnight();
    
    // Get today's orders
    db.collection('orders')
        .where('createdAt', '>=', today)
        .get()
        .then(snapshot => {
            let totalOrders = 0;
            let totalRevenue = 0;
            let activeQueue = 0;
            
            snapshot.forEach(doc => {
                const order = doc.data();
                totalOrders++;
                totalRevenue += order.total;
                if (order.status === 'pending' || order.status === 'processing') {
                    activeQueue++;
                }
            });
            
            document.getElementById('totalOrders').textContent = totalOrders;
            document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
            document.getElementById('activeQueue').textContent = activeQueue;
        });
    
    // Get total users
    db.collection('users').get()
        .then(snapshot => {
            document.getElementById('totalUsers').textContent = snapshot.size;
        });
}

// Listen for orders
function listenForOrders() {
    if (!validateAdminAccess()) return;
    
    db.collection('orders')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            orders = [];
            snapshot.forEach(doc => {
                orders.push({ id: doc.id, ...doc.data() });
            });
            
            updateOrdersUI();
            loadAdminStats();
        });
}

// Load orders
function loadOrders() {
    if (!validateAdminAccess()) return;
    
    db.collection('orders')
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            orders = [];
            snapshot.forEach(doc => {
                orders.push({ id: doc.id, ...doc.data() });
            });
            
            updateOrdersUI();
        });
}

// Update orders UI
function updateOrdersUI() {
    if (!validateAdminAccess()) return;
    
    const ordersList = document.getElementById('ordersList');
    const noOrders = document.getElementById('noOrders');
    
    if (orders.length === 0) {
        ordersList.innerHTML = '';
        noOrders.classList.remove('hidden');
    } else {
        noOrders.classList.add('hidden');
        ordersList.innerHTML = '';
        
        orders.forEach(order => {
            const orderItem = document.createElement('div');
            orderItem.className = 'border rounded-lg p-4 hover:shadow-md transition no-select';
            
            let statusColor = '';
            let statusText = '';
            
            switch(order.status) {
                case 'pending':
                    statusColor = 'bg-yellow-100 text-yellow-800';
                    statusText = 'Menunggu';
                    break;
                case 'processing':
                    statusColor = 'bg-blue-100 text-blue-800';
                    statusText = 'Diproses';
                    break;
                case 'ready':
                    statusColor = 'bg-green-100 text-green-800';
                    statusText = 'Siap Diambil';
                    break;
                case 'completed':
                    statusColor = 'bg-gray-100 text-gray-800';
                    statusText = 'Selesai';
                    break;
            }
            
            orderItem.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h4 class="font-semibold">Pesanan #${order.queueNumber}</h4>
                        <p class="text-sm text-gray-600">${formatDate(order.createdAt.toDate())}</p>
                    </div>
                    <span class="px-3 py-1 rounded-full text-sm font-medium ${statusColor}">
                        ${statusText}
                    </span>
                </div>
                
                <div class="mb-3">
                    <p class="text-sm text-gray-600 mb-1">Items:</p>
                    <div class="space-y-1">
                        ${order.items.map(item => `
                            <p class="text-sm">${item.name} x${item.quantity}</p>
                        `).join('')}
                    </div>
                </div>
                
                <div class="flex justify-between items-center">
                    <p class="font-bold text-lg">${formatCurrency(order.total)}</p>
                    <div class="space-x-2">
                        ${order.status === 'pending' ? `
                            <button onclick="updateOrderStatus('${order.id}', 'processing')" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition">
                                Proses
                            </button>
                        ` : ''}
                        ${order.status === 'processing' ? `
                            <button onclick="updateOrderStatus('${order.id}', 'ready')" class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition">
                                Siap
                            </button>
                            <button onclick="callOrder('${order.id}')" class="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition">
                                <i class="fas fa-bell mr-1"></i>Panggil
                            </button>
                        ` : ''}
                        ${order.status === 'ready' ? `
                            <button onclick="updateOrderStatus('${order.id}', 'completed')" class="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition">
                                Selesai
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
            ordersList.appendChild(orderItem);
        });
    }
}

// Update order status
function updateOrderStatus(orderId, newStatus) {
    if (!validateAdminAccess()) return;
    
    showLoading();
    
    db.collection('orders').doc(orderId).update({
        status: newStatus
    }).then(() => {
        hideLoading();
        showSuccess('Status Diperbarui');
    }).catch(error => {
        hideLoading();
        showError('Error', 'Gagal update status: ' + error.message);
    });
}

// Call order
function callOrder(orderId) {
    if (!validateAdminAccess()) return;
    
    const order = orders.find(o => o.id === orderId);
    if (order) {
        showLoading();
        
        // Send notification to user
        sendQueueNotification(order.userId, order.queueNumber)
            .then(() => {
                hideLoading();
                showSuccess('Notifikasi Terkirim', `Pesanan #${order.queueNumber} telah dipanggil`);
            })
            .catch(error => {
                hideLoading();
                showError('Error', 'Gagal mengirim notifikasi: ' + error.message);
            });
    }
}

// Barcode Scanner Functions
function startBarcodeScanner() {
    if (!validateAdminAccess()) return;
    
    const scannerContainer = document.getElementById('scanner-container');
    const barcodeScanner = document.getElementById('barcodeScanner');
    
    barcodeScanner.classList.remove('hidden');
    
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: scannerContainer,
            constraints: {
                width: 640,
                height: 480,
                facingMode: "environment"
            }
        },
        decoder: {
            readers: [
                "code_128_reader",
                "ean_reader",
                "ean_8_reader",
                "code_39_reader"
            ]
        }
    }, function(err) {
        if (err) {
            console.error(err);
            showError('Scanner Error', 'Tidak dapat mengakses kamera');
            return;
        }
        Quagga.start();
    });
    
    Quagga.onDetected(function(result) {
        const code = result.codeResult.code;
        document.getElementById('scannedCode').textContent = code;
        document.getElementById('scanResult').classList.remove('hidden');
        
        // Stop scanner after detection
        stopBarcodeScanner();
        
        // Process the scanned code
        processScannedCode(code);
    });
    
    scanner = Quagga;
}

function stopBarcodeScanner() {
    if (scanner) {
        scanner.stop();
        scanner = null;
    }
    document.getElementById('barcodeScanner').classList.add('hidden');
}

function processScannedCode(code) {
    if (!validateAdminAccess()) return;
    
    // Check if the code matches a queue number
    const order = orders.find(o => o.queueNumber.toString() === code);
    
    if (order) {
        Swal.fire({
            title: 'Pesanan Ditemukan!',
            html: `
                <p><strong>Nomor Antrian:</strong> ${order.queueNumber}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <p><strong>Total:</strong> ${formatCurrency(order.total)}</p>
            `,
            icon: 'info',
            confirmButtonText: 'OK'
        });
    } else {
        showWarning('Kode Tidak Ditemukan', 'Tidak ada pesanan dengan kode tersebut');
    }
}

// Initialize admin app
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if on admin app
    if (window.location.pathname.includes('admin.html')) {
        // Setup event listeners
        document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);
    }
});