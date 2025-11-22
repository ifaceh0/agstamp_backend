// const stripe = require("../Config/stripe")
// const Order = require("../Model/orderModel") // Assuming you have an Order model
// const User = require("../Model/") // Assuming you have a User model

// // Create a checkout session
// exports.createCheckoutSession = async (req, res) => {
//   try {
//     const { items, customerEmail, customerName, shippingAddress, metadata = {} } = req.body

//     // Validate required fields
//     if (!items || !items.length) {
//       return res.status(400).json({
//         success: false,
//         message: "No items provided for checkout",
//       })
//     }

//     // Format line items for Stripe
//     const lineItems = items.map((item) => ({
//       price_data: {
//         currency: "usd",
//         product_data: {
//           name: item.name,
//           description: item.description || "",
//           images: item.images || [],
//         },
//         unit_amount: Math.round(item.price * 100), // Stripe requires amount in cents
//       },
//       quantity: item.quantity,
//     }))

//     // Create the checkout session
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       mode: "payment",
//       line_items: lineItems,
//       customer_email: customerEmail,
//       client_reference_id: req.user ? req.user.id : null, // If user is authenticated
//       success_url: `${req.headers.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${req.headers.origin}/checkout/cancel`,
//       shipping_address_collection: {
//         allowed_countries: ["US", "CA"], // Add more countries as needed
//       },
//       shipping_options: [
//         {
//           shipping_rate_data: {
//             type: "fixed_amount",
//             fixed_amount: {
//               amount: 0, // Free shipping
//               currency: "usd",
//             },
//             display_name: "Standard Shipping",
//             delivery_estimate: {
//               minimum: {
//                 unit: "business_day",
//                 value: 3,
//               },
//               maximum: {
//                 unit: "business_day",
//                 value: 5,
//               },
//             },
//           },
//         },
//       ],
//       metadata: {
//         ...metadata,
//         customerName,
//       },
//     })

//     // Return the session ID and URL
//     res.status(200).json({
//       success: true,
//       sessionId: session.id,
//       url: session.url,
//     })
//   } catch (error) {
//     console.error("Error creating checkout session:", error)
//     res.status(500).json({
//       success: false,
//       message: "Failed to create checkout session",
//       error: error.message,
//     })
//   }
// }

// // Verify a checkout session
// exports.verifyCheckoutSession = async (req, res) => {
//   try {
//     const { sessionId } = req.params

//     if (!sessionId) {
//       return res.status(400).json({
//         success: false,
//         message: "Session ID is required",
//       })
//     }

//     const session = await stripe.checkout.sessions.retrieve(sessionId, {
//       expand: ["line_items", "customer"],
//     })

//     res.status(200).json({
//       success: true,
//       session,
//     })
//   } catch (error) {
//     console.error("Error verifying checkout session:", error)
//     res.status(500).json({
//       success: false,
//       message: "Failed to verify checkout session",
//       error: error.message,
//     })
//   }
// }

// // Handle Stripe webhook events
// exports.handleWebhook = async (req, res) => {
//   const signature = req.headers["stripe-signature"]
//   const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

//   let event

//   try {
//     // Verify the webhook signature
//     event = stripe.webhooks.constructEvent(
//       req.rawBody, // You need to configure Express to provide raw body for webhook verification
//       signature,
//       endpointSecret,
//     )
//   } catch (error) {
//     console.error("Webhook signature verification failed:", error.message)
//     return res.status(400).send(`Webhook Error: ${error.message}`)
//   }

//   // Handle specific events
//   switch (event.type) {
//     case "checkout.session.completed":
//       const session = event.data.object

//       // Create order in database
//       await handleCheckoutSessionCompleted(session)
//       break

//     case "payment_intent.succeeded":
//       const paymentIntent = event.data.object
//       // Update payment status in your database
//       await handlePaymentIntentSucceeded(paymentIntent)
//       break

//     // Add more event handlers as needed

//     default:
//       console.log(`Unhandled event type: ${event.type}`)
//   }

//   res.status(200).json({ received: true })
// }

// // Helper function to handle checkout.session.completed event
// async function handleCheckoutSessionCompleted(session) {
//   try {
//     // Retrieve the session with line items
//     const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
//       expand: ["line_items"],
//     })

//     // Extract order details
//     const { client_reference_id, customer_email, metadata, amount_total, line_items, payment_status, shipping } =
//       expandedSession

//     // Create a new order in your database
//     const order = new Order({
//       user: client_reference_id, // User ID if available
//       email: customer_email,
//       customerName: metadata?.customerName,
//       items: line_items.data.map((item) => ({
//         name: item.description,
//         price: item.amount_total / 100, // Convert from cents to dollars
//         quantity: item.quantity,
//       })),
//       total: amount_total / 100, // Convert from cents to dollars
//       paymentStatus: payment_status,
//       shippingAddress: shipping
//         ? {
//             name: shipping.name,
//             address: {
//               line1: shipping.address.line1,
//               line2: shipping.address.line2,
//               city: shipping.address.city,
//               state: shipping.address.state,
//               postalCode: shipping.address.postal_code,
//               country: shipping.address.country,
//             },
//           }
//         : null,
//       stripeSessionId: session.id,
//     })

//     await order.save()

//     // If user is authenticated, add order to user's orders
//     if (client_reference_id) {
//       await User.findByIdAndUpdate(client_reference_id, { $push: { orders: order._id } })
//     }

//     console.log(`Order created: ${order._id}`)
//   } catch (error) {
//     console.error("Error handling checkout session completed:", error)
//   }
// }

// // Helper function to handle payment_intent.succeeded event
// async function handlePaymentIntentSucceeded(paymentIntent) {
//   try {
//     // Update order payment status
//     await Order.findOneAndUpdate(
//       { paymentIntentId: paymentIntent.id },
//       {
//         $set: {
//           paymentStatus: "paid",
//           paymentDetails: {
//             paymentMethod: paymentIntent.payment_method_types[0],
//             paymentId: paymentIntent.id,
//             amount: paymentIntent.amount / 100, // Convert from cents to dollars
//             currency: paymentIntent.currency,
//             paidAt: new Date(paymentIntent.created * 1000), // Convert from Unix timestamp
//           },
//         },
//       },
//     )

//     console.log(`Payment succeeded for intent: ${paymentIntent.id}`)
//   } catch (error) {
//     console.error("Error handling payment intent succeeded:", error)
//   }
// }


// import stripe from "../Config/stripe.js"; // Make sure this path is correct
// import Order from "../Model/orderModel.js"; // Ensure this path is correct
// import { UserModel } from '../Model/userModel.js';// Update with your actual user model name

// // Create a checkout session
// export const createCheckoutSession = async (req, res) => {
//   try {
//     const { items, customerEmail, customerName, shippingAddress, metadata = {} } = req.body;

//     // Validate required fields
//     if (!items || !items.length) {
//       return res.status(400).json({
//         success: false,
//         message: "No items provided for checkout",
//       });
//     }

//     // Format line items for Stripe
//     const lineItems = items.map((item) => ({
//       price_data: {
//         currency: "usd",
//         product_data: {
//           name: item.name,
//           description: item.description || "",
//           images: item.images || [],
//         },
//         unit_amount: Math.round(item.price * 100), // Stripe requires amount in cents
//       },
//       quantity: item.quantity,
//     }));

//     // Create the checkout session
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       mode: "payment",
//       line_items: lineItems,
//       customer_email: customerEmail,
//       client_reference_id: req.user ? req.user.id : null, // If user is authenticated
//       success_url: `${req.headers.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${req.headers.origin}/checkout/cancel`,
//       shipping_address_collection: {
//         allowed_countries: ["US", "CA"], // Add more countries as needed
//       },
//       shipping_options: [
//         {
//           shipping_rate_data: {
//             type: "fixed_amount",
//             fixed_amount: {
//               amount: 0, // Free shipping
//               currency: "usd",
//             },
//             display_name: "Standard Shipping",
//             delivery_estimate: {
//               minimum: {
//                 unit: "business_day",
//                 value: 3,
//               },
//               maximum: {
//                 unit: "business_day",
//                 value: 5,
//               },
//             },
//           },
//         },
//       ],
//       metadata: {
//         ...metadata,
//         customerName,
//       },
//     });

//     // Return the session ID and URL
//     res.status(200).json({
//       success: true,
//       sessionId: session.id,
//       url: session.url,
//     });
//   } catch (error) {
//     console.error("Error creating checkout session:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to create checkout session",
//       error: error.message,
//     });
//   }
// };

// // Verify a checkout session
// export const verifyCheckoutSession = async (req, res) => {
//   try {
//     const { sessionId } = req.params;

//     if (!sessionId) {
//       return res.status(400).json({
//         success: false,
//         message: "Session ID is required",
//       });
//     }

//     const session = await stripe.checkout.sessions.retrieve(sessionId, {
//       expand: ["line_items", "customer"],
//     });

//     res.status(200).json({
//       success: true,
//       session,
//     });
//   } catch (error) {
//     console.error("Error verifying checkout session:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to verify checkout session",
//       error: error.message,
//     });
//   }
// };

// // Handle Stripe webhook events
// export const handleWebhook = async (req, res) => {
//   const signature = req.headers["stripe-signature"];
//   const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

//   let event;

//   try {
//     // Verify the webhook signature
//     event = stripe.webhooks.constructEvent(
//       req.rawBody, // You need to configure Express to provide raw body for webhook verification
//       signature,
//       endpointSecret,
//     );
//   } catch (error) {
//     console.error("Webhook signature verification failed:", error.message);
//     return res.status(400).send(`Webhook Error: ${error.message}`);
//   }

//   // Handle specific events
//   switch (event.type) {
//     case "checkout.session.completed":
//       const session = event.data.object;

//       // Create order in database
//       await handleCheckoutSessionCompleted(session);
//       break;

//     case "payment_intent.succeeded":
//       const paymentIntent = event.data.object;
//       // Update payment status in your database
//       await handlePaymentIntentSucceeded(paymentIntent);
//       break;

//     // Add more event handlers as needed

//     default:
//       console.log(`Unhandled event type: ${event.type}`);
//   }

//   res.status(200).json({ received: true });
// };

// // Helper function to handle checkout.session.completed event
// async function handleCheckoutSessionCompleted(session) {
//   try {
//     // Retrieve the session with line items
//     const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
//       expand: ["line_items"],
//     });

//     // Extract order details
//     const { client_reference_id, customer_email, metadata, amount_total, line_items, payment_status, shipping } =
//       expandedSession;

//     // Create a new order in your database
//     const order = new Order({
//       user: client_reference_id, // User ID if available
//       email: customer_email,
//       customerName: metadata?.customerName,
//       items: line_items.data.map((item) => ({
//         name: item.description,
//         price: item.amount_total / 100, // Convert from cents to dollars
//         quantity: item.quantity,
//       })),
//       total: amount_total / 100, // Convert from cents to dollars
//       paymentStatus: payment_status,
//       shippingAddress: shipping
//         ? {
//             name: shipping.name,
//             address: {
//               line1: shipping.address.line1,
//               line2: shipping.address.line2,
//               city: shipping.address.city,
//               state: shipping.address.state,
//               postalCode: shipping.address.postal_code,
//               country: shipping.address.country,
//             },
//           }
//         : null,
//       stripeSessionId: session.id,
//     });

//     await order.save();

//     // If user is authenticated, add order to user's orders
//     if (client_reference_id) {
//       await User.findByIdAndUpdate(client_reference_id, { $push: { orders: order._id } });
//     }

//     console.log(`Order created: ${order._id}`);
//   } catch (error) {
//     console.error("Error handling checkout session completed:", error);
//   }
// }

// // Helper function to handle payment_intent.succeeded event
// async function handlePaymentIntentSucceeded(paymentIntent) {
//   try {
//     // Update order payment status
//     await Order.findOneAndUpdate(
//       { paymentIntentId: paymentIntent.id },
//       {
//         $set: {
//           paymentStatus: "paid",
//           paymentDetails: {
//             paymentMethod: paymentIntent.payment_method_types[0],
//             paymentId: paymentIntent.id,
//             amount: paymentIntent.amount / 100, // Convert from cents to dollars
//             currency: paymentIntent.currency,
//             paidAt: new Date(paymentIntent.created * 1000), // Convert from Unix timestamp
//           },
//         },
//       },
//     );

//     console.log(`Payment succeeded for intent: ${paymentIntent.id}`);
//   } catch (error) {
//     console.error("Error handling payment intent succeeded:", error);
//   }
// }


// import stripe from "../Config/stripe.js"; // Make sure this path is correct
// import { checkStockAvailability, updateStampStock } from "../Helper/Helper.js";
// import { mail } from "../Helper/Mail.js";
// import CartModel from "../Model/cartModel.js";
// import Order from "../Model/orderModel.js"; // Ensure this path is correct
// import stampModel from "../Model/stampModel.js";
// import { UserModel } from '../Model/userModel.js';// Update with your actual user model name
// import { ErrorHandler } from "../Utils/ErrorHandler.js";

// // Create a checkout session
// export const createCheckoutSession = async (req, res) => {
//   try {
//     const { items, customerEmail, customerName, shippingType, metadata = {} } = req.body;

//     // Validate required fields
//     if (!items || !items.length) {
//       return res.status(400).json({
//         success: false,
//         message: "No items provided for checkout",
//       });
//     }


//     const lineItemsCheck = items.map((item) => ({
//       mongoID:item.mongoID,
//       quantity: item.quantity,
//     }));

//     const isStock = await checkStockAvailability(lineItemsCheck);
//     if(isStock !== true){
//       res.status(500).json({
//       success: false,
//       message: isStock,
//       });
//       return;
//     }

//     // Format line items for Stripe
//     const lineItems = items.map((item) => ({
//       price_data: {
//         currency: "usd",
//         product_data: {
//           name: item.name,
//           description: item.description || "",
//           images: item.images.map(ele=>ele.publicUrl) || [],
//         },
//         unit_amount: Math.round(item.price * 100),
//       },
//       quantity: item.quantity,
//     }));


//     // Create the session data object
//     const sessionData = {
//       payment_method_types: ["card"],
//       mode: "payment",
//       line_items: lineItems,
//       customer_email: customerEmail,
//       success_url: `${req.headers.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${req.headers.origin}/checkout/cancel`,
//       shipping_address_collection: {
//         allowed_countries: shippingType == "us" ? ["US"] : ["CA"], // Add more countries as needed
//       },
//       shipping_options: [
//         {
//           shipping_rate_data: {
//             type: "fixed_amount",
//             fixed_amount: {
//               amount: shippingType == "us" ? 500 : 2500, 
//               currency: "usd",
//             },
//             display_name: "Express Shipping",
//             delivery_estimate: {
//               minimum: {
//                 unit: "business_day",
//                 value: 1,
//               },
//               maximum: {
//                 unit: "business_day",
//                 value: 2,
//               },
//             },
//           },
//         },
//       ],

     
//       metadata: {
//         ...metadata,
//         customerName,
//         customerId:String(req.user._id)
//       },
//     };

//     // Only add client_reference_id if user is authenticated and id exists
//     if (req.user && req.user.id) {
//       sessionData.client_reference_id = req.user.id;
//     }

//     // Create the checkout session
//     const session = await stripe.checkout.sessions.create(sessionData);

//     // Return the session ID and URL
//     res.status(200).json({
//       success: true,
//       sessionId: session.id,
//       url: session.url,
//     });
//   } catch (error) {
//     console.error("Error creating checkout session:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to create checkout session",
//       error: error.message,
//     });
//   }
// };

// // Verify a checkout session
// export const verifyCheckoutSession = async (req, res) => {
//   try {
//     const { sessionId } = req.params;

//     if (!sessionId) {
//       return res.status(400).json({
//         success: false,
//         message: "Session ID is required",
//       });
//     }

//     const session = await stripe.checkout.sessions.retrieve(sessionId, {
//       expand: ["line_items", "customer"],
//     });

//     const isOrder = await Order.findOne({paymentIntentId:session.payment_intent});
//     if(isOrder){
//       res.status(200).json({
//         success: true,
//         session,
//       });
//       return;
//     }

//     if(session.payment_status !== "paid") throw ErrorHandler(400,"error occured while payment")

//       const stampList = JSON.parse(session.metadata.products)

//       ////////////////////////
//       const ids = stampList.map(item => item.mongoID);
//       const stamps = await stampModel.find({ _id: { $in: ids } });
//         const response = stampList.map(item => {
//           const stamp = stamps.find(s => s._id.toString() === item.mongoID);
//           if (!stamp) return null;
//           return {
//             mongoID: item.mongoID,
//             name: stamp.name,
//             category: stamp.categories,
//             unitPrice: stamp.price,
//             image: stamp.images?.[0] || null,
//             quantity: item.quantity,
//             totalPrice: item.quantity * stamp.price,
//           };
//         }).filter(Boolean);
//         const orderInstance = new Order({
//           userId:session.metadata.customerId,
//           items:response,
//           total:session.amount_total / 100,
//           paymentStatus:"paid",
//           paymentDetails:{
//             amount:session.amount_total / 100,
//             amountSubtotal:session.amount_subtotal / 100,
//             shippingCost:session.shipping_cost.amount_total / 100,
//             paymentId:session.payment_intent,
//             paymentMethod:"card",
//             currency:session.currency
//           },
//           shippingAddress:session.customer_details.address,
//           stripeSessionId:sessionId,
//           paymentIntentId:session.payment_intent
//         })
//         await orderInstance.save();
//         const isUpdated = await updateStampStock(orderInstance);

//         if(typeof isUpdated == "string"){
//           res.status(500).json({
//             success: false,
//             message: isUpdated,
//           });
//          return;
//         }

//       await CartModel.deleteOne({user:req.user._id});

//       const today = new Date();
//       const formatted = today.toISOString().split("T")[0];

//       let listOfItem = "";

//       response.forEach((item)=>{
//         listOfItem+= `
//           <li style="margin-bottom: 10px;">
//               <div><strong>Name:</strong> ${item.name}</div>
//               <div><strong>Category:</strong> ${item.category}</div>
//               <div><strong>Price:</strong> $${item.unitPrice}</div>
//               <div><strong>Quantity:</strong> ${item.quantity}</div>
//               <div><img src=${item.image.publicUrl} alt=${item.name} style="max-width: 100px; margin-top: 5px;"/></div>
//             </li>
//         `
//       })


//       const htmlBody = `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
//           <h2 style="color: #2e7d32;">Thank you for shopping with us!</h2>
//           <p>Hi <strong>${req.user.username}</strong>,</p>
//           <p>Your order has been successfully placed on <strong>${formatted}</strong>.</p>
          
//           <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px;">Order Summary</h3>
//           <ul style="padding-left: 20px;">
//             ${listOfItem}
//           </ul>

//           <p><strong>Shipping Amount:</strong> $${session.shipping_cost.amount_total / 100}</p>
//           <p><strong>Total Amount:</strong> $${session.amount_total / 100}</p>

//           <p>We’ll send another email when your items are shipped. You can track your order status anytime in your account.</p>

//           <p style="margin-top: 20px;">Thank you for choosing us!<br/>The Team</p>

//           <hr style="margin-top: 30px;">
//           <small style="color: #888;">This is an automated message. Please do not reply.</small>
//         </div>
//       `;
//       await mail([req.user.email],"Your Order Has Been Placed Successfully! 🛒",htmlBody);

//     res.status(200).json({
//       success: true,
//       session,
//       updatedStamp:isUpdated
//     });
//   } catch (error) {
//     console.error("Error verifying checkout session:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to verify checkout session",
//       error: error.message,
//     });
//   }
// };

// // Handle Stripe webhook events
// export const handleWebhook = async (req, res) => {
//   const signature = req.headers["stripe-signature"];
//   const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

//   let event;

//   try {
//     // Verify the webhook signature
//     event = stripe.webhooks.constructEvent(
//       req.rawBody, // You need to configure Express to provide raw body for webhook verification
//       signature,
//       endpointSecret,
//     );
//   } catch (error) {
//     console.error("Webhook signature verification failed:", error.message);
//     return res.status(400).send(`Webhook Error: ${error.message}`);
//   }

//   // Handle specific events
//   switch (event.type) {
//     case "checkout.session.completed":
//       const session = event.data.object;

//       // Create order in database
//       await handleCheckoutSessionCompleted(session);
//       break;

//     case "payment_intent.succeeded":
//       const paymentIntent = event.data.object;
//       // Update payment status in your database
//       await handlePaymentIntentSucceeded(paymentIntent);
//       break;

//     // Add more event handlers as needed

//     default:
//       console.log(`Unhandled event type: ${event.type}`);
//   }

//   res.status(200).json({ received: true });
// };

// // Helper function to handle checkout.session.completed event
// async function handleCheckoutSessionCompleted(session) {
//   try {
//     // Retrieve the session with line items
//     const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
//       expand: ["line_items"],
//     });

//     // Extract order details
//     const { client_reference_id, customer_email, metadata, amount_total, line_items, payment_status, shipping } =
//       expandedSession;

//     // Create a new order in your database
//     const order = new Order({
//       user: client_reference_id || null, // User ID if available, otherwise null
//       email: customer_email,
//       customerName: metadata?.customerName,
//       items: line_items.data.map((item) => ({
//         name: item.description,
//         price: item.amount_total / 100, // Convert from cents to dollars
//         quantity: item.quantity,
//       })),
//       total: amount_total / 100, // Convert from cents to dollars
//       paymentStatus: payment_status,
//       shippingAddress: shipping
//         ? {
//           name: shipping.name,
//           address: {
//             line1: shipping.address.line1,
//             line2: shipping.address.line2,
//             city: shipping.address.city,
//             state: shipping.address.state,
//             postalCode: shipping.address.postal_code,
//             country: shipping.address.country,
//           },
//         }
//         : null,
//       stripeSessionId: session.id,
//     });

//     await order.save();

//     // If user is authenticated, add order to user's orders
//     if (client_reference_id) {
//       await UserModel.findByIdAndUpdate(client_reference_id, { $push: { orders: order._id } });
//     }

//     console.log(`Order created: ${order._id}`);
//   } catch (error) {
//     console.error("Error handling checkout session completed:", error);
//   }
// }

// // Helper function to handle payment_intent.succeeded event
// async function handlePaymentIntentSucceeded(paymentIntent) {
//   console.dir(paymentIntent);
//   try {
//     // Update order payment status
//     await Order.findOneAndUpdate(
//       { paymentIntentId: paymentIntent.id },
//       {
//         $set: {
//           paymentStatus: "paid",
//           paymentDetails: {
//             paymentMethod: paymentIntent.payment_method_types[0],
//             paymentId: paymentIntent.id,
//             amount: paymentIntent.amount / 100, // Convert from cents to dollars
//             currency: paymentIntent.currency,
//             paidAt: new Date(paymentIntent.created * 1000), // Convert from Unix timestamp
//           },
//         },
//       },
//     );

//     console.log(`Payment succeeded for intent: ${paymentIntent.id}`);
//   } catch (error) {
//     console.error("Error handling payment intent succeeded:", error);
//   }
// }

// import stripe from "../Config/stripe.js";
// import { checkStockAvailability, updateStampStock } from "../Helper/Helper.js";
// import { mail } from "../Helper/Mail.js";
// import CartModel from "../Model/cartModel.js";
// import Order from "../Model/orderModel.js";
// import stampModel from "../Model/stampModel.js";
// import { UserModel } from '../Model/userModel.js';
// import { ErrorHandler } from "../Utils/ErrorHandler.js";

// // 🧾 Create a checkout session
// // 🧾 Create a checkout session
// export const createCheckoutSession = async (req, res) => {
//   try {
//     const { items, customerEmail, customerName, shippingType, metadata = {}, selectedCountry, shippingRate } = req.body;

//     // Validate items
//     if (!items || !items.length) {
//       return res.status(400).json({
//         success: false,
//         message: "No items provided for checkout",
//       });
//     }

//     // Check stock before proceeding
//     const lineItemsCheck = items.map((item) => ({
//       mongoID: item.mongoID,
//       quantity: item.quantity,
//     }));

//     const isStock = await checkStockAvailability(lineItemsCheck);
//     if (isStock !== true) {
//       return res.status(500).json({
//         success: false,
//         message: isStock,
//       });
//     }

//     // Format line items for Stripe
//     const lineItems = items.map((item) => ({
//       price_data: {
//         currency: "usd",
//         product_data: {
//           name: item.name,
//           description: item.description || "",
//           images: item.images.map((ele) => ele.publicUrl) || [],
//         },
//         unit_amount: Math.round(item.price * 100),
//       },
//       quantity: item.quantity,
//     }));

//     // 🧮 Calculate total order amount before shipping
//     const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

//     // 🚚 Determine dynamic shipping cost (example logic)
//     // let shippingCost = 0;
//     // let shippingLabel = "";

//     // if (selectedCountry === "US") {
//     //   shippingCost = 500; // $5 for domestic
//     //   shippingLabel = "Domestic Shipping";
//     // } else {
//     //   shippingCost = 1500; // $15 for international
//     //   shippingLabel = "International Shipping";
//     // }

//     const shippingCost = Math.round(shippingRate * 100); // Convert to cents
//     const shippingLabel = selectedCountry === "US" ? "US Shipping" : "International Shipping";

//     // 📍 Ensure selectedCountry is set
//     const countryCode = selectedCountry || "US"; // fallback to US if not provided

//     // 💳 Create the Stripe session
//     const sessionData = {
//   payment_method_types: ["card"],
//   mode: "payment",
//   line_items: lineItems,
//   customer_email: customerEmail,
//   customer_creation: "always", // ✅ auto-creates a customer so address can be prefilled
//   success_url: `${req.headers.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
//   cancel_url: `${req.headers.origin}/checkout/cancel`,

//   // ✅ Only allow and lock this country
//   shipping_address_collection: {
//     allowed_countries: [countryCode],
//   },

//   // // ✅ Prevent user updates in Stripe
//   // customer_update: {
//   //   address: "never",
//   //   shipping: "never",
//   // },

//   // ✅ Dynamic shipping cost
//   shipping_options: [
//     {
//       shipping_rate_data: {
//         type: "fixed_amount",
//         fixed_amount: {
//           amount: shippingCost,
//           currency: "usd",
//         },
//         display_name: shippingLabel,
//         delivery_estimate: {
//           minimum: { unit: "business_day", value: 1 },
//           maximum: { unit: "business_day", value: 3 },
//         },
//       },
//     },
//   ],

//   // ✅ Store selected country in metadata for records
//   metadata: {
//     ...metadata,
//     customerName,
//     customerId: String(req.user._id),
//     selectedCountry: countryCode,
//     products: JSON.stringify(items),
//   },
// };



//     if (req.user && req.user.id) {
//       sessionData.client_reference_id = req.user.id;
//     }

//     const session = await stripe.checkout.sessions.create(sessionData);

//     res.status(200).json({
//       success: true,
//       sessionId: session.id,
//       url: session.url,
//     });
//   } catch (error) {
//     console.error("Error creating checkout session:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to create checkout session",
//       error: error.message,
//     });
//   }
// };

// // ✅ Verify Checkout Session
// export const verifyCheckoutSession = async (req, res) => {
//   try {
//     const { sessionId } = req.params;
//     if (!sessionId) {
//       return res.status(400).json({
//         success: false,
//         message: "Session ID is required",
//       });
//     }

//     const session = await stripe.checkout.sessions.retrieve(sessionId, {
//       expand: ["line_items", "customer"],
//     });

//     const isOrder = await Order.findOne({ paymentIntentId: session.payment_intent });
//     if (isOrder) {
//       return res.status(200).json({
//         success: true,
//         session,
//       });
//     }

//     if (session.payment_status !== "paid") throw ErrorHandler(400, "Error occurred during payment");

//     const stampList = JSON.parse(session.metadata.products);

//     const ids = stampList.map((item) => item.mongoID);
//     const stamps = await stampModel.find({ _id: { $in: ids } });

//     const response = stampList.map((item) => {
//       const stamp = stamps.find((s) => s._id.toString() === item.mongoID);
//       if (!stamp) return null;
//       return {
//         mongoID: item.mongoID,
//         name: stamp.name,
//         category: stamp.categories,
//         unitPrice: stamp.price,
//         image: stamp.images?.[0] || null,
//         quantity: item.quantity,
//         totalPrice: item.quantity * stamp.price,
//       };
//     }).filter(Boolean);

//     const orderInstance = new Order({
//       userId: session.metadata.customerId,
//       items: response,
//       total: session.amount_total / 100,
//       paymentStatus: "paid",
//       paymentDetails: {
//         amount: session.amount_total / 100,
//         amountSubtotal: session.amount_subtotal / 100,
//         shippingCost: session.shipping_cost.amount_total / 100,
//         paymentId: session.payment_intent,
//         paymentMethod: "card",
//         currency: session.currency,
//       },
//       shippingAddress: session.customer_details.address,
//       stripeSessionId: sessionId,
//       paymentIntentId: session.payment_intent,
//     });

//     await orderInstance.save();
//     const isUpdated = await updateStampStock(orderInstance);

//     if (typeof isUpdated === "string") {
//       return res.status(500).json({
//         success: false,
//         message: isUpdated,
//       });
//     }

//     await CartModel.deleteOne({ user: req.user._id });

//     const today = new Date();
//     const formatted = today.toISOString().split("T")[0];

//     let listOfItem = "";
//     response.forEach((item) => {
//       listOfItem += `
//         <li style="margin-bottom: 10px;">
//           <div><strong>Name:</strong> ${item.name}</div>
//           <div><strong>Category:</strong> ${item.category}</div>
//           <div><strong>Price:</strong> $${item.unitPrice}</div>
//           <div><strong>Quantity:</strong> ${item.quantity}</div>
//           <div><img src=${item.image.publicUrl} alt=${item.name} style="max-width: 100px; margin-top: 5px;"/></div>
//         </li>
//       `;
//     });

//     const htmlBody = `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
//         <h2 style="color: #2e7d32;">Thank you for shopping with us!</h2>
//         <p>Hi <strong>${req.user.username}</strong>,</p>
//         <p>Your order has been successfully placed on <strong>${formatted}</strong>.</p>
//         <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px;">Order Summary</h3>
//         <ul style="padding-left: 20px;">
//           ${listOfItem}
//         </ul>
//         <p><strong>Shipping Amount:</strong> $${session.shipping_cost.amount_total / 100}</p>
//         <p><strong>Total Amount:</strong> $${session.amount_total / 100}</p>
//         <p>We’ll send another email when your items are shipped.</p>
//         <p style="margin-top: 20px;">Thank you for choosing us!<br/>The Team</p>
//         <hr style="margin-top: 30px;">
//         <small style="color: #888;">This is an automated message. Please do not reply.</small>
//       </div>
//     `;

//     await mail([req.user.email], "Your Order Has Been Placed Successfully! 🛒", htmlBody);

//     res.status(200).json({
//       success: true,
//       session,
//       updatedStamp: isUpdated,
//     });
//   } catch (error) {
//     console.error("Error verifying checkout session:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to verify checkout session",
//       error: error.message,
//     });
//   }
// };

// // ⚙️ Handle Stripe Webhook Events
// export const handleWebhook = async (req, res) => {
//   const signature = req.headers["stripe-signature"];
//   const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

//   let event;
//   try {
//     event = stripe.webhooks.constructEvent(req.rawBody, signature, endpointSecret);
//   } catch (error) {
//     console.error("Webhook signature verification failed:", error.message);
//     return res.status(400).send(`Webhook Error: ${error.message}`);
//   }

//   switch (event.type) {
//     case "checkout.session.completed":
//       await handleCheckoutSessionCompleted(event.data.object);
//       break;

//     case "payment_intent.succeeded":
//       await handlePaymentIntentSucceeded(event.data.object);
//       break;

//     default:
//       console.log(`Unhandled event type: ${event.type}`);
//   }

//   res.status(200).json({ received: true });
// };

// // Helper: When Checkout Session Completes
// async function handleCheckoutSessionCompleted(session) {
//   try {
//     const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
//       expand: ["line_items"],
//     });

//     const { client_reference_id, customer_email, metadata, amount_total, line_items, payment_status, shipping } =
//       expandedSession;

//     const order = new Order({
//       user: client_reference_id || null,
//       email: customer_email,
//       customerName: metadata?.customerName,
//       items: line_items.data.map((item) => ({
//         name: item.description,
//         price: item.amount_total / 100,
//         quantity: item.quantity,
//       })),
//       total: amount_total / 100,
//       paymentStatus: payment_status,
//       shippingAddress: shipping ? {
//         name: shipping.name,
//         address: {
//           line1: shipping.address.line1,
//           line2: shipping.address.line2,
//           city: shipping.address.city,
//           state: shipping.address.state,
//           postalCode: shipping.address.postal_code,
//           country: shipping.address.country,
//         },
//       } : null,
//       stripeSessionId: session.id,
//     });

//     await order.save();

//     if (client_reference_id) {
//       await UserModel.findByIdAndUpdate(client_reference_id, { $push: { orders: order._id } });
//     }

//     console.log(`Order created: ${order._id}`);
//   } catch (error) {
//     console.error("Error handling checkout session completed:", error);
//   }
// }

// // Helper: When Payment Intent Succeeds
// async function handlePaymentIntentSucceeded(paymentIntent) {
//   try {
//     await Order.findOneAndUpdate(
//       { paymentIntentId: paymentIntent.id },
//       {
//         $set: {
//           paymentStatus: "paid",
//           paymentDetails: {
//             paymentMethod: paymentIntent.payment_method_types[0],
//             paymentId: paymentIntent.id,
//             amount: paymentIntent.amount / 100,
//             currency: paymentIntent.currency,
//             paidAt: new Date(paymentIntent.created * 1000),
//           },
//         },
//       }
//     );

//     console.log(`Payment succeeded for intent: ${paymentIntent.id}`);
//   } catch (error) {
//     console.error("Error handling payment intent succeeded:", error);
//   }
// }


import stripe from "../Config/stripe.js";
import { checkStockAvailability, updateStampStock } from "../Helper/Helper.js";
import { mail } from "../Helper/Mail.js";
import CartModel from "../Model/cartModel.js";
import Order from "../Model/orderModel.js";
import stampModel from "../Model/stampModel.js";
import { UserModel } from "../Model/userModel.js";
import { ErrorHandler } from "../Utils/ErrorHandler.js";

// ==========================================
// 🧾 AUTHENTICATED USER CHECKOUT
// ==========================================
export const createCheckoutSession = async (req, res) => {
  try {
    const { items, customerEmail, customerName, shippingType, metadata = {}, selectedCountry, shippingRate } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: "No items provided for checkout" });
    }

    const lineItemsCheck = items.map((item) => ({ mongoID: item.mongoID, quantity: item.quantity }));
    const isStock = await checkStockAvailability(lineItemsCheck);
    if (isStock !== true) {
      return res.status(400).json({ success: false, message: isStock });
    }

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          description: item.description || "",
          images: item.images?.map((ele) => ele.publicUrl) || [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const shippingCost = Math.round(shippingRate * 100);
    const shippingLabel = selectedCountry === "US" ? "US Shipping" : "International Shipping";
    const countryCode = selectedCountry || "US";

    const sessionData = {
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      customer_email: customerEmail,
      customer_creation: "always",
      success_url: `${req.headers.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/checkout/cancel`,
      shipping_address_collection: { allowed_countries: [countryCode] },
      shipping_options: [{
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: shippingCost, currency: "usd" },
          display_name: shippingLabel,
          delivery_estimate: {
            minimum: { unit: "business_day", value: 1 },
            maximum: { unit: "business_day", value: 3 },
          },
        },
      }],
      metadata: {
        ...metadata,
        customerName,
        customerId: String(req.user._id),
        isGuestCheckout: "false",
        selectedCountry: countryCode,
        products: JSON.stringify(items),
      },
    };

    if (req.user && req.user.id) {
      sessionData.client_reference_id = req.user.id;
    }

    const session = await stripe.checkout.sessions.create(sessionData);
    res.status(200).json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ success: false, message: "Failed to create checkout session", error: error.message });
  }
};

// ✅ Verify Authenticated User Session
export const verifyCheckoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ success: false, message: "Session ID is required" });

    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["line_items", "customer"] });
    const isOrder = await Order.findOne({ paymentIntentId: session.payment_intent });
    if (isOrder) return res.status(200).json({ success: true, session });

    if (session.payment_status !== "paid") throw ErrorHandler(400, "Error occurred during payment");

    const stampList = JSON.parse(session.metadata.products);
    const ids = stampList.map((item) => item.mongoID);
    const stamps = await stampModel.find({ _id: { $in: ids } });

    const response = stampList.map((item) => {
      const stamp = stamps.find((s) => s._id.toString() === item.mongoID);
      if (!stamp) return null;
      return {
        mongoID: item.mongoID, name: stamp.name, category: stamp.categories,
        unitPrice: stamp.price, image: stamp.images?.[0] || null,
        quantity: item.quantity, totalPrice: item.quantity * stamp.price,
      };
    }).filter(Boolean);

    const orderInstance = new Order({
      userId: session.metadata.customerId,
      isGuestOrder: false,
      items: response,
      total: session.amount_total / 100,
      paymentStatus: "paid",
      paymentDetails: {
        amount: session.amount_total / 100,
        amountSubtotal: session.amount_subtotal / 100,
        shippingCost: session.shipping_cost?.amount_total / 100 || 0,
        paymentId: session.payment_intent,
        paymentMethod: "card",
        currency: session.currency,
      },
      shippingAddress: session.customer_details?.address,
      stripeSessionId: sessionId,
      paymentIntentId: session.payment_intent,
    });

    await orderInstance.save();
    const isUpdated = await updateStampStock(orderInstance);
    if (typeof isUpdated === "string") return res.status(500).json({ success: false, message: isUpdated });

    await CartModel.deleteOne({ user: req.user._id });

    // Send email
    const today = new Date().toISOString().split("T")[0];
    let listOfItem = response.map(item => `
      <li style="margin-bottom: 10px;">
        <div><strong>Name:</strong> ${item.name}</div>
        <div><strong>Price:</strong> $${item.unitPrice}</div>
        <div><strong>Quantity:</strong> ${item.quantity}</div>
      </li>
    `).join("");

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #2e7d32;">Thank you for shopping with us!</h2>
        <p>Hi <strong>${req.user.username}</strong>,</p>
        <p>Your order has been successfully placed on <strong>${today}</strong>.</p>
        <ul style="padding-left: 20px;">${listOfItem}</ul>
        <p><strong>Total:</strong> $${session.amount_total / 100}</p>
        <p>Thank you for choosing us!<br/>The Team</p>
      </div>
    `;
    await mail([req.user.email], "Your Order Has Been Placed Successfully! 🛒", htmlBody);

    res.status(200).json({ success: true, session, updatedStamp: isUpdated });
  } catch (error) {
    console.error("Error verifying checkout session:", error);
    res.status(500).json({ success: false, message: "Failed to verify checkout session", error: error.message });
  }
};

// ==========================================
// 🧾 GUEST CHECKOUT (NO AUTH REQUIRED)
// ==========================================
export const createGuestCheckoutSession = async (req, res) => {
  try {
    const { items, customerEmail, customerName, metadata = {}, selectedCountry, shippingRate } = req.body;

    if (!customerEmail) return res.status(400).json({ success: false, message: "Email is required for guest checkout" });
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) return res.status(400).json({ success: false, message: "Invalid email address" });
    if (!items || !items.length) return res.status(400).json({ success: false, message: "No items provided" });

    const lineItemsCheck = items.map((item) => ({ mongoID: item.mongoID, quantity: item.quantity }));
    const isStock = await checkStockAvailability(lineItemsCheck);
    if (isStock !== true) return res.status(400).json({ success: false, message: isStock });

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name, description: item.description || "", images: item.images?.map((e) => e.publicUrl) || [] },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const shippingCost = Math.round(shippingRate * 100);
    const shippingLabel = selectedCountry === "US" ? "US Shipping" : "International Shipping";
    const countryCode = selectedCountry || "US";

    const sessionData = {
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      customer_email: customerEmail,
      customer_creation: "always",
      success_url: `${req.headers.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&guest=true`,
      cancel_url: `${req.headers.origin}/checkout/cancel`,
      shipping_address_collection: { allowed_countries: [countryCode] },
      shipping_options: [{
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: shippingCost, currency: "usd" },
          display_name: shippingLabel,
          delivery_estimate: { minimum: { unit: "business_day", value: 1 }, maximum: { unit: "business_day", value: 3 } },
        },
      }],
      metadata: { ...metadata, customerName: customerName || "Guest", customerEmail, isGuestCheckout: "true", selectedCountry: countryCode, products: JSON.stringify(items) },
    };

    const session = await stripe.checkout.sessions.create(sessionData);
    res.status(200).json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating guest checkout:", error);
    res.status(500).json({ success: false, message: "Failed to create checkout session", error: error.message });
  }
};

// ✅ Verify Guest Session
export const verifyGuestCheckoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ success: false, message: "Session ID is required" });

    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["line_items", "customer"] });
    const existingOrder = await Order.findOne({ paymentIntentId: session.payment_intent });
    if (existingOrder) return res.status(200).json({ success: true, session, order: existingOrder });

    if (session.payment_status !== "paid") return res.status(400).json({ success: false, message: "Payment not completed" });

    const stampList = JSON.parse(session.metadata.products);
    const ids = stampList.map((item) => item.mongoID);
    const stamps = await stampModel.find({ _id: { $in: ids } });

    const response = stampList.map((item) => {
      const stamp = stamps.find((s) => s._id.toString() === item.mongoID);
      if (!stamp) return null;
      return { mongoID: item.mongoID, name: stamp.name, category: stamp.categories, unitPrice: stamp.price, image: stamp.images?.[0] || null, quantity: item.quantity, totalPrice: item.quantity * stamp.price };
    }).filter(Boolean);

    const orderInstance = new Order({
      userId: null,
      guestEmail: session.metadata.customerEmail,
      guestName: session.metadata.customerName,
      isGuestOrder: true,
      items: response,
      total: session.amount_total / 100,
      paymentStatus: "paid",
      paymentDetails: { amount: session.amount_total / 100, amountSubtotal: session.amount_subtotal / 100, shippingCost: session.shipping_cost?.amount_total / 100 || 0, paymentId: session.payment_intent, paymentMethod: "card", currency: session.currency },
      shippingAddress: session.customer_details?.address || {},
      stripeSessionId: sessionId,
      paymentIntentId: session.payment_intent,
    });

    await orderInstance.save();
    await updateStampStock(orderInstance);

    // Send guest confirmation email
    const guestEmail = session.metadata.customerEmail;
    const guestName = session.metadata.customerName || "Valued Customer";
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #2e7d32;">Thank you for your order!</h2>
        <p>Hi <strong>${guestName}</strong>,</p>
        <p>Your order <strong>#${orderInstance._id}</strong> has been placed successfully.</p>
        <p><strong>Total:</strong> $${session.amount_total / 100}</p>
        <p>Save your Order ID to track your order status.</p>
        <p>Thank you!<br/>The Team</p>
      </div>
    `;
    await mail([guestEmail], "Your Order Has Been Placed! 🛒", htmlBody);

    res.status(200).json({ success: true, session, order: orderInstance });
  } catch (error) {
    console.error("Error verifying guest session:", error);
    res.status(500).json({ success: false, message: "Failed to verify session", error: error.message });
  }
};

// 📧 Track Guest Order
export const trackGuestOrder = async (req, res) => {
  try {
    const { email, orderId } = req.body;
    if (!email || !orderId) return res.status(400).json({ success: false, message: "Email and Order ID required" });

    const order = await Order.findOne({ _id: orderId, guestEmail: email.toLowerCase(), isGuestOrder: true });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to track order", error: error.message });
  }
};

// ⚙️ Handle Stripe Webhook Events
export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") await handleCheckoutSessionCompleted(event.data.object);
  else if (event.type === "payment_intent.succeeded") await handlePaymentIntentSucceeded(event.data.object);

  res.status(200).json({ received: true });
};

async function handleCheckoutSessionCompleted(session) {
  try {
    const expanded = await stripe.checkout.sessions.retrieve(session.id, { expand: ["line_items"] });
    const { client_reference_id, customer_email, metadata, amount_total, line_items, payment_status, shipping } = expanded;

    const isGuest = metadata?.isGuestCheckout === "true";
    const order = new Order({
      userId: isGuest ? null : client_reference_id,
      guestEmail: isGuest ? metadata?.customerEmail : null,
      guestName: isGuest ? metadata?.customerName : null,
      isGuestOrder: isGuest,
      email: customer_email,
      items: line_items.data.map((i) => ({ name: i.description, price: i.amount_total / 100, quantity: i.quantity })),
      total: amount_total / 100,
      paymentStatus: payment_status,
      shippingAddress: shipping?.address || null,
      stripeSessionId: session.id,
    });

    await order.save();
    if (!isGuest && client_reference_id) {
      await UserModel.findByIdAndUpdate(client_reference_id, { $push: { orders: order._id } });
    }
  } catch (err) {
    console.error("Error handling checkout completed:", err);
  }
}

async function handlePaymentIntentSucceeded(pi) {
  try {
    await Order.findOneAndUpdate({ paymentIntentId: pi.id }, {
      $set: { paymentStatus: "paid", paymentDetails: { paymentMethod: pi.payment_method_types[0], paymentId: pi.id, amount: pi.amount / 100, currency: pi.currency, paidAt: new Date(pi.created * 1000) } },
    });
  } catch (err) {
    console.error("Error handling payment succeeded:", err);
  }
}