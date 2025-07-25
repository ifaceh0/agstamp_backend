import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema({
  publicId: {
    type: String,
    required: true,
    unique: true
  },
  url: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});


const PhotoModel = mongoose.model('Photo', photoSchema);

export default PhotoModel;