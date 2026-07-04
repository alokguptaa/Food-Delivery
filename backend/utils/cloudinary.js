import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

const uploadOnCloudinary = async (file) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    try {
        console.log("FILE PATH:", file);
console.log("FILE EXISTS:", fs.existsSync(file));
        const result = await cloudinary.uploader.upload(file)
console.log("UPLOAD SUCCESS:", result.secure_url);
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
        }
        return result.secure_url
    } catch (error) {
        console.error("CLOUDINARY ERROR:", error);
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
        }

        console.error("Cloudinary Error:", error);
        throw error; 
    }
}

export default uploadOnCloudinary;
