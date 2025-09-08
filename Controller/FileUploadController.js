import busboy from 'busboy';
import SFTPClient from 'ssh2-sftp-client';
import StampModel from '../Model/stampModel.js';
import { synchFunc } from '../Utils/SynchFunc.js';
import { ErrorHandler } from '../Utils/ErrorHandler.js';
import PhotoModel from '../Model/WaveModel.js';
import CarouselModel from '../Model/CarouselModel.js';
import path from 'path';

// ---------------- SFTP Helpers ----------------
const connectSFTP = async () => {
  const sftp = new SFTPClient();
  await sftp.connect({
    host: process.env.SFTP_HOST,
    port: process.env.SFTP_PORT,
    username: process.env.SFTP_USER,
    password: process.env.SFTP_PASS,
  });
  return sftp;
};

export const uploadBufferToSFTP = async (buffer, originalFilename, folder = "images", customName = null) => {
  const sftp = await connectSFTP();
  try {
    const ext = path.extname(originalFilename);
    const safeName = customName
      ? customName.replace(/\s+/g, "-").toLowerCase()
      : path.basename(originalFilename, ext).toLowerCase();
    const finalFileName = `${safeName}${ext}`;
    const remotePath = path.posix.join(`/${folder}`, finalFileName);

    await sftp.put(buffer, remotePath);
    await sftp.end();

    return { publicId: finalFileName, url: `https://agstamp.com${remotePath}` };
  } catch (err) {
    await sftp.end();
    throw new ErrorHandler(500, "SFTP upload failed: " + err.message);
  }
};

const deleteFilesFromSFTP = async (fileIds = [], folder = "images") => {
  if (!fileIds.length) return;
  const sftp = await connectSFTP();
  try {
    for (const publicId of fileIds) {
      try {
        await sftp.delete(`/${folder}/${publicId}`);
        console.log(`Deleted: /${folder}/${publicId}`);
      } catch (err) {
        console.warn(`Failed to delete /${folder}/${publicId}:`, err.message);
      }
    }
    await sftp.end();
  } catch (err) {
    await sftp.end();
    throw new ErrorHandler(500, "Failed to delete files from SFTP server");
  }
};

// ---------------- Stamp Controllers ----------------
export const createStamp = synchFunc(async (req, res) => {
  const bb = busboy({ headers: req.headers });
  const formData = { name: '', description: '', price: 0, stock: 0, beginDate: '', categories: '' };
  const uploadPromises = [];

  bb.on('field', (field, val) => {
    formData[field] = ['price', 'stock'].includes(field) ? Number(val) : val;
  });

  bb.on('file', (field, file, info) => {
    const { filename, mimeType } = info;
    if (!mimeType.startsWith('image/')) {
      file.resume();
      uploadPromises.push(Promise.reject(new ErrorHandler(400, "Only image files are allowed!")));
      return;
    }

    const chunks = [];
    file.on('data', (chunk) => chunks.push(chunk));
    uploadPromises.push(new Promise((resolve, reject) => {
      file.on('end', async () => {
        try {
          if (!formData.name.trim()) throw new ErrorHandler(400, "Stamp name is required before uploading images");
          const uploaded = await uploadBufferToSFTP(Buffer.concat(chunks), filename, "images", formData.name);
          resolve(uploaded);
        } catch (err) { reject(err); }
      });
      file.on('error', reject);
    }));
  });

  await new Promise((resolve, reject) => {
    bb.on('finish', resolve);
    bb.on('error', (err) => reject(new ErrorHandler(500, err.message)));
    req.pipe(bb);
  });

  if (!formData.name.trim()) throw new ErrorHandler(400, 'Stamp name is required');
  if (!formData.description.trim()) throw new ErrorHandler(400, 'Stamp description is required');
  if (formData.price < 0) throw new ErrorHandler(400, 'Price must be positive');
  if (formData.stock < 0) throw new ErrorHandler(400, 'Stock cannot be negative');
  if (!formData.beginDate) throw new ErrorHandler(400, 'Begin date is required');

  const beginDateParsed = new Date(formData.beginDate);
  if (isNaN(beginDateParsed.getTime())) throw new ErrorHandler(400, 'Invalid begin date format');

  const images = await Promise.all(uploadPromises);
  if (!images.length) throw new ErrorHandler(400, 'At least one image is required');

  const newStamp = await StampModel.create({ ...formData, beginDate: beginDateParsed, images });
  res.status(201).json({ success: true, message: 'Stamp created successfully', stamp: newStamp });
});

export const deleteStamp = synchFunc(async (req, res) => {
  const { id } = req.params;
  const stamp = await StampModel.findById(id);
  if (!stamp) throw new ErrorHandler(404, "Stamp not found");

  if (stamp.images.length) await deleteFilesFromSFTP(stamp.images.map(i => i.publicId));
  await StampModel.findByIdAndDelete(id);

  const stamps = await StampModel.find();
  res.status(200).json({ success: true, stamps, message: "Stamp and associated images deleted successfully" });
});

// ---------------- Photo Controller ----------------
export const uploadPhoto = synchFunc(async (req, res) => {
  const bb = busboy({ headers: req.headers });
  let uploadPromise;
  const formData = {};
  let fileUploaded = false;

  bb.on('field', (f, val) => formData[f] = val);

  bb.on('file', (f, file, info) => {
    const { filename, mimeType } = info;
    if (!mimeType.startsWith('image/')) { file.resume(); return; }
    fileUploaded = true;

    const chunks = [];
    file.on('data', (chunk) => chunks.push(chunk));

    uploadPromise = new Promise(async (resolve, reject) => {
      file.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const safeName = formData.name || path.basename(filename, path.extname(filename));
          const existingPhoto = await PhotoModel.findOne();
          if (existingPhoto) {
            await deleteFilesFromSFTP([existingPhoto.publicId]);
            await PhotoModel.deleteOne({ _id: existingPhoto._id });
          }
          const uploaded = await uploadBufferToSFTP(buffer, filename, "images", safeName);
          const newPhoto = await PhotoModel.create(uploaded);
          resolve(newPhoto);
        } catch (err) { reject(err); }
      });
      file.on('error', reject);
    });
  });

  await new Promise((resolve, reject) => {
    bb.on('finish', resolve);
    bb.on('error', reject);
    req.pipe(bb);
  });

  if (!fileUploaded) throw new ErrorHandler(400, "No file uploaded");
  const uploadResult = await uploadPromise;

  res.status(201).json({ success: true, data: uploadResult });
});

// ---------------- Carousel Controllers ----------------
export const createCarousel = synchFunc(async (req, res) => {
  const bb = busboy({ headers: req.headers });
  let name = '';
  const uploadPromises = [];

  bb.on('field', (f, val) => { if(f==='name') name = val.trim(); });

  bb.on('file', (f, file, info) => {
    const { filename, mimeType } = info;
    if (!mimeType.startsWith('image/')) {
      file.resume();
      uploadPromises.push(Promise.reject(new ErrorHandler(400, "Only image files are allowed!")));
      return;
    }
    const chunks = [];
    file.on('data', chunk => chunks.push(chunk));
    uploadPromises.push(new Promise((resolve, reject) => {
      file.on('end', async () => {
        if (!chunks.length) return reject(new ErrorHandler(400, "Empty file received"));
        try {
          const uploaded = await uploadBufferToSFTP(Buffer.concat(chunks), filename, "images", name);
          resolve(uploaded);
        } catch (err) { reject(new ErrorHandler(500, "Failed to upload image to SFTP")); }
      });
      file.on('error', reject);
    }));
  });

  await new Promise((resolve, reject) => {
    bb.on('finish', resolve);
    bb.on('error', err => reject(new ErrorHandler(500, err.message)));
    req.pipe(bb);
  });

  if (!name) throw new ErrorHandler(400, "Carousel name is required");
  const images = await Promise.all(uploadPromises);
  if (!images.length) throw new ErrorHandler(400, "At least one image is required");

  const newCarousel = await CarouselModel.create({ name, images });
  res.status(201).json({ success: true, message: "Carousel created successfully", carousel: newCarousel });
});

export const updateCarousel = synchFunc(async (req, res) => {
  const bb = busboy({ headers: req.headers });
  const { id } = req.params;
  const formData = {};
  const uploadPromises = [];

  bb.on('field', (f, val) => {
    if(f==='removedImages') {
      try { formData.removedImages = JSON.parse(val); } catch { formData.removedImages = []; }
    } else { formData[f] = val; }
  });

  bb.on('file', (f, file, info) => {
    const { filename, mimeType } = info;
    if (!mimeType.startsWith('image/')) {
      file.resume();
      uploadPromises.push(Promise.reject(new ErrorHandler(400, "Only image files are allowed!")));
      return;
    }

    const chunks = [];
    file.on('data', chunk => chunks.push(chunk));
    uploadPromises.push(new Promise((resolve, reject) => {
      file.on('end', async () => {
        if (!chunks.length) return reject(new ErrorHandler(400, "Empty file received"));
        try {
          const uploaded = await uploadBufferToSFTP(Buffer.concat(chunks), filename, "images", formData.name || null);
          resolve(uploaded);
        } catch { reject(new ErrorHandler(500, "Failed to upload image to SFTP")); }
      });
      file.on('error', reject);
    }));
  });

  await new Promise((resolve, reject) => {
    bb.on('finish', resolve);
    bb.on('error', err => reject(new ErrorHandler(500, err.message)));
    req.pipe(bb);
  });

  const carousel = await CarouselModel.findById(id);
  if (!carousel) throw new ErrorHandler(404, "Carousel not found");

  if (formData.removedImages?.length) {
    await deleteFilesFromSFTP(formData.removedImages);
    carousel.images = carousel.images.filter(img => !formData.removedImages.includes(img.publicId));
  }

  const uploadedImages = await Promise.all(uploadPromises);
  if (uploadedImages.length) carousel.images.push(...uploadedImages);

  if (formData.name !== undefined) carousel.name = formData.name.trim();

  await carousel.save();
  res.status(200).json({ success: true, message: "Carousel updated successfully", carousel });
});

export const deleteCarousel = synchFunc(async (req, res) => {
  const { id } = req.params;
  const carousel = await CarouselModel.findById(id);
  if (!carousel) throw new ErrorHandler(404, "Carousel not found");

  await deleteFilesFromSFTP(carousel.images.map(i => i.publicId));
  await CarouselModel.findByIdAndDelete(id);

  const carousels = await CarouselModel.find();
  res.status(200).json({ success: true, message: "Carousel deleted successfully", carousels });
});