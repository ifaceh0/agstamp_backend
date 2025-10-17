import mongoose from "mongoose";

const CountrySchema = new mongoose.Schema({
  name: { type: String, required: true },            // e.g. "India"
  code: { type: String, required: true, uppercase: true }, // ISO code: "IN"
  active: { type: Boolean, default: true },          // allow disabling without deleting
}, { timestamps: true });

export default mongoose.model("Country", CountrySchema);
