import { DEBUG_MODE } from "../config/index.js";
import pkg from 'joi';
const {ValidationError} = pkg;
import CustomErrorHandler from "../services/CustomErrorHandler.js";

const errorHandler = (err,req,res,next) => {
    let statusCode = 500;

    let data ={
        message: "Server Error",
        ...(DEBUG_MODE === "true" && {originalError: err.message})
    }

    if(err instanceof ValidationError){
        statusCode = 422  // if validation error 
        data={
            message: err.message
        }
    }

    if(err instanceof CustomErrorHandler){
        statusCode=err.status;
        data={
            message: err.message
        }
    }

    return res.status(statusCode).json(data);
}

export default errorHandler;