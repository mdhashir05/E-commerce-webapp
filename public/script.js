// Order Management System - Frontend JavaScript with Firebase

// Global variables
let authToken = localStorage.getItem('authToken');
let currentView = 'dashboard';
let allOrders = [];
let analyticsData = {};
let currentPage = 1;
const ordersPerPage = 10;

// DOM Elements
const loginPage = document.getElementById('loginPage');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const pageTitle = document.getElementById('pageTitle');

// Navigation elements
const dashboardNav = document.getElementById('dashboardNav');
const addOrderNav = document.getElementById('addOrderNav');
const ordersNav = document.getElementById('ordersNav');
const analyticsNav = document.getElementById('analyticsNav');
const settingsNav = document.getElementById('settingsNav');
const logoutBtn = document.getElementById('logoutBtn');
const viewAllOrdersBtn = document.getElementById('viewAllOrdersBtn');

// View containers
const dashboardView = document.getElementById('dashboardView');
const addOrderView = document.getElementById('addOrderView');
const ordersView = document.getElementById('ordersView');
const orderDetailView = document.getElementById('orderDetailView');
const analyticsView = document.getElementById('analyticsView');
const settingsView = document.getElementById('settingsView');

// Form elements
const addOrderForm = document.getElementById('addOrderForm');
const cancelAddOrder = document.getElementById('cancelAddOrder');
const saveAndAddNew = document.getElementById('saveAndAddNew');
const resetForm = document.getElementById('resetForm');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const statusFilter = document.getElementById('statusFilter');
const sortFilter = document.getElementById('sortFilter');
const backToOrders = document.getElementById('backToOrders');
const themeToggle = document.getElementById('themeToggle');
// Dark mode has been removed, so we'll only keep the reference if it exists
// const darkModeToggle = document.getElementById('darkModeToggle');
// const headerThemeToggle = document.getElementById('headerThemeToggle');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    if (authToken) {
        showDashboard();
    } else {
        showLogin();
    }

    // Initialize theme
    initializeTheme();
    
    // Set today's date as default for order date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('orderDate').value = today;
    document.getElementById('editOrderDate').value = today;

    // Add event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', handleLogin);
    
    // Navigation
    dashboardNav.addEventListener('click', (e) => { e.preventDefault(); showView('dashboard'); });
    addOrderNav.addEventListener('click', (e) => { e.preventDefault(); showView('addOrder'); });
    ordersNav.addEventListener('click', (e) => { e.preventDefault(); showView('orders'); });
    analyticsNav.addEventListener('click', (e) => { e.preventDefault(); showView('analytics'); });
    settingsNav.addEventListener('click', (e) => { e.preventDefault(); showView('settings'); });
    logoutBtn.addEventListener('click', (e) => { e.preventDefault(); logout(); });
    viewAllOrdersBtn.addEventListener('click', (e) => { showView('orders'); });
    
    // Add order form
    addOrderForm.addEventListener('submit', handleAddOrder);
    cancelAddOrder.addEventListener('click', () => showView('dashboard'));
    saveAndAddNew.addEventListener('click', handleSaveAndAddNew);
    resetForm.addEventListener('click', resetAddOrderForm);
    
    // Search and filter
    searchBtn.addEventListener('click', () => { currentPage = 1; loadOrders(); });
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { currentPage = 1; loadOrders(); }
    });
    statusFilter.addEventListener('change', () => { currentPage = 1; loadOrders(); });
    sortFilter.addEventListener('change', () => { currentPage = 1; loadOrders(); });
    
    // Back buttons
    backToOrders.addEventListener('click', () => showView('orders'));
    
    // Theme toggle - dark mode removed
    // Removed all theme toggle event listeners
    
    // Auto-calculate total price
    document.getElementById('quantity').addEventListener('input', calculateTotalPrice);
    document.getElementById('pricePerProduct').addEventListener('input', calculateTotalPrice);
    document.getElementById('discount').addEventListener('input', calculateTotalPrice);
    
    // Edit form auto-calculate
    document.getElementById('editQuantity').addEventListener('input', calculateEditTotalPrice);
    document.getElementById('editPricePerProduct').addEventListener('input', calculateEditTotalPrice);
    document.getElementById('editDiscount').addEventListener('input', calculateEditTotalPrice);
}

function toggleTheme() {
    // Dark mode has been removed, so just ensure the toggle is unchecked
    if (themeToggle) themeToggle.checked = false;
}

// Initialize theme on page load
function initializeTheme() {
    // Dark mode has been removed
    // Reset theme toggle to unchecked
    if (themeToggle) themeToggle.checked = false;
}

function enableDarkMode() {
    // Dark mode has been removed
}

function enableLightMode() {
    // Dark mode has been removed
}

function showLogin() {
    loginPage.classList.remove('d-none');
    dashboard.classList.add('d-none');
    currentView = 'login';
}

function showDashboard() {
    loginPage.classList.add('d-none');
    dashboard.classList.remove('d-none');
    currentView = 'dashboard';
    pageTitle.textContent = 'Dashboard';
    
    // Update active navigation
    updateActiveNav('dashboardNav');
    
    // Load dashboard data
    loadDashboardData();
}

function showView(view) {
    // Hide all views
    dashboardView.classList.add('d-none');
    addOrderView.classList.add('d-none');
    ordersView.classList.add('d-none');
    orderDetailView.classList.add('d-none');
    analyticsView.classList.add('d-none');
    settingsView.classList.add('d-none');
    
    // Update navigation
    switch(view) {
        case 'dashboard':
            dashboardView.classList.remove('d-none');
            pageTitle.textContent = 'Dashboard';
            updateActiveNav('dashboardNav');
            loadDashboardData();
            break;
        case 'addOrder':
            addOrderView.classList.remove('d-none');
            pageTitle.textContent = 'Add New Order';
            updateActiveNav('addOrderNav');
            resetAddOrderForm();
            break;
        case 'orders':
            ordersView.classList.remove('d-none');
            pageTitle.textContent = 'All Orders';
            updateActiveNav('ordersNav');
            loadOrders();
            break;
        case 'orderDetail':
            orderDetailView.classList.remove('d-none');
            pageTitle.textContent = 'Order Details';
            updateActiveNav(null); // No active nav for detail view
            break;
        case 'analytics':
            analyticsView.classList.remove('d-none');
            pageTitle.textContent = 'Analytics';
            updateActiveNav('analyticsNav');
            loadAnalytics();
            break;
        case 'settings':
            settingsView.classList.remove('d-none');
            pageTitle.textContent = 'Settings';
            updateActiveNav('settingsNav');
            break;
    }
    
    currentView = view;
}

function updateActiveNav(activeNavId) {
    // Remove active class from all nav items
    [dashboardNav, addOrderNav, ordersNav, analyticsNav, settingsNav].forEach(nav => {
        nav.classList.remove('active');
    });
    
    // Add active class to specified nav item
    const activeNav = document.getElementById(activeNavId);
    if (activeNav) {
        activeNav.classList.add('active');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            authToken = data.token;
            localStorage.setItem('authToken', data.token);
            showDashboard();
        } else {
            if (response.status === 401) {
                showToast('Login Failed', 'Invalid username or password. Please check your credentials.', 'error');
            } else {
                showToast('Login Error', `Server error: ${response.status}`, 'error');
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Error', 'Login failed: ' + error.message, 'error');
    }
}

function logout() {
    authToken = null;
    localStorage.removeItem('authToken');
    showLogin();
}

function resetAddOrderForm() {
    document.getElementById('addOrderForm').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('orderDate').value = today;
    document.getElementById('deliveryStatus').value = 'Pending';
    document.getElementById('discount').value = '0';
    calculateTotalPrice(); // Reset total price
}

function calculateTotalPrice() {
    const quantity = parseFloat(document.getElementById('quantity').value) || 0;
    const price = parseFloat(document.getElementById('pricePerProduct').value) || 0;
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    
    let totalPrice = quantity * price;
    if (discount > 0) {
        totalPrice = totalPrice - (totalPrice * (discount / 100));
    }
    
    document.getElementById('totalPrice').value = totalPrice.toFixed(2);
}

function calculateEditTotalPrice() {
    const quantity = parseFloat(document.getElementById('editQuantity').value) || 0;
    const price = parseFloat(document.getElementById('editPricePerProduct').value) || 0;
    const discount = parseFloat(document.getElementById('editDiscount').value) || 0;
    
    let totalPrice = quantity * price;
    if (discount > 0) {
        totalPrice = totalPrice - (totalPrice * (discount / 100));
    }
    
    document.getElementById('editTotalPrice').value = totalPrice.toFixed(2);
}

async function handleAddOrder(e) {
    e.preventDefault();
    
    // Handle product image upload first
    const productImageFile = document.getElementById('productImage').files[0];
    const orderData = {
        customerName: document.getElementById('customerName').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        deliveryAddress: document.getElementById('deliveryAddress').value,
        orderNotes: document.getElementById('orderNotes').value,
        productName: document.getElementById('productName').value,
        productCategory: document.getElementById('productCategory').value,
        quantity: parseInt(document.getElementById('quantity').value),
        pricePerProduct: parseFloat(document.getElementById('pricePerProduct').value),
        discount: parseFloat(document.getElementById('discount').value) || 0,
        totalPrice: parseFloat(document.getElementById('totalPrice').value),
        orderDate: document.getElementById('orderDate').value,
        deliveryStatus: document.getElementById('deliveryStatus').value
    };

    if (productImageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            orderData.productImage = e.target.result; // Store as base64
            submitOrder(orderData);
        };
        reader.onerror = function() {
            console.error('Error reading image file');
            showToast('Error', 'Error reading image file', 'error');
        };
        reader.readAsDataURL(productImageFile);
    } else {
        submitOrder(orderData);
    }
}

function submitOrder(orderData) {
    fetch('/api/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Token is invalid or expired, redirect to login
                logout();
                showToast('Session Expired', 'Please log in again', 'error');
                return;
            }
            throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
    })
    .then(newOrder => {
        showToast('Success', 'Order added successfully!', 'success');
        showView('dashboard');
        loadDashboardData(); // Refresh dashboard data
        
        // Refresh the orders list if we're on the orders page
        if (currentView === 'orders') {
            loadOrders();
        }
    })
    .catch(error => {
        console.error('Error adding order:', error);
        showToast('Error', 'Error adding order: ' + error.message, 'error');
    });
}

async function handleSaveAndAddNew() {
    // Handle product image upload first
    const productImageFile = document.getElementById('productImage').files[0];
    const orderData = {
        customerName: document.getElementById('customerName').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        deliveryAddress: document.getElementById('deliveryAddress').value,
        orderNotes: document.getElementById('orderNotes').value,
        productName: document.getElementById('productName').value,
        productCategory: document.getElementById('productCategory').value,
        quantity: parseInt(document.getElementById('quantity').value),
        pricePerProduct: parseFloat(document.getElementById('pricePerProduct').value),
        discount: parseFloat(document.getElementById('discount').value) || 0,
        totalPrice: parseFloat(document.getElementById('totalPrice').value),
        orderDate: document.getElementById('orderDate').value,
        deliveryStatus: document.getElementById('deliveryStatus').value
    };

    if (productImageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            orderData.productImage = e.target.result; // Store as base64
            submitOrderSaveAndNew(orderData);
        };
        reader.onerror = function() {
            console.error('Error reading image file');
            showToast('Error', 'Error reading image file', 'error');
        };
        reader.readAsDataURL(productImageFile);
    } else {
        submitOrderSaveAndNew(orderData);
    }
}

function submitOrderSaveAndNew(orderData) {
    fetch('/api/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Token is invalid or expired, redirect to login
                logout();
                showToast('Session Expired', 'Please log in again', 'error');
                return;
            }
            throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
    })
    .then(newOrder => {
        showToast('Success', 'Order added successfully!', 'success');
        resetAddOrderForm();
        
        // Refresh the orders list if we're on the orders page
        if (currentView === 'orders') {
            loadOrders();
        }
        
        // Also refresh dashboard if we're on dashboard
        if (currentView === 'dashboard') {
            loadDashboardData();
        }
    })
    .catch(error => {
        console.error('Error adding order:', error);
        showToast('Error', 'Error adding order: ' + error.message, 'error');
    });
}

async function loadOrders() {
    const searchQuery = searchInput.value.trim();
    const statusFilterValue = statusFilter.value;
    const sortValue = sortFilter.value;
    
    try {
        const response = await fetch('/api/orders', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Token is invalid or expired, redirect to login
                logout();
                showToast('Session Expired', 'Please log in again', 'error');
                return;
            }
            throw new Error(`Server error: ${response.status}`);
        }
        
        let orders = await response.json();
        
        // Apply client-side filtering and sorting
        let filteredOrders = orders;
        
        // Apply search filter
        if (searchQuery) {
            filteredOrders = filteredOrders.filter(order => 
                order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        // Apply status filter
        if (statusFilterValue) {
            filteredOrders = filteredOrders.filter(order => 
                order.deliveryStatus === statusFilterValue
            );
        }
        
        // Apply sorting
        filteredOrders.sort((a, b) => {
            switch(sortValue) {
                case 'date-desc':
                    return new Date(b.orderDate) - new Date(a.orderDate);
                case 'date-asc':
                    return new Date(a.orderDate) - new Date(b.orderDate);
                case 'price-desc':
                    return b.totalPrice - a.totalPrice;
                case 'price-asc':
                    return a.totalPrice - b.totalPrice;
                default:
                    return new Date(b.orderDate) - new Date(a.orderDate);
            }
        });
        
        allOrders = filteredOrders;
        displayOrders(filteredOrders);
        setupPagination(filteredOrders);
    } catch (error) {
        console.error('Error loading orders:', error);
        showToast('Error', 'Error loading orders: ' + error.message, 'error');
    }
}

function displayOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No orders found</td></tr>';
        return;
    }
    
    // Calculate start and end indices for pagination
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const ordersToShow = orders.slice(startIndex, endIndex);
    
    tbody.innerHTML = ordersToShow.map(order => {
        const orderDate = new Date(order.orderDate).toLocaleDateString();
        const statusClass = getStatusClass(order.deliveryStatus);
        
        return `
            <tr>
                <td>${order.orderIdNum ? '#' + order.orderIdNum.toString().padStart(4, '0') : (order._id || order.id) ? (order._id || order.id).substring(0, 8) + '...' : 'N/A'}</td>
                <td>${order.customerName}</td>
                <td>${order.phoneNumber}</td>
                <td>
                    ${order.productImage ? `<img src="${order.productImage}" alt="Product" class="img-fluid rounded" style="max-height: 40px; object-fit: contain; margin-right: 8px;">` : ''}
                    ${order.productName}
                </td>
                <td>₹${order.totalPrice.toFixed(2)}</td>
                <td><span class="status-badge ${statusClass}">${order.deliveryStatus}</span></td>
                <td>${orderDate}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="viewOrderDetails('${order.id}')">View</button>
                    <button class="btn btn-sm btn-outline-secondary me-1" onclick="editOrder('${order.id}')">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteOrder('${order.id}')">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function setupPagination(orders) {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(orders.length / ordersPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>
        </li>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
        </li>
    `;
    
    pagination.innerHTML = paginationHTML;
}

function changePage(page) {
    if (page < 1 || page > Math.ceil(allOrders.length / ordersPerPage)) {
        return;
    }
    currentPage = page;
    displayOrders(allOrders);
    setupPagination(allOrders);
}

function getStatusClass(status) {
    switch(status) {
        case 'Pending': return 'status-pending';
        case 'On the Way': return 'status-onway';
        case 'Delivered': return 'status-delivered';
        case 'Not Delivered / Cancelled': return 'status-cancelled';
        default: return 'status-pending';
    }
}

async function viewOrderDetails(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Token is invalid or expired, redirect to login
                logout();
                showToast('Session Expired', 'Please log in again', 'error');
                return;
            }
            if (response.status === 404) {
                showToast('Error', 'Order not found', 'error');
                return;
            }
            throw new Error(`Server error: ${response.status}`);
        }
        
        const order = await response.json();
        displayOrderDetails(order);
        showView('orderDetail');
    } catch (error) {
        console.error('Error loading order details:', error);
        showToast('Error', 'Error loading order details: ' + error.message, 'error');
    }
}

function displayOrderDetails(order) {
    const content = document.getElementById('orderDetailContent');
    const orderDate = new Date(order.orderDate).toLocaleDateString();
    const statusClass = getStatusClass(order.deliveryStatus);
    
    content.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6>Customer Information</h6>
                <table class="table table-borderless">
                    <tr>
                        <td><strong>Name:</strong></td>
                        <td>${order.customerName}</td>
                    </tr>
                    <tr>
                        <td><strong>Phone:</strong></td>
                        <td>${order.phoneNumber}</td>
                    </tr>
                    <tr>
                        <td><strong>Address:</strong></td>
                        <td>${order.deliveryAddress}</td>
                    </tr>
                    ${order.orderNotes ? `<tr>
                        <td><strong>Notes:</strong></td>
                        <td>${order.orderNotes}</td>
                    </tr>` : ''}
                </table>
            </div>
            <div class="col-md-6">
                <h6>Order Information</h6>
                <table class="table table-borderless">
                    <tr>
                        <td><strong>Product:</strong></td>
                        <td>${order.productName}</td>
                    </tr>
                    <tr>
                        <td><strong>Category:</strong></td>
                        <td>${order.productCategory || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Quantity:</strong></td>
                        <td>${order.quantity}</td>
                    </tr>
                    <tr>
                        <td><strong>Price per Product:</strong></td>
                        <td>₹${order.pricePerProduct.toFixed(2)}</td>
                    </tr>
                    ${order.discount > 0 ? `<tr>
                        <td><strong>Discount:</strong></td>
                        <td>${order.discount}%</td>
                    </tr>` : ''}
                    <tr>
                        <td><strong>Total Price:</strong></td>
                        <td>₹${order.totalPrice.toFixed(2)}</td>
                    </tr>
                </table>
            </div>
        </div>
        
        ${order.productImage ? `
        <div class="row mt-3">
            <div class="col-12">
                <h6>Product Image</h6>
                <div class="text-center">
                    <img src="${order.productImage}" alt="Product Image" class="img-fluid rounded" style="max-height: 200px; object-fit: contain;">
                </div>
            </div>
        </div>
        ` : ''}
        
        <div class="row mt-3">
            <div class="col-md-6">
                <h6>Order Details</h6>
                <table class="table table-borderless">
                    <tr>
                        <td><strong>Order ID:</strong></td>
                        <td>${order.orderIdNum ? '#' + order.orderIdNum.toString().padStart(4, '0') : order.id}</td>
                    </tr>
                    <tr>
                        <td><strong>Order Date:</strong></td>
                        <td>${orderDate}</td>
                    </tr>
                    <tr>
                        <td><strong>Delivery Status:</strong></td>
                        <td><span class="status-badge ${statusClass}">${order.deliveryStatus}</span></td>
                    </tr>
                </table>
            </div>
        </div>
        
        <div class="mt-4">
            <button class="btn btn-primary me-2" onclick="editOrder('${order.id}')">Edit Order</button>
            <button class="btn btn-danger" onclick="deleteOrder('${order.id}')">Delete Order</button>
        </div>
    `;
}

async function editOrder(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Token is invalid or expired, redirect to login
                logout();
                showToast('Session Expired', 'Please log in again', 'error');
                return;
            }
            if (response.status === 404) {
                showToast('Error', 'Order not found', 'error');
                return;
            }
            throw new Error(`Server error: ${response.status}`);
        }
        
        const order = await response.json();
        
        // Populate the edit form
        document.getElementById('editOrderId').value = order._id || order.id;
        document.getElementById('editCustomerName').value = order.customerName;
        document.getElementById('editPhoneNumber').value = order.phoneNumber;
        document.getElementById('editDeliveryAddress').value = order.deliveryAddress;
        document.getElementById('editOrderNotes').value = order.orderNotes || '';
        document.getElementById('editProductName').value = order.productName;
        document.getElementById('editProductCategory').value = order.productCategory || '';
        document.getElementById('editQuantity').value = order.quantity;
        document.getElementById('editPricePerProduct').value = order.pricePerProduct;
        document.getElementById('editDiscount').value = order.discount || 0;
        document.getElementById('editTotalPrice').value = order.totalPrice;
        document.getElementById('editOrderDate').value = order.orderDate.split('T')[0];
        document.getElementById('editDeliveryStatus').value = order.deliveryStatus;
        
        // Show the modal
        const editModal = new bootstrap.Modal(document.getElementById('editOrderModal'));
        editModal.show();
        
        // Set up save button
        document.getElementById('saveOrderChanges').onclick = () => saveOrderChanges(order._id || order.id);
    } catch (error) {
        console.error('Error loading order for edit:', error);
        showToast('Error', 'Error loading order for edit: ' + error.message, 'error');
    }
}

async function saveOrderChanges(orderId) {
    const orderData = {
        customerName: document.getElementById('editCustomerName').value,
        phoneNumber: document.getElementById('editPhoneNumber').value,
        deliveryAddress: document.getElementById('editDeliveryAddress').value,
        orderNotes: document.getElementById('editOrderNotes').value,
        productName: document.getElementById('editProductName').value,
        productCategory: document.getElementById('editProductCategory').value,
        quantity: parseInt(document.getElementById('editQuantity').value),
        pricePerProduct: parseFloat(document.getElementById('editPricePerProduct').value),
        discount: parseFloat(document.getElementById('editDiscount').value) || 0,
        totalPrice: parseFloat(document.getElementById('editTotalPrice').value),
        orderDate: document.getElementById('editOrderDate').value,
        deliveryStatus: document.getElementById('editDeliveryStatus').value
    };

    // Handle product image upload
    const productImageFile = document.getElementById('editProductImage').files[0];
    if (productImageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            orderData.productImage = e.target.result; // Store as base64
            submitOrderUpdate(orderId, orderData);
        };
        reader.onerror = function() {
            console.error('Error reading image file');
            showToast('Error', 'Error reading image file', 'error');
        };
        reader.readAsDataURL(productImageFile);
    } else {
        submitOrderUpdate(orderId, orderData);
    }
}

function submitOrderUpdate(orderId, orderData) {
    fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Token is invalid or expired, redirect to login
                logout();
                showToast('Session Expired', 'Please log in again', 'error');
                return;
            }
            throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
    })
    .then(updatedOrder => {
        // Close modal
        const editModal = bootstrap.Modal.getInstance(document.getElementById('editOrderModal'));
        editModal.hide();
        
        showToast('Success', 'Order updated successfully!', 'success');
        
        // Refresh the orders list if we're on the orders page
        if (currentView === 'orders') {
            loadOrders();
        }
        
        // Also refresh dashboard if we're on dashboard
        if (currentView === 'dashboard') {
            loadDashboardData();
        }
    })
    .catch(error => {
        console.error('Error updating order:', error);
        showToast('Error', 'Error updating order: ' + error.message, 'error');
    });
}

async function deleteOrder(orderId) {
    if (confirm('Are you sure you want to delete this order?')) {
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // Token is invalid or expired, redirect to login
                    logout();
                    showToast('Session Expired', 'Please log in again', 'error');
                    return;
                }
                throw new Error(`Server error: ${response.status}`);
            }
            
            showToast('Success', 'Order deleted successfully!', 'success');
            
            // Refresh the orders list if we're on the orders page
            if (currentView === 'orders') {
                loadOrders();
            }
            
            // Also refresh dashboard if we're on dashboard
            if (currentView === 'dashboard') {
                loadDashboardData();
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            showToast('Error', 'Error deleting order: ' + error.message, 'error');
        }
    }
}

async function loadDashboardData() {
    // Load analytics data
    try {
        const response = await fetch('/api/analytics', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Token is invalid or expired, redirect to login
                logout();
                showToast('Session Expired', 'Please log in again', 'error');
                return;
            }
            throw new Error(`Server error: ${response.status}`);
        }
        
        analyticsData = await response.json();
        
        // Update dashboard stats
        document.getElementById('totalOrders').textContent = analyticsData.totalOrders;
        document.getElementById('deliveredOrders').textContent = analyticsData.deliveredOrders;
        document.getElementById('pendingOrders').textContent = analyticsData.pendingOrders;
        document.getElementById('totalRevenue').textContent = '₹' + analyticsData.revenue.toFixed(2);
        
        // Load recent orders
        loadRecentOrders();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Error', 'Error loading dashboard data: ' + error.message, 'error');
    }
}

async function loadRecentOrders() {
    try {
        const response = await fetch('/api/orders', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Token is invalid or expired, redirect to login
                logout();
                showToast('Session Expired', 'Please log in again', 'error');
                return;
            }
            throw new Error(`Server error: ${response.status}`);
        }
        
        let orders = await response.json();
        
        // Sort by date (newest first) and take top 5
        const recentOrders = orders
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
            .slice(0, 5);
        
        const container = document.getElementById('recentOrdersList');
        
        if (recentOrders.length === 0) {
            container.innerHTML = '<p class="text-center text-muted py-4">No orders found</p>';
            return;
        }
        
        container.innerHTML = recentOrders.map(order => {
            const orderDate = new Date(order.orderDate).toLocaleDateString();
            const statusClass = getStatusClass(order.deliveryStatus);
            
            return `
                <div class="order-card card mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">${order.customerName}</h6>
                                <p class="card-text">
                                    <small class="text-muted">${order.productName}</small><br>
                                    <strong>₹${order.totalPrice.toFixed(2)}</strong>
                                </p>
                            </div>
                            <div class="text-end">
                                <span class="status-badge ${statusClass}">${order.deliveryStatus}</span><br>
                                <small class="text-muted">${orderDate}</small>
                            </div>
                        </div>
                        ${order.productImage ? `
                        <div class="mt-2 text-center">
                            <img src="${order.productImage}" alt="Product" class="img-fluid rounded" style="max-height: 80px; object-fit: contain;">
                        </div>
                        ` : ''}
                        <div class="mt-2">
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="viewOrderDetails('${order.id}')">View</button>
                            <button class="btn btn-sm btn-outline-secondary me-1" onclick="editOrder('${order.id}')">Edit</button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteOrder('${order.id}')">Delete</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading recent orders:', error);
        document.getElementById('recentOrdersList').innerHTML = '<p class="text-center text-muted py-4">Error loading recent orders</p>';
    }
}

async function loadAnalytics() {
    // Load analytics data
    try {
        const response = await fetch('/api/analytics', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Token is invalid or expired, redirect to login
                logout();
                showToast('Session Expired', 'Please log in again', 'error');
                return;
            }
            throw new Error(`Server error: ${response.status}`);
        }
        
        analyticsData = await response.json();
        
        // Update analytics stats
        document.getElementById('analyticsTotalOrders').textContent = analyticsData.totalOrders;
        document.getElementById('analyticsDeliveredOrders').textContent = analyticsData.deliveredOrders;
        document.getElementById('analyticsPendingOrders').textContent = analyticsData.pendingOrders;
        document.getElementById('analyticsTotalRevenue').textContent = '₹' + analyticsData.revenue.toFixed(2);
        
        // Draw status chart
        drawStatusChart();
    } catch (error) {
        console.error('Error loading analytics:', error);
        showToast('Error', 'Error loading analytics: ' + error.message, 'error');
    }
}

function drawStatusChart() {
    const canvasElement = document.getElementById('statusChart');
    if (!canvasElement) {
        console.error('Status chart canvas element not found');
        return;
    }
    
    const ctx = canvasElement.getContext('2d');
    if (!ctx) {
        console.error('Could not get canvas context');
        return;
    }
    
    // Calculate counts for each status
    const statusCounts = {
        Pending: 0,
        'On the Way': 0,
        Delivered: 0,
        'Not Delivered / Cancelled': 0
    };
    
    // Make sure allOrders is populated
    if (!allOrders || allOrders.length === 0) {
        // If allOrders is empty, fetch orders for the chart
        fetch('/api/orders', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // Token is invalid or expired, redirect to login
                    logout();
                    showToast('Session Expired', 'Please log in again', 'error');
                    return Promise.reject(new Error('Session expired'));
                }
                throw new Error(`Server error: ${response.status}`);
            }
            return response.json();
        })
        .then(orders => {
            // Reset counts
            for (let key in statusCounts) {
                statusCounts[key] = 0;
            }
            
            orders.forEach(order => {
                if (statusCounts.hasOwnProperty(order.deliveryStatus)) {
                    statusCounts[order.deliveryStatus]++;
                }
            });
            
            // Prepare data for chart
            const labels = Object.keys(statusCounts);
            const data = Object.values(statusCounts);
            const backgroundColors = [
                'rgba(251, 191, 36, 0.7)',   // Pending - amber
                'rgba(59, 130, 246, 0.7)',   // On the Way - blue
                'rgba(16, 185, 129, 0.7)',   // Delivered - green
                'rgba(239, 68, 68, 0.7)'     // Cancelled - red
            ];
            
            // Destroy existing chart if it exists
            if (window.statusChart) {
                try {
                    window.statusChart.destroy();
                } catch (error) {
                    console.warn('Error destroying chart:', error);
                }
            }
            
            // Create new chart
            try {
                window.statusChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: backgroundColors,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Error creating chart:', error);
            }
        })
        .catch(error => {
            console.error('Error loading orders for chart:', error);
            // Optionally display an error message on the chart
            if (window.statusChart) {
                try {
                    window.statusChart.destroy();
                } catch (err) {
                    console.warn('Error destroying chart in catch block:', err);
                }
            }
        });
        return;
    }
    
    // Reset counts
    for (let key in statusCounts) {
        statusCounts[key] = 0;
    }
    
    allOrders.forEach(order => {
        if (statusCounts.hasOwnProperty(order.deliveryStatus)) {
            statusCounts[order.deliveryStatus]++;
        }
    });
    
    // Prepare data for chart
    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);
    const backgroundColors = [
        'rgba(251, 191, 36, 0.7)',   // Pending - amber
        'rgba(59, 130, 246, 0.7)',   // On the Way - blue
        'rgba(16, 185, 129, 0.7)',   // Delivered - green
        'rgba(239, 68, 68, 0.7)'     // Cancelled - red
    ];
    
    // Destroy existing chart if it exists
    if (window.statusChart) {
        try {
            window.statusChart.destroy();
        } catch (error) {
            console.warn('Error destroying chart:', error);
        }
    }
    
    // Create new chart
    try {
        window.statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating chart:', error);
    }
}

function showToast(title, message, type) {
    const toastElement = document.getElementById('toast');
    const toastTitle = document.getElementById('toastTitle');
    const toastBody = document.getElementById('toastBody');
    
    toastTitle.textContent = title;
    toastBody.textContent = message;
    
    // Set toast color based on type
    const toastHeader = toastElement.querySelector('.toast-header');
    toastHeader.className = 'toast-header';
    
    switch(type) {
        case 'success':
            toastHeader.classList.add('bg-success', 'text-white');
            break;
        case 'error':
            toastHeader.classList.add('bg-danger', 'text-white');
            break;
        case 'warning':
            toastHeader.classList.add('bg-warning');
            break;
        default:
            toastHeader.classList.add('bg-primary', 'text-white');
    }
    
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}