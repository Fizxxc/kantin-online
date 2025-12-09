// Utility Functions

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
    }).format(amount);
}

// Format date
function formatDate(date) {
    return new Date(date).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get greeting based on time
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
}

// Play notification sound
function playNotificationSound() {
    const audio = document.getElementById('notificationSound');
    audio.play().catch(e => console.log('Audio play failed:', e));
}

// Show loading
function showLoading() {
    Swal.fire({
        title: 'Loading...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

// Hide loading
function hideLoading() {
    Swal.close();
}

// Show success message
function showSuccess(title, text = '') {
    Swal.fire({
        icon: 'success',
        title: title,
        text: text,
        timer: 1500,
        showConfirmButton: false
    });
}

// Show error message
function showError(title, text = '') {
    Swal.fire({
        icon: 'error',
        title: title,
        text: text
    });
}

// Show warning message
function showWarning(title, text = '') {
    Swal.fire({
        icon: 'warning',
        title: title,
        text: text
    });
}

// Get today's date at midnight
function getTodayMidnight() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

// Check if it's a new day
function isNewDay(lastDate) {
    const today = getTodayMidnight();
    const last = new Date(lastDate);
    last.setHours(0, 0, 0, 0);
    return today > last;
}

// Generate queue number
async function generateQueueNumber() {
    try {
        // Get queue counter from Firestore
        const queueDoc = await db.collection('counters').doc('queue').get();
        
        if (queueDoc.exists) {
            const data = queueDoc.data();
            const lastReset = data.lastReset.toDate();
            
            // Check if it's a new day
            if (isNewDay(lastReset)) {
                // Reset counter
                await db.collection('counters').doc('queue').update({
                    count: 1,
                    lastReset: firebase.firestore.FieldValue.serverTimestamp()
                });
                return 1;
            } else {
                // Increment counter
                const newCount = data.count + 1;
                await db.collection('counters').doc('queue').update({
                    count: newCount
                });
                return newCount;
            }
        } else {
            // Create new counter
            await db.collection('counters').doc('queue').set({
                count: 1,
                lastReset: firebase.firestore.FieldValue.serverTimestamp()
            });
            return 1;
        }
    } catch (error) {
        console.error('Error generating queue number:', error);
        return Math.floor(Math.random() * 100) + 1; // Fallback
    }
}

// Initialize queue counter
async function initializeQueueCounter() {
    try {
        const queueDoc = await db.collection('counters').doc('queue').get();
        
        if (!queueDoc.exists) {
            await db.collection('counters').doc('queue').set({
                count: 0,
                lastReset: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error initializing queue counter:', error);
    }
}

// Security: Validate admin access
function validateAdminAccess() {
    if (currentUser && currentUser.email === 'admin@kantin.com') {
        return true;
    }
    return false;
}

// Security: Validate user access
function validateUserAccess() {
    if (currentUser && currentUser.email !== 'admin@kantin.com') {
        return true;
    }
    return false;
}