import busboy from 'busboy';
import SFTPClient from 'ssh2-sftp-client';
import StampModel from '../Model/stampModel.js';
import { synchFunc } from '../Utils/SynchFunc.js';
import { ErrorHandler } from '../Utils/ErrorHandler.js';
import PhotoModel from '../Model/WaveModel.js';
import CarouselModel from '../Model/CarouselModel.js';
import path from 'path';

export const createStamp = synchFunc(async (req, res) => {
  const bb = busboy({ headers: req.headers });

  const formData = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    beginDate: '',
    categories: '',
  };

  const uploadPromises = [];

  bb.on('file', (fieldname, file, info) => {
    const { filename, mimeType } = info;
    if (!mimeType.startsWith('image/')) {
      throw new ErrorHandler(400, 'Only image files are allowed!');
    }

    const chunks = [];
    file.on('data', (chunk) => chunks.push(chunk));

    const uploadPromise = new Promise((resolve, reject) => {
      file.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          // 🔹 Generate new filename from Stamp Name
          const ext = path.extname(filename); // keep original extension
          const safeName = formData.name.replace(/\s+/g, "-").toLowerCase();
          const finalFileName = `${safeName}${ext}`;


          // SFTP connection
          const sftp = new SFTPClient();
          await sftp.connect({
            host: process.env.SFTP_HOST, // your IONOS SFTP host
            port: process.env.SFTP_PORT, // your IONOS SFTP port
            username: process.env.SFTP_USER,                 // your IONOS user
            password: process.env.SFTP_PASS,        // your IONOS password
          });

          // Upload to /images on your server
          const remotePath = `/images/${finalFileName}`;
          await sftp.put(buffer, remotePath);
          await sftp.end();

          resolve({
            publicId: finalFileName,
            publicUrl: `https://agstamp.com/images/${finalFileName}`,
          });
        } catch (err) {
          console.error(err);
          reject(new ErrorHandler(500, 'SFTP upload failed'));
        }
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

  if (!formData.name.trim()) throw new ErrorHandler(400, 'Stamp name is required');
  if (!formData.description.trim()) throw new ErrorHandler(400, 'Stamp description is required');
  if (formData.price < 0) throw new ErrorHandler(400, 'Price must be a positive number');
  if (formData.stock < 0) throw new ErrorHandler(400, 'Stock cannot be negative');
  if (!formData.beginDate) throw new ErrorHandler(400, 'Begin date is required');

  const beginDateParsed = new Date(formData.beginDate);
  if (isNaN(beginDateParsed.getTime())) throw new ErrorHandler(400, 'Invalid begin date format');

  // Upload all images via SFTP
  const images = await Promise.all(uploadPromises);
  if (!images.length) throw new ErrorHandler(400, 'At least one image is required');

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
  if (!stamp) throw new ErrorHandler(404, "Stamp not found");

  // If there are images, delete them from SFTP server
  if (stamp.images.length) {
    try {
      const sftp = new SFTPClient();
      await sftp.connect({
        host: process.env.SFTP_HOST, // IONOS SFTP host
        port: process.env.SFTP_PORT,
        username: process.env.SFTP_USER,                // IONOS user
        password: process.env.SFTP_PASS,             // IONOS password
      });

      for (const img of stamp.images) {
        const filePath = `/images/${img.publicId}`;
        try {
          await sftp.delete(filePath);
          console.log(`Deleted: ${filePath}`);
        } catch (err) {
          console.warn(`Failed to delete ${filePath}:`, err.message);
        }
      }

      await sftp.end();
    } catch (err) {
      console.error("SFTP delete error:", err);
      throw new ErrorHandler(500, "Failed to delete images from SFTP server");
    }
  }

  // Delete stamp from database
  await StampModel.findByIdAndDelete(id);

  const stamps = await StampModel.find();

  res.status(200).json({
    success: true,
    stamps,
    message: "Stamp and associated images deleted successfully",
  });
});

export const uploadBufferToSFTP = async (buffer, originalFilename, folder = "images", customName = null) => {
  const sftp = new SFTPClient();
  try {
    await sftp.connect({
      host: process.env.SFTP_HOST,
      port: process.env.SFTP_PORT,
      username: process.env.SFTP_USER,
      password: process.env.SFTP_PASS,
    });

    const ext = path.extname(originalFilename);
    const safeName = customName
      ? customName.replace(/\s+/g, "-").toLowerCase()
      : path.basename(originalFilename, ext).toLowerCase();
    const finalFileName = `${safeName}${ext}`;

    const remoteDir = `/${folder}`;
    const remotePath = path.posix.join(remoteDir, finalFileName);

    // ✅ Upload to SFTP
    await sftp.put(buffer, remotePath);
    await sftp.end();

    return {
      publicId: finalFileName,
      url: `https://agstamp.com${remotePath}`,
      publicUrl: `https://agstamp.com${remotePath}`,
    };
  } catch (err) {
    throw new ErrorHandler(500, "SFTP upload failed: " + err.message);
  }
};



export const uploadPhoto = async (req, res) => {
    const bb = busboy({ headers: req.headers });

    let formData = {};
    let fileData = {};

    bb.on("field", (fieldname, val) => {
        formData[fieldname] = val;
    });

    bb.on("file", (fieldname, file, info) => {
        const { filename, mimeType } = info;
        if (!mimeType.startsWith("image/")) {
            return file.resume();
        }
        const chunks = [];
        file.on("data", (chunk) => chunks.push(chunk));
        file.on("end", () => {
            fileData = {
                buffer: Buffer.concat(chunks),
                filename,
            };
        });
    });

    bb.on("finish", async () => {
        try {
            // CRITICAL CHANGE: Use the stamp name from the form to find the document.
            if (!formData.name) {
                return res.status(400).json({ success: false, message: "Stamp name is required to perform an update." });
            }

            const stampToUpdate = await StampModel.findOne({ name: formData.name });
            if (!stampToUpdate) {
                return res.status(404).json({ success: false, message: `Stamp with name "${formData.name}" not found.` });
            }

            // CASE 1: A new file was uploaded.
            if (fileData.buffer) {
                // Delete old images from SFTP
                const sftp = new SFTPClient();
                await sftp.connect({ /* your sftp config */ });
                for (const image of stampToUpdate.images) {
                    try {
                        await sftp.delete(`/images/${image.publicId}`);
                    } catch (err) {
                        console.warn(`Old file ${image.publicId} not found, continuing.`);
                    }
                }
                await sftp.end();

                // Upload the new image, using the stamp name for the filename
                const newImage = await uploadBufferToSFTP(
                    fileData.buffer,
                    fileData.filename,
                    "images",
                    formData.name
                );
                
                formData.images = [newImage];
            }
            // CASE 2: No new file was uploaded. Proceed to update text fields.

            // Update the found stamp with the new form data.
            const updatedStamp = await StampModel.findOneAndUpdate(
                { name: formData.name }, // Find by name
                { $set: formData },      // Set the new data
                { new: true, runValidators: true } // Options
            );

            return res.status(200).json({
                success: true,
                message: "Stamp updated successfully!",
                stamp: updatedStamp,
            });

        } catch (error) {
            console.error("Update error:", error);
            return res.status(500).json({ success: false, message: "Server error during update." });
        }
    });

    req.pipe(bb);
};

export const createCarousel = synchFunc(async (req, res) => {
  const bb = busboy({ headers: req.headers });

  let name = "";
  const uploadPromises = [];

  // 📝 Get carousel name
  bb.on("field", (fieldname, val) => {
    if (fieldname === "name") {
      name = val.trim();
    }
  });

  // 📂 Handle file uploads
  bb.on("file", (fieldname, file, info) => {
    const { filename, mimeType } = info;

    if (!mimeType.startsWith("image/")) {
      file.resume();
      uploadPromises.push(
        Promise.reject(new ErrorHandler(400, "Only image files are allowed!"))
      );
      return;
    }

    const chunks = [];
    file.on("data", (chunk) => chunks.push(chunk));

    const uploadPromise = new Promise((resolve, reject) => {
      file.on("end", async () => {
        try {
          if (chunks.length === 0) {
            return reject(new ErrorHandler(400, "Empty file received"));
          }

          const buffer = Buffer.concat(chunks);

          // ✅ Use the helper so naming matches uploadPhoto
          const result = await uploadBufferToSFTP(
            buffer,
            filename,
            "images",
            name // optional: use carousel name as base for file naming
          );

          resolve(result);
        } catch (err) {
          console.error("SFTP upload error:", err);
          reject(new ErrorHandler(500, "Failed to upload image to SFTP"));
        }
      });

      file.on("error", reject);
    });

    uploadPromises.push(uploadPromise);
  });

  // Wait for form parsing
  await new Promise((resolve, reject) => {
    bb.on("finish", resolve);
    bb.on("error", (err) => reject(new ErrorHandler(500, err.message)));
    req.pipe(bb);
  });

  if (!name) {
    throw new ErrorHandler(400, "Carousel name is required");
  }

  // Upload all images
  const images = await Promise.all(uploadPromises);
  if (!images.length) {
    throw new ErrorHandler(400, "At least one image is required");
  }

  // Save carousel to DB
  const newCarousel = await CarouselModel.create({
    name,
    images, // [{ publicId, url }]
  });

  res.status(201).json({
    success: true,
    message: "Carousel image(s) added successfully",
    carousel: newCarousel,
  });
});


// Update Carousel
export const updateCarousel = synchFunc(async (req, res) => {
  const bb = busboy({ headers: req.headers });
  const { id } = req.params;

  const formData = {};
  const uploadPromises = [];

  // Handle fields
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

  // Handle file uploads using helper
  bb.on("file", (fieldname, file, info) => {
    const { filename, mimeType } = info;

    if (!mimeType.startsWith("image/")) {
      file.resume();
      uploadPromises.push(Promise.reject(new ErrorHandler(400, "Only image files are allowed!")));
      return;
    }

    const chunks = [];
    file.on("data", (chunk) => chunks.push(chunk));

    uploadPromises.push(
      new Promise((resolve, reject) => {
        file.on("end", async () => {
          try {
            if (!chunks.length) return reject(new ErrorHandler(400, "Empty file received"));

            const buffer = Buffer.concat(chunks);
            const uploaded = await uploadBufferToSFTP(
              buffer,
              filename,
              "images",
              formData.name || null
            );

            resolve({ publicId: uploaded.publicId, url: uploaded.url });
          } catch (err) {
            reject(new ErrorHandler(500, "Failed to upload image to SFTP"));
          }
        });
        file.on("error", reject);
      })
    );
  });

  // Wait for busboy finish
  await new Promise((resolve, reject) => {
    bb.on("finish", resolve);
    bb.on("error", (err) => reject(new ErrorHandler(500, err.message)));
    req.pipe(bb);
  });

  // Find existing carousel
  const existingCarousel = await CarouselModel.findById(id);
  if (!existingCarousel) throw new ErrorHandler(404, "Carousel not found");

  // Delete removed images
  if (formData.removedImages?.length) {
    await deleteFilesFromSFTP(formData.removedImages, "images");
    existingCarousel.images = existingCarousel.images.filter(
      (img) => !formData.removedImages.includes(img.publicId)
    );
  }

  // Add newly uploaded images
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

  // 🗑 Delete associated images from SFTP
  if (carousel.images.length) {
    try {
      const sftp = new SFTPClient();
      await sftp.connect({
        host: process.env.SFTP_HOST, // IONOS SFTP host
        port: process.env.SFTP_PORT,
        username: process.env.SFTP_USER,                // IONOS user
        password: process.env.SFTP_PASS,             // IONOS password
      });

      for (const img of carousel.images) {
        const filePath = `/images/${img.publicId}`;
        try {
          await sftp.delete(filePath);
          console.log(`Deleted: ${filePath}`);
        } catch (err) {
          console.warn(`Failed to delete ${filePath}:`, err.message);
        }
      }

      await sftp.end();
    } catch (err) {
      console.error("SFTP delete error:", err);
      throw new ErrorHandler(500, "Failed to delete images from SFTP server");
    }
  }

  // 🗂 Delete carousel document
  await CarouselModel.findByIdAndDelete(id);

  const carousels = await CarouselModel.find();

  res.status(200).json({
    success: true,
    carousels,
    message: "Carousel and associated images deleted successfully",
  });
});
