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

// ✅ Prevent duplicate images globally
Carousel.pre("save", function (next) {
  if (this.images && this.images.length > 0) {
    const seen = new Set();
    this.images = this.images.filter(img => {
      if (seen.has(img.publicId)) return false;
      seen.add(img.publicId);
      return true;
    });
  }
  next();
});

const CarouselModel = mongoose.model("Carousel", Carousel);

export default CarouselModel;
