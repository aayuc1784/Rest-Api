import CustomErrorHandler from "../services/CustomErrorHandler.js";
import JwtServices from "../services/JwtServices.js"

const auth=async (req,res,next)=>{
    let authHeaders = req.headers.authorization;
    if(!authHeaders){
        return next(CustomErrorHandler.unAuthorized());
    }
    // console.log(authHeaders);
    const token = authHeaders.split(' ')[1];
    // console.log(token);
    try {
        const {_id, role} = await JwtServices.verify(token);
        const user={
            _id,
            role
        }
        req.user=user;
    }
    catch(err){
        return next(CustomErrorHandler.unAuthorized());
    }
    next();
}
export default auth;