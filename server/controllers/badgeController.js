import mongoose from 'mongoose';
import Badge from '../models/Badge.js';

export const createBadge = async (req, res) => {
  try {
    const { title, description, image, displayOrder, order, isActive } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    const resolvedOrder = displayOrder !== undefined ? Number(displayOrder) : (order !== undefined ? Number(order) : 0);
    const finalOrder = isNaN(resolvedOrder) ? 0 : resolvedOrder;

    const badge = await Badge.create({
      title: title.trim(),
      description: description.trim(),
      image: image ? image.trim() : '',
      displayOrder: finalOrder,
      order: finalOrder,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    res.status(201).json({
      success: true,
      data: badge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getBadges = async (req, res) => {
  try {
    const hasAdminToken = Boolean(
      req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
    );
    const includeAll = req.query.all === 'true' || hasAdminToken;

    const filter = includeAll ? {} : { isActive: { $ne: false } };

    const badges = await Badge.find(filter).sort({
      displayOrder: 1,
      createdAt: -1,
      _id: 1
    });

    res.status(200).json({
      success: true,
      data: badges
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getBadgeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid badge ID format'
      });
    }

    const badge = await Badge.findById(id);

    if (!badge) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found'
      });
    }

    res.status(200).json({
      success: true,
      data: badge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateBadge = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid badge ID format'
      });
    }

    const updateData = { ...req.body };
    if (updateData.title !== undefined) updateData.title = updateData.title.trim();
    if (updateData.description !== undefined) updateData.description = updateData.description.trim();
    if (updateData.image !== undefined) updateData.image = updateData.image.trim();
    if (updateData.isActive !== undefined) updateData.isActive = Boolean(updateData.isActive);

    if (updateData.displayOrder !== undefined) {
      const parsed = Number(updateData.displayOrder);
      const val = isNaN(parsed) ? 0 : parsed;
      updateData.displayOrder = val;
      updateData.order = val;
    } else if (updateData.order !== undefined) {
      const parsed = Number(updateData.order);
      const val = isNaN(parsed) ? 0 : parsed;
      updateData.displayOrder = val;
      updateData.order = val;
    }

    const updatedBadge = await Badge.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!updatedBadge) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedBadge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteBadge = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid badge ID format'
      });
    }

    const deletedBadge = await Badge.findByIdAndDelete(id);

    if (!deletedBadge) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Badge deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
