import busboy from "busboy";
import StampModel from "../Model/stampModel.js";
import { synchFunc } from "../Utils/SynchFunc.js";
import { uploadPhoto } from "./FileUploadController.js"; // 🔹 your uploader
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
import categoryModel from "../Model/CategoryModal.js";
import SFTPClient from "ssh2-sftp-client";
import { uploadBufferToSFTP } from "./FileUploadController.js";

// 🔹 helper to delete files from INOS (SFTP)
async function deleteFiles(filePaths = []) {
  const sftp = new SFTPClient();
  try {
    await sftp.connect({
      host: process.env.SFTP_HOST,
      port: process.env.SFTP_PORT,
      username: process.env.SFTP_USER,
      password: process.env.SFTP_PASS,
    });

    for (const filePath of filePaths) {
      await sftp.delete(filePath);
    }
  } finally {
    sftp.end();
  }
}

export const allStamps = synchFunc(async (_, res) => {
  const stamps = await StampModel.find().populate();
  res.status(201).json({ success: true, stamps });
});

export const singleStamp = synchFunc(async (req, res) => {
  const { id } = req.params;
  const stamp = await StampModel.findById(id);
  res.status(201).json({ success: true, stamp });
});

// A helper function to contain the busboy logic for parsing multipart forms.
// This keeps your main controller function much cleaner.
const parseMultipartForm = (req) => {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });

    const fields = {};
    const newImages = [];
    const uploadPromises = [];

    bb.on("file", (fieldname, file, info) => {
      const chunks = [];
      file.on("data", (chunk) => chunks.push(chunk));
      
      const uploadPromise = new Promise(async (resolveFile, rejectFile) => {
        file.on("end", async () => {
          try {
            const buffer = Buffer.concat(chunks);
            // We use your existing SFTP upload function
            const uploaded = await uploadBufferToSFTP(buffer, info.filename, "stamps");
            resolveFile(uploaded); // Resolve with the uploaded file info
          } catch (err) {
            rejectFile(err);
          }
        });
      });
      uploadPromises.push(uploadPromise);
    });

    bb.on("field", (fieldname, val) => {
      fields[fieldname] = val;
    });

    bb.on("finish", async () => {
      try {
        // Wait for all file uploads to complete
        const uploadedImages = await Promise.all(uploadPromises);
        newImages.push(...uploadedImages);
        
        // Resolve the main promise with all parsed data
        resolve({ fields, newImages });
      } catch (err) {
        reject(new ErrorHandler(500, "SFTP upload failed during processing."));
      }
    });

    bb.on("error", (err) => {
      reject(new ErrorHandler(400, `Form parsing error: ${err.message}`));
    });

    req.pipe(bb);
  });
};


// 🔹 YOUR NEW AND IMPROVED updateStamp FUNCTION 🔹
export const updateStamp = synchFunc(async (req, res) => {
  const { id } = req.params;
  let updateData = {}; // This will hold all our form data
  let newImages = [];   // This will hold info about newly uploaded images

  // STEP 1: Check the content type to decide how to parse the request
  if (req.is('multipart/form-data')) {
    // If we are uploading files, use our busboy helper
    const parsed = await parseMultipartForm(req);
    updateData = parsed.fields;
    newImages = parsed.newImages;
  } else {
    // If no files are uploaded, the data is in req.body
    updateData = req.body;
  }
  
  // STEP 2: Process the data (which is now consistent)
  // Convert string fields from the form into correct types
  if (updateData.price) updateData.price = Number(updateData.price);
  if (updateData.stock) updateData.stock = Number(updateData.stock);
  if (updateData.active) updateData.active = updateData.active === 'true';
  if (updateData.removedImages) {
    // `removedImages` is sent as a JSON string, so we must parse it
    try {
      updateData.removedImages = JSON.parse(updateData.removedImages);
    } catch (e) {
      throw new ErrorHandler(400, "Invalid format for removedImages");
    }
  }

  // STEP 3: Update the database
  const existingStamp = await StampModel.findById(id);
  if (!existingStamp) throw new ErrorHandler(404, "Stamp not found");

  // Delete images that were marked for removal
  if (updateData.removedImages?.length) {
    // Here you need to find the full paths/publicIds of the images to delete.
    // Assuming `removedImages` is an array of publicIds.
    const imageObjectsToDelete = existingStamp.images.filter(img => 
      updateData.removedImages.includes(img.publicId)
    );
    const pathsToDelete = imageObjectsToDelete.map(img => `/stamps/${img.publicId}`); // Adjust path as needed
    
    if (pathsToDelete.length > 0) {
      await deleteFiles(pathsToDelete);
    }

    // Filter out the removed images from the stamp document
    existingStamp.images = existingStamp.images.filter(
      (img) => !updateData.removedImages.includes(img.publicId)
    );
  }

  // Add the newly uploaded images
  if (newImages.length) {
    existingStamp.images.push(...newImages);
  }

  // Update all other text fields
  const updatableFields = [ "name", "description", "price", "stock", "active", "beginDate", "category" ];
  updatableFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      existingStamp[field] = updateData[field];
    }
  });

  await existingStamp.save();

  res.status(200).json({
    success: true,
    message: "Stamp updated successfully",
    stamp: existingStamp,
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
