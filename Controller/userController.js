import bcrypt from 'bcryptjs';
import { UserModel } from '../Model/userModel.js';
import jwt from "jsonwebtoken";
import { synchFunc } from '../Utils/SynchFunc.js';
import { ErrorHandler } from '../Utils/ErrorHandler.js';
import stampModel from '../Model/stampModel.js';
import PhotoModel from '../Model/WaveModel.js';
import { mail } from '../Helper/Mail.js';
import subscriberModel from '../Model/subcriberModel.js';
import orderModel from '../Model/orderModel.js';
import ContactUs from '../Model/ContactUs.js';
import categoryModel from '../Model/CategoryModal.js';
import ShippingRate from '../Model/ShippingRate.js';

export const userRegister = synchFunc(async (req, res) => {
    const { firstname, lastname, username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
        throw new ErrorHandler(400,'Email already in use')
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new UserModel({
        firstname,
        lastname,
        username,
        email,
        password: hashedPassword
    });

    // Save user to database
    await newUser.save();

    res.status(201).json({ success:true, message: 'register successful'});
})

export const userLogin = synchFunc(async (req, res) => {

    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (!existingUser) {
        throw new ErrorHandler(400,'Invalid email or password!')
    }

    const isCorrectPassword = bcrypt.compareSync(password,existingUser.password)

    if(!isCorrectPassword){
        throw new ErrorHandler(400,'Invalid email or password!')
    }


    // creating user token
    const token = jwt.sign({id:existingUser._id},process.env.JWTSECRET,{
        expiresIn : process.env.JWTEXPIRY
    })

    res.cookie("agstampToken", token, {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true, 
        secure: true,
        sameSite: "none",
        path: "/",
    }).status(201).json({ success:true, message: 'Login successful', user: existingUser });
})

export const getUserInfo = synchFunc(async (req, res) => {
    res.status(201).json({ success:true, user: req.user });
})

export const userLogout = synchFunc(async (_, res) => {
    res.cookie("agstampToken", null, {
        maxAge: 0,
        httpOnly: true, 
        secure: true,
        sameSite: "none",
        path: "/",
    }).status(201).json({ success:true, message: 'Logout successful',user:null });
})

export const userProduct = synchFunc(async (_, res) => {
    const today = new Date();
    const stamps = await stampModel.find({
    active: true,
    beginDate: { $lte: today },
    });
    res.status(201).json({ success:true, stamps });
})

export const getWaveImg = synchFunc(async (_, res) => {
    const wave = await PhotoModel.find();
    res.status(201).json({ success:true, wave });
})

export const subscribeMailService = synchFunc(async (req, res) => {
    const {email} = req.body;
    const {user} = req;
    const emailSendRes = await mail([email],"Welcome email","Hello");
    if(emailSendRes.messageId){
        const newSubscriber = new subscriberModel({
            user:user._id,
            subscribedEmail:email,
        });
        
        // Save user to database
        await newSubscriber.save();
        res.status(200).json({ success:true, message:"Thank you for subscribing" });
    }else{
        throw new ErrorHandler(400,'something Went Wrong While Sending The Mail!');
    }
});

export const getAllUserOrder = synchFunc(async (req, res) => {
    const orders = await orderModel.find({userId:req.user._id}).sort({ createdAt: -1 });
    res.status(200).json({ 
      success: true, 
      orders 
    });
});

// export const contactUSController = synchFunc(async (req, res) => {
//     const { name, email, subject, message } = req.body;

//     if (!name || !email || !subject || !message) {
//       return res.status(400).json({ success: false, message: 'All fields are required' });
//     }

//     const html = `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
//             <h2 style="color: #333;">📬 New Contact Form Submission</h2>

//             <p><strong>Name:</strong> ${name}</p>
//             <p><strong>Email:</strong> ${email}</p>
//             <p><strong>Subject:</strong> ${subject}</p>
//             <p><strong>Message:</strong></p>
//             <div style="background: #fff; padding: 12px; border-left: 4px solid #007BFF; margin-top: 10px; color: #333;">
//             ${message.replace(/\n/g, "<br />")}
//             </div>

//             <hr style="margin-top: 20px;" />
//             <p style="font-size: 12px; color: #888;">This email was generated automatically from your website contact form.</p>
//         </div>
//     `

//     await mail([process.env.ADMIN_EMAIL],`Contact Form: ${subject}`,html);
//     res.status(201).json({ success: true, message: 'Message sent successfully' });
// });

// export const contactUSController = synchFunc(async (req, res) => {
//     const { name, email, subject, message } = req.body;

//     // Validate required fields
//     if (!name || !email || !subject || !message) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'All fields are required' 
//       });
//     }

//     // Email validation regex
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Please provide a valid email address' 
//       });
//     }

//     // Save to database first
//     const newContact = new ContactUs({
//       name,
//       email,
//       subject,
//       message
//     });

//     await newContact.save();

//     // Prepare email HTML
//     const adminEmailHtml = `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
//             <h2 style="color: #333;">📬 New Contact Form Submission</h2>

//             <p><strong>Name:</strong> ${name}</p>
//             <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
//             <p><strong>Subject:</strong> ${subject}</p>
//             <p><strong>Message:</strong></p>
//             <div style="background: #fff; padding: 12px; border-left: 4px solid #007BFF; margin-top: 10px; color: #333;">
//             ${message.replace(/\n/g, "<br />")}
//             </div>

//             <hr style="margin-top: 20px;" />
//             <p style="font-size: 12px; color: #888;">Submitted on: ${new Date().toLocaleString()}</p>
//             <p style="font-size: 12px; color: #888;">This email was generated automatically from your website contact form.</p>
//         </div>
//     `;

//     // Prepare confirmation email for user
//     const userConfirmationHtml = `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
//             <h2 style="color: #007BFF;">Thank You for Contacting Agstamp! 🎉</h2>
            
//             <p>Hi <strong>${name}</strong>,</p>
            
//             <p>We have received your message and our team will get back to you as soon as possible.</p>
            
//             <div style="background: #fff; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
//                 <h3 style="margin-top: 0; color: #333;">Your Message Details:</h3>
//                 <p><strong>Subject:</strong> ${subject}</p>
//                 <p><strong>Message:</strong></p>
//                 <p style="color: #555;">${message.replace(/\n/g, "<br />")}</p>
//             </div>
            
//             <p>If you have any urgent concerns, please feel free to reply to this email.</p>
            
//             <hr style="margin: 20px 0;" />
//             <p style="font-size: 12px; color: #888;">Best regards,<br/>The Agstamp Team</p>
//         </div>
//     `;

//     try {
//       // Send email to admin
//       await mail(
//         [process.env.ADMIN_EMAIL], 
//         `Contact Form: ${subject}`, 
//         adminEmailHtml
//       );

//       // Send confirmation email to user
//       await mail(
//         [email], 
//         'We received your message - Agstamp', 
//         userConfirmationHtml
//       );

//       res.status(201).json({ 
//         success: true, 
//         message: 'Message sent successfully! Check your email for confirmation.' 
//       });

//     } catch (emailError) {
//       console.error('Email sending error:', emailError);
      
//       // Even if email fails, the message is saved in database
//       res.status(201).json({ 
//         success: true, 
//         message: 'Message saved successfully! We will respond soon.',
//         emailSent: false
//       });
//     }
// });

export const contactUSController = synchFunc(async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
      });
    }

    // Name validation - only letters and spaces
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name should contain only letters and spaces' 
      });
    }

    // Save to database first
    const newContact = new ContactUs({
      name,
      email,
      subject,
      message
    });

    await newContact.save();

    // Prepare email HTML for admin
    const adminEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
            <h2 style="color: #333;">📬 New Contact Form Submission</h2>

            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #007BFF;">${email}</a></p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <div style="background: #fff; padding: 12px; border-left: 4px solid #007BFF; margin-top: 10px; color: #333;">
                ${message.replace(/\n/g, "<br />")}
            </div>

            <hr style="margin-top: 20px; border: none; border-top: 1px solid #e0e0e0;" />
            <p style="font-size: 12px; color: #888;">Submitted on: ${new Date().toLocaleString()}</p>
            <p style="font-size: 12px; color: #888;">This email was generated automatically from your website contact form.</p>
        </div>
    `;

    // Prepare confirmation email for user
    const userConfirmationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
            <h2 style="color: #007BFF;">Thank You for Contacting Agstamp! 🎉</h2>
            
            <p>Hi <strong>${name}</strong>,</p>
            
            <p>We have received your message and our team will get back to you as soon as possible.</p>
            
            <div style="background: #fff; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #333;">Your Message Details:</h3>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p style="color: #555;">${message.replace(/\n/g, "<br />")}</p>
            </div>
            
            <p>If you have any urgent concerns, please feel free to reply to this email.</p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;" />
            <p style="font-size: 12px; color: #888;">Best regards,<br/>The Agstamp Team</p>
            <p style="font-size: 12px; color: #888;">📧 Email: ${process.env.ADMIN_EMAIL || 'info@agstamp.com'}</p>
        </div>
    `;

    try {
      // Send email to admin with replyTo set to user's email
      await mail(
        [process.env.ADMIN_EMAIL], 
        `Contact Form: ${subject}`, 
        adminEmailHtml,
        email // Pass user's email for replyTo
      );

      // Send confirmation email to user
      await mail(
        [email], 
        'We received your message - Agstamp', 
        userConfirmationHtml
      );

      res.status(201).json({ 
        success: true, 
        message: 'Message sent successfully! Check your email for confirmation.' 
      });

    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      
      // Even if email fails, the message is saved in database
      res.status(201).json({ 
        success: true, 
        message: 'Message saved successfully! We will respond soon.',
        emailSent: false
      });
    }
});

export const getCategories = synchFunc(async (req, res) => {
  const categories = await categoryModel.find();
  res.status(201).json(categories);
});

export const getCustomerShippingPrices = async (req, res) => {
  try {
    const rates = await ShippingRate.find();
    const domestic = rates.find(r => r.type === "domestic");
    const international = rates.find(r => r.type === "international");

    res.status(200).json({
      success: true,
      usPrice: domestic ? domestic.price : 5, // fallback default
      internationalPrice: international ? international.price : 25,
    });
  } catch (error) {
    console.error("Error fetching customer shipping prices:", error);
    res.status(500).json({ success: false, message: "Server error while fetching shipping prices" });
  }
};