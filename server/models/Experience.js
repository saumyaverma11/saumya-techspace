import mongoose from 'mongoose';

const experienceSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: true,
      trim: true
    },
    position: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      default: '',
      trim: true
    },
    startDate: {
      type: String,
      default: '',
      trim: true
    },
    endDate: {
      type: String,
      default: '',
      trim: true
    },
    current: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    technologies: {
      type: [String],
      default: []
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Experience = mongoose.model('Experience', experienceSchema);

export default Experience;
