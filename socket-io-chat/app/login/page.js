'use client';
import Link from 'next/link';
import React, { useRef, useState } from 'react'
import { toast } from 'react-toastify';

function Login() {

    const emailRef = useRef("");
    const passRef = useRef("");

    const [location, setLocation] = useState(null);

    const login = async () => {

        if (emailRef.current.value.trim() === "") {
            toast.error("Please write your email");
        }

        else if (passRef.current.value.trim() === "") {
            toast.error("Please write your password");
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

                    toast.success("Login sucessfully")
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
            <div className='p-2 w-full h-65 pt-3 rounded-md shadow-md bg-gray-200/60 dark:bg-[#201f1f] flex flex-col items-center gap-3'>
                <p className='text-center font-bold'>Login Form</p>
                <input type="email" ref={emailRef} placeholder='Enter the email' className='p-2 outline-none shadow-sm rounded-md bg-white dark:bg-[#171717] w-full' />
                <input type="password" ref={passRef} placeholder='Enter the password' className='p-2 outline-none shadow-sm rounded-md bg-white dark:bg-[#171717] w-full' />
                <Link href={"/register"} className='text-red-500 underline mt-2'>
                    New user ? Signup
                </Link>
                <button className='p-2 rounded-md shadow-sm bg-red-500 text-white w-full active:scale-95 transition-all' onClick={login}>
                    Login
                </button>
            </div>
        </div>
    )
}

export default Login
