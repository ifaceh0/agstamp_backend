import mongoose, { Schema } from "mongoose";

const Carousel = new Schema(
  {
    name: {
      type: String,
      required: [true, "Stamp name is required"],
      trim: true,
    },
    images: {
      type: [
        {
          publicId: { type: String, required: [true, "publicId is required"] },
          publicUrl: { type: String, required: [true, "publicUrl is required"] },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const CarouselModel = mongoose.model("Carousel", Carousel);

export default CarouselModel;
