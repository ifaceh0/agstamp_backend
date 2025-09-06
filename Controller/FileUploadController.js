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
          const remotePath = `/kunden/homepages/19/d209772675/htdocs/images/${finalFileName}`;
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

export const uploadBufferToSFTP = async (buffer, filename, folder = "images") => {
  const sftp = new SFTPClient();
  try {
    await sftp.connect({
      host: process.env.SFTP_HOST,
      port: process.env.SFTP_PORT,
      username: process.env.SFTP_USER,
      password: process.env.SFTP_PASS,
    });

    const remoteDir = `/${folder}`;
    const remoteFilename = filename;
    const remotePath = path.posix.join(remoteDir, remoteFilename);

    await sftp.put(buffer, remotePath);
    await sftp.end();

    return {
      publicId: remoteFilename,
      publicUrl: `https://agstamp.com${remotePath}`,
    };
  } catch (err) {
    throw new ErrorHandler(500, "SFTP upload failed: " + err.message);
  }
};


export const uploadPhoto = async (req, res) => {
  try {
    const bb = busboy({ headers: req.headers });

    let uploadResult = null;
    let fileProcessingStarted = false;
    let uploadPromise;

    bb.on("file", (fieldname, file, info) => {
      fileProcessingStarted = true;
      const { filename, mimeType } = info;
      console.log(`--- UPLOAD DEBUG --- The filename is: ${filename}`)

      if (!mimeType.startsWith("image/")) {
        file.resume();
        return;
      }

      const chunks = [];

      file.on("data", (chunk) => chunks.push(chunk));

      uploadPromise = new Promise((resolve, reject) => {
        file.on("end", async () => {
          try {
            if (chunks.length === 0) {
              return reject(new ErrorHandler(400, "Empty file received"));
            }

            const buffer = Buffer.concat(chunks);

            const sftp = new SFTPClient();
            await sftp.connect({
              host: process.env.SFTP_HOST, // IONOS SFTP host
              port: process.env.SFTP_PORT,
              username: process.env.SFTP_USER,                // IONOS user
              password: process.env.SFTP_PASS,             // IONOS password
            });

            // 🗑 Delete existing photo if present
            const existingPhoto = await PhotoModel.findOne();
            if (existingPhoto) {
              try {
                await sftp.delete(`/images/${existingPhoto.publicId}`); // delete from server
              } catch (err) {
                console.warn("Old file not found on SFTP:", err.message);
              }
              await PhotoModel.deleteOne({ _id: existingPhoto._id }); // delete from DB
            }

            // 📂 Define remote path
            const remoteDir = "/images";
            const remoteFilename = filename;
            const remotePath = path.posix.join(remoteDir, remoteFilename);

            // ✅ Upload to SFTP
            await sftp.put(buffer, remotePath);
            await sftp.end();

            // 💾 Save to DB
            const newPhoto = await PhotoModel.create({
              publicId: remoteFilename,
              url: `https://agstamp.com${remotePath}`,
            });

            resolve({
              id: newPhoto._id,
              path: newPhoto.path,
              url: newPhoto.url,
              createdAt: newPhoto.createdAt,
            });
          } catch (error) {
            reject(error);
          }
        });

        file.on("error", reject);
      });
    });

    bb.on("error", (err) => {
      throw err;
    });

    const pipelinePromise = new Promise((resolve, reject) => {
      bb.on("finish", async () => {
        if (!fileProcessingStarted) {
          return reject(new ErrorHandler(400, "No file was uploaded"));
        }

        try {
          uploadResult = await uploadPromise;
          resolve();
        } catch (err) {
          reject(err);
        }
      });

      req.on("error", reject);
      req.pipe(bb);
    });

    await pipelinePromise;

    return res.status(201).json({
      success: true,
      data: uploadResult,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "File upload failed",
    });
  }
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
      throw new ErrorHandler(400, "Only image files are allowed!");
    }

    const chunks = [];

    file.on("data", (chunk) => chunks.push(chunk));

    const uploadPromise = new Promise((resolve, reject) => {
      file.on("end", async () => {
        try {
          const buffer = Buffer.concat(chunks);

          const sftp = new SFTPClient();
          await sftp.connect({
            host: process.env.SFTP_HOST, // IONOS SFTP host
            port: process.env.SFTP_PORT,
            username: process.env.SFTP_USER,                // IONOS user
            password: process.env.SFTP_PASS,             // IONOS password
          });

          // 📂 Remote path
          const remoteDir = "/images";
          const remoteFilename = filename;
          const remotePath = path.posix.join(remoteDir, remoteFilename);

          // ✅ Upload to SFTP
          await sftp.put(buffer, remotePath);
          await sftp.end();

          resolve({
            publicId: remoteFilename,
            publicUrl: `https://agstamp.com${remotePath}`,
          });
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

  // 📝 Handle fields
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

  // 📂 Handle file uploads
  bb.on("file", (fieldname, file, info) => {
    const { filename, mimeType } = info;

    if (!mimeType.startsWith("image/")) {
      throw new ErrorHandler(400, "Only image files are allowed!");
    }

    const chunks = [];

    file.on("data", (chunk) => chunks.push(chunk));

    const uploadPromise = new Promise((resolve, reject) => {
      file.on("end", async () => {
        try {
          const buffer = Buffer.concat(chunks);

          const sftp = new SFTPClient();
          await sftp.connect({
            host: process.env.SFTP_HOST, // IONOS SFTP host
            port: process.env.SFTP_PORT,
            username: process.env.SFTP_USER,                // IONOS user
            password: process.env.SFTP_PASS,             // IONOS password
          });

          const remoteDir = "/images";
          const remoteFilename = filename;
          const remotePath = path.posix.join(remoteDir, remoteFilename);

          await sftp.put(buffer, remotePath);
          await sftp.end();

          resolve({
            publicId: remoteFilename,
            publicUrl: `https://agstamp.com${remotePath}`,
          });
        } catch (err) {
          console.error("SFTP upload error:", err);
          reject(new ErrorHandler(500, "Failed to upload image to SFTP"));
        }
      });

      file.on("error", reject);
    });

    uploadPromises.push(uploadPromise);
  });

  // Wait for busboy finish
  await new Promise((resolve, reject) => {
    bb.on("finish", resolve);
    bb.on("error", (err) => reject(new ErrorHandler(500, err.message)));
    req.pipe(bb);
  });

  // 🔍 Find existing carousel
  const existingCarousel = await CarouselModel.findById(id);
  if (!existingCarousel) throw new ErrorHandler(404, "Carousel not found");

  // 🗑 Remove old images from SFTP if specified
  if (formData.removedImages?.length) {
    try {
      const sftp = new SFTPClient();
      await sftp.connect({
        host: process.env.SFTP_HOST, // IONOS SFTP host
        port: process.env.SFTP_PORT,
        username: process.env.SFTP_USER,                // IONOS user
        password: process.env.SFTP_PASS,
      });

      for (const publicId of formData.removedImages) {
        const filePath = `/images/${publicId}`;
        try {
          await sftp.delete(filePath);
          console.log(`Deleted: ${filePath}`);
        } catch (err) {
          console.warn(`Failed to delete ${filePath}:`, err.message);
        }
      }

      await sftp.end();

      // Remove them from DB object too
      existingCarousel.images = existingCarousel.images.filter(
        (img) => !formData.removedImages.includes(img.publicId)
      );
    } catch (err) {
      console.error("SFTP delete error:", err);
      throw new ErrorHandler(500, "Failed to delete images from SFTP server");
    }
  }

  // 📥 Add new uploaded images
  const uploadedImages = await Promise.all(uploadPromises);
  if (uploadedImages.length) {
    existingCarousel.images.push(...uploadedImages);
  }

  // ✏️ Update name if provided
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
