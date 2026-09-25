import mongoose from 'mongoose';
import Project from '../models/Project.js';

export const createProject = async (req, res) => {
  try {
    const { title, description, image, category, technologies, githubUrl, liveUrl, showGithubUrl, showLiveUrl, featured, displayOrder, order } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    const resolvedOrder = displayOrder !== undefined ? Number(displayOrder) : (order !== undefined ? Number(order) : 0);

    const project = await Project.create({
      title,
      description,
      image,
      category,
      technologies,
      githubUrl,
      showGithubUrl: showGithubUrl !== undefined ? Boolean(showGithubUrl) : true,
      liveUrl,
      showLiveUrl: showLiveUrl !== undefined ? Boolean(showLiveUrl) : true,
      featured,
      displayOrder: isNaN(resolvedOrder) ? 0 : resolvedOrder
    });

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ displayOrder: 1, createdAt: -1, _id: 1 });

    res.status(200).json({
      success: true,
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format'
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format'
      });
    }

    const updateData = { ...req.body };
    if (updateData.showGithubUrl !== undefined) {
      updateData.showGithubUrl = Boolean(updateData.showGithubUrl);
    }
    if (updateData.showLiveUrl !== undefined) {
      updateData.showLiveUrl = Boolean(updateData.showLiveUrl);
    }
    if (updateData.displayOrder !== undefined) {
      const parsed = Number(updateData.displayOrder);
      updateData.displayOrder = isNaN(parsed) ? 0 : parsed;
    } else if (updateData.order !== undefined) {
      const parsed = Number(updateData.order);
      updateData.displayOrder = isNaN(parsed) ? 0 : parsed;
    }

    const updatedProject = await Project.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!updatedProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format'
      });
    }

    const deletedProject = await Project.findByIdAndDelete(id);

    if (!deletedProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
