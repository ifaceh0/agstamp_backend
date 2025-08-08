import { UserModel } from '../Model/userModel.js';
import jwt from "jsonwebtoken";
import { ErrorHandler } from '../Utils/ErrorHandler.js';
import { synchFunc } from './SynchFunc.js';

export const authorization = synchFunc(async (req,res,next)=>{
    console.log("Cookies received:", req.cookies); // Debug
    const {agstampToken} = req.cookies;
    if (!agstampToken) {
        console.error("❌ No token found in cookies");
        throw new ErrorHandler(401, "No token provided");
    }
    
    try {
        const { id } = jwt.verify(agstampToken, process.env.JWTSECRET);
        console.log("✅ Token verified, user ID:", id);

        const existingUser = await UserModel.findById(id);
        if (!existingUser) {
            console.error("❌ No user found for this token");
            throw new ErrorHandler(400, "Invalid Token!");
        }

        req.user = existingUser;
        next();
    } catch (err) {
        console.error("❌ JWT verification failed:", err.message);
        throw new ErrorHandler(401, "Invalid token, authorization denied");
    }
});