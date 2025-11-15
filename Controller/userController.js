// import bcrypt from 'bcryptjs';
// import { UserModel } from '../Model/userModel.js';
// import jwt from "jsonwebtoken";
// import { synchFunc } from '../Utils/SynchFunc.js';
// import { ErrorHandler } from '../Utils/ErrorHandler.js';
// import stampModel from '../Model/stampModel.js';
// import PhotoModel from '../Model/WaveModel.js';
// import { mail } from '../Helper/Mail.js';
// import subscriberModel from '../Model/subcriberModel.js';
// import orderModel from '../Model/orderModel.js';
// import ContactUs from '../Model/ContactUs.js';
// import categoryModel from '../Model/CategoryModal.js';
// import ShippingRate from '../Model/ShippingRate.js';


// export const userRegister = synchFunc(async (req, res) => {
//     const { firstname, lastname, username, email, password } = req.body;

//     // Check if user already exists
//     const existingUser = await UserModel.findOne({ email });
//     if (existingUser) {
//         throw new ErrorHandler(400,'Email already in use')
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Create new user
//     const newUser = new UserModel({
//         firstname,
//         lastname,
//         username,
//         email,
//         password: hashedPassword
//     });

//     // Save user to database
//     await newUser.save();

//     res.status(201).json({ success:true, message: 'register successful'});
// })

// // export const userLogin = synchFunc(async (req, res) => {

// //     const { email, password } = req.body;

// //     // Check if user already exists
// //     const existingUser = await UserModel.findOne({ email });
// //     if (!existingUser) {
// //         throw new ErrorHandler(400,'Invalid email or password!')
// //     }

// //     const isCorrectPassword = bcrypt.compareSync(password,existingUser.password)

// //     if(!isCorrectPassword){
// //         throw new ErrorHandler(400,'Invalid email or password!')
// //     }


// //     // creating user token
// //     const token = jwt.sign({id:existingUser._id},process.env.JWTSECRET,{
// //         expiresIn : process.env.JWTEXPIRY
// //     })

// //     res.cookie("agstampToken", token, {
// //         maxAge: 1000 * 60 * 60 * 24 * 7,
// //         httpOnly: true, 
// //         secure: true,
// //         sameSite: "none",
// //         path: "/",
// //     }).status(201).json({ success:true, message: 'Login successful', user: existingUser });
// // })

// // export const getUserInfo = synchFunc(async (req, res) => {
// //     res.status(201).json({ success:true, user: req.user });
// // })

// // export const userLogout = synchFunc(async (_, res) => {
// //     res.cookie("agstampToken", null, {
// //         maxAge: 0,
// //         httpOnly: true, 
// //         secure: true,
// //         sameSite: "none",
// //         path: "/",
// //     }).status(201).json({ success:true, message: 'Logout successful',user:null });
// // })

// export const userLogin = synchFunc(async (req, res) => {
//     const { email, password } = req.body;

//     // Check if user exists
//     const existingUser = await UserModel.findOne({ email });
//     if (!existingUser) {
//         throw new ErrorHandler(400, 'Invalid email or password!');
//     }

//     // Verify password
//     const isCorrectPassword = bcrypt.compareSync(password, existingUser.password);
//     if (!isCorrectPassword) {
//         throw new ErrorHandler(400, 'Invalid email or password!');
//     }

//     // Create JWT token
//     const token = jwt.sign(
//         { id: existingUser._id },
//         process.env.JWTSECRET,
//         { expiresIn: process.env.JWTEXPIRY }
//     );

//     // ✅ FIXED: Cookie configuration for cross-origin
//     const cookieOptions = {
//         maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
//         httpOnly: true,    // Prevents XSS attacks
//         secure: true,      // HTTPS only (required for SameSite=None)
//         sameSite: "none",  // Allows cross-origin cookies
//         path: "/",         // Available on all paths
//     };

//     // ✅ Set cookie AND return token in response body
//     res.cookie("agstampToken", token, cookieOptions)
//        .status(200)
//        .json({ 
//            success: true, 
//            message: 'Login successful', 
//            user: {
//                _id: existingUser._id,
//                firstname: existingUser.firstname,
//                lastname: existingUser.lastname,
//                username: existingUser.username,
//                email: existingUser.email
//            },
//            token: token  // ✅ IMPORTANT: Return token for fallback
//        });
// });

// export const userLogout = synchFunc(async (_, res) => {
//     // Clear cookie with same options
//     res.cookie("agstampToken", "", {
//         maxAge: 0,
//         httpOnly: true,
//         secure: true,
//         sameSite: "none",
//         path: "/",
//     }).status(200).json({ 
//         success: true, 
//         message: 'Logout successful',
//         user: null 
//     });
// });

// export const userProduct = synchFunc(async (_, res) => {
//     const today = new Date();
//     const stamps = await stampModel.find({
//     active: true,
//     beginDate: { $lte: today },
//     });
//     res.status(201).json({ success:true, stamps });
// })

// export const getWaveImg = synchFunc(async (_, res) => {
//     const wave = await PhotoModel.find();
//     res.status(201).json({ success:true, wave });
// })

// // export const subscribeMailService = synchFunc(async (req, res) => {
// //     const {email} = req.body;
// //     const {user} = req;
// //     const emailSendRes = await mail([email],"Welcome email","Hello");
// //     if(emailSendRes.messageId){
// //         const newSubscriber = new subscriberModel({
// //             user:user._id,
// //             subscribedEmail:email,
// //         });
        
// //         // Save user to database
// //         await newSubscriber.save();
// //         res.status(200).json({ success:true, message:"Thank you for subscribing" });
// //     }else{
// //         throw new ErrorHandler(400,'something Went Wrong While Sending The Mail!');
// //     }
// // });

// export const subscribeMailService = synchFunc(async (req, res) => {
//     const { email } = req.body;
//     const { user } = req;

//     // Validate email
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!email || !emailRegex.test(email)) {
//         return res.status(400).json({ 
//             success: false, 
//             message: 'Please provide a valid email address' 
//         });
//     }

//     // Check if already subscribed
//     const existingSubscriber = await subscriberModel.findOne({ subscribedEmail: email });
//     if (existingSubscriber) {
//         return res.status(400).json({ 
//             success: false, 
//             message: 'This email is already subscribed to our newsletter' 
//         });
//     }

//     try {
//         // Prepare welcome email for subscriber
//         const subscriberWelcomeEmail = `
//             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
//                 <h2 style="color: #007BFF;">Welcome to Agstamp Newsletter! 🎉</h2>
                
//                 <p>Hi there,</p>
                
//                 <p>Thank you for subscribing to our newsletter! We're excited to have you as part of our community.</p>
                
//                 <div style="background: #fff; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
//                     <h3 style="margin-top: 0; color: #333;">What to Expect:</h3>
//                     <ul style="color: #555;">
//                         <li>Latest updates and news from Agstamp</li>
//                         <li>Exclusive offers and promotions</li>
//                         <li>Tips and insights about our products</li>
//                         <li>Special announcements and events</li>
//                     </ul>
//                 </div>
                
//                 <p>You'll receive our newsletters directly to <strong>${email}</strong></p>
                
//                 <p style="font-size: 12px; color: #666; margin-top: 30px;">
//                     If you didn't subscribe or want to unsubscribe, please reply to this email or contact us at ${process.env.ADMIN_EMAIL || 'info@agstamp.com'}
//                 </p>
                
//                 <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;" />
//                 <p style="font-size: 12px; color: #888;">Best regards,<br/>The Agstamp Team</p>
//                 <p style="font-size: 12px; color: #888;">📧 Email: ${process.env.ADMIN_EMAIL || 'info@agstamp.com'}</p>
//             </div>
//         `;

//         // Prepare admin notification email
//         const adminNotificationEmail = `
//             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
//                 <h2 style="color: #333;">📬 New Newsletter Subscription</h2>
                
//                 <p><strong>A new user has subscribed to the Agstamp newsletter!</strong></p>
                
//                 <div style="background: #fff; padding: 15px; border-left: 4px solid #007BFF; margin: 20px 0;">
//                     <h3 style="margin-top: 0; color: #333;">Subscriber Details:</h3>
//                     <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #007BFF;">${email}</a></p>
//                     <p><strong>User ID:</strong> ${user._id}</p>
//                     <p><strong>Subscribed on:</strong> ${new Date().toLocaleString()}</p>
//                 </div>
                
//                 <hr style="margin-top: 20px; border: none; border-top: 1px solid #e0e0e0;" />
//                 <p style="font-size: 12px; color: #888;">This email was generated automatically from the Agstamp newsletter subscription system.</p>
//             </div>
//         `;

//         // Send emails in parallel
//         const emailPromises = [
//             // Send welcome email to subscriber
//             mail(
//                 [email],
//                 'Welcome to Agstamp Newsletter! 🎉',
//                 subscriberWelcomeEmail
//             ),
//             // Send notification to admin
//             mail(
//                 [process.env.ADMIN_EMAIL],
//                 `New Newsletter Subscription: ${email}`,
//                 adminNotificationEmail
//             )
//         ];

//         // Wait for both emails to send
//         const emailResults = await Promise.allSettled(emailPromises);
        
//         // Check if subscriber email was sent successfully
//         const subscriberEmailSent = emailResults[0].status === 'fulfilled';
        
//         if (subscriberEmailSent) {
//             // Save subscriber to database
//             const newSubscriber = new subscriberModel({
//                 user: user._id,
//                 subscribedEmail: email,
//             });
            
//             await newSubscriber.save();

//             // Check if admin email was sent
//             const adminEmailSent = emailResults[1].status === 'fulfilled';
            
//             if (!adminEmailSent) {
//                 console.error('⚠️ Admin notification email failed:', emailResults[1].reason);
//             }

//             res.status(200).json({ 
//                 success: true, 
//                 message: 'Thank you for subscribing! Check your email for confirmation.' 
//             });
//         } else {
//             throw new ErrorHandler(400, 'Failed to send welcome email. Please try again.');
//         }

//     } catch (error) {
//         console.error('❌ Subscription error:', error);
        
//         // If it's a database error
//         if (error.name === 'ValidationError' || error.name === 'MongoError') {
//             throw new ErrorHandler(500, 'Failed to save subscription. Please try again.');
//         }
        
//         // If it's an email error or general error
//         throw new ErrorHandler(400, error.message || 'Something went wrong while processing your subscription.');
//     }
// });

// export const getAllUserOrder = synchFunc(async (req, res) => {
//     const orders = await orderModel.find({userId:req.user._id}).sort({ createdAt: -1 });
//     res.status(200).json({ 
//       success: true, 
//       orders 
//     });
// });

// // export const contactUSController = synchFunc(async (req, res) => {
// //     const { name, email, subject, message } = req.body;

// //     if (!name || !email || !subject || !message) {
// //       return res.status(400).json({ success: false, message: 'All fields are required' });
// //     }

// //     const html = `
// //         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
// //             <h2 style="color: #333;">📬 New Contact Form Submission</h2>

// //             <p><strong>Name:</strong> ${name}</p>
// //             <p><strong>Email:</strong> ${email}</p>
// //             <p><strong>Subject:</strong> ${subject}</p>
// //             <p><strong>Message:</strong></p>
// //             <div style="background: #fff; padding: 12px; border-left: 4px solid #007BFF; margin-top: 10px; color: #333;">
// //             ${message.replace(/\n/g, "<br />")}
// //             </div>

// //             <hr style="margin-top: 20px;" />
// //             <p style="font-size: 12px; color: #888;">This email was generated automatically from your website contact form.</p>
// //         </div>
// //     `

// //     await mail([process.env.ADMIN_EMAIL],`Contact Form: ${subject}`,html);
// //     res.status(201).json({ success: true, message: 'Message sent successfully' });
// // });

// // export const contactUSController = synchFunc(async (req, res) => {
// //     const { name, email, subject, message } = req.body;

// //     // Validate required fields
// //     if (!name || !email || !subject || !message) {
// //       return res.status(400).json({ 
// //         success: false, 
// //         message: 'All fields are required' 
// //       });
// //     }

// //     // Email validation regex
// //     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// //     if (!emailRegex.test(email)) {
// //       return res.status(400).json({ 
// //         success: false, 
// //         message: 'Please provide a valid email address' 
// //       });
// //     }

// //     // Save to database first
// //     const newContact = new ContactUs({
// //       name,
// //       email,
// //       subject,
// //       message
// //     });

// //     await newContact.save();

// //     // Prepare email HTML
// //     const adminEmailHtml = `
// //         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
// //             <h2 style="color: #333;">📬 New Contact Form Submission</h2>

// //             <p><strong>Name:</strong> ${name}</p>
// //             <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
// //             <p><strong>Subject:</strong> ${subject}</p>
// //             <p><strong>Message:</strong></p>
// //             <div style="background: #fff; padding: 12px; border-left: 4px solid #007BFF; margin-top: 10px; color: #333;">
// //             ${message.replace(/\n/g, "<br />")}
// //             </div>

// //             <hr style="margin-top: 20px;" />
// //             <p style="font-size: 12px; color: #888;">Submitted on: ${new Date().toLocaleString()}</p>
// //             <p style="font-size: 12px; color: #888;">This email was generated automatically from your website contact form.</p>
// //         </div>
// //     `;

// //     // Prepare confirmation email for user
// //     const userConfirmationHtml = `
// //         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
// //             <h2 style="color: #007BFF;">Thank You for Contacting Agstamp! 🎉</h2>
            
// //             <p>Hi <strong>${name}</strong>,</p>
            
// //             <p>We have received your message and our team will get back to you as soon as possible.</p>
            
// //             <div style="background: #fff; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
// //                 <h3 style="margin-top: 0; color: #333;">Your Message Details:</h3>
// //                 <p><strong>Subject:</strong> ${subject}</p>
// //                 <p><strong>Message:</strong></p>
// //                 <p style="color: #555;">${message.replace(/\n/g, "<br />")}</p>
// //             </div>
            
// //             <p>If you have any urgent concerns, please feel free to reply to this email.</p>
            
// //             <hr style="margin: 20px 0;" />
// //             <p style="font-size: 12px; color: #888;">Best regards,<br/>The Agstamp Team</p>
// //         </div>
// //     `;

// //     try {
// //       // Send email to admin
// //       await mail(
// //         [process.env.ADMIN_EMAIL], 
// //         `Contact Form: ${subject}`, 
// //         adminEmailHtml
// //       );

// //       // Send confirmation email to user
// //       await mail(
// //         [email], 
// //         'We received your message - Agstamp', 
// //         userConfirmationHtml
// //       );

// //       res.status(201).json({ 
// //         success: true, 
// //         message: 'Message sent successfully! Check your email for confirmation.' 
// //       });

// //     } catch (emailError) {
// //       console.error('Email sending error:', emailError);
      
// //       // Even if email fails, the message is saved in database
// //       res.status(201).json({ 
// //         success: true, 
// //         message: 'Message saved successfully! We will respond soon.',
// //         emailSent: false
// //       });
// //     }
// // });

// // export const contactUSController = synchFunc(async (req, res) => {
// //     const { name, email, subject, message } = req.body;

// //     // Validate required fields
// //     if (!name || !email || !subject || !message) {
// //       return res.status(400).json({ 
// //         success: false, 
// //         message: 'All fields are required' 
// //       });
// //     }

// //     // Email validation regex
// //     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// //     if (!emailRegex.test(email)) {
// //       return res.status(400).json({ 
// //         success: false, 
// //         message: 'Please provide a valid email address' 
// //       });
// //     }

// //     // Name validation - only letters and spaces
// //     const nameRegex = /^[a-zA-Z\s]+$/;
// //     if (!nameRegex.test(name)) {
// //       return res.status(400).json({ 
// //         success: false, 
// //         message: 'Name should contain only letters and spaces' 
// //       });
// //     }

// //     // Save to database first
// //     const newContact = new ContactUs({
// //       name,
// //       email,
// //       subject,
// //       message
// //     });

// //     await newContact.save();

// //     // Prepare email HTML for admin
// //     const adminEmailHtml = `
// //         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
// //             <h2 style="color: #333;">📬 New Contact Form Submission</h2>

// //             <p><strong>Name:</strong> ${name}</p>
// //             <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #007BFF;">${email}</a></p>
// //             <p><strong>Subject:</strong> ${subject}</p>
// //             <p><strong>Message:</strong></p>
// //             <div style="background: #fff; padding: 12px; border-left: 4px solid #007BFF; margin-top: 10px; color: #333;">
// //                 ${message.replace(/\n/g, "<br />")}
// //             </div>

// //             <hr style="margin-top: 20px; border: none; border-top: 1px solid #e0e0e0;" />
// //             <p style="font-size: 12px; color: #888;">Submitted on: ${new Date().toLocaleString()}</p>
// //             <p style="font-size: 12px; color: #888;">This email was generated automatically from your website contact form.</p>
// //         </div>
// //     `;

// //     // Prepare confirmation email for user
// //     const userConfirmationHtml = `
// //         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
// //             <h2 style="color: #007BFF;">Thank You for Contacting Agstamp! 🎉</h2>
            
// //             <p>Hi <strong>${name}</strong>,</p>
            
// //             <p>We have received your message and our team will get back to you as soon as possible.</p>
            
// //             <div style="background: #fff; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
// //                 <h3 style="margin-top: 0; color: #333;">Your Message Details:</h3>
// //                 <p><strong>Subject:</strong> ${subject}</p>
// //                 <p><strong>Message:</strong></p>
// //                 <p style="color: #555;">${message.replace(/\n/g, "<br />")}</p>
// //             </div>
            
// //             <p>If you have any urgent concerns, please feel free to reply to this email.</p>
            
// //             <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;" />
// //             <p style="font-size: 12px; color: #888;">Best regards,<br/>The Agstamp Team</p>
// //             <p style="font-size: 12px; color: #888;">📧 Email: ${process.env.ADMIN_EMAIL || 'info@agstamp.com'}</p>
// //         </div>
// //     `;

// //     try {
// //       // Send email to admin with replyTo set to user's email
// //       await mail(
// //         [process.env.ADMIN_EMAIL], 
// //         `Contact Form: ${subject}`, 
// //         adminEmailHtml,
// //         email // Pass user's email for replyTo
// //       );

// //       // Send confirmation email to user
// //       await mail(
// //         [email], 
// //         'We received your message - Agstamp', 
// //         userConfirmationHtml
// //       );

// //       res.status(201).json({ 
// //         success: true, 
// //         message: 'Message sent successfully! Check your email for confirmation.' 
// //       });

// //     } catch (emailError) {
// //       console.error('❌ Email sending error:', emailError);
      
// //       // Even if email fails, the message is saved in database
// //       res.status(201).json({ 
// //         success: true, 
// //         message: 'Message saved successfully! We will respond soon.',
// //         emailSent: false
// //       });
// //     }
// // });

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

//     // Name validation - only letters and spaces
//     const nameRegex = /^[a-zA-Z\s]+$/;
//     if (!nameRegex.test(name)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Name should contain only letters and spaces' 
//       });
//     }

//     try {
//       // Save to database first
//       const newContact = new ContactUs({
//         name,
//         email,
//         subject,
//         message
//       });

//       await newContact.save();

//       // Prepare email HTML for admin
//       const adminEmailHtml = `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
//               <h2 style="color: #333;">📬 New Contact Form Submission</h2>

//               <p><strong>Name:</strong> ${name}</p>
//               <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #007BFF;">${email}</a></p>
//               <p><strong>Subject:</strong> ${subject}</p>
//               <p><strong>Message:</strong></p>
//               <div style="background: #fff; padding: 12px; border-left: 4px solid #007BFF; margin-top: 10px; color: #333;">
//                   ${message.replace(/\n/g, "<br />")}
//               </div>

//               <hr style="margin-top: 20px; border: none; border-top: 1px solid #e0e0e0;" />
//               <p style="font-size: 12px; color: #888;">Submitted on: ${new Date().toLocaleString()}</p>
//               <p style="font-size: 12px; color: #888;">This email was generated automatically from your website contact form.</p>
//           </div>
//       `;

//       // Prepare confirmation email for user
//       const userConfirmationHtml = `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
//               <h2 style="color: #007BFF;">Thank You for Contacting Agstamp! 🎉</h2>
              
//               <p>Hi <strong>${name}</strong>,</p>
              
//               <p>We have received your message and our team will get back to you as soon as possible.</p>
              
//               <div style="background: #fff; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
//                   <h3 style="margin-top: 0; color: #333;">Your Message Details:</h3>
//                   <p><strong>Subject:</strong> ${subject}</p>
//                   <p><strong>Message:</strong></p>
//                   <p style="color: #555;">${message.replace(/\n/g, "<br />")}</p>
//               </div>
              
//               <p>If you have any urgent concerns, please feel free to reply to this email.</p>
              
//               <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;" />
//               <p style="font-size: 12px; color: #888;">Best regards,<br/>The Agstamp Team</p>
//               <p style="font-size: 12px; color: #888;">📧 Email: ${process.env.ADMIN_EMAIL || 'info@agstamp.com'}</p>
//           </div>
//       `;

//       // Send emails in parallel for better performance
//       const emailPromises = [
//         // Send email to admin with replyTo set to user's email
//         mail(
//           [process.env.ADMIN_EMAIL], 
//           `Contact Form: ${subject}`, 
//           adminEmailHtml,
//           email // User's email for replyTo
//         ),
//         // Send confirmation email to user
//         mail(
//           [email], 
//           'We received your message - Agstamp', 
//           userConfirmationHtml
//         )
//       ];

//       // Wait for both emails to send
//       await Promise.allSettled(emailPromises);

//       res.status(201).json({ 
//         success: true, 
//         message: 'Message sent successfully! Check your email for confirmation.' 
//       });

//     } catch (error) {
//       console.error('❌ Contact form error:', error);
      
//       // If database save fails
//       if (error.name === 'ValidationError' || error.name === 'MongoError') {
//         return res.status(500).json({ 
//           success: false, 
//           message: 'Failed to save your message. Please try again.' 
//         });
//       }
      
//       // If email sending fails but data is saved
//       res.status(201).json({ 
//         success: true, 
//         message: 'Message saved successfully! We will respond soon.',
//         emailSent: false
//       });
//     }
// });

// export const getCategories = synchFunc(async (req, res) => {
//   const categories = await categoryModel.find();
//   res.status(201).json(categories);
// });

// export const getCustomerShippingPrices = async (req, res) => {
//   try {
//     const rates = await ShippingRate.find();
//     const domestic = rates.find(r => r.type === "domestic");
//     const international = rates.find(r => r.type === "international");

//     res.status(200).json({
//       success: true,
//       usPrice: domestic ? domestic.price : 5, // fallback default
//       internationalPrice: international ? international.price : 25,
//     });
//   } catch (error) {
//     console.error("Error fetching customer shipping prices:", error);
//     res.status(500).json({ success: false, message: "Server error while fetching shipping prices" });
//   }
// };

// import bcrypt from 'bcryptjs';
// import { UserModel } from '../Model/userModel.js';
// import jwt from "jsonwebtoken";
// import { synchFunc } from '../Utils/SynchFunc.js';
// import { ErrorHandler } from '../Utils/ErrorHandler.js';
// import stampModel from '../Model/stampModel.js';
// import PhotoModel from '../Model/WaveModel.js';
// import { mail } from '../Helper/Mail.js';
// import subscriberModel from '../Model/subcriberModel.js';
// import orderModel from '../Model/orderModel.js';
// import ContactUs from '../Model/ContactUs.js';
// import categoryModel from '../Model/CategoryModal.js';
// import ShippingRate from '../Model/ShippingRate.js';

// export const userRegister = synchFunc(async (req, res) => {
//     const { firstname, lastname, username, email, password } = req.body;

//     // Check if user already exists
//     const existingUser = await UserModel.findOne({ email });
//     if (existingUser) {
//         throw new ErrorHandler(400,'Email already in use')
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Create new user
//     const newUser = new UserModel({
//         firstname,
//         lastname,
//         username,
//         email,
//         password: hashedPassword
//     });

//     // Save user to database
//     await newUser.save();

//     res.status(201).json({ success:true, message: 'register successful'});
// })

// export const userLogin = synchFunc(async (req, res) => {
//     const { email, password } = req.body;

//     // Check if user exists
//     const existingUser = await UserModel.findOne({ email });
//     if (!existingUser) {
//         throw new ErrorHandler(400, 'Invalid email or password!');
//     }

//     // Verify password
//     const isCorrectPassword = bcrypt.compareSync(password, existingUser.password);
//     if (!isCorrectPassword) {
//         throw new ErrorHandler(400, 'Invalid email or password!');
//     }

//     // Create JWT token
//     const token = jwt.sign(
//         { id: existingUser._id },
//         process.env.JWTSECRET,
//         { expiresIn: process.env.JWTEXPIRY }
//     );

//     // ✅ FIXED: Cookie configuration for cross-origin
//     const cookieOptions = {
//         maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
//         httpOnly: true,    // Prevents XSS attacks
//         secure: true,      // HTTPS only (required for SameSite=None)
//         sameSite: "none",  // Allows cross-origin cookies
//         path: "/",         // Available on all paths
//     };

//     // ✅ Set cookie AND return token in response body
//     res.cookie("agstampToken", token, cookieOptions)
//        .status(200)
//        .json({ 
//            success: true, 
//            message: 'Login successful', 
//            user: {
//                _id: existingUser._id,
//                firstname: existingUser.firstname,
//                lastname: existingUser.lastname,
//                username: existingUser.username,
//                email: existingUser.email
//            },
//            token: token  // ✅ IMPORTANT: Return token for fallback
//        });
// });

// export const getUserInfo = synchFunc(async (req, res) => {
//     res.status(201).json({ success:true, user: req.user });
// })

// export const userLogout = synchFunc(async (_, res) => {
//     res.cookie("agstampToken", "", {
//         maxAge: 0,
//         httpOnly: true,
//         secure: true,
//         sameSite: "none",
//         path: "/",
//     }).status(200).json({ 
//         success: true, 
//         message: 'Logout successful',
//         user: null 
//     });
// })

// export const userProduct = synchFunc(async (_, res) => {
//     const today = new Date();
//     const stamps = await stampModel.find({
//         active: true,
//         beginDate: { $lte: today },
//     });
//     res.status(201).json({ success:true, stamps });
// })

// export const getWaveImg = synchFunc(async (_, res) => {
//     const wave = await PhotoModel.find();
//     res.status(201).json({ success:true, wave });
// })

// export const subscribeMailService = synchFunc(async (req, res) => {
//     const { email } = req.body;
//     const { user } = req;

//     // Validate email
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!email || !emailRegex.test(email)) {
//         return res.status(400).json({ 
//             success: false, 
//             message: 'Please provide a valid email address' 
//         });
//     }

//     // Check if already subscribed
//     const existingSubscriber = await subscriberModel.findOne({ subscribedEmail: email });
//     if (existingSubscriber) {
//         return res.status(400).json({ 
//             success: false, 
//             message: 'This email is already subscribed to our newsletter' 
//         });
//     }

//     try {
//         // Prepare welcome email for subscriber
//         const subscriberWelcomeEmail = `
//             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
//                 <h2 style="color: #007BFF;">Welcome to Agstamp Newsletter! 🎉</h2>
                
//                 <p>Hi there,</p>
                
//                 <p>Thank you for subscribing to our newsletter! We're excited to have you as part of our community.</p>
                
//                 <div style="background: #fff; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
//                     <h3 style="margin-top: 0; color: #333;">What to Expect:</h3>
//                     <ul style="color: #555;">
//                         <li>Latest updates and news from Agstamp</li>
//                         <li>Exclusive offers and promotions</li>
//                         <li>Tips and insights about our products</li>
//                         <li>Special announcements and events</li>
//                     </ul>
//                 </div>
                
//                 <p>You'll receive our newsletters directly to <strong>${email}</strong></p>
                
//                 <p style="font-size: 12px; color: #666; margin-top: 30px;">
//                     If you didn't subscribe or want to unsubscribe, please reply to this email or contact us at ${process.env.ADMIN_EMAIL || 'info@agstamp.com'}
//                 </p>
                
//                 <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;" />
//                 <p style="font-size: 12px; color: #888;">Best regards,<br/>The Agstamp Team</p>
//                 <p style="font-size: 12px; color: #888;">📧 Email: ${process.env.ADMIN_EMAIL || 'info@agstamp.com'}</p>
//             </div>
//         `;

//         // Prepare admin notification email
//         const adminNotificationEmail = `
//             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
//                 <h2 style="color: #333;">📬 New Newsletter Subscription</h2>
                
//                 <p><strong>A new user has subscribed to the Agstamp newsletter!</strong></p>
                
//                 <div style="background: #fff; padding: 15px; border-left: 4px solid #007BFF; margin: 20px 0;">
//                     <h3 style="margin-top: 0; color: #333;">Subscriber Details:</h3>
//                     <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #007BFF;">${email}</a></p>
//                     <p><strong>User ID:</strong> ${user._id}</p>
//                     <p><strong>Subscribed on:</strong> ${new Date().toLocaleString()}</p>
//                 </div>
                
//                 <hr style="margin-top: 20px; border: none; border-top: 1px solid #e0e0e0;" />
//                 <p style="font-size: 12px; color: #888;">This email was generated automatically from the Agstamp newsletter subscription system.</p>
//             </div>
//         `;

//         // Send emails in parallel
//         const emailPromises = [
//             mail([email], 'Welcome to Agstamp Newsletter! 🎉', subscriberWelcomeEmail),
//             mail([process.env.ADMIN_EMAIL], `New Newsletter Subscription: ${email}`, adminNotificationEmail)
//         ];

//         const emailResults = await Promise.allSettled(emailPromises);
//         const subscriberEmailSent = emailResults[0].status === 'fulfilled';
        
//         if (subscriberEmailSent) {
//             const newSubscriber = new subscriberModel({
//                 user: user._id,
//                 subscribedEmail: email,
//             });
            
//             await newSubscriber.save();

//             const adminEmailSent = emailResults[1].status === 'fulfilled';
//             if (!adminEmailSent) {
//                 console.error('⚠️ Admin notification email failed:', emailResults[1].reason);
//             }

//             res.status(200).json({ 
//                 success: true, 
//                 message: 'Thank you for subscribing! Check your email for confirmation.' 
//             });
//         } else {
//             throw new ErrorHandler(400, 'Failed to send welcome email. Please try again.');
//         }

//     } catch (error) {
//         console.error('❌ Subscription error:', error);
        
//         if (error.name === 'ValidationError' || error.name === 'MongoError') {
//             throw new ErrorHandler(500, 'Failed to save subscription. Please try again.');
//         }
        
//         throw new ErrorHandler(400, error.message || 'Something went wrong while processing your subscription.');
//     }
// });

// export const getAllUserOrder = synchFunc(async (req, res) => {
//     const orders = await orderModel.find({userId:req.user._id}).sort({ createdAt: -1 });
//     res.status(200).json({ 
//       success: true, 
//       orders 
//     });
// });

// export const contactUSController = synchFunc(async (req, res) => {
//     const { name, email, subject, message } = req.body;

//     if (!name || !email || !subject || !message) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'All fields are required' 
//       });
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Please provide a valid email address' 
//       });
//     }

//     const nameRegex = /^[a-zA-Z\s]+$/;
//     if (!nameRegex.test(name)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Name should contain only letters and spaces' 
//       });
//     }

//     try {
//       const newContact = new ContactUs({
//         name,
//         email,
//         subject,
//         message
//       });

//       await newContact.save();

//       const adminEmailHtml = `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
//               <h2 style="color: #333;">📬 New Contact Form Submission</h2>

//               <p><strong>Name:</strong> ${name}</p>
//               <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #007BFF;">${email}</a></p>
//               <p><strong>Subject:</strong> ${subject}</p>
//               <p><strong>Message:</strong></p>
//               <div style="background: #fff; padding: 12px; border-left: 4px solid #007BFF; margin-top: 10px; color: #333;">
//                   ${message.replace(/\n/g, "<br />")}
//               </div>

//               <hr style="margin-top: 20px; border: none; border-top: 1px solid #e0e0e0;" />
//               <p style="font-size: 12px; color: #888;">Submitted on: ${new Date().toLocaleString()}</p>
//               <p style="font-size: 12px; color: #888;">This email was generated automatically from your website contact form.</p>
//           </div>
//       `;

//       const userConfirmationHtml = `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
//               <h2 style="color: #007BFF;">Thank You for Contacting Agstamp! 🎉</h2>
              
//               <p>Hi <strong>${name}</strong>,</p>
              
//               <p>We have received your message and our team will get back to you as soon as possible.</p>
              
//               <div style="background: #fff; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
//                   <h3 style="margin-top: 0; color: #333;">Your Message Details:</h3>
//                   <p><strong>Subject:</strong> ${subject}</p>
//                   <p><strong>Message:</strong></p>
//                   <p style="color: #555;">${message.replace(/\n/g, "<br />")}</p>
//               </div>
              
//               <p>If you have any urgent concerns, please feel free to reply to this email.</p>
              
//               <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;" />
//               <p style="font-size: 12px; color: #888;">Best regards,<br/>The Agstamp Team</p>
//               <p style="font-size: 12px; color: #888;">📧 Email: ${process.env.ADMIN_EMAIL || 'info@agstamp.com'}</p>
//           </div>
//       `;

//       const emailPromises = [
//         mail([process.env.ADMIN_EMAIL], `Contact Form: ${subject}`, adminEmailHtml, email),
//         mail([email], 'We received your message - Agstamp', userConfirmationHtml)
//       ];

//       await Promise.allSettled(emailPromises);

//       res.status(201).json({ 
//         success: true, 
//         message: 'Message sent successfully! Check your email for confirmation.' 
//       });

//     } catch (error) {
//       console.error('❌ Contact form error:', error);
      
//       if (error.name === 'ValidationError' || error.name === 'MongoError') {
//         return res.status(500).json({ 
//           success: false, 
//           message: 'Failed to save your message. Please try again.' 
//         });
//       }
      
//       res.status(201).json({ 
//         success: true, 
//         message: 'Message saved successfully! We will respond soon.',
//         emailSent: false
//       });
//     }
// });

// export const getCategories = synchFunc(async (req, res) => {
//   const categories = await categoryModel.find();
//   res.status(201).json(categories);
// });

// export const getCustomerShippingPrices = async (req, res) => {
//   try {
//     const rates = await ShippingRate.find();
//     const domestic = rates.find(r => r.type === "domestic");
//     const international = rates.find(r => r.type === "international");

//     res.status(200).json({
//       success: true,
//       usPrice: domestic ? domestic.price : 5,
//       internationalPrice: international ? international.price : 25,
//     });
//   } catch (error) {
//     console.error("Error fetching customer shipping prices:", error);
//     res.status(500).json({ success: false, message: "Server error while fetching shipping prices" });
//   }
// };

// export const userLogin = synchFunc(async (req, res) => {
//     const { email, password } = req.body;

//     // Check if user exists
//     const existingUser = await UserModel.findOne({ email });
//     if (!existingUser) {
//         throw new ErrorHandler(400, 'Invalid email or password!');
//     }

//     // Verify password
//     const isCorrectPassword = bcrypt.compareSync(password, existingUser.password);
//     if (!isCorrectPassword) {
//         throw new ErrorHandler(400, 'Invalid email or password!');
//     }

//     // Create JWT token
//     const token = jwt.sign(
//         { id: existingUser._id },
//         process.env.JWTSECRET,
//         { expiresIn: process.env.JWTEXPIRY }
//     );

//     // ✅ FIXED: Cookie configuration for cross-origin
//     const cookieOptions = {
//         maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
//         httpOnly: true,    // Prevents XSS attacks
//         secure: true,      // HTTPS only (required for SameSite=None)
//         sameSite: "none",  // Allows cross-origin cookies
//         path: "/",         // Available on all paths
//     };

//     // ✅ Set cookie AND return token in response body
//     res.cookie("agstampToken", token, cookieOptions)
//        .status(200)
//        .json({ 
//            success: true, 
//            message: 'Login successful', 
//            user: {
//                _id: existingUser._id,
//                firstname: existingUser.firstname,
//                lastname: existingUser.lastname,
//                username: existingUser.username,
//                email: existingUser.email
//            },
//            token: token  // ✅ IMPORTANT: Return token for fallback
//        });
// });

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
import CarouselModel from '../Model/CarouselModel.js';

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

    const existingUser = await UserModel.findOne({ email });
    if (!existingUser) {
        throw new ErrorHandler(400, 'Invalid email or password!');
    }

    const isCorrectPassword = bcrypt.compareSync(password, existingUser.password);
    if (!isCorrectPassword) {
        throw new ErrorHandler(400, 'Invalid email or password!');
    }

    const token = jwt.sign(
        { id: existingUser._id },
        process.env.JWTSECRET,
        { expiresIn: process.env.JWTEXPIRY }
    );

    const cookieOptions = {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
    };

     // ✅ Add domain only in production (Render deployment)
    if (process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN) {
        cookieOptions.domain = process.env.COOKIE_DOMAIN;
    }

    res.cookie("agstampToken", token, cookieOptions)
       .status(200)
       .json({ 
           success: true, 
           message: 'Login successful', 
           user: {
               _id: existingUser._id,
               firstname: existingUser.firstname,
               lastname: existingUser.lastname,
               username: existingUser.username,
               email: existingUser.email,
               role: existingUser.role // ✅ ADD THIS
           },
           token: token
       });
});

// ✅ FIXED getUserInfo function
export const getUserInfo = synchFunc(async (req, res) => {
    // Fetch the complete user data from database to ensure all fields are included
    const user = await UserModel.findById(req.user._id).select('-password');
    
    if (!user) {
        throw new ErrorHandler(404, 'User not found');
    }
    
    res.status(200).json({ 
        success: true, 
        user: {
            _id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            username: user.username,
            email: user.email,
            role: user.role // ✅ CRITICAL: Explicitly include role
        }
    });
});

// export const userLogout = synchFunc(async (_, res) => {
//     // ✅ Add domain only in production (Render deployment)
//     if (process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN) {
//         cookieOptions.domain = process.env.COOKIE_DOMAIN;
//     }
//     res.cookie("agstampToken", "", {
//         maxAge: 0,
//         httpOnly: true,
//         secure: true,
//         sameSite: "none",
//         path: "/",
//     }).status(200).json({ 
//         success: true, 
//         message: 'Logout successful',
//         user: null 
//     });
// })

export const userLogout = synchFunc(async (_, res) => {
    // ✅ Cookie configuration with conditional domain
    const cookieOptions = {
        maxAge: 0,
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
    };

    // ✅ Add domain only in production (Render deployment)
    if (process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN) {
        cookieOptions.domain = process.env.COOKIE_DOMAIN;
    }

    res.cookie("agstampToken", "", cookieOptions)
       .status(200)
       .json({ 
           success: true, 
           message: 'Logout successful',
           user: null 
       });
});

export const userProduct = synchFunc(async (_, res) => {
    const today = new Date();
    const stamps = await stampModel.find({
        active: true,
        beginDate: { $lte: today },
    });
    res.status(201).json({ success:true, stamps });
})

// ✅ NEW: Get single stamp details for users (public route)
export const getSingleStamp = synchFunc(async (req, res) => {
    const { stampId } = req.params;
    
    // Validate stampId
    if (!stampId) {
        throw new ErrorHandler(400, 'Stamp ID is required');
    }

    // Find the stamp
    const stamp = await stampModel.findById(stampId);
    
    if (!stamp) {
        throw new ErrorHandler(404, 'Stamp not found');
    }

    // Check if stamp is active and available
    const today = new Date();
    if (!stamp.active || stamp.beginDate > today) {
        throw new ErrorHandler(404, 'Stamp not available');
    }

    res.status(200).json({ 
        success: true, 
        stamp 
    });
});

export const getWaveImg = synchFunc(async (_, res) => {
    const wave = await PhotoModel.find();
    res.status(201).json({ success:true, wave });
})

export const subscribeMailService = synchFunc(async (req, res) => {
    const { email } = req.body;
    const { user } = req;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Please provide a valid email address' 
        });
    }

    // Check if already subscribed
    const existingSubscriber = await subscriberModel.findOne({ subscribedEmail: email });
    if (existingSubscriber) {
        return res.status(400).json({ 
            success: false, 
            message: 'This email is already subscribed to our newsletter' 
        });
    }

    try {
        // Prepare welcome email for subscriber
        const subscriberWelcomeEmail = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
                <h2 style="color: #007BFF;">Welcome to Agstamp Newsletter! 🎉</h2>
                
                <p>Hi there,</p>
                
                <p>Thank you for subscribing to our newsletter! We're excited to have you as part of our community.</p>
                
                <div style="background: #fff; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333;">What to Expect:</h3>
                    <ul style="color: #555;">
                        <li>Latest updates and news from Agstamp</li>
                        <li>Exclusive offers and promotions</li>
                        <li>Tips and insights about our products</li>
                        <li>Special announcements and events</li>
                    </ul>
                </div>
                
                <p>You'll receive our newsletters directly to <strong>${email}</strong></p>
                
                <p style="font-size: 12px; color: #666; margin-top: 30px;">
                    If you didn't subscribe or want to unsubscribe, please reply to this email or contact us at ${process.env.ADMIN_EMAIL || 'info@agstamp.com'}
                </p>
                
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;" />
                <p style="font-size: 12px; color: #888;">Best regards,<br/>The Agstamp Team</p>
                <p style="font-size: 12px; color: #888;">📧 Email: ${process.env.ADMIN_EMAIL || 'info@agstamp.com'}</p>
            </div>
        `;

        // Prepare admin notification email
        const adminNotificationEmail = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
                <h2 style="color: #333;">📬 New Newsletter Subscription</h2>
                
                <p><strong>A new user has subscribed to the Agstamp newsletter!</strong></p>
                
                <div style="background: #fff; padding: 15px; border-left: 4px solid #007BFF; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333;">Subscriber Details:</h3>
                    <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #007BFF;">${email}</a></p>
                    <p><strong>User ID:</strong> ${user._id}</p>
                    <p><strong>Subscribed on:</strong> ${new Date().toLocaleString()}</p>
                </div>
                
                <hr style="margin-top: 20px; border: none; border-top: 1px solid #e0e0e0;" />
                <p style="font-size: 12px; color: #888;">This email was generated automatically from the Agstamp newsletter subscription system.</p>
            </div>
        `;

        // Send emails in parallel
        const emailPromises = [
            mail([email], 'Welcome to Agstamp Newsletter! 🎉', subscriberWelcomeEmail),
            mail([process.env.ADMIN_EMAIL], `New Newsletter Subscription: ${email}`, adminNotificationEmail)
        ];

        const emailResults = await Promise.allSettled(emailPromises);
        const subscriberEmailSent = emailResults[0].status === 'fulfilled';
        
        if (subscriberEmailSent) {
            const newSubscriber = new subscriberModel({
                user: user._id,
                subscribedEmail: email,
            });
            
            await newSubscriber.save();

            const adminEmailSent = emailResults[1].status === 'fulfilled';
            if (!adminEmailSent) {
                console.error('⚠️ Admin notification email failed:', emailResults[1].reason);
            }

            res.status(200).json({ 
                success: true, 
                message: 'Thank you for subscribing! Check your email for confirmation.' 
            });
        } else {
            throw new ErrorHandler(400, 'Failed to send welcome email. Please try again.');
        }

    } catch (error) {
        console.error('❌ Subscription error:', error);
        
        if (error.name === 'ValidationError' || error.name === 'MongoError') {
            throw new ErrorHandler(500, 'Failed to save subscription. Please try again.');
        }
        
        throw new ErrorHandler(400, error.message || 'Something went wrong while processing your subscription.');
    }
});

export const getAllUserOrder = synchFunc(async (req, res) => {
    const orders = await orderModel.find({userId:req.user._id}).sort({ createdAt: -1 });
    res.status(200).json({ 
      success: true, 
      orders 
    });
});

export const contactUSController = synchFunc(async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
      });
    }

    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name should contain only letters and spaces' 
      });
    }

    try {
      const newContact = new ContactUs({
        name,
        email,
        subject,
        message
      });

      await newContact.save();

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

      const emailPromises = [
        mail([process.env.ADMIN_EMAIL], `Contact Form: ${subject}`, adminEmailHtml, email),
        mail([email], 'We received your message - Agstamp', userConfirmationHtml)
      ];

      await Promise.allSettled(emailPromises);

      res.status(201).json({ 
        success: true, 
        message: 'Message sent successfully! Check your email for confirmation.' 
      });

    } catch (error) {
      console.error('❌ Contact form error:', error);
      
      if (error.name === 'ValidationError' || error.name === 'MongoError') {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to save your message. Please try again.' 
        });
      }
      
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
      usPrice: domestic ? domestic.price : 5,
      internationalPrice: international ? international.price : 25,
    });
  } catch (error) {
    console.error("Error fetching customer shipping prices:", error);
    res.status(500).json({ success: false, message: "Server error while fetching shipping prices" });
  }
};

 // ✅ NEW: Get all carousels for public display (no auth required)
export const getPublicCarousels = synchFunc(async (_, res) => {
    const carousels = await CarouselModel.find();
    res.status(200).json({ success: true, Carousels: carousels });
});