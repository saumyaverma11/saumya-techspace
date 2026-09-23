import mongoose from 'mongoose';

const resumeDownloadRequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254
    },
    message: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000
    },
    sessionId: {
      type: String,
      trim: true,
      default: null,
      maxlength: 128
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewedBy: {
      type: String,
      default: null
    },
    rejectionNote: {
      type: String,
      trim: true,
      default: null,
      maxlength: 500
    },
    // SHA-256 hash of the raw approval token (raw token only sent in email to visitor)
    approvalToken: {
      type: String,
      default: null
    },
    approvalTokenExpire: {
      type: Date,
      default: null
    },
    // Source of review action
    reviewSource: {
      type: String,
      enum: ['admin_dashboard', 'email', null],
      default: null
    },
    // Cryptographically secure capability tokens for admin 1-click email approve/reject
    // Only SHA-256 hashes are stored; raw tokens exist strictly in admin notification emails
    emailApproveToken: {
      type: String,
      default: null,
      select: false
    },
    emailRejectToken: {
      type: String,
      default: null,
      select: false
    },
    emailActionTokenExpire: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient token lookups
resumeDownloadRequestSchema.index({ approvalToken: 1 });
resumeDownloadRequestSchema.index({ emailApproveToken: 1 });
resumeDownloadRequestSchema.index({ emailRejectToken: 1 });
resumeDownloadRequestSchema.index({ email: 1 });
resumeDownloadRequestSchema.index({ status: 1 });

const ResumeDownloadRequest = mongoose.model(
  'ResumeDownloadRequest',
  resumeDownloadRequestSchema
);

export default ResumeDownloadRequest;
