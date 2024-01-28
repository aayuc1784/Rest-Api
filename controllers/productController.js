import path from 'path';
import Product from '../models/product.js';
import multer from 'multer';
import CustomErrorHandler from '../services/CustomErrorHandler.js';
import Joi from 'joi';
import fs from 'fs';
import { APP_URL } from '../config/index.js';

const storage = multer.diskStorage({
    destination: (req,file,cb) => cb(null,"uploads/"),
    filename: (req,file,cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random()*1E9)}${path.extname(file.originalname)}`;
        cb(null,uniqueName);
    }
});

const handleMultipleFormData = multer({storage, limits:{fileSize:5000000 }}).single('image');

const productController ={
    async store(req,res,next){  
        handleMultipleFormData(req,res,async (err)=>{
            if(err){
                return next(CustomErrorHandler.serverError(err.message));
            }
            let filePath=req.file.path;
            const productSchema = Joi.object({
                name: Joi.string().required(),
                price: Joi.number().required(),
                size: Joi.string().required()
            });
            const { error } = productSchema.validate(req.body);
            
            if(error){
                fs.unlink(`${appRoot}/${filePath}`, (err)=>{
                    if(err)
                    return next(CustomErrorHandler.serverError(err.message));
                });

                return next(error);
            }
            const {name, price, size } = req.body;

            let document;

            try{
                document = await Product.create({
                    name,
                    price,
                    size,
                    image: filePath
                })
            }
            catch(err){
                return next(err);
            }

            res.status(201).json({document});
        });
    },
    async update(req,res,next){
        handleMultipleFormData(req,res,async (err)=>{
            if(err){
                return next(CustomErrorHandler.serverError(err.message));
            }
            let filePath;
            if(req.file)
            filePath = req.file.path;
            
            const productSchema = Joi.object({
                name: Joi.string().required(),
                price: Joi.number().required(),
                size: Joi.string().required()
            });
            const { error } = productSchema.validate(req.body);
            
            if(error){
                if(req.file){
                fs.unlink(`${appRoot}/${filePath}`, (err)=>{
                    if(err)
                    return next(CustomErrorHandler.serverError(err.message));
                });
            }
                return next(error);
            }
            const {name, price, size } = req.body;

            let document;

            try{
                document = await Product.findOneAndUpdate({_id:req.params.id}, {
                    name,
                    price,
                    size,
                    ...(req.file && { image : filePath})
                }, {new : true})
            }
            catch(err){
                return next(err);
            }

            res.status(201).json({document});
        });
    },
    async destroy(req,res,next){
        const document = await Product.findOneAndDelete({_id: req.params.id});
        if(!document){
            return next(new Error("Nothing to delete"));
        }
        const imagePath = document.image;
        fs.unlink(`${appRoot}/${imagePath}`, (err)=>{
            if(err){
                return next(CustomErrorHandler.serverError());
            }
        });
        res.json(document);
    },
    async index(req,res,next){
        let documents;
        try{
        documents = await Product.find().select('-createdAt -__v -updatedAt');
        } catch(err){
            return next(CustomErrorHandler.serverError());
        }
        let size = documents.length;
        for(let i=0;i<size;i++){
            let currURL = documents[i].image;
            //console.log(currURL);
            let id='',ok=0;
            for(let i=0;i<currURL.length;i++){
                if(currURL[i]==='\\'){
                    ok=1;
                }
                else if(ok){
                    id+=currURL[i];
                }
            }
            // console.log(id);
            currURL=`uploads/${id}`;
            // console.log(currURL);
            documents[i].image=`${APP_URL}/${currURL}`;
        }
        res.json(documents);
    },
    async show(req,res,next){
        let documents;
        try{
        documents = await Product.findOne({_id : req.params.id}).select('-createdAt -__v -updatedAt');
        } catch(err){
            return next(CustomErrorHandler.serverError());
        }
        let currURL = documents.image;
        //console.log(currURL);
        let id='',ok=0;
        for(let i=0;i<currURL.length;i++){
            if(currURL[i]==='\\'){
                ok=1;
            }
            else if(ok){
                id+=currURL[i];
            }
        }
        // console.log(id);
        currURL=`uploads/${id}`;
        // console.log(currURL);
        documents.image=`${APP_URL}/${currURL}`;
        res.json(documents);
        }
}
export default productController;