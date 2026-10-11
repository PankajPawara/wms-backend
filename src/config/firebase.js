const { initializeApp, cert } = require('firebase-admin/app');
const fs = require('fs');
const env = require('./env');

const initializeFirebase = () => {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (_) {
        const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decoded);
      }
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully via FIREBASE_SERVICE_ACCOUNT env.');
      return;
    }

    if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      if (fs.existsSync(env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
        const serviceAccount = require(require('path').resolve(env.FIREBASE_SERVICE_ACCOUNT_PATH));
        initializeApp({
          credential: cert(serviceAccount),
        });
        console.log('Firebase Admin SDK initialized successfully via file.');
      } else {
        console.warn(`Firebase service account file not found at ${env.FIREBASE_SERVICE_ACCOUNT_PATH}. Push notifications will be disabled.`);
      }
    } else {
      console.warn('Neither FIREBASE_SERVICE_ACCOUNT nor FIREBASE_SERVICE_ACCOUNT_PATH provided. Push notifications will be disabled.');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error.message);
  }
};

module.exports = {
  initializeFirebase,
};
