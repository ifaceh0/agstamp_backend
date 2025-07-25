import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscribedEmail: {
    type:String,
    required:true,
  }, 
}, {
  timestamps: true
});

const subscriberModel = mongoose.model('Subscriber', subscriberSchema);
export default subscriberModel;
