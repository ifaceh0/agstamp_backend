import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  stamp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stamp',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [cartItemSchema],
  totalPrice: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const CartModel = mongoose.model('Cart', cartSchema);
export default CartModel;
