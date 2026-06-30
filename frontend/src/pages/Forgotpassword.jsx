import React, { useState } from 'react';
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { serverUrl } from "../App"
import { ClipLoader } from "react-spinners"

const Forgotpassword = () => {

  const [step, setstep] = useState(1)
  const [email, setemail] = useState("")
  const [otp, setotp] = useState("")
  const [password, setpassword] = useState("")
  const [confrimpassword, setconfrimpassword] = useState("")
  const [err, seterr] = useState("")
  const navigate = useNavigate()
  const [loading, setloading] = useState(false)

  const handleSendOtp = async () => {
    if (!email) {
      return seterr("Email is required.")
    }
    setloading(true)
    try {
      const result = await axios.post(`${serverUrl}/api/auth/send-otp`,{email},
        {withCredentials:true})
        console.log(result)
        seterr("")
        setloading(false)
        setstep(2)
    } catch (error) {
      seterr(error?.response?.data?.message)
      setloading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp) {
      return seterr("OTP is required.")
    }
    setloading(true)
    try {
      const result = await axios.post(`${serverUrl}/api/auth/verify-otp`,{email,otp},
        {withCredentials:true})
        console.log(result)
        seterr("")
        setloading(false)
        setstep(3)
    } catch (error) {
      seterr(error?.response?.data?.message)
      setloading(false)
    }
  } 
  
  const handleResetPassword = async () => {
    if (!password) {
      return seterr("Password is required.")
    }
    if (!confrimpassword) {
      return seterr("Confrimpassword is required.")
    }
    if(password != confrimpassword){
      return null
    }
    setloading(true)
    try {
      const result = await axios.post(`${serverUrl}/api/auth/reset-password`,{email, newpassword: password},
        {withCredentials:true})
        console.log(result)
        seterr("")
        setloading(false)
        navigate("/signin")
    } catch (error) {
      seterr(error?.response?.data?.message)
      setloading(false)
    }
  } 

  return (
    <div className='flex w-full items-center justify-center min-h-screen p-4 bg-[#fff9f6]'>
      <div className='bg-white rounded-xl shadow-lg w-full max-w-md p-8'>
        <div className='flex items-center gap-4 mb-4'>
          <IoIosArrowRoundBack size={30} className='text-[#ff4d2d] cursor-pointer' onClick={() => navigate("/signin")}/>
          <h1 className='text-2xl font-bold text-center text-[#ff4d2d]'>Forgot Password</h1>
        </div>
        {step == 1 
          && 
          <div>
            <div className='mb-6'>
                <label htmlFor="email" className="block text-gray-700 font-medium mb-1">Email</label>
                <input type="email" className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none " placeholder="Enter your Email" onChange={(e) => setemail(e.target.value)} value={email} required/>
            </div>
            <button className={`w-full font-semibold rounded-lg py-2 transitionm duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer`} onClick={handleSendOtp} disabled={loading}>
                {loading?<ClipLoader size={20} color='white'/>: "Send Otp"}
            </button>
            {err && <p className="text-red-500 text-center my-1">*{err}</p>}
          </div>}

          {step == 2
          && 
          <div>
            <div className='mb-6'>
                <label htmlFor="otp" className="block text-gray-700 font-medium mb-1">OTP</label>
                <input type="otp" className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none " placeholder="Enter OTP" onChange={(e) => setotp(e.target.value)} value={otp} required/>
            </div>
            <button className={`w-full font-semibold rounded-lg py-2 transitionm duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer`} onClick={handleVerifyOtp} disabled={loading}>
                {loading?<ClipLoader size={20} color='white'/>: "Verify"}
            </button>
            {err && <p className="text-red-500 text-center my-1">*{err}</p>}
          </div>}

          {step == 3
          && 
          <div>
            <div className='mb-6'>
                <label htmlFor="newpassword" className="block text-gray-700 font-medium mb-1">New Password</label>
                <input type="password" className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none " placeholder="Enter New Password" onChange={(e) => setpassword(e.target.value)} value={password}/>
            </div>
            <div className='mb-6'>
                <label htmlFor="confirmpassword" className="block text-gray-700 font-medium mb-1">Confirm Password</label>
                <input type="password" className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none " placeholder="Confrim Password" onChange={(e) => setconfrimpassword(e.target.value)} value={confrimpassword} required/>
            </div>
            <button className={`w-full font-semibold rounded-lg py-2 transitionm duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer`} onClick={handleResetPassword} disabled={loading}>
                {loading?<ClipLoader size={20} color='white'/>: "Reset Password"}
            </button>
            {err && <p className="text-red-500 text-center my-1">*{err}</p>}
          </div>}
      </div>
    </div>
  )
}

export default Forgotpassword;

