import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      default: '',
      trim: true
    },
    level: {
      type: String,
      default: '',
      trim: true
    },
    icon: {
      type: String,
      default: '',
      trim: true
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

const Skill = mongoose.model('Skill', skillSchema);

export default Skill;
