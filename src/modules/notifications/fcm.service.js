const { getMessaging } = require('firebase-admin/messaging');
const { getApps } = require('firebase-admin/app');

/**
 * Send an FCM message to a specific topic.
 * @param {string} topic The FCM topic name (e.g., 'inventory_updates')
 * @param {object} payload The notification payload
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
const sendTopicNotification = async (topic, payload) => {
  if (getApps().length === 0) {
    const error = 'Firebase Admin SDK is not initialized on the server.';
    console.warn(`[FCM] ${error} Skipping notification to topic: ${topic}`);
    return { success: false, error };
  }

  try {
    const message = {
      ...payload,
      topic: topic,
    };

    const response = await getMessaging().send(message);
    console.log(`[FCM] Successfully sent message to topic ${topic}:`, response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error(`[FCM] Error sending message to topic ${topic}:`, error.message);
    return { success: false, error: error.message };
  }
};

const sendDeviceNotification = async (token, payload) => {
  if (getApps().length === 0) {
    const error = 'Firebase Admin SDK is not initialized on the server.';
    console.warn(`[FCM] ${error} Skipping device notification.`);
    return { success: false, error };
  }
  try {
    const message = { ...payload, token: token };
    const response = await getMessaging().send(message);
    console.log('[FCM] Successfully sent message to device:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('[FCM] Error sending message to device:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendTopicNotification,
  sendDeviceNotification,
};

