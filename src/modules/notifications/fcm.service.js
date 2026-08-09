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
    console.log(`[FCM] Firebase not initialized. Skipping notification to topic: ${topic}`);
    return false;
  }

  try {
    const message = {
      ...payload,
      topic: topic,
    };

    const response = await getMessaging().send(message);
    console.log(`[FCM] Successfully sent message to topic ${topic}:`, response);
    return true;
  } catch (error) {
    console.error(`[FCM] Error sending message to topic ${topic}:`, error.message);
    return false;
  }
};

module.exports = {
  sendTopicNotification,
};
