import Joi from "joi";
import CustomErrorHandler from "../../services/CustomErrorHandler.js";
import  { User } from '../../models/index.js'
import bcrpyt from "bcrypt";
import JwtServices from "../../services/JwtServices.js";
import { REFRESH_SECRET } from "../../config/index.js";
import RefreshToken from "../../models/refreshToken.js";

const registerController ={
    async register(req,res,next){
        // validate a request -> entered fields are correct or not 

        const registerSchema = Joi.object({
            name: Joi.string().min(3).max(30).required(),
            email: Joi.string().email().required(),
            password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
            repeat_password: Joi.ref('password') 
        });
        const { error } = registerSchema.validate(req.body);
        
        if(error){
            return next(error);
        }

        // Unique user -> 

        try{
            const exist = await User.exists({ email: req.body.email });
            if(exist){
                return next(CustomErrorHandler.alreadyExist("This email already exist"));
            }
        }catch(err){
            return next(err);
        }

        // Enter User ->
        // hashed password 
        const hashedPassword = await bcrpyt.hash(req.body.password,10);
        // console.log(hashedPassword);

        // create model ->
        const user=new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });

        let access_token;
        let refresh_token;
        try{
            const result = await user.save();
            // tokens
            access_token=JwtServices.sign({ _id:result._id, role:result.role});
            refresh_token=JwtServices.sign({ _id:result._id, role:result.role}, '1y',REFRESH_SECRET);
            await RefreshToken.create({ token: refresh_token});
        }catch(err){
            return next(err);
        }

        res.json({access_token: access_token, refresh_token: refresh_token});
    }
    
}
export default registerController;