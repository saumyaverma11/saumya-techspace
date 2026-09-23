import mongoose from 'mongoose';

export const ALLOWED_EVENT_TYPES = [
  'page_view',
  'section_view',
  'scroll_depth',
  'project_view',
  'project_github_click',
  'project_live_click',
  'certificate_view',
  'resume_view',
  'resume_download_request',
  'resume_download_approved',
  'resume_download_completed',
  'github_click',
  'linkedin_click',
  'email_click',
  'contact_form_start',
  'contact_form_submit'
];

const analyticsEventSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 128,
      index: true
    },
    eventType: {
      type: String,
      required: true,
      enum: ALLOWED_EVENT_TYPES,
      trim: true,
      index: true
    },
    page: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '/'
    },
    section: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    deviceType: {
      type: String,
      trim: true,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown'
    },
    browser: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'unknown'
    },
    operatingSystem: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'unknown'
    },
    screenWidth: {
      type: Number,
      default: null
    },
    screenHeight: {
      type: Number,
      default: null
    },
    referrer: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    source: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'direct'
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for optimal querying in Phase 28 without impacting performance
analyticsEventSchema.index({ eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ sessionId: 1, timestamp: -1 });
analyticsEventSchema.index({ timestamp: -1 });

const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);

export default AnalyticsEvent;
