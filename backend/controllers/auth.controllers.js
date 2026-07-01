import User from "../models/user.model.js";
import bcrypt from "bcryptjs"
import gentoken from "../utils/token.js";
import { sendOtpMail } from "../utils/mail.js";
import Shop from "../models/shop.model.js";
import { EVENTS } from "../constants/events.js";

export const signUp = async (req, res) => {
    try {
        const {fullname, email, password, mobile, role} = req.body;
        let user = await User.findOne({email})

        if(user){
            return res.status(400).json({message:"User already exist."})
        }
        if(password.length<6){
            return res.status(400).json({message:"Password must be at least 6 characters."})
        }
        if(mobile.length<10){
            return res.status(400).json({message:"Mobile Number must be at least 10 digits."})
        }

        const hashedPassword = await bcrypt.hash(password, 6)
        user = await User.create({
            fullname,
            email,
            role,
            mobile,
            password:hashedPassword
        })

        const token = await gentoken(user._id)
        
        res.cookie("token",token,{
            secure:true,
            sameSite:"none",
            maxAge:7*24*60*60*1000,
            httpOnly:true
        })

        return res.status(201).json(user)

    } catch (error) {
        return res.status(500).json({
            message: `sign up error ${error.message}`
        })
    }
}

export const signIn = async (req, res) => {
    try {
        const {email, password} = req.body
        
        const user = await User.findOne({email})

        if(!user){
            return res.status(400).json({message:"User does not exist."})
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if(!isMatch){
            return res.status(400).json({message:"incorrect Password"})
        }

        const token = await gentoken(user._id)

        res.cookie("token",token,{
            secure:true,
            sameSite:"none",
            maxAge:7*24*60*60*1000,
            httpOnly:true
        })

        const io = req.app.get("io");

        const shop = await Shop.findOne({ owner: user._id });

        if (shop) {
            shop.isOpen = true;
            await shop.save();

            io.to(shop.city).emit(EVENTS.SHOP_STATUS_CHANGED, {
                shopId: shop._id,
                isOpen: true
            });
        }

        const { password: _, ...safeUser } = user._doc;

        return res.status(200).json( safeUser );

    } catch (error) {
        console.log("SIGNIN ERROR:", error);
        return res.status(500).json(`sign In error ${error}`)
    }
}

export const signOut =async (req, res) => {
    try {
        const io = req.app.get("io");

        const user = await User.findByIdAndUpdate(
            req.userId,
            {
                isOnline: false,
                socketId: null
            },
            {
                returnDocument: "after"
            }
        );
        if(user.role === "deliveryBoy"){
        io.emit(EVENTS.DELIVERY_BOY_STATUS_CHANGED, {
            userId: user._id,
            isOnline: false
        });
        }

        const shop = await Shop.findOne({ owner: req.userId });
        
        if (shop) {
            shop.isOpen = false;
            await shop.save();
        
            io.to(shop.city).emit(EVENTS.SHOP_STATUS_CHANGED, {
                shopId: shop._id,
                isOpen: false
            });
        }
        
        res.clearCookie("token");
        return res.status(200).json({
            message: "log out successfully"
        });

        res.clearCookie("token");

        return res.status(200).json({message:"log out successfully"})
    } catch (error) {
        return res.status(500).json(`sign out error ${error}`)
    }
}

export const sendOtp = async (req, res) => {
    try {
        const {email} = req.body
        const user = await User.findOne({email})
        if(!user){
            return res.status(400).json({message:"User does not exist."})
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString()
        user.resetOtp = otp
        user.otpExpires = Date.now() + 5 * 60 * 1000
        user.isOtpVerified = false
        await user.save()
        await sendOtpMail(email, otp)
        return res.status(200).json({message:"otp sent successfully"})
    } catch (error) {
        return res.status(500).json(`send otp error ${error}`)
    }
}

export const verifyOtp = async (req, res) => {
    try {
        const {email, otp} = req.body
        const user = await User.findOne({email})
        if(!user || user.resetOtp != otp || user.otpExpires < Date.now()){
            return res.status(400).json({message: "invalid/expired otp"})
        }
        user.isOtpVerified = true
        user.resetOtp = undefined
        user.otpExpires = undefined
        await user.save()
        return res.status(200).json({message:"Otp verify successfully"})
    } catch (error) {
        return res.status(400).json(`verify otp error ${error}`)
    }
}

export const resetPassword = async (req, res) => {
    try {
        const {email, newpassword} = req.body
        const user = await User.findOne({email})
    if(!user || !user.isOtpVerified){
        return res.status(400).json({message:"otp verification required"})
    }
    const hashedPassword = await bcrypt.hash(newpassword,10)
    user.password = hashedPassword
    user.isOtpVerified = false
    await user.save()
    return res.status(200).json({message:"password reset successfully"})
    } catch (error) {
        return res.status(400).json(`reset password error ${error}`)
    }
}

export const googleAuth = async (req, res) => {
    try {
        const {fullname, email, mobile, role} = req.body
        let user = await User.findOne({email})
        if(!user){
            user = await User.create({
                fullname, email, mobile, role
            })
        }

        const token = await gentoken(user._id)
        res.cookie("token",token,{
            secure:true,
            sameSite:"none",
            maxAge:7*24*60*60*1000,
            httpOnly:true
        })

        return res.status(200).json(user)
    } catch (error) {
        return res.status(400).json(`googleAuth error ${error}`)
    }
} 
