import { ErrorHandler } from "./ErrorHandler.js";
import { synchFunc } from "./SynchFunc.js";

export const Protected = synchFunc(async (req,_,next) => {
    if(req.user.role !== "admin")
        throw new ErrorHandler(400,'users are not allowed to access the admin routes!')
    next();
});