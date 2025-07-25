import busboy from "busboy";
import StampModel from "../Model/stampModel.js"
import { synchFunc } from "../Utils/SynchFunc.js";
import { v2 as cloudinary } from 'cloudinary';
import CarouselModel from "../Model/CarouselModel.js";
import subscriberModel from "../Model/subcriberModel.js";
import { mail } from "../Helper/Mail.js";
import { ErrorHandler } from "../Utils/ErrorHandler.js";
import orderModel from "../Model/orderModel.js";
import { getMonthlyPurchasers, getTopStampsThisMonth, summarizeOrdersByMonth } from "../Helper/Helper.js";
import ContactUs from "../Model/ContactUs.js";
import categoryModel from "../Model/CategoryModal.js";

export const allStamps = synchFunc(async (_, res) => {
    const stamps = await StampModel.find().populate();
    res.status(201).json({ success:true, stamps });
});


export const singleStamp = synchFunc(async (req, res) => {
    const {id} = req.params; 
    const stamp = await StampModel.findById(id);
    res.status(201).json({ success:true, stamp });
});


export const updateStamp = synchFunc(async (req, res) => {
  const bb = busboy({ headers: req.headers });
  const { id } = req.params;

  const formData = {};
  const fields = {};
  const files = [];
  const uploadPromises = [];

  bb.on('file', (fieldname, file, info) => {
    const { mimeType } = info;

    const chunks = [];
    file.on('data', (chunk) => chunks.push(chunk));

    const uploadPromise = new Promise((resolve, reject) => {
      file.on('end', () => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'stamps' },
          (error, result) => {
            if (error || !result) {
              reject(new ErrorHandler(500, 'Cloudinary upload failed'));
            } else {
              resolve({
                publicId: result.public_id,
                publicUrl: result.secure_url
              });
            }
          }
        );
        uploadStream.end(Buffer.concat(chunks));
      });
    });

    uploadPromises.push(uploadPromise);

    files.push({
      fieldname,
      filename: info.filename,
      mimeType: info.mimeType,
    });
  });

  bb.on('field', (fieldname, val) => {
    fields[fieldname] = val;

    if (fieldname === 'removedImages' || fieldname === 'existingImages') {
      try {
        formData[fieldname] = JSON.parse(val);
      } catch {
        formData[fieldname] = [];
      }
    } else {
      formData[fieldname] = ['price', 'stock', 'active'].includes(fieldname)
        ? (fieldname === 'active' ? val === 'true' : Number(val))
        : val;
    }
  });

  await new Promise((resolve, reject) => {
    bb.on('finish', resolve);
    bb.on('error', err => reject(new ErrorHandler(500, err.message)));
    req.pipe(bb);
  });

  const existingStamp = await StampModel.findById(id);
  if (!existingStamp) throw new ErrorHandler(404, 'Stamp not found');

  // Delete removed images from Cloudinary
  if (formData.removedImages?.length) {
    await cloudinary.api.delete_resources(formData.removedImages);
    existingStamp.images = existingStamp.images.filter(
      img => !formData.removedImages.includes(img.publicId)
    );
  }

  // Upload new images
  const uploadedImages = await Promise.all(uploadPromises);
  if (uploadedImages.length) {
    existingStamp.images.push(...uploadedImages);
  }

  // Update only provided fields
  const updatableFields = ['name', 'description', 'price', 'stock', 'active', 'beginDate', 'categories'];
  updatableFields.forEach(field => {
    if (formData[field] !== undefined) {
      existingStamp[field] = formData[field];
    }
  });

  await existingStamp.save();

  res.status(200).json({
    success: true,
    message: 'Stamp updated successfully',
    stamp: existingStamp
  });
});

export const allCarousel = synchFunc(async (_, res) => {
  const Carousels = await CarouselModel.find();
  res.status(201).json({ success:true, Carousels });
});

export const singleCarousel = synchFunc(async (req, res) => {
  const {id} = req.params; 
  const carousel = await CarouselModel.findById(id);
  res.status(201).json({ success:true, carousel });
});

export const getAllSubscriber = synchFunc(async (_, res) => {
  const subscribers = await subscriberModel.find({}).populate({
    path: "user",
    model: "User",
  });

  res.status(201).json({ success:true, subscribers });
});

export const sendMailToSubscribers = synchFunc(async (req, res) => {
    const {selectedSubscribers,subject,message} = req.body;
    const emailSendRes = await mail(selectedSubscribers,subject,message)
    if(emailSendRes.messageId){
        res.status(200).json({ success:true, message:"Sent!" });
    }else{
        throw new ErrorHandler(400,'something Went Wrong While Sending The Mail!');
    }
});

export const getAllOrders = synchFunc(async (req, res) => {
    const orders = await orderModel.find();
    if(orders.length > 0){
        res.status(200).json({ success:true, orders });
    }else{
        throw new ErrorHandler(400,'On Order Placed Yet!');
    }
});

export const editOrder = synchFunc(async (req, res) => {
    const {id,status} = req.body;
    const order = await orderModel.findById(id);
    if(!order) throw new ErrorHandler(404,'order not found');
    order.status = status;
    await order.save();
    const orders = await orderModel.find();
    res.status(200).json({
      success:true, orders
    })
});

export const dashboardData = synchFunc(async (_, res) => {
  const orders = await orderModel.find();
  const monthlyCategorySummary = summarizeOrdersByMonth(orders);
  const monthlyPurchasers = getMonthlyPurchasers(orders);
  const topStampsThisMonth = getTopStampsThisMonth(orders)
  res.status(200).json({
    success:true,
    data:{
      barchatData:monthlyCategorySummary,
      lineChatData:monthlyPurchasers,
      topStampsThisMonth
    }
  })
});

export const getAllContactus = synchFunc(async (_, res) => {
  const allContacts = await ContactUs.find();
  res.status(200).json({
    success:true,
    allContacts
  })
});


export const addCategory = synchFunc(async (req, res) => {
  const category = await categoryModel.create({ name: req.body.name });
  res.status(201).json(category);
});

// // POST /api/categories
// app.post("/api/categories", async (req, res) => {
//   try {
    
//   } catch (err) {
//     res.status(400).json({ error: "Category already exists or is invalid" });
//   }
// });
