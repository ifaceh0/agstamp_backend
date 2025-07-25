import { UserModel } from '../Model/userModel.js';
import jwt from "jsonwebtoken";
import { ErrorHandler } from '../Utils/ErrorHandler.js';
import { synchFunc } from './SynchFunc.js';

export const authorization = synchFunc(async (req,res,next)=>{
    const {agstampToken} = req.cookies;
    
    const {id} = jwt.verify(agstampToken,process.env.JWTSECRET);

    // Check if user already exists
    const existingUser = await UserModel.findById(id);
    if (!existingUser) {
        throw new ErrorHandler(400,'Invalid Token!')
    }
    req.user = existingUser;
    next();
})