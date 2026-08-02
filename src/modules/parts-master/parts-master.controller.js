const partsMasterService = require('./parts-master.service');
const { successResponse, errorResponse } = require('../../utils/response.util');

const getParts = async (req, res, next) => {
  try {
    const { search } = req.query;
    const parts = await partsMasterService.getParts(search);
    return res.status(200).json(successResponse('Parts retrieved successfully', { parts }));
  } catch (err) {
    next(err);
  }
};

const updatePart = async (req, res, next) => {
  try {
    const { partNo } = req.params;
    const { description, location, mrp } = req.body;
    
    // Only allow specific fields to be updated manually
    const updateData = {};
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (mrp !== undefined) updateData.mrp = mrp;
    updateData.source = 'manual';
    updateData.lastSeenAt = new Date();

    const part = await partsMasterService.updatePart(partNo, updateData, req.user._id);
    if (!part) {
      return res.status(404).json(errorResponse('Part not found', 'NOT_FOUND', 404));
    }
    
    return res.status(200).json(successResponse('Part updated successfully', { part }));
  } catch (err) {
    next(err);
  }
};

module.exports = { getParts, updatePart };
