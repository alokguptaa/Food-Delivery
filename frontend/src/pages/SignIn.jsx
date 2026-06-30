import React, { useState } from "react";
import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase";
import { ClipLoader } from "react-spinners"
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";

const SignIn = () => {
    const primaryColor = "#ff4d2d";
    const bgColor = "#fff9f6";
    const borderColor = "#ddd";

    const [showPassword, setshowPassword] = useState(false);
    const navigate = useNavigate()
    const [email, setemail] = useState("");
    const [password, setpassword] = useState("");
    const [err, seterr] = useState("")
    const [loading, setloading] = useState(false)
    const dispatch = useDispatch()

    const serverUrl = "http://localhost:3000"

    const handleSignIn = async () => {
        if (!email) {
            return seterr("Email is required.")
        }

        if (!password) {
            return seterr("Password is required")
        }
        setloading(true)
        try {
            const result = await axios.post(`${serverUrl}/api/auth/signin`,{
                email, password
                },{withCredentials:true})
                dispatch(setUserData(result.data))
                seterr("")
                setloading(false)
        } catch (error) {
            seterr(error?.response?.data?.message)
            setloading(false)
        }
    }

    const handleGoogleAuth = async () => {
        const provider = new GoogleAuthProvider()
        const result = await signInWithPopup(auth, provider)
        try {
            const {data} = await axios.post(`${serverUrl}/api/auth/google-auth`,{
                email:result.user.email
            },{withCredentials:true})
            dispatch(setUserData(data))
        } catch (error) {
            console.log(error)
        }
    }

return (
    <div
        className="min-h-screen w-full flex items-center justify-center p-4"
        style={{ backgroundColor: bgColor }}>
        <div
            className={`bg-white rounded-xl shadow-lg w-full max-w-md p-8 border-1px`}
            style={{border: `1px solid ${borderColor}` }}>
            <h1
                className={`text-3xl font-bold mb-2`} style={{ color: primaryColor }}>
                Vingo
            </h1>
            <p className="text-gray-600 mb-8">
                SignIn your account to get startrd with delicious food deliveries
            </p>
        
            <div>
                <label htmlFor="email" className="block text-grey-700 font-medium mb-1">Email</label>
                <input type="email" className="w-full border rounded-lg px-3 py-2 focus:outline-none " placeholder="Enter your Email" style={{border: `1px solid ${borderColor}`}} onChange={(e) => setemail(e.target.value)} value={email} required/>
            </div>

            <div className="mb-4">
                <label htmlFor="password" className="block text-grey-700 font-medium mb-1">Password</label>
                <div className="relative">
                    <input type={`${showPassword?"text":"password"}`} className="w-full border rounded-lg px-3 py-2 focus:outline-none " placeholder="Enter your Password" style={{border: `1px solid ${borderColor}`}} onChange={(e) => setpassword(e.target.value)} value={password} required/>
                
                    <button className="absolute right-3 top-2.5 cursor-pointer text-gray-500" onClick={() => setshowPassword(prev=>!prev)}>{!showPassword ? < FaEye /> : < FaEyeSlash />}</button>
                </div>
            </div>

            <div className="text-right mb-4 text-[#ff4d2d] font-medium cursor-pointer" onClick={() => navigate("/forgot-password")}>
                Forgot Password
            </div>

            <button className={`w-full font-semibold rounded-lg py-2 transitionm duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer`} onClick={handleSignIn} disabled={loading}>
                {loading?<ClipLoader size={20} color="white"/>: "Sign In"} 
            </button>

            {err && <p className="text-red-500 text-center my-1">*{err}</p>}

            <button className="w-full mt-4 flex items-center justify-center gap-2 rounded-lg px-4 py-2 cursor-pointer transition duration-200 hover:bg-gray-200" style={{border: `1px solid ${borderColor}`}} onClick={handleGoogleAuth}>
                <FcGoogle size={20}/>
                <span>Sign In with Google</span>
            </button>

            <p className="text-center mt-2 cursor-pointer" onClick={() => navigate("/signup")}>
                Want to create a new acount <span className="text-[#ff4d2d]">Sign Up</span>
            </p>
        </div>

    </div>
);
};

export default SignIn;

