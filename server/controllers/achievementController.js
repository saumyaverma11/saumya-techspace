import mongoose from 'mongoose';
import Achievement from '../models/Achievement.js';

export const createAchievement = async (req, res) => {
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

    const achievement = await Achievement.create({
      title: title.trim(),
      description: description.trim(),
      image: image ? image.trim() : '',
      displayOrder: finalOrder,
      order: finalOrder,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    res.status(201).json({
      success: true,
      data: achievement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAchievements = async (req, res) => {
  try {
    const hasAdminToken = Boolean(
      req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
    );
    const includeAll = req.query.all === 'true' || hasAdminToken;

    const filter = includeAll ? {} : { isActive: { $ne: false } };

    const achievements = await Achievement.find(filter).sort({
      displayOrder: 1,
      createdAt: -1,
      _id: 1
    });

    res.status(200).json({
      success: true,
      data: achievements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAchievementById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid achievement ID format'
      });
    }

    const achievement = await Achievement.findById(id);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    res.status(200).json({
      success: true,
      data: achievement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateAchievement = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid achievement ID format'
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

    const updatedAchievement = await Achievement.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!updatedAchievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedAchievement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteAchievement = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid achievement ID format'
      });
    }

    const deletedAchievement = await Achievement.findByIdAndDelete(id);

    if (!deletedAchievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Achievement deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
