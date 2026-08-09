const { initializeApp, cert } = require('firebase-admin/app');
const fs = require('fs');
const env = require('./env');

const initializeFirebase = () => {
  try {
    if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      if (fs.existsSync(env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
        const serviceAccount = require(require('path').resolve(env.FIREBASE_SERVICE_ACCOUNT_PATH));
        initializeApp({
          credential: cert(serviceAccount),
        });
        console.log('Firebase Admin SDK initialized successfully.');
      } else {
        console.warn(`Firebase service account file not found at ${env.FIREBASE_SERVICE_ACCOUNT_PATH}. Push notifications will be disabled.`);
      }
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT_PATH not provided. Push notifications will be disabled.');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error.message);
  }
};

module.exports = {
  initializeFirebase,
};
