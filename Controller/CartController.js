import { calculateTotal } from "../Helper/Helper.js";
import CartModel from "../Model/cartModel.js";
import stampModel from "../Model/stampModel.js";

export const addToCart = async (req, res) => {
  try {
    const { _id } = req?.user; 
    const { stampId, quantity } = req.body;

    // Check if the stamp exists
    const stamp = await stampModel.findById(stampId);
    if (!stamp) return res.status(404).json({ message: 'Stamp not found' });

    // Check stock availability
    if (quantity > stamp.stock) {
      return res.status(400).json({ message: `Only ${stamp.stock} items in stock` });
    }

    // Find the user's cart or create a new one
    let cart = await CartModel.findOne({ user: _id });

    if (!cart) {
      cart = new CartModel({
        user: _id,
        items: [{ stamp: stampId, quantity }],
        totalPrice: stamp.price * quantity,
      });
    } else {
      const existingItem = cart.items.find(item => item.stamp.toString() === stampId);

      const currentQuantity = existingItem ? existingItem.quantity : 0;
      const totalRequested = currentQuantity + quantity;

      if (totalRequested > stamp.stock) {
        return res.status(400).json({ message: `Only ${stamp.stock - currentQuantity} more item(s) can be added` });
      }

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ stamp: stampId, quantity });
      }

      cart.totalPrice = await calculateTotal(cart.items);
    }

    await cart.save();

    // Populate the stamp field with full stamp data
    await cart.populate('items.stamp');

    res.status(200).json(cart); // returns full cart with populated stamps

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while adding to cart' });
  }
};

export const getCart = async (req, res) => {
  try {
    const { _id } = req.user;

    // Find user's cart and populate full stamp data
    const cart = await CartModel.findOne({ user: _id }).populate({
      path: "items.stamp",
      model: "Stamp",
    });

    if (cart) {
      cart.items = cart.items.filter(item => item.stamp !== null);
      await cart.save();
    }

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    res.status(200).json(cart);
  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).json({ message: "Server error while fetching cart" });
  }
};


export const updateCartItemQuantity = async (req, res) => {
  try {
    const { _id } = req.user;
    const { stampId, delta } = req.body; // delta can be +1 or -1

    const cart = await CartModel.findOne({ user: _id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find((i) => i.stamp.toString() === stampId);
    if (!item) return res.status(404).json({ message: "Item not found in cart" });

    const stamp = await stampModel.findById(stampId);
    if (!stamp) return res.status(404).json({ message: "Stamp not found" });

    const newQuantity = item.quantity + delta;

    if (newQuantity > stamp.stock) {
      return res.status(400).json({ message: `Only ${stamp.stock} items in stock` });
    }

    if (newQuantity <= 0) {
      // Remove item if quantity goes to zero or below
      cart.items = cart.items.filter((i) => i.stamp.toString() !== stampId);
    } else {
      item.quantity = newQuantity;
    }

    cart.totalPrice = await calculateTotal(cart.items);
    await cart.save();
    await cart.populate("items.stamp");

    res.status(200).json(cart);
  } catch (err) {
    console.error("Error updating cart quantity:", err);
    res.status(500).json({ message: "Server error while updating cart quantity" });
  }
};


export const removeCartItem = async (req, res) => {
  try {
    const { _id } = req.user;
    const { stampId } = req.params;

    const cart = await CartModel.findOne({ user: _id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemExists = cart.items.some((item) => item.stamp.toString() === stampId);
    if (!itemExists) return res.status(404).json({ message: "Item not found in cart" });

    cart.items = cart.items.filter((item) => item.stamp.toString() !== stampId);
    cart.totalPrice = await calculateTotal(cart.items);

    await cart.save();
    await cart.populate("items.stamp");

    res.status(200).json(cart);
  } catch (err) {
    console.error("Error removing item from cart:", err);
    res.status(500).json({ message: "Server error while removing item" });
  }
};

export const removeAllCartItem = async (req, res) => {
  try {
    const {id} = req.params;
    const data = await CartModel.deleteOne({_id:id});
    if(data.deletedCount == 1){
      res.status(200).json({cart:null});
    }else{
      res.status(404).json({ message: "cart not found" });
    }
  } catch (err) {
    console.error("Error removing item from cart:", err);
    res.status(500).json({ message: "Server error while removing item" });
  }
};

