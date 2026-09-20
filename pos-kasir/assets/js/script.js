/* ==============================================
   MOCK DATA (Simulasi Database)
============================================== */
let products = [
    { id: "BRG001", nama: "Espresso Coffee", harga: 25000, stok: 50, kategori: "Minuman" },
    { id: "BRG002", nama: "Caramel Macchiato", harga: 35000, stok: 30, kategori: "Minuman" },
    { id: "BRG003", nama: "Red Velvet Cake", harga: 20000, stok: 15, kategori: "Makanan" },
    { id: "BRG004", nama: "Beef Croissant", harga: 28000, stok: 20, kategori: "Makanan" },
    { id: "BRG005", nama: "Matcha Latte", harga: 30000, stok: 40, kategori: "Minuman" }
];

let cart = [];
let transactions = [
    { nota: "TRX-1001", tanggal: "2026-09-10", total: 80000 },
    { nota: "TRX-1002", tanggal: "2026-09-11", total: 55000 }
];

/* ==============================================
   AUTENTIKASI & LAYOUT DASAR
============================================== */
function checkAuth() {
    const isLogin = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    const user = localStorage.getItem('posUser');
    
    if (!user && !isLogin) window.location.href = '../index.html';
    if (user && isLogin) window.location.href = 'pages/dashboard.html';
}

function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    if (user === 'admin' && pass === 'admin123') {
        localStorage.setItem('posUser', 'admin');
        window.location.href = 'pages/dashboard.html';
    } else {
        alert("Username/Password salah! Gunakan admin / admin123");
    }
}

function handleLogout() {
    localStorage.removeItem('posUser');
    window.location.href = '../index.html';
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
}

/* ==============================================
   INISIALISASI HALAMAN
============================================== */
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Sidebar toggle
    const toggleBtn = document.getElementById('toggleSidebarBtn');
    if (toggleBtn) toggleBtn.addEventListener('click', toggleSidebar);
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    // Active menu styling
    const path = window.location.pathname.split('/').pop();
    document.querySelectorAll('.menu-item').forEach(link => {
        if (link.getAttribute('href') === path) link.classList.add('active');
    });

    // Page Specific Logic
    if (document.getElementById('dashboardChart')) initDashboard();
    if (document.getElementById('productGrid')) initKasir();
    if (document.getElementById('tableMasterBody')) initDataMaster();
    if (document.getElementById('tableLaporanBody')) initLaporan();
    
    // Modal closes
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal-overlay').classList.remove('active');
        });
    });
});

/* ==============================================
   DASHBOARD
============================================== */
function initDashboard() {
    document.getElementById('dashPendapatan').innerText = formatRupiah(135000);
    document.getElementById('dashTransaksi').innerText = transactions.length;
    document.getElementById('dashProduk').innerText = products.length;

    const ctx = document.getElementById('dashboardChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
            datasets: [{
                label: 'Pendapatan (Rp)',
                data: [50000, 75000, 60000, 135000, 0, 0, 0],
                borderColor: '#ffffff',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            color: 'white',
            scales: {
                x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }
            },
            plugins: {
                legend: { labels: { color: 'white' } }
            }
        }
    });
}

/* ==============================================
   KASIR (POINT OF SALES)
============================================== */
function initKasir() {
    renderProductGrid();
    updateCartUI();

    document.getElementById('searchMenu').addEventListener('input', (e) => {
        renderProductGrid(e.target.value);
    });

    document.getElementById('formBayar').addEventListener('submit', (e) => {
        e.preventDefault();
        processPayment();
    });
}

function renderProductGrid(keyword = "") {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    
    const filtered = products.filter(p => p.nama.toLowerCase().includes(keyword.toLowerCase()));
    
    filtered.forEach(p => {
        const item = document.createElement('div');
        item.className = 'product-item glass-card';
        // Mock image using initials or generic icon (using fontawesome classes as string)
        item.innerHTML = `
            <div style="font-size: 2.5rem; margin-bottom: 10px;"><i class="fas fa-box-open"></i></div>
            <h4 style="font-size: 0.9rem;">${p.nama}</h4>
            <p class="mb-1">${formatRupiah(p.harga)}</p>
            <small style="background: rgba(0,0,0,0.3); padding: 2px 5px; border-radius: 4px;">Stok: ${p.stok}</small>
        `;
        item.onclick = () => addToCart(p.id);
        grid.appendChild(item);
    });
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    if (!product || product.stok <= 0) return alert('Stok habis!');

    const existing = cart.find(c => c.id === id);
    if (existing) {
        if(existing.qty < product.stok) existing.qty++;
        else alert('Maksimal stok tercapai!');
    } else {
        cart.push({ ...product, qty: 1 });
    }
    updateCartUI();
}

function ubahQty(id, delta) {
    const item = cart.find(c => c.id === id);
    if(item) {
        item.qty += delta;
        if(item.qty <= 0) cart = cart.filter(c => c.id !== id);
    }
    updateCartUI();
}

function updateCartUI() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const inputUang = document.getElementById('inputUang');
    
    cartItems.innerHTML = '';
    let total = 0;

    if(cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align:center; margin-top:2rem; opacity:0.7;">Keranjang Kosong</p>';
    }

    cart.forEach(c => {
        const sub = c.harga * c.qty;
        total += sub;
        cartItems.innerHTML += `
            <div class="cart-item">
                <div>
                    <strong>${c.nama}</strong><br>
                    <small>${formatRupiah(c.harga)}</small>
                </div>
                <div class="cart-controls">
                    <button class="btn btn-icon" style="padding: 2px 6px;" onclick="ubahQty('${c.id}', -1)">-</button>
                    <input type="text" value="${c.qty}" readonly>
                    <button class="btn btn-icon" style="padding: 2px 6px;" onclick="ubahQty('${c.id}', 1)">+</button>
                </div>
            </div>
        `;
    });

    cartTotal.innerText = formatRupiah(total);
    document.getElementById('hiddenTotal').value = total;
    
    // Auto hitung kembalian jika input uang sudah diisi
    inputUang.addEventListener('input', hitungKembalian);
}

function hitungKembalian() {
    const total = parseInt(document.getElementById('hiddenTotal').value) || 0;
    const uang = parseInt(document.getElementById('inputUang').value) || 0;
    const kembaliLabel = document.getElementById('labelKembalian');
    
    if (uang >= total) {
        kembaliLabel.innerText = formatRupiah(uang - total);
        kembaliLabel.style.color = '#00b09b';
    } else {
        kembaliLabel.innerText = "Uang Kurang!";
        kembaliLabel.style.color = '#ff4b2b';
    }
}

function showPaymentModal() {
    if(cart.length === 0) return alert('Keranjang kosong!');
    document.getElementById('modalBayar').classList.add('active');
    document.getElementById('inputUang').value = '';
    document.getElementById('labelKembalian').innerText = 'Rp 0';
}

function processPayment() {
    const total = parseInt(document.getElementById('hiddenTotal').value) || 0;
    const uang = parseInt(document.getElementById('inputUang').value) || 0;
    
    if (uang < total) {
        alert("Uang pembayaran kurang dari total belanja!");
        return;
    }
    
    // Potong stok (Simulasi)
    cart.forEach(c => {
        let p = products.find(prod => prod.id === c.id);
        if(p) p.stok -= c.qty;
    });

    // Catat transaksi
    const trxNo = "TRX-" + Math.floor(Math.random() * 10000);
    transactions.push({
        nota: trxNo,
        tanggal: new Date().toISOString().split('T')[0],
        total: total
    });

    alert(`Transaksi Berhasil!\nNota: ${trxNo}\nKembalian: ${formatRupiah(uang - total)}`);
    
    // Reset
    cart = [];
    document.getElementById('modalBayar').classList.remove('active');
    renderProductGrid();
    updateCartUI();
}

/* ==============================================
   DATA MASTER (BARANG)
============================================== */
function initDataMaster() {
    const tableBody = document.getElementById('tableMasterBody');
    
    function renderTable() {
        tableBody.innerHTML = '';
        products.forEach((p, idx) => {
            tableBody.innerHTML += `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.nama}</td>
                    <td>${p.kategori}</td>
                    <td>${formatRupiah(p.harga)}</td>
                    <td>${p.stok}</td>
                    <td>
                        <button class="btn btn-icon btn-primary" onclick="alert('Edit ${p.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-icon btn-danger" onclick="alert('Hapus ${p.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    }
    renderTable();

    document.getElementById('formTambah').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Fitur tambah data berhasil (Simulasi Client-Side)');
        document.getElementById('modalTambah').classList.remove('active');
    });
}

/* ==============================================
   LAPORAN
============================================== */
function initLaporan() {
    const tableBody = document.getElementById('tableLaporanBody');
    let grandTotal = 0;
    
    transactions.forEach(t => {
        grandTotal += t.total;
        tableBody.innerHTML += `
            <tr>
                <td>${t.nota}</td>
                <td>${t.tanggal}</td>
                <td>Kasir 1</td>
                <td>${formatRupiah(t.total)}</td>
            </tr>
        `;
    });
    
    document.getElementById('lapGrandTotal').innerText = formatRupiah(grandTotal);
}
