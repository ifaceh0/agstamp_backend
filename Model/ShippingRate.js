// models/ShippingRate.js
import mongoose from "mongoose";

const shippingRateSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["domestic", "international"], // "domestic" = US, "international" = others
    required: true,
    unique: true,
  },
  price: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: "usd",
  },
});

export default mongoose.model("ShippingRate", shippingRateSchema);
