// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAKF1eXOowCS35ylhonxvdy9QBiLYLmvzY",
  authDomain: "crht-proj.firebaseapp.com",
  databaseURL: "https://crht-proj-default-rtdb.firebaseio.com",
  projectId: "crht-proj",
  storageBucket: "crht-proj.firebasestorage.app",
  messagingSenderId: "957104910274",
  appId: "1:957104910274:web:5a7463a011d5f68583305b",
  measurementId: "G-4BTK874XF4"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Menu Data
const menuItems = [
    { id: 1, name: 'Nasi Goreng', price: 15000, category: 'makanan', image: 'https://picsum.photos/seed/nasigoreng/300/200.jpg' },
    { id: 2, name: 'Mie Goreng', price: 12000, category: 'makanan', image: 'https://picsum.photos/seed/miegoreng/300/200.jpg' },
    { id: 3, name: 'Ayam Goreng', price: 18000, category: 'makanan', image: 'https://picsum.photos/seed/ayamgoreng/300/200.jpg' },
    { id: 4, name: 'Es Teh', price: 3000, category: 'minuman', image: 'https://picsum.photos/seed/esteh/300/200.jpg' },
    { id: 5, name: 'Es Jeruk', price: 5000, category: 'minuman', image: 'https://picsum.photos/seed/esjeruk/300/200.jpg' },
    { id: 6, name: 'Jus Alpukat', price: 10000, category: 'minuman', image: 'https://picsum.photos/seed/jusalpukat/300/200.jpg' },
    { id: 7, name: 'Kentang Goreng', price: 8000, category: 'snack', image: 'https://picsum.photos/seed/kentang/300/200.jpg' },
    { id: 8, name: 'Pisang Goreng', price: 6000, category: 'snack', image: 'https://picsum.photos/seed/pisang/300/200.jpg' },
    { id: 9, name: 'Sate Ayam', price: 20000, category: 'makanan', image: 'https://picsum.photos/seed/sate/300/200.jpg' },
    { id: 10, name: 'Kopi', price: 5000, category: 'minuman', image: 'https://picsum.photos/seed/kopi/300/200.jpg' }
];

// Global Variables
let currentUser = null;
let cart = [];
let notifications = [];
let orders = [];
let currentCategory = 'all';
let currentQueueNumber = 1;
let scanner = null;

// Security: Prevent right-click and inspect
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') || 
        (e.ctrlKey && e.shiftKey && e.key === 'J') || 
        (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
    }
});