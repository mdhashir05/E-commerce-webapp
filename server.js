const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
let serviceAccount;

// Use emulator for local development if FIREBASE_EMULATOR_HOST is set
if (process.env.FIREBASE_EMULATOR_HOST || !process.env.FIREBASE_PROJECT_ID) {
  // Use emulator
  admin.initializeApp({
    projectId: 'ecommerce-order-management',
  });
  // Connect to emulator
  const firestoreSettings = {
    host: process.env.FIREBASE_EMULATOR_HOST || 'localhost:8080',
    ssl: false,
  };
  admin.firestore().settings(firestoreSettings);
  console.log('Connected to Firebase Emulator');
} else {
  // Use production Firebase
  serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Connected to Firebase Production');
}

const db = admin.firestore();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for development without Firebase
// let orders = [];
// let admins = [];

// Initialize with default admin if none exists
// if (admins.length === 0) {
//   const defaultPassword = 'admin123';
//   const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
//   admins.push({
//     id: 1,
//     username: 'admin',
//     password: hashedPassword
//   });
// }

// Check if admin exists, if not create default admin
async function ensureDefaultAdmin() {
  try {
    const adminRef = db.collection('admins').doc('default');
    const doc = await adminRef.get();
    
    if (!doc.exists) {
      const defaultPassword = 'admin123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      await adminRef.set({
        id: 'default',
        username: 'your wish',
        password: hashedPassword,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('Default admin created');
    }
  } catch (error) {
    console.error('Error ensuring default admin:', error);
  }
}

// Order Schema (for reference)
const OrderSchema = {
  customerName: String,
  phoneNumber: String,
  deliveryAddress: String,
  orderNotes: String,
  productName: String,
  productCategory: String,
  quantity: Number,
  pricePerProduct: Number,
  discount: Number,
  totalPrice: Number,
  orderDate: Date,
  deliveryStatus: String
};

// Admin Schema (for reference)
const AdminSchema = {
  username: String,
  password: String
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes
// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find admin user in Firebase
    const adminRef = db.collection('admins').where('username', '==', username);
    const adminSnapshot = await adminRef.get();
    
    if (adminSnapshot.empty) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const adminDoc = adminSnapshot.docs[0];
    const adminData = adminDoc.data();
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, adminData.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Create JWT token
    const token = jwt.sign({ id: adminData.id, username: adminData.username }, 
      process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '24h' });

    res.json({ token, username: adminData.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all orders
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const ordersSnapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
    const orders = [];
    
    ordersSnapshot.forEach(doc => {
      orders.push({
        id: doc.id,
        orderIdNum: doc.data().orderIdNum,
        ...doc.data()
      });
    });
    
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get order by ID
app.get('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const orderRef = db.collection('orders').doc(req.params.id);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({
      id: orderDoc.id,
      orderIdNum: orderDoc.data().orderIdNum,
      ...orderDoc.data()
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new order
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    // Extract productImage if it exists and handle it separately
    const { productImage, ...orderData } = req.body;
    
    const newOrder = {
      ...orderData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add productImage to the order if it exists
    if (productImage) {
      newOrder.productImage = productImage;
    }
    
    // Generate a sequential order ID
    const ordersCollection = db.collection('orders');
    const ordersSnapshot = await ordersCollection.orderBy('orderIdNum', 'desc').limit(1).get();
    
    let newOrderIdNum = 1;
    if (!ordersSnapshot.empty) {
      const lastOrder = ordersSnapshot.docs[0];
      newOrderIdNum = (lastOrder.data().orderIdNum || 0) + 1;
    }
    
    const orderRef = await ordersCollection.add({
      ...newOrder,
      orderIdNum: newOrderIdNum
    });
    const orderDoc = await orderRef.get();
    
    res.status(201).json({
      id: orderDoc.id,
      orderIdNum: newOrderIdNum,
      ...orderDoc.data()
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update order
app.put('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const orderRef = db.collection('orders').doc(req.params.id);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Extract productImage if it exists and handle it separately
    const { productImage, ...orderData } = req.body;
    
    const updateData = {
      ...orderData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add productImage to the update if it exists
    if (productImage) {
      updateData.productImage = productImage;
    }
    
    await orderRef.update(updateData);
    
    const updatedOrderDoc = await orderRef.get();
    res.json({
      id: updatedOrderDoc.id,
      orderIdNum: updatedOrderDoc.data().orderIdNum,
      ...updatedOrderDoc.data()
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete order
app.delete('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const orderRef = db.collection('orders').doc(req.params.id);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    await orderRef.delete();
    res.json({ message: 'Order deleted' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get analytics
app.get('/api/analytics', authenticateToken, async (req, res) => {
  try {
    const ordersSnapshot = await db.collection('orders').get();
    let totalOrders = 0;
    let deliveredOrders = 0;
    let pendingOrders = 0;
    let revenue = 0;
    
    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      totalOrders++;
      if (order.deliveryStatus === 'Delivered') deliveredOrders++;
      if (order.deliveryStatus === 'Pending') pendingOrders++;
      revenue += order.totalPrice || 0;
    });
    
    res.json({
      totalOrders,
      deliveredOrders,
      pendingOrders,
      revenue
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Serve the main page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await ensureDefaultAdmin(); // Ensure default admin exists
  console.log(`Server running on port ${PORT}`);
});
