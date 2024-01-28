import Joi from "joi";
import { User } from "../../models/index.js";
import CustomErrorHandler from "../../services/CustomErrorHandler.js";
import bcrpyt from "bcrypt";
import JwtServices from "../../services/JwtServices.js";
import RefreshToken from "../../models/refreshToken.js";
import { REFRESH_SECRET } from "../../config/index.js";



const loginController={
    async login(req,res,next){
        // validate ->
        const loginSchema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required()
        });
        const { error } = loginSchema.validate(req.body);
        
        if(error){
            return next(error);
        }
        // find user
        let user;
        try{
            user = await User.findOne( { email: req.body.email });

            if(!user){
                return next(CustomErrorHandler.wrongCredentials());
            }
            const match = await bcrpyt.compare(req.body.password,user.password);
            if(!match){
                return next(CustomErrorHandler.wrongCredentials());
            }
        }catch(err){
            return next(err);
        }
        const access_token=JwtServices.sign({ _id:user._id, role:user.role});
        const refresh_token=JwtServices.sign({ _id:user._id, role:user.role}, '1y',REFRESH_SECRET);
        await RefreshToken.create({ token: refresh_token});
        res.json({access_token: access_token, refresh_token: refresh_token});
    },
    async logout(req,res,next){

        const refreshSchema = Joi.object({
            refresh_token: Joi.string().required()
        });
        const { error } = refreshSchema.validate(req.body.refresh_token);
        
        if(error){
            return next(error);
        }

        try{
            await RefreshToken.deleteOne({token: req.body.refresh_token});
        }
        catch(err){
            return next(new Error('Something went wrong in the database'));
        }
        res.json("logout");
    }
};

export default loginController;