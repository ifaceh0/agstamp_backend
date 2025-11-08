// import busboy from "busboy";
// import categoryModel from "../Model/CategoryModal.js";
// import StampModel from "../Model/stampModel.js";
// import { synchFunc } from "../Utils/SynchFunc.js";
// //import { uploadPhoto } from "./FileUploadController.js"; // 🔹 your uploader
// import CarouselModel from "../Model/CarouselModel.js";
// import subscriberModel from "../Model/subcriberModel.js";
// import { mail } from "../Helper/Mail.js";
// import { ErrorHandler } from "../Utils/ErrorHandler.js";
// import orderModel from "../Model/orderModel.js";
// import {
//   getMonthlyPurchasers,
//   getTopStampsThisMonth,
//   summarizeOrdersByMonth,
// } from "../Helper/Helper.js";
// import ContactUs from "../Model/ContactUs.js";
// import SFTPClient from "ssh2-sftp-client";
// import { uploadBufferToSFTP } from "./FileUploadController.js";
// import ShippingRate from "../Model/ShippingRate.js";
// import Country from "../Model/CountryModel.js";

// // Helper to delete files from SFTP
// async function deleteFilesFromSFTP(publicIds = [], folder = "stamps_images") {
//   if (!publicIds.length) return;
//   const sftp = new SFTPClient();
//   try {
//     await sftp.connect({
//       host: process.env.SFTP_HOST,
//       port: process.env.SFTP_PORT,
//       username: process.env.SFTP_USER,
//       password: process.env.SFTP_PASS,
//     });

//     for (const publicId of publicIds) {
//       const remotePath = `/${folder}/${publicId}`;
//       try {
//         await sftp.delete(remotePath);
//         console.log(`Successfully deleted ${remotePath}`);
//       } catch (err) {
//         console.warn(`Could not delete ${remotePath}: ${err.message}`);
//       }
//     }
//   } catch (err) {
//     console.error(`SFTP connection or operation failed: ${err.message}`);
//   } finally {
//     await sftp.end();
//   }
// }

// export const allStamps = synchFunc(async (_, res) => {
//   const stamps = await StampModel.find().populate("categories","name");
//   res.status(201).json({ success: true, stamps });
// });

// export const singleStamp = synchFunc(async (req, res) => {
//   const { id } = req.params;
//   const stamp = await StampModel.findById(id);
//   res.status(201).json({ success: true, stamp });
// });

// // A helper function to contain the busboy logic for parsing multipart forms.
// // This keeps your main controller function much cleaner.
// const parseMultipartForm = (req) => {
//   return new Promise((resolve, reject) => {
//     const bb = busboy({ headers: req.headers });

//     const fields = {};
//     const newImages = [];
//     const uploadPromises = [];

//     bb.on("file", (fieldname, file, info) => {
//       const chunks = [];
//       file.on("data", (chunk) => chunks.push(chunk));
      
//       const uploadPromise = new Promise(async (resolveFile, rejectFile) => {
//         file.on("end", async () => {
//           try {
//             const buffer = Buffer.concat(chunks);
//             // We use your existing SFTP upload function
//             const uploaded = await uploadBufferToSFTP(buffer, info.filename, "stamps_images");
//             resolveFile(uploaded); // Resolve with the uploaded file info
//           } catch (err) {
//             rejectFile(err);
//           }
//         });
//       });
//       uploadPromises.push(uploadPromise);
//     });

//     bb.on("field", (fieldname, val) => {
//       fields[fieldname] = val;
//     });

//     bb.on("finish", async () => {
//       try {
//         // Wait for all file uploads to complete
//         const uploadedImages = await Promise.all(uploadPromises);
//         newImages.push(...uploadedImages);
        
//         // Resolve the main promise with all parsed data
//         resolve({ fields, newImages });
//       } catch (err) {
//         reject(new ErrorHandler(500, `SFTP upload failed during processing: ${err.message}`));
//       }
//     });

//     bb.on("error", (err) => {
//       reject(new ErrorHandler(400, `Form parsing error: ${err.message}`));
//     });

//     req.pipe(bb);
//   });
// };


// // ✅ YOUR NEW, CONSOLIDATED updateStamp FUNCTION ✅
// export const updateStamp = synchFunc(async (req, res) => {
//   const { id } = req.params;

//   // Find the stamp we need to update first
//   const stampToUpdate = await StampModel.findById(id);
//   if (!stampToUpdate) {
//     throw new ErrorHandler(404, "Stamp not found");
//   }

//   const bb = busboy({ headers: req.headers });
//   const formData = {};
//   const fileUploadPromises = [];

//   bb.on("file", (fieldname, file, info) => {
//     // We only care about the new image(s) being uploaded
//     if (fieldname !== "newImages") {
//       return file.resume();
//     }
    
//     const { filename, mimeType } = info;
//     if (!mimeType.startsWith("image/")) {
//       return file.resume();
//     }

//     const chunks = [];
//     file.on("data", (chunk) => chunks.push(chunk));

//     const uploadPromise = new Promise((resolve, reject) => {
//       file.on("end", async () => {
//         try {
//           const buffer = Buffer.concat(chunks);
//           // Determine the filename based on the stamp's name
//           const nameForFile = formData.name || stampToUpdate.name;
//           const newImage = await uploadBufferToSFTP(
//             buffer,
//             filename,
//             "stamps_images",
//             nameForFile
//           );
//           resolve(newImage);
//         } catch (err) {
//           reject(err);
//         }
//       });
//     });
//     fileUploadPromises.push(uploadPromise);
//   });

//   bb.on("field", (fieldname, val) => {
//     formData[fieldname] = val;
//   });

//   await new Promise((resolve, reject) => {
//     bb.on("finish", resolve);
//     bb.on("error", (err) => reject(new ErrorHandler(500, err.message)));
//     req.pipe(bb);
//   });

//   // Process newly uploaded images
//   const uploadedImages = await Promise.all(fileUploadPromises);
//   if (uploadedImages.length > 0) {
//     // If new images are uploaded, we replace the old ones
//     stampToUpdate.images = uploadedImages;
//   } else if (formData.removedImages) {
//     // If no new images, check if any existing images were removed
//     const removedImageIds = JSON.parse(formData.removedImages);
//     await deleteFilesFromSFTP(removedImageIds);
//     stampToUpdate.images = stampToUpdate.images.filter(
//       (img) => !removedImageIds.includes(img.publicId)
//     );
//   }

//   // Update text fields
//    const updatableFields = ["name", "description", "price", "stock", "active", "beginDate"];
//   updatableFields.forEach((field) => {
//     if (formData[field] !== undefined) {
//       stampToUpdate[field] = formData[field];
//     }
//   });

//   // 2. Specifically handle the 'categories' array
//   if (formData.categories) {
//     try {
//       const parsedCategories = JSON.parse(formData.categories);
//       if (!Array.isArray(parsedCategories)) {
//         throw new Error('Categories must be an array.');
//       }
//       stampToUpdate.categories = parsedCategories; // Assign the new array
//     } catch (error) {
//       throw new ErrorHandler(400, 'Categories must be a valid JSON array of IDs');
//     }
//   }

//   // Save all changes to the database
//   const updatedStamp = await stampToUpdate.save();

//   res.status(200).json({
//     success: true,
//     message: "Stamp updated successfully!",
//     stamp: updatedStamp,
//   });
// });


// export const allCarousel = synchFunc(async (_, res) => {
//   const Carousels = await CarouselModel.find();
//   res.status(201).json({ success: true, Carousels });
// });

// export const singleCarousel = synchFunc(async (req, res) => {
//   const { id } = req.params;
//   const carousel = await CarouselModel.findById(id);
//   res.status(201).json({ success: true, carousel });
// });

// export const getAllSubscriber = synchFunc(async (_, res) => {
//   const subscribers = await subscriberModel.find({}).populate({
//     path: "user",
//     model: "User",
//   });

//   res.status(201).json({ success: true, subscribers });
// });

// export const sendMailToSubscribers = synchFunc(async (req, res) => {
//   const { selectedSubscribers, subject, message } = req.body;
//   const emailSendRes = await mail(selectedSubscribers, subject, message);
//   if (emailSendRes.messageId) {
//     res.status(200).json({ success: true, message: "Sent!" });
//   } else {
//     throw new ErrorHandler(
//       400,
//       "Something went wrong while sending the mail!"
//     );
//   }
// });

// export const getAllOrders = synchFunc(async (req, res) => {
//   const orders = await orderModel.find();
//   if (orders.length > 0) {
//     res.status(200).json({ success: true, orders });
//   } else {
//     throw new ErrorHandler(400, "No order placed yet!");
//   }
// });

// export const editOrder = synchFunc(async (req, res) => {
//   const { id, status } = req.body;
//   const order = await orderModel.findById(id);
//   if (!order) throw new ErrorHandler(404, "Order not found");
//   order.status = status;
//   await order.save();
//   const orders = await orderModel.find();
//   res.status(200).json({
//     success: true,
//     orders,
//   });
// });

// export const dashboardData = synchFunc(async (_, res) => {
//   const orders = await orderModel.find();
//   const monthlyCategorySummary = summarizeOrdersByMonth(orders);
//   const monthlyPurchasers = getMonthlyPurchasers(orders);
//   const topStampsThisMonth = getTopStampsThisMonth(orders);
//   res.status(200).json({
//     success: true,
//     data: {
//       barchatData: monthlyCategorySummary,
//       lineChatData: monthlyPurchasers,
//       topStampsThisMonth,
//     },
//   });
// });

// export const getAllContactus = synchFunc(async (_, res) => {
//   const allContacts = await ContactUs.find();
//   res.status(200).json({
//     success: true,
//     allContacts,
//   });
// });

// export const addCategory = synchFunc(async (req, res) => {
//   const category = await categoryModel.create({ name: req.body.name });
//   res.status(201).json(category);
// });

// // ✅ Fetch all categories
// export const getAllCategories = async (req, res) => {
//   try {
//     const categories = await categoryModel.find().sort({ createdAt: -1 });
//     res.status(200).json(categories);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch categories" });
//   }
// };

// export const updateCategory = synchFunc(async (req, res) => {
//   const { id } = req.params;
//   const { name } = req.body;

//   if (!name) {
//     throw new ErrorHandler(400, "Category name is required");
//   }

//   const updatedCategory = await categoryModel.findByIdAndUpdate(
//     id,
//     { name },
//     { new: true } // returns updated category
//   );

//   if (!updatedCategory) {
//     throw new ErrorHandler(404, "Category not found");
//   }

//   res.status(200).json({
//     success: true,
//     message: "Category updated successfully",
//     category: updatedCategory,
//   });
// });

// export const deleteCategory = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Check if any stamp is linked to this category
//     const stampCount = await StampModel.countDocuments({ categories: id });

//     if (stampCount > 0) {
//       return res.status(400).json({
//         message: "Cannot delete category with existing stamps",
//       });
//     }

//     // Delete category if no stamps are linked
//     await categoryModel.findByIdAndDelete(id);

//     res.status(200).json({ message: "Category deleted successfully" });
//   } catch (error) {
//     console.error("Delete category error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };
// // ✅ Get all shipping rates
// export const getShippingRates = async (req, res) => {
//   try {
//     const rates = await ShippingRate.find();
//     res.status(200).json({ success: true, rates });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ✅ Update or create a shipping rate
// export const updateShippingRate = async (req, res) => {
//   try {
//     const { type, price } = req.body;
//     if (!type || price == null) {
//       return res.status(400).json({ success: false, message: "Type and price required" });
//     }

//     const updated = await ShippingRate.findOneAndUpdate(
//       { type },
//       { price },
//       { new: true, upsert: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: "Shipping rate updated successfully",
//       rate: updated,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Create a country
// export const addCountry = async (req, res, next) => {
//   try {
//     const { name, code, dialCode, active } = req.body;
//     if (!name || !code) throw new ErrorHandler(400, "Name and code are required");
//     const exists = await Country.findOne({ code: code.toUpperCase() });
//     if (exists) throw new ErrorHandler(400, "Country with this code already exists");
//     const country = await Country.create({ name, code: code.toUpperCase(), dialCode, active });
//     res.status(201).json({ success: true, country });
//   } catch (err) {
//     next(err);
//   }
// };

// // Get all countries (public or admin; for cart you can expose a public endpoint)
// export const getCountries = async (req, res, next) => {
//   try {
//     // Optionally only return active ones for public endpoint
//     const countries = await Country.find().sort({ name: 1 });
//     res.status(200).json({ success: true, countries });
//   } catch (err) {
//     next(err);
//   }
// };

// // Update country
// export const updateCountry = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const payload = req.body;
//     if (payload.code) payload.code = payload.code.toUpperCase();
//     const updated = await Country.findByIdAndUpdate(id, payload, { new: true });
//     if (!updated) throw new ErrorHandler(404, "Country not found");
//     res.status(200).json({ success: true, country: updated });
//   } catch (err) {
//     next(err);
//   }
// };

// // Delete country
// export const deleteCountry = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     await Country.findByIdAndDelete(id);
//     res.status(200).json({ success: true, message: "Deleted" });
//   } catch (err) {
//     next(err);
//   }
// };

import busboy from "busboy";
import categoryModel from "../Model/CategoryModal.js";
import StampModel from "../Model/stampModel.js";
import { synchFunc } from "../Utils/SynchFunc.js";
import CarouselModel from "../Model/CarouselModel.js";
import subscriberModel from "../Model/subcriberModel.js";
import { mail } from "../Helper/Mail.js";
import { ErrorHandler } from "../Utils/ErrorHandler.js";
import orderModel from "../Model/orderModel.js";
import {
  getMonthlyPurchasers,
  getTopStampsThisMonth,
  summarizeOrdersByMonth,
} from "../Helper/Helper.js";
import ContactUs from "../Model/ContactUs.js";
import SFTPClient from "ssh2-sftp-client";
import { uploadBufferToSFTP } from "./FileUploadController.js";
import ShippingRate from "../Model/ShippingRate.js";
import Country from "../Model/CountryModel.js";

// Helper to delete files from SFTP
async function deleteFilesFromSFTP(publicIds = [], folder = "stamps_images") {
  if (!publicIds.length) return;
  const sftp = new SFTPClient();
  try {
    await sftp.connect({
      host: process.env.SFTP_HOST,
      port: process.env.SFTP_PORT,
      username: process.env.SFTP_USER,
      password: process.env.SFTP_PASS,
    });

    for (const publicId of publicIds) {
      const remotePath = `/${folder}/${publicId}`;
      try {
        await sftp.delete(remotePath);
        console.log(`Successfully deleted ${remotePath}`);
      } catch (err) {
        console.warn(`Could not delete ${remotePath}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error(`SFTP connection or operation failed: ${err.message}`);
  } finally {
    await sftp.end();
  }
}

export const allStamps = synchFunc(async (_, res) => {
  const stamps = await StampModel.find().populate("categories","name");
  res.status(201).json({ success: true, stamps });
});

export const singleStamp = synchFunc(async (req, res) => {
  const { id } = req.params;
  const stamp = await StampModel.findById(id);
  res.status(201).json({ success: true, stamp });
});

// ✅ UPDATED updateStamp FUNCTION WITH MULTIPLE IMAGE SUPPORT ✅
export const updateStamp = synchFunc(async (req, res) => {
  const { id } = req.params;

  // Find the stamp we need to update first
  const stampToUpdate = await StampModel.findById(id);
  if (!stampToUpdate) {
    throw new ErrorHandler(404, "Stamp not found");
  }

  const bb = busboy({ headers: req.headers });
  const formData = {};
  const fileUploadPromises = [];
  let imageIndex = 0; // ✅ Track image count for unique filenames

  bb.on("file", (fieldname, file, info) => {
    // We only care about the new image(s) being uploaded
    if (fieldname !== "newImages") {
      return file.resume();
    }
    
    const { filename, mimeType } = info;
    if (!mimeType.startsWith("image/")) {
      return file.resume();
    }

    const chunks = [];
    file.on("data", (chunk) => chunks.push(chunk));
    
    const currentIndex = imageIndex++; // ✅ Capture current index

    const uploadPromise = new Promise((resolve, reject) => {
      file.on("end", async () => {
        try {
          const buffer = Buffer.concat(chunks);
          // Determine the filename based on the stamp's name
          const nameForFile = formData.name || stampToUpdate.name;
          
          // ✅ Pass index to make filenames unique
          const newImage = await uploadBufferToSFTP(
            buffer,
            filename,
            "stamps_images",
            nameForFile,
            currentIndex // Pass the index
          );
          resolve(newImage);
        } catch (err) {
          reject(err);
        }
      });
    });
    fileUploadPromises.push(uploadPromise);
  });

  bb.on("field", (fieldname, val) => {
    formData[fieldname] = val;
  });

  await new Promise((resolve, reject) => {
    bb.on("finish", resolve);
    bb.on("error", (err) => reject(new ErrorHandler(500, err.message)));
    req.pipe(bb);
  });

  // Process newly uploaded images
  const uploadedImages = await Promise.all(fileUploadPromises);
  
  // Handle image updates
  if (formData.removedImages) {
    // Parse removed images
    const removedImageIds = JSON.parse(formData.removedImages);
    
    // Delete removed images from SFTP
    if (removedImageIds.length > 0) {
      await deleteFilesFromSFTP(removedImageIds);
    }
    
    // Remove from stamp's images array
    stampToUpdate.images = stampToUpdate.images.filter(
      (img) => !removedImageIds.includes(img.publicId)
    );
  }
  
  // Add new uploaded images to existing ones
  if (uploadedImages.length > 0) {
    stampToUpdate.images.push(...uploadedImages);
  }

  // Update text fields
  const updatableFields = ["name", "description", "price", "stock", "active", "beginDate"];
  updatableFields.forEach((field) => {
    if (formData[field] !== undefined) {
      stampToUpdate[field] = formData[field];
    }
  });

  // Handle the 'categories' array
  if (formData.categories) {
    try {
      const parsedCategories = JSON.parse(formData.categories);
      if (!Array.isArray(parsedCategories)) {
        throw new Error('Categories must be an array.');
      }
      stampToUpdate.categories = parsedCategories;
    } catch (error) {
      throw new ErrorHandler(400, 'Categories must be a valid JSON array of IDs');
    }
  }

  // Save all changes to the database
  const updatedStamp = await stampToUpdate.save();

  res.status(200).json({
    success: true,
    message: "Stamp updated successfully!",
    stamp: updatedStamp,
  });
});

export const allCarousel = synchFunc(async (_, res) => {
  const Carousels = await CarouselModel.find();
  res.status(201).json({ success: true, Carousels });
});

export const singleCarousel = synchFunc(async (req, res) => {
  const { id } = req.params;
  const carousel = await CarouselModel.findById(id);
  res.status(201).json({ success: true, carousel });
});

export const getAllSubscriber = synchFunc(async (_, res) => {
  const subscribers = await subscriberModel.find({}).populate({
    path: "user",
    model: "User",
  });

  res.status(201).json({ success: true, subscribers });
});

export const sendMailToSubscribers = synchFunc(async (req, res) => {
  const { selectedSubscribers, subject, message } = req.body;
  const emailSendRes = await mail(selectedSubscribers, subject, message);
  if (emailSendRes.messageId) {
    res.status(200).json({ success: true, message: "Sent!" });
  } else {
    throw new ErrorHandler(
      400,
      "Something went wrong while sending the mail!"
    );
  }
});

export const getAllOrders = synchFunc(async (req, res) => {
  const orders = await orderModel.find();
  if (orders.length > 0) {
    res.status(200).json({ success: true, orders });
  } else {
    throw new ErrorHandler(400, "No order placed yet!");
  }
});

export const editOrder = synchFunc(async (req, res) => {
  const { id, status } = req.body;
  const order = await orderModel.findById(id);
  if (!order) throw new ErrorHandler(404, "Order not found");
  order.status = status;
  await order.save();
  const orders = await orderModel.find();
  res.status(200).json({
    success: true,
    orders,
  });
});

export const dashboardData = synchFunc(async (_, res) => {
  const orders = await orderModel.find();
  const monthlyCategorySummary = summarizeOrdersByMonth(orders);
  const monthlyPurchasers = getMonthlyPurchasers(orders);
  const topStampsThisMonth = getTopStampsThisMonth(orders);
  res.status(200).json({
    success: true,
    data: {
      barchatData: monthlyCategorySummary,
      lineChatData: monthlyPurchasers,
      topStampsThisMonth,
    },
  });
});

export const getAllContactus = synchFunc(async (_, res) => {
  const allContacts = await ContactUs.find();
  res.status(200).json({
    success: true,
    allContacts,
  });
});

export const addCategory = synchFunc(async (req, res) => {
  const category = await categoryModel.create({ name: req.body.name });
  res.status(201).json(category);
});

export const getAllCategories = synchFunc(async (req, res) => {
  const categories = await categoryModel.find().sort({ createdAt: -1 });
  res.status(200).json(categories);
});

export const updateCategory = synchFunc(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    throw new ErrorHandler(400, "Category name is required");
  }

  const updatedCategory = await categoryModel.findByIdAndUpdate(
    id,
    { name },
    { new: true }
  );

  if (!updatedCategory) {
    throw new ErrorHandler(404, "Category not found");
  }

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    category: updatedCategory,
  });
});

export const deleteCategory = synchFunc(async (req, res) => {
  const { id } = req.params;

  const stampCount = await StampModel.countDocuments({ categories: id });

  if (stampCount > 0) {
    throw new ErrorHandler(400, "Cannot delete category with existing stamps");
  }

  await categoryModel.findByIdAndDelete(id);

  res.status(200).json({ 
    success: true,
    message: "Category deleted successfully" 
  });
});

export const getShippingRates = synchFunc(async (req, res) => {
  const rates = await ShippingRate.find();
  res.status(200).json({ success: true, rates });
});

export const updateShippingRate = synchFunc(async (req, res) => {
  const { type, price } = req.body;
  
  if (!type || price == null) {
    throw new ErrorHandler(400, "Type and price required");
  }

  const updated = await ShippingRate.findOneAndUpdate(
    { type },
    { price },
    { new: true, upsert: true }
  );

  res.status(200).json({
    success: true,
    message: "Shipping rate updated successfully",
    rate: updated,
  });
});

export const addCountry = synchFunc(async (req, res) => {
  const { name, code, dialCode, active } = req.body;
  
  if (!name || !code) {
    throw new ErrorHandler(400, "Name and code are required");
  }
  
  const exists = await Country.findOne({ code: code.toUpperCase() });
  if (exists) {
    throw new ErrorHandler(400, "Country with this code already exists");
  }
  
  const country = await Country.create({ 
    name, 
    code: code.toUpperCase(), 
    dialCode, 
    active 
  });
  
  res.status(201).json({ success: true, country });
});

export const getCountries = synchFunc(async (req, res) => {
  const countries = await Country.find().sort({ name: 1 });
  res.status(200).json({ success: true, countries });
});

export const updateCountry = synchFunc(async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  
  if (payload.code) {
    payload.code = payload.code.toUpperCase();
  }
  
  const updated = await Country.findByIdAndUpdate(id, payload, { new: true });
  
  if (!updated) {
    throw new ErrorHandler(404, "Country not found");
  }
  
  res.status(200).json({ success: true, country: updated });
});


export const deleteCountry = synchFunc(async (req, res) => {
  const { id } = req.params;
  await Country.findByIdAndDelete(id);
  res.status(200).json({ success: true, message: "Deleted" });
});