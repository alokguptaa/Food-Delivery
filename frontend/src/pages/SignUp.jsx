import React, { useState } from "react";
import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { auth } from "../../firebase";
import { ClipLoader } from "react-spinners"
import { GoogleAuthProvider, signInWithPopup, } from "firebase/auth"
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";

const SignUp = () => {
    const primaryColor = "#ff4d2d";
    const bgColor = "#fff9f6";
    const borderColor = "#ddd";

    const [showPassword, setshowPassword] = useState(false);
    const [role, setrole] = useState("user")
    const navigate = useNavigate()
    const [fullname, setfullname] = useState("");
    const [email, setemail] = useState("");
    const [password, setpassword] = useState("");
    const [mobile, setmobile] = useState("");
    const [err, seterr] = useState("")
    const [loading, setloading] = useState(false)
    const dispatch = useDispatch()

    const serverUrl = "http://localhost:3000"

    const handleSignUP = async () => {
        if (!fullname) {
            return seterr("Fullname is required")
        }

        if (!email) {
            return seterr("Email is required")
        }

        if (!mobile) {
            return seterr("Mobile number is required")
        }

        if (mobile.length < 10) {
            return seterr("Mobile number must be at least 10 digits")
        }

        if (!password) {
            return seterr("Password is required")
        }

        if (password.length < 6) {
            return seterr("Password must be at least 6 characters")
        }
        setloading(true)
        try {
            const result = await axios.post(`${serverUrl}/api/auth/signup`,{
                fullname, email, password, mobile, role
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
        if(!mobile) {
            return seterr("mobile number is required")
        }
        const provider = new GoogleAuthProvider()
        const result = await signInWithPopup(auth, provider)
        try {
            const {data} = await axios.post(`${serverUrl}/api/auth/google-auth`,{
                fullname:result.user.displayName,
                email:result.user.email,
                role,
                mobile,
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
                Create your account to get startrd with delicious food deliveries
            </p>
        
            <div>
                <label htmlFor="fullName" className="block text-gray-700 font-medium mb-1">Full Name</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none " placeholder="Enter your Full Name" style={{border: `1px solid ${borderColor}`}} onChange={(e) => setfullname(e.target.value)} value={fullname} required/>
            </div>
        
            <div>
                <label htmlFor="email" className="block text-gray-700 font-medium mb-1">Email</label>
                <input type="email" className="w-full border rounded-lg px-3 py-2 focus:outline-none " placeholder="Enter your Email" style={{border: `1px solid ${borderColor}`}} onChange={(e) => setemail(e.target.value)} value={email} required/>
            </div>

            <div>
                <label htmlFor="mobile" className="block text-gray-700 font-medium mb-1">Mobile</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 focus:outline-none " placeholder="Enter your Mobile Number" style={{border: `1px solid ${borderColor}`}} onChange={(e) => setmobile(e.target.value)} value={mobile} required/>
            </div>

            <div className="mb-4">
                <label htmlFor="password" className="block text-gray-700 font-medium mb-1">Password</label>
                <div className="relative">
                    <input type={`${showPassword?"text":"password"}`} className="w-full border rounded-lg px-3 py-2 focus:outline-none " placeholder="Enter your Password" style={{border: `1px solid ${borderColor}`}} onChange={(e) => setpassword(e.target.value)} value={password} required/>
                
                    <button className="absolute right-3 top-2.5 cursor-pointer text-gray-500" onClick={() => setshowPassword(prev=>!prev)}>{!showPassword ? < FaEye /> : < FaEyeSlash />}</button>
                </div>
            </div>

            <div className="mb-4">
                <label htmlFor="role" className="block text-gray-700 font-medium mb-1">Role</label>
                <div className="flex gap-3">
                    {["user", "owner", "deliveryBoy"].map((r) => (
                        <button
                        key={r} type="button"
                        className="flex-1 border rounded-lg px-3 py-2 text-center font-medium cursor-pointer transition-colors"
                        onClick={() => setrole(r)} 
                        style={role === r ? {backgroundColor:primaryColor,color:"white",}
                        :{border: `1px solid ${primaryColor}`, color:primaryColor,}}>{r}
                        </button>
                    ))}
                </div>
            </div>

            <button className={`w-full font-semibold rounded-lg py-2 transitionm duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer`} onClick={handleSignUP} disabled={loading}>
                {loading?<ClipLoader size={20} color="white"/>: "Sign Up"}
            </button>

            {err && <p className="text-red-500 text-center my-1">*{err}</p>}

            <button className="w-full mt-4 flex items-center justify-center gap-2 rounded-lg px-4 py-2 cursor-pointer transition duration-200 hover:bg-gray-200" style={{border: `1px solid ${borderColor}`}} onClick={handleGoogleAuth}>
                <FcGoogle size={20}/>
                <span>Sign Up with Google</span>
            </button>

            <p className="text-center mt-2 cursor-pointer" onClick={() => navigate("/signin")}>
                Already have a account ? <span className="text-[#ff4d2d]">Sign In</span>
            </p>
        </div>

    </div>
);
};

export default SignUp;
