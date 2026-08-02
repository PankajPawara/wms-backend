const PartsMaster = require('../../models/PartsMaster.model');
const ActivityLog = require('../../models/ActivityLog.model');

/**
 * Get all Parts Master records, sorted by most recently seen
 * @param {string} search Optional search query
 */
const getParts = async (search) => {
  let query = {};
  if (search) {
    query = {
      $or: [
        { partNo: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ]
    };
  }
  return await PartsMaster.find(query).sort({ lastSeenAt: -1 }).limit(100);
};

/**
 * Update a part's details (admin/stock_manager only)
 */
const updatePart = async (partNo, updateData, userId) => {
  const part = await PartsMaster.findOneAndUpdate(
    { partNo },
    { $set: updateData },
    { new: true }
  );

  if (part) {
    await ActivityLog.create({
      user_id: userId,
      event_type: 'PART_UPDATED',
      description: `User manually updated part: ${partNo}`,
    });
  }

  return part;
};

module.exports = { getParts, updatePart };
