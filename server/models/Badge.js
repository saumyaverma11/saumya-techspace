import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    image: {
      type: String,
      default: '',
      trim: true
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Synchronize displayOrder and order fields
badgeSchema.pre('validate', function (next) {
  if (this.isModified('displayOrder') && !this.isModified('order')) {
    this.order = this.displayOrder;
  } else if (this.isModified('order') && !this.isModified('displayOrder')) {
    this.displayOrder = this.order;
  }
  next();
});

const Badge = mongoose.model('Badge', badgeSchema);

export default Badge;
