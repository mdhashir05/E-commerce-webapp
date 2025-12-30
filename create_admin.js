const admin = require('firebase-admin');
require('dotenv').config();
const bcrypt = require('bcryptjs');

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

async function createAdminUser() {
  try {
    const defaultPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    const adminRef = db.collection('admins').doc('default');
    
    // Check if admin user already exists
    const doc = await adminRef.get();
    
    if (doc.exists) {
      console.log('Admin user already exists. Updating...');
      await adminRef.update({
        username: 'your wish',
        password: hashedPassword
      });
      console.log('Admin user updated with new username "your wish"');
    } else {
      await adminRef.set({
        id: 'default',
        username: 'your wish',
        password: hashedPassword,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('Default admin user created with username "your wish" and password "admin123"');
    }
    
    console.log('Admin user setup complete!');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser().then(() => {
  console.log('Admin user creation process completed.');
  process.exit(0);
});