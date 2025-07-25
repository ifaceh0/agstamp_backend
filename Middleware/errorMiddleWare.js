export const errorHandlerMiddleware = (error, req, res, next) => {
   console.error(error.stack); // Log full error stack for debugging

    let statusCode = error.statusCode || 500;
    let message = error.message || "Internal Server Error";

    // ✅ Handle Mongoose Validation Error
    if (error.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(error.errors).map(err => err.message).join(", ");
    }

    // ✅ Handle Mongoose CastError (invalid ObjectId)
    else if (error.name === "CastError") {
        statusCode = 400;
        message = `Invalid ${error.path}: ${error.value}`;
    }

    // ✅ Handle Mongoose Duplicate Key Error
    else if (error.code === 11000) {
        statusCode = 400;
        message = `${Object.keys(error.keyValue)[0]} ${Object.values(error.keyValue)[0]} is allready in use`;
    }

    // ✅ Handle JWT Expired Token
    else if (error.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token has expired, please login again";
    }

    // ✅ Handle JWT Invalid Token
    else if (error.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token, authorization denied";
    }

    // ✅ Handle Unauthorized Error
    else if (error.name === "UnauthorizedError") {
        statusCode = 401;
        message = "Unauthorized access";
    }

    // ✅ Handle Forbidden Error
    else if (error.name === "ForbiddenError") {
        statusCode = 403;
        message = "Access forbidden";
    }

    // ✅ Handle Not Found Error
    else if (error.name === "NotFoundError") {
        statusCode = 404;
        message = "Resource not found";
    }

    // ✅ Handle other unexpected errors
    res.status(statusCode).json({
        success: false,
        error: message,
    });
};
