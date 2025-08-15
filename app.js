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
import cloudinary from "cloudinary";
import { errorHandlerMiddleware } from "./Middleware/errorMiddleWare.js";
import { adminRoute } from "./Routes/adminRoute.js";
import stripeRoutes from "./Routes/stripeRoutes.js";

// ✅ Load environment variables
dotenv.config({ path: path.join(path.resolve(), "./Config/config.env") });

// ✅ Create Express app
export const app = express();

// ✅ Parse cookies
app.use(cookieParser());



// ✅ Setup CORS middleware FIRST
// const allowedOrigins = (process.env.FRONTEND_URL || "")
//   .split(",")
//   .map((origin) => origin.trim());


// console.log("✅ Allowed Origins:", allowedOrigins);
// if (allowedOrigins.length === 0) {
//   console.warn("❗ No FRONTEND_URL values found. Check your .env file or Render environment variables.");
// }


// const corsOptions = {
//   origin: function (origin, callback) {
//     console.log(`🌐 Incoming CORS Origin: ${origin || "NO ORIGIN HEADER"}`);
//     if (!origin || allowedOrigins.includes(origin)) {
//       console.log("✅ CORS Allowed:", origin);
//       callback(null, true);
//     } else {
//       console.warn("❌ CORS Blocked:", origin);
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//   credentials: true,
//   allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"],
// };

// app.use(cors(corsOptions));

app.use(cors({
  origin: ["https://agstamp-frontend.vercel.app","http://localhost:5173","https://agstamp.com"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"],
  optionsSuccessStatus: 200,
}))

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// ✅ Stripe webhook raw body
app.use("/api/v1/stripe/webhook", express.raw({ type: "application/json" }));


// ✅ JSON parser for all other routes
app.use(express.json());

console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
// ✅ Cloudinary configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Debug log to check if cookies arrive
app.use((req, res, next) => {
  console.log("Raw cookie header:", req.headers.cookie);
  console.log("Parsed cookies:", req.cookies);
  next();
});

// ✅ API routes
app.use("/api/v1", customersRoute);
app.use("/api/v1", adminRoute);
app.use("/api/v1/stripe", stripeRoutes);

// ✅ Error handling
app.use(errorHandlerMiddleware);