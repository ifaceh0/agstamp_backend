import busboy from 'busboy';
import { v2 as cloudinary } from 'cloudinary';
import StampModel from '../Model/stampModel.js';
import { synchFunc } from '../Utils/SynchFunc.js';
import { ErrorHandler } from '../Utils/ErrorHandler.js';
import PhotoModel from '../Model/WaveModel.js';
import CarouselModel from '../Model/CarouselModel.js';

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const createStamp = synchFunc(async (req, res) => {
  const bb = busboy({ headers: req.headers });

  const formData = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    beginDate: '',
    categories: '', // added here
  };

  const uploadPromises = [];

  bb.on('file', (fieldname, file, info) => {
    const { mimeType } = info;

    if (!mimeType.startsWith('image/')) {
      throw new ErrorHandler(400, 'Only image files are allowed!');
    }

    const chunks = [];

    file.on('data', (chunk) => chunks.push(chunk));

    const uploadPromise = new Promise((resolve, reject) => {
      file.on('end', () => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'stamps' },
          (error, result) => {
            if (error || !result) {
              reject(new ErrorHandler(500, 'Failed to upload image to Cloudinary'));
            } else {
              resolve({
                publicId: result.public_id,
                publicUrl: result.secure_url,
              });
            }
          }
        );
        uploadStream.end(Buffer.concat(chunks));
      });
    });

    uploadPromises.push(uploadPromise);
  });

  bb.on('field', (fieldname, val) => {
    if (['price', 'stock'].includes(fieldname)) {
      formData[fieldname] = Number(val);
    } else {
      formData[fieldname] = val;
    }
  });

  await new Promise((resolve, reject) => {
    bb.on('finish', resolve);
    bb.on('error', (err) => reject(new ErrorHandler(500, err.message)));
    req.pipe(bb);
  });

  // Validations
  if (!formData.name.trim()) throw new ErrorHandler(400, 'Stamp name is required');
  if (!formData.description.trim()) throw new ErrorHandler(400, 'Stamp description is required');
  if (formData.price < 0) throw new ErrorHandler(400, 'Price must be a positive number');
  if (formData.stock < 0) throw new ErrorHandler(400, 'Stock cannot be negative');

  if (!formData.beginDate) {
    throw new ErrorHandler(400, 'Begin date is required');
  }

  const beginDateParsed = new Date(formData.beginDate);
  if (isNaN(beginDateParsed.getTime())) {
    throw new ErrorHandler(400, 'Invalid begin date format');
  }

  let images = [];

  try {
    images = await Promise.all(uploadPromises);
    if (!images.length) throw new ErrorHandler(400, 'At least one image is required');
  } catch (error) {
    if (images.length) {
      await cloudinary.api.delete_resources(images.map((img) => img.publicId));
    }
    throw error;
  }

  const newStamp = await StampModel.create({
    ...formData,
    beginDate: beginDateParsed,
    images,
  });

  res.status(201).json({
    success: true,
    message: 'Stamp created successfully',
    stamp: newStamp,
  });
});


export const deleteStamp = synchFunc(async (req, res) => {
  const { id } = req.params;

  const stamp = await StampModel.findById(id);
  if (!stamp) throw new ErrorHandler(404, 'Stamp not found');

  if (stamp.images.length) {
    const publicIds = stamp.images.map(img => img.publicId);
    await cloudinary.api.delete_resources(publicIds);
  }

  await StampModel.findByIdAndDelete(id);

  const stamps = await StampModel.find();

  res.status(200).json({
    success: true,
    stamps,
    message: 'Stamp and associated images deleted successfully'
  });
});


export const uploadPhoto = async (req, res) => {
  try {
    const bb = busboy({ headers: req.headers });

    let uploadResult = null;
    let fileProcessingStarted = false;
    let uploadPromise;

    bb.on('file', (fieldname, file, info) => {
      fileProcessingStarted = true;
      const { mimeType } = info;

      if (!mimeType.startsWith('image/')) {
        file.resume();
        return;
      }

      const chunks = [];

      file.on('data', (chunk) => chunks.push(chunk));

      uploadPromise = new Promise((resolve, reject) => {
        file.on('end', async () => {
          try {
            if (chunks.length === 0) {
              return reject(new Error('Empty file received'));
            }

            const buffer = Buffer.concat(chunks);

            // if (buffer.length > 10 * 1024 * 1024) {
            //   return reject(new Error('File size exceeds 10MB limit'));
            // }

            // Check for existing photo and delete it
            const existingPhoto = await PhotoModel.findOne();
            if (existingPhoto) {
              // Delete from Cloudinary
              await cloudinary.uploader.destroy(existingPhoto.publicId);
              // Delete from MongoDB
              await PhotoModel.deleteOne({ _id: existingPhoto._id });
            }

            // Upload new photo to Cloudinary
            const cloudinaryResult = await new Promise((innerResolve, innerReject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'user-uploads' },
                (error, result) => {
                  if (error || !result) {
                    return innerReject(error || new Error('Cloudinary upload failed'));
                  }
                  innerResolve(result);
                }
              );

              uploadStream.on('error', innerReject);
              uploadStream.end(buffer);
            });

            // Save to MongoDB
            const newPhoto = await PhotoModel.create({
              publicId: cloudinaryResult.public_id,
              url: cloudinaryResult.secure_url,
            });

            resolve({
              id: newPhoto._id,
              publicId: newPhoto.publicId,
              url: newPhoto.url,
              createdAt: newPhoto.createdAt,
            });
          } catch (error) {
            reject(error);
          }
        });

        file.on('error', reject);
      });
    });

    bb.on('error', (err) => {
      throw err;
    });

    const pipelinePromise = new Promise((resolve, reject) => {
      bb.on('close', async () => {
        if (!fileProcessingStarted) {
          return reject(new Error('No file was uploaded'));
        }

        try {
          uploadResult = await uploadPromise;
          resolve();
        } catch (err) {
          reject(err);
        }
      });

      req.on('error', reject);
      req.pipe(bb);
    });

    await pipelinePromise;

    return res.status(201).json({
      success: true,
      data: uploadResult,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'File upload failed',
    });
  }
};

export const createCarousel = synchFunc(async (req, res) => {
  const bb = busboy({ headers: req.headers });

  let name = "";
  const uploadPromises = [];

  bb.on("field", (fieldname, val) => {
    if (fieldname === "name") {
      name = val.trim();
    }
  });

  bb.on("file", (fieldname, file, info) => {
    const { mimeType } = info;

    if (!mimeType.startsWith("image/")) {
      throw new ErrorHandler(400, "Only image files are allowed!");
    }

    const chunks = [];

    file.on("data", (chunk) => chunks.push(chunk));

    const uploadPromise = new Promise((resolve, reject) => {
      file.on("end", () => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "carousel" },
          (error, result) => {
            if (error || !result) {
              reject(new ErrorHandler(500, "Failed to upload image to Cloudinary"));
            } else {
              resolve({
                publicId: result.public_id,
                publicUrl: result.secure_url,
              });
            }
          }
        );
        uploadStream.end(Buffer.concat(chunks));
      });
    });

    uploadPromises.push(uploadPromise);
  });

  await new Promise((resolve, reject) => {
    bb.on("finish", resolve);
    bb.on("error", (err) => reject(new ErrorHandler(500, err.message)));
    req.pipe(bb);
  });

  if (!name) {
    throw new ErrorHandler(400, "Carousel name is required");
  }

  let images = [];

  try {
    images = await Promise.all(uploadPromises);
    if (!images.length) throw new ErrorHandler(400, "At least one image is required");
  } catch (error) {
    if (images.length) {
      await cloudinary.api.delete_resources(images.map((img) => img.publicId));
    }
    throw error;
  }

  const newCarousel = await CarouselModel.create({
    name,
    images,
  });

  res.status(201).json({
    success: true,
    message: "Carousel image(s) added successfully",
    carousel: newCarousel,
  });
});

export const updateCarousel = synchFunc(async (req, res) => {
  const bb = busboy({ headers: req.headers });
  const { id } = req.params;

  const formData = {};
  const uploadPromises = [];

  bb.on("field", (fieldname, val) => {
    if (fieldname === "removedImages") {
      try {
        formData.removedImages = JSON.parse(val);
      } catch {
        formData.removedImages = [];
      }
    } else {
      formData[fieldname] = val;
    }
  });

  bb.on("file", (fieldname, file, info) => {
    const { mimeType } = info;
    const chunks = [];

    if (!mimeType.startsWith("image/")) {
      throw new ErrorHandler(400, "Only image files are allowed!");
    }

    file.on("data", (chunk) => chunks.push(chunk));

    const uploadPromise = new Promise((resolve, reject) => {
      file.on("end", () => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "carousel" },
          (error, result) => {
            if (error || !result) {
              reject(new ErrorHandler(500, "Cloudinary upload failed"));
            } else {
              resolve({
                publicId: result.public_id,
                publicUrl: result.secure_url,
              });
            }
          }
        );
        uploadStream.end(Buffer.concat(chunks));
      });
    });

    uploadPromises.push(uploadPromise);
  });

  await new Promise((resolve, reject) => {
    bb.on("finish", resolve);
    bb.on("error", (err) => reject(new ErrorHandler(500, err.message)));
    req.pipe(bb);
  });

  const existingCarousel = await CarouselModel.findById(id);
  if (!existingCarousel) throw new ErrorHandler(404, "Carousel not found");

  // Remove old images if specified
  if (formData.removedImages?.length) {
    await cloudinary.api.delete_resources(formData.removedImages);
    existingCarousel.images = existingCarousel.images.filter(
      (img) => !formData.removedImages.includes(img.publicId)
    );
  }

  // Upload new images and add them to the model
  const uploadedImages = await Promise.all(uploadPromises);
  if (uploadedImages.length) {
    existingCarousel.images.push(...uploadedImages);
  }

  // Update name if provided
  if (formData.name !== undefined) {
    existingCarousel.name = formData.name.trim();
  }

  await existingCarousel.save();

  res.status(200).json({
    success: true,
    message: "Carousel updated successfully",
    carousel: existingCarousel,
  });
});

export const deleteCarousel = synchFunc(async (req, res) => {
  const { id } = req.params;

  const carousel = await CarouselModel.findById(id);
  if (!carousel) throw new ErrorHandler(404, "Carousel not found");

  // Delete associated Cloudinary images
  if (carousel.images.length) {
    const publicIds = carousel.images.map((img) => img.publicId);
    await cloudinary.api.delete_resources(publicIds);
  }

  await CarouselModel.findByIdAndDelete(id);

  const carousels = await CarouselModel.find();

  res.status(200).json({
    success: true,
    carousels,
    message: "Carousel and associated images deleted successfully",
  });
});

