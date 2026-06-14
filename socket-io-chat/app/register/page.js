'use client';
import Link from 'next/link'
import { useRouter } from 'next/navigation';
import React, { useRef, useState } from 'react'
import { toast } from 'react-toastify'

function Register() {

    const nameRef = useRef("");
    const emailRef = useRef("");
    const passRef = useRef("");
    const conpassRef = useRef("");
    const phoneRef = useRef("");

    const [location, setLocation] = useState(null);
    const router = useRouter();

    const register = async () => {

        if (nameRef.current.value.trim() === "") {
            toast.error("Please write your name");
        }

        else if (emailRef.current.value.trim() === "") {
            toast.error("Please write your email");
        }

        else if (passRef.current.value.trim() === "") {
            toast.error("Please write your password");
        }

        else if (conpassRef.current.value.trim() === "") {
            toast.error("Please write your conform password");
        }

        else if (conpassRef.current.value.trim() !== passRef.current.value.trim()) {
            toast.error("Password and Conform password doesn't match");
        }

        else {

            if (!navigator.geolocation) {
                alert("Geolocation is not supported");
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });

                    toast.success("Register sucessfully");
                    router.push("/login");
                },
                (error) => {
                    // console.error(error);
                    toast.error("Please allow your location always allow recomended");
                }
            );
        }
    }

    return (
        <div className='border-0 h-screen flex flex-col items-center justify-center p-2 px-4'>
            <div className='p-2 w-full h-102 pt-3 rounded-md shadow-md bg-gray-200/60 dark:bg-[#201f1f] flex flex-col items-center gap-3'>
                <p className='text-center font-bold'>Registration Form</p>
                <input type="text" ref={nameRef} placeholder='Enter the name' className='p-2 outline-none shadow-sm rounded-md bg-white dark:bg-[#171717] w-full' />
                <input type="email" ref={emailRef} placeholder='Enter the email' className='p-2 outline-none shadow-sm rounded-md bg-white dark:bg-[#171717] w-full' />
                <input type="password" ref={passRef} placeholder='Enter the password' className='p-2 outline-none shadow-sm rounded-md bg-white dark:bg-[#171717] w-full' />
                <input type="password" ref={conpassRef} placeholder='Enter the conform password' className='p-2 outline-none shadow-sm rounded-md bg-white dark:bg-[#171717] w-full' />
                <input type="number" ref={phoneRef} placeholder='Enter the phone number (Optional)' className='p-2 outline-none shadow-sm rounded-md bg-white dark:bg-[#171717] w-full' />
                <Link href={"/login"} className='text-red-500 underline mt-2'>
                    Already register ? Login
                </Link>
                <button className='p-2 rounded-md shadow-sm bg-red-500 text-white w-full active:scale-95 transition-all' onClick={register}>
                    Register
                </button>
            </div>
        </div>
    )
}

export default Register
