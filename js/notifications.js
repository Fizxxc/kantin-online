// Notification Functions

// Listen for notifications
function listenForNotifications() {
    if (!validateUserAccess()) return;
    
    db.collection('notifications')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            notifications = [];
            snapshot.forEach(doc => {
                notifications.push({ id: doc.id, ...doc.data() });
            });
            
            updateNotificationUI();
            checkForQueueNotifications();
        });
}

// Update notification UI
function updateNotificationUI() {
    if (!validateUserAccess()) return;
    
    const notificationCount = document.getElementById('notificationCount');
    const notificationsList = document.getElementById('notificationsList');
    const noNotifications = document.getElementById('noNotifications');
    
    // Update notification count
    const unreadCount = notifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
        notificationCount.textContent = unreadCount;
        notificationCount.classList.remove('hidden');
    } else {
        notificationCount.classList.add('hidden');
    }
    
    // Update notifications list
    if (notifications.length === 0) {
        notificationsList.innerHTML = '';
        noNotifications.classList.remove('hidden');
    } else {
        noNotifications.classList.add('hidden');
        notificationsList.innerHTML = '';
        
        notifications.forEach(notification => {
            const notificationItem = document.createElement('div');
            notificationItem.className = `p-4 rounded-lg ${notification.read ? 'bg-gray-50' : 'bg-blue-50'} border-l-4 ${notification.read ? 'border-gray-300' : 'border-blue-500'}`;
            notificationItem.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold ${notification.read ? 'text-gray-700' : 'text-blue-700'}">${notification.title}</h4>
                        <p class="text-sm text-gray-600 mt-1">${notification.message}</p>
                        <p class="text-xs text-gray-500 mt-2">${formatDate(notification.createdAt.toDate())}</p>
                    </div>
                    ${!notification.read ? '<i class="fas fa-circle text-blue-500 text-xs"></i>' : ''}
                </div>
            `;
            notificationsList.appendChild(notificationItem);
            
            // Mark as read
            if (!notification.read) {
                db.collection('notifications').doc(notification.id).update({ read: true });
            }
        });
    }
}

// Check for queue notifications
function checkForQueueNotifications() {
    if (!validateUserAccess()) return;
    
    const unreadNotifications = notifications.filter(n => !n.read && n.type === 'queue');
    
    unreadNotifications.forEach(notification => {
        if (notification.message.includes('siap diambil')) {
            // Show SweetAlert notification
            Swal.fire({
                title: 'Pesanan Siap Diambil!',
                text: notification.message,
                icon: 'success',
                confirmButtonText: 'OK',
                allowOutsideClick: false,
                didOpen: () => {
                    // Play notification sound
                    playNotificationSound();
                    
                    // Speak the notification
                    speakNotification(notification.message);
                }
            });
        }
    });
}

// Speak notification
function speakNotification(message) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'id-ID';
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
    }
}

// Show notifications modal
function showNotifications() {
    if (!validateUserAccess()) return;
    document.getElementById('notificationsModal').classList.remove('hidden');
}

// Hide notifications modal
function hideNotifications() {
    document.getElementById('notificationsModal').classList.add('hidden');
}

// Create notification
async function createNotification(userId, title, message, type = 'general') {
    try {
        await db.collection('notifications').add({
            userId: userId,
            title: title,
            message: message,
            type: type,
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

// Send queue notification
async function sendQueueNotification(userId, queueNumber) {
    const message = `Antrian nomor ${queueNumber}, silahkan ambil pesanan Anda`;
    await createNotification(userId, 'Pesanan Siap Diambil!', message, 'queue');
}