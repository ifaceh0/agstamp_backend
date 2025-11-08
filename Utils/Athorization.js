// import { UserModel } from '../Model/userModel.js';
// import jwt from "jsonwebtoken";
// import { ErrorHandler } from '../Utils/ErrorHandler.js';
// import { synchFunc } from './SynchFunc.js';

// export const authorization = synchFunc(async (req,res,next)=>{
//     console.log("Cookies received:", req.cookies); // Debug
//     const {agstampToken} = req.cookies;
//     if (!agstampToken) {
//         console.error("❌ No token found in cookies");
//         throw new ErrorHandler(401, "No token provided");
//     }
    
//     try {
//         const { id } = jwt.verify(agstampToken, process.env.JWTSECRET);
//         console.log("✅ Token verified, user ID:", id);

//         const existingUser = await UserModel.findById(id);
//         if (!existingUser) {
//             console.error("❌ No user found for this token");
//             throw new ErrorHandler(400, "Invalid Token!");
//         }

//         req.user = existingUser;
//         next();
//     } catch (err) {
//         console.error("❌ JWT verification failed:", err.message);
//         throw new ErrorHandler(401, "Invalid token, authorization denied");
//     }
// });

import jwt from "jsonwebtoken";
import { UserModel } from "../Model/userModel.js";
import { synchFunc } from "./SynchFunc.js";
import { ErrorHandler } from "./ErrorHandler.js";

export const authorization = synchFunc(async (req, res, next) => {
    // ✅ Try to get token from multiple sources (cookie OR Authorization header)
    let token = null;
    
    // 1. Try cookie first (preferred method)
    if (req.cookies && req.cookies.agstampToken) {
        token = req.cookies.agstampToken;
        console.log("✅ Token found in cookie");
    }
    
    // 2. Fallback to Authorization header
    if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7); // Remove 'Bearer ' prefix
            console.log("✅ Token found in Authorization header");
        }
    }
    
    // 3. No token found anywhere
    if (!token) {
        console.log("❌ No token found in cookies or headers");
        throw new ErrorHandler(401, "Authentication required. Please login.");
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWTSECRET);
        
        // Get user from database
        const user = await UserModel.findById(decoded.id).select("-password");
        
        if (!user) {
            throw new ErrorHandler(401, "User not found. Please login again.");
        }
        
        // Attach user to request
        req.user = user;
        next();
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new ErrorHandler(401, "Invalid token. Please login again.");
        }
        if (error.name === 'TokenExpiredError') {
            throw new ErrorHandler(401, "Session expired. Please login again.");
        }
        throw error;
    }
});