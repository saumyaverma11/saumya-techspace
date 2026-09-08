import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: 'Saumya Verma'
    },
    title: {
      type: String,
      default: 'Junior Software Engineer | Full-Stack Developer'
    },
    tagline: {
      type: String,
      default: 'Welcome to my portfolio'
    },
    bio: {
      type: String,
      default: 'I build modern, scalable and user-friendly web applications using modern frontend and backend technologies.'
    },
    aboutHeading: {
      type: String,
      default: 'Building ideas into real applications.'
    },
    aboutDescription: {
      type: String,
      default: "I'm a Junior Software Engineer and Full-Stack Developer passionate about building modern, scalable and user-friendly web applications."
    },
    avatar: {
      type: String,
      default: ''
    },
    resumeUrl: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      default: ''
    },
    githubUrl: {
      type: String,
      default: ''
    },
    linkedinUrl: {
      type: String,
      default: ''
    },
    twitterUrl: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
