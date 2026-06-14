'use client';
import { Settings } from 'lucide-react';
import { User2 } from 'lucide-react';
import { Bell } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { UserButton } from '@clerk/nextjs';
import axios from 'axios';
import socket from '@/lib/socket';
import { toast } from 'react-toastify';
import Message from '@/components/utils/message';
import Hashids from 'hashids';

function Header() {

    const [notifications, setNotifications] = useState(0);

    const hashids = new Hashids(process.env.NEXT_PUBLIC_HASHIDS_SALT, 36);

    useEffect(() => {

        const fetchNotifications = async () => {

            const userId = sessionStorage.getItem('user_id');

            const UnReplyNotifications = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/notifications/get-notifications`, {
                params: {
                    receiver_id: userId
                }
            });

            setNotifications(UnReplyNotifications.data.count);

            const notification = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/notifications/`, {
                params: {
                    receiver_id: userId
                }
            });

            // console.log(notification.data);
            const id = notification.data?.message?.id;
            const receiver_id = notification.data?.message?.sender_id;
            const name = notification.data?.message?.sender_name;
            const message = notification.data?.message?.message;
            if (notification.data?.message?.sender_id && notification.data?.message.receiver_id) {
                toast(
                    ({ toastId }) => (
                        <Message toast={toast} toastId={toastId} id={id} receiverId={receiver_id} name={name} message={message} />
                    ),
                    {
                        autoClose: 10000,
                        style: {
                            backgroundColor: "#3b82f6"
                        },
                    },
                );
                const audio = new Audio('/sounds/notify.mp3');
                audio.play();
                const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/notifications/view`, {
                    id: hashids.encode(Number(notification.data.message?.id))
                });
            }
        }

        fetchNotifications();
        socket.on('notification', fetchNotifications);

        return () => {
            socket.off('notification', fetchNotifications);
        }

    }, []);

    const navButtons = [
        {
            name: "notification",
            icon: <Bell size={18} />
        },

        {
            name: "settings",
            icon: <Settings size={18} />
        },

        {
            name: "profile",
            // icon: <User2 size={18} />,
            icon: (
                <div className='w-4 h-4 flex items-center justify-center'>
                    <UserButton />
                    <User2 />
                </div >
            )
        },
    ];

    return (
        <div className='border-0 p-2.5 flex justify-between items-center'>
            <p className='text-red-600 font-semibold'>
                Socket-IO Chat
            </p>

            <div className='flex gap-2'>
                {navButtons.map((item, index) => (

                    <button key={index} className='border-0 relative p-1.5 rounded-full shadow-sm flex items-center justify-center bg-white dark:bg-[#323131]'>
                        {
                            item.name === 'notification' && notifications > 0 &&(
                                <p className='absolute -top-1 -left-1 text-[9px] w-3 h-3 rounded-full items-center justify-center text-white bg-red-500'>
                                    {notifications}
                                </p>
                            )
                        }
                        {item.icon}
                    </button>
                ))}
            </div>

        </div>
    )
}

export default Header
