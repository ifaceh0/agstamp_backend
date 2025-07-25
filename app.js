// import express from "express";
// import dotenv from "dotenv";
// import path from "path";
// import { customersRoute } from "./Routes/customersRoute.js";
// import cookieParser from "cookie-parser";
// import cors from "cors";
// import cloudinary from 'cloudinary';
// import { errorHandlerMiddleware } from "./Middleware/errorMiddleWare.js";
// import { adminRoute } from "./Routes/adminRoute.js";
// const stripeRoutes = require("./Routes/stripeRoutes.js")

// //setting path of env environment
// dotenv.config({path:path.join(path.resolve(),"/Config/config.env")});

// // creating app instance
// export const app = express();

// //middleware
// app.use(express.json());
// app.use(cookieParser());

// // Configure Cloudinary
// cloudinary.v2.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });


// //cors 
// const allowedOrigins = [process.env.FORNTEND_URL]; 
// const corsOptions = {
//     origin: allowedOrigins,
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//     allowedHeaders: ["Content-Type", "Authorization"],
// };
// app.use(cors(corsOptions));


// //routers
// app.get("/api/v1/user/login",(_,res)=>{
//     res.end("welcome to my server!")
// })
// app.use("/api/v1",customersRoute);
// app.use("/api/v1",adminRoute);
// app.use("/api/v1/stripe", stripeRoutes)



// //errorHandlerMiddleware
// app.use(errorHandlerMiddleware);




import express from "express";
import dotenv from "dotenv";
import path from "path";
import { customersRoute } from "./Routes/customersRoute.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import cloudinary from 'cloudinary';
import { errorHandlerMiddleware } from "./Middleware/errorMiddleWare.js";
import { adminRoute } from "./Routes/adminRoute.js";
import stripeRoutes from "./Routes/stripeRoutes.js"; // Changed to ES module import

//setting path of env environment
dotenv.config({path:path.join(path.resolve(),"/Config/config.env")});

// creating app instance
export const app = express();

//middleware
app.use(express.json());
app.use(cookieParser());

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Raw body parser middleware for Stripe webhooks
app.use((req, res, next) => {
  if (req.originalUrl === '/api/v1/stripe/webhook') {
    let rawBody = '';
    req.on('data', (chunk) => {
      rawBody += chunk.toString();
    });
    req.on('end', () => {
      req.rawBody = rawBody;
      next();
    });
  } else {
    next();
  }
});

//cors 
const allowedOrigins = [process.env.FORNTEND_URL, 'http://localhost:3000']; // Added localhost:3000 for development
const corsOptions = {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"],
};
app.use(cors(corsOptions));

//routers
app.get("/api/v1/user/login",(_,res)=>{
    res.end("welcome to my server!")
})
app.use("/api/v1",customersRoute);
app.use("/api/v1",adminRoute);
app.use("/api/v1/stripe", stripeRoutes);

//errorHandlerMiddleware
app.use(errorHandlerMiddleware);