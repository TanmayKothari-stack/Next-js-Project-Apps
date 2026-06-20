'use client';
import React, { use, useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PhoneCall } from 'lucide-react';
import { Video } from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import { EllipsisVertical } from 'lucide-react';
import { Phone } from 'lucide-react';
import { Mail } from 'lucide-react';
import { Copy } from 'lucide-react';
import { User } from 'lucide-react';
import { Locate } from 'lucide-react';
import { Clock } from 'lucide-react';
import { Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import { Upload } from 'lucide-react';
import { MapPin } from 'lucide-react';
import axios from 'axios';
import Image from 'next/image';
import socket from '@/lib/socket';

function Info({ params }) {

    let { sender_id } = use(params);
    let { receiver_id } = use(params);

    const [userDetails, setUserDetails] = useState([]);
    const [latitude, setLatitude] = useState(0);
    const [longitude, setLontitude] = useState(0);
    const [location, setLocation] = useState([]);
    const [isOnline, setIsOnline] = useState("Offline");

    // Check online status
    useEffect(() => {
        const checkOnline = () => {
            socket.emit("check-user", receiver_id, (online) => {
                online && setIsOnline("Online");
            });
        }

        socket.on("user-online", checkOnline);
        socket.on("user-offline", () => {
            setIsOnline("Offline");
        });

        const interval = setInterval(checkOnline, 1000);

        return () => {
            socket.off("user-online", checkOnline);
            socket.off("user-offline");
            clearInterval(interval);
        }
    }, [isOnline]);

    useEffect(() => {

        const getUserData = async () => {

            const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/account/user-info`, {
                params: {
                    id: receiver_id
                }
            });

            // console.log(response.data);
            setUserDetails(response.data);

            setLatitude(response.data?.location?.x);
            setLontitude(response.data?.location?.y);
        }

        // console.log(latitude, lontitude);

        getUserData();

    }, []);

    useEffect(() => {
        if (!latitude || !longitude) return;

        const getLocation = async () => {
            try {
                const response = await axios.get(
                    "https://nominatim.openstreetmap.org/reverse",
                    {
                        params: {
                            format: "json",
                            lat: latitude,
                            lon: longitude,
                            "accept-language": "en",
                        },
                    }
                );

                // console.log(response.data);
                setLocation(response.data);
            } catch (error) {
                console.error(error);
            }
        };

        getLocation();
    }, [latitude, longitude]);

    const router = useRouter();
    const back = () => {
        router.back();
    }

    const contactButtons = [
        {
            name: "call",
            icon: <PhoneCall size={20} />,
            onClick: () => {
                alert("Phone call");
            }
        },

        {
            name: "video",
            icon: <Video />,
            onClick: () => {
                alert("Video Call");
            }
        },

        {
            name: "chat",
            icon: <MessageCircle size={20} />,
            onClick: () => {
                router.push(`/chat/${sender_id}/${receiver_id}`);
            }
        },
    ];

    const contactUI = [
        {
            name: "User name",
            leftIcon: <User size={18} />,
            rightIcon: <Copy size={18} />,
            onClick: async () => {
                await navigator.clipboard.writeText(name);
                toast.success("Copied to clipboard");
            },
            value: userDetails?.name
        },
        {
            name: "Email address",
            leftIcon: <Mail size={18} />,
            rightIcon: <Upload size={18} />,
            value: (
                <span className='w-50 block truncate'>{userDetails.email}</span>
            ),
            onClick: () => {
                window.location.href = `mailto:${userDetails.email}`;
            }
        },
        {
            name: "Phone",
            leftIcon: <Phone size={18} />,
            rightIcon: <Phone size={18} />,
            onClick: () => {
                window.location.href = `tel:${userDetails.phone}`
            },
            value: userDetails.phone === 0 || userDetails.phone === "0" ? "Not mentioned" : userDetails.phone
        },
        {
            name: `Last location (${userDetails.location_type})`,
            leftIcon: <MapPin size={18} />,
            rightIcon: <Locate size={18} />,
            value: location.display_name,
            onClick: () => {
                location.display_name ? window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, "_blank")
                    :
                    toast.warn("No location is there");
            }
        },
        {
            name: "Last Login",
            leftIcon: <Clock size={18} />,
            rightIcon: <Clock size={18} />,
            value: new Date(userDetails.login_date).toLocaleString("en-GB"),
        },
        {
            name: "Joined",
            leftIcon: <Calendar size={18} />,
            rightIcon: <Calendar size={18} />,
            value: new Date(userDetails.register_date).toLocaleString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "numeric",
                minute: "numeric",
                second: "numeric"
            })
        },
    ];

    return (
        <div className='border-0 h-screen'>
            <div className='p-4 shadow-sm flex justify-between bg-white dark:bg-[#232222] sticky top-0 z-10'>
                <ArrowLeft onClick={back} size={20} />
                <EllipsisVertical onClick={() => router.push("/")} size={20} className='rotate-90' />
            </div>
            <div className='border-0 pb-2 mt-2 flex flex-col items-center gap-3'>
                <p className='border-0 w-30 h-30 rounded-full flex items-center justify-center text-2xl font-bold shadow-md text-center bg-white dark:bg-[#202020] '>
                    {userDetails?.profile_image ? (
                        <span className="relative w-28 h-28">
                            <Image
                                src={userDetails?.profile_image}
                                alt="Image"
                                fill
                                className="object-cover rounded-full"
                            />
                        </span>
                    ) :
                        userDetails?.name?.charAt(0)
                    }
                </p>
                <div className='text-center'>
                    <p className='text-xl'>{userDetails?.name}</p>
                    <p className={`text-sm ${isOnline === "Online" && 'text-green-600'}`}>
                        {
                            isOnline === "Online" ? isOnline
                                : (
                                    <span>Last seen: {
                                        new Date(userDetails?.last_seen).toLocaleString("en-IN", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: true,
                                        })
                                    }</span>
                                )
                        }
                    </p>
                </div>
                <div className='flex gap-5'>
                    {contactButtons.map((button, index) => (

                        <button key={index} className='shadow-md rounded-md p-2 text-red-600 dark:text-blue-600 bg-white dark:bg-[#1c1b1b]' onClick={button.onClick}>
                            {button.icon}
                        </button>
                    ))}
                </div>
            </div>
            <p className='text-center font-semibold border-b pb-2 mt-2'>Contact Information</p>
            <div className='border-0 relative p-4 flex flex-col gap-2'>
                {
                    contactUI.map((item, index) => (
                        <div key={index} className='flex items-center justify-between shadow-sm rounded-md p-2 gap-2 bg-white dark:bg-[#171616]'>
                            <div className='border-0 flex items-center gap-5'>
                                <p className='border-0 p-2 rounded-md shadow-sm text-red-600 dark:text-blue-600 bg-white dark:bg-[#212121]'>
                                    {/* {item.leftIcon} */}
                                    {item.leftIcon}
                                </p>
                                <div>
                                    <p>{item.name}</p>
                                    <p className='text-sm'>{item.value}</p>
                                </div>
                            </div>
                            <button
                                className='border-0 p-2 rounded-md shadow-sm bg-white dark:bg-[#212121]'
                                onClick={item.onClick}
                            >
                                {item.rightIcon}
                            </button>
                        </div>
                    ))}
            </div>
        </div >
    )
}

export default Info
