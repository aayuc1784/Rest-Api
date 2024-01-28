import Joi from "joi";
import refreshToken from "../../models/refreshToken.js";
import CustomErrorHandler from "../../services/CustomErrorHandler.js";
import JwtServices from "../../services/JwtServices.js";
import { REFRESH_SECRET } from "../../config/index.js";
import { User } from "../../models/index.js";
import RefreshToken from "../../models/refreshToken.js";

const refreshController = {
    async refresh(req,res,next){
        // validate ->
        const refreshSchema = Joi.object({
            refresh_token: Joi.string().required()
        });
        const { error } = refreshSchema.validate(req.body);
        
        if(error){
            return next(error);
        }

        let refreshtoken;
        try{
            refreshtoken = await refreshToken.findOne({token: req.body.refresh_token});
            if(!refreshtoken){
                return next(CustomErrorHandler.unAuthorized('Invalid Refresh Token'));
            }

            let userId;
            try{
                const { _id } = await JwtServices.verify(refreshtoken.token, REFRESH_SECRET)
                userId = _id;
            }catch(err){
                return next(CustomErrorHandler.unAuthorized('Invalid Refresh Token'));
            }
            
            const user = User.findOne({_id : userId});
            if(!user){
                return next(CustomErrorHandler.unAuthorized('No User Found'));
            }
            const access_token=JwtServices.sign({ _id:user._id, role:user.role});
            const refresh_token=JwtServices.sign({ _id:user._id, role:user.role}, '1y',REFRESH_SECRET);
            await RefreshToken.create({ token: refresh_token});
            res.json({access_token: access_token, refresh_token: refresh_token});
        }
        catch(err){
            return next(new Error('Something went wrong') + err.message);
        }
    }
}
export default refreshController;