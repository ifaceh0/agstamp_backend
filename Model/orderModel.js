import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    items: [
      {
        mongoId: {
          type: mongoose.Schema.Types.ObjectId,
          required: false, // for referencing Stamp model if needed
        },
        name: {
          type: String,
          required: true,
        },
        category: {
          type: String, // "Stamp", "S&H", "US", "International", etc.
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        unitPrice: {
          type: Number,
          required: true,
        },
        totalPrice: {
          type: Number,
          required: true,
        },
        image: {
          type: 
            {
              publicId: { type: String, required: [true, "publicId is required"] },
              publicUrl: { type: String, required: [true, "publicUrl is required"] },
            },
      },
      },
    ],

    total: {
      type: Number,
      required: true,
    },

    dateOfSale: {
      type: Date,
      default: Date.now,
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "failed", "refunded"],
      default: "unpaid",
    },

    paymentDetails: {
      paymentMethod: String,
      paymentId: String,
      amount: Number,
      amountSubtotal: Number,
      shippingCost:Number,
      currency: String,
    },

    shippingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered"],
      default: "pending",
    },

    stripeSessionId: {
      type: String,
      required: true,
    },

    paymentIntentId: String,
  },
  {
    timestamps: true,
  }
);


const orderModel = mongoose.model("Order", OrderSchema);

export default orderModel;
