import mongoose from 'mongoose';

const certificationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    issuer: {
      type: String,
      required: true,
      trim: true
    },
    issueDate: {
      type: String,
      default: '',
      trim: true
    },
    credentialId: {
      type: String,
      default: '',
      trim: true
    },
    credentialUrl: {
      type: String,
      default: '',
      trim: true
    },
    showCredentialUrl: {
      type: Boolean,
      default: true
    },
    image: {
      type: String,
      default: '',
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    order: {
      type: Number,
      default: 0
    },
    displayOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

certificationSchema.pre('validate', function (next) {
  if (this.isModified('displayOrder') && !this.isModified('order')) {
    this.order = this.displayOrder;
  } else if (this.isModified('order') && !this.isModified('displayOrder')) {
    this.displayOrder = this.order;
  }
  next();
});

const Certification = mongoose.model('Certification', certificationSchema);

export default Certification;
