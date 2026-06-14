'use client';

import React, { useRef } from 'react'
import { Info } from 'lucide-react';
import Hashids from 'hashids';
import axios from 'axios';
import { useRouter } from 'next/navigation';

function Message({ toast, toastId, id, receiverId, name, message }) {

    const replyMessageRef = useRef();

    const hashids = new Hashids(process.env.NEXT_PUBLIC_HASHIDS_SALT, 36);
    const router = useRouter();

    const sender_id = sessionStorage.getItem('user_id');
    const sender_name = sessionStorage.getItem('user_name');
    const receiver_id = hashids.encode(Number(receiverId));

    const sendReply = async () => {
        if (replyMessageRef.current.value.trim() !== "") {
            const message = replyMessageRef.current.value;

            const chats = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/chats/chat`, {
                sender_id: sender_id,
                sender_name: sender_name,
                receiver_id: receiver_id,
                receiver_name: name,
                message: message
            });


            const notification = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/notifications/delete`, {
                id: hashids.encode(Number(id))
            });

            // console.log(`sender_id: ${sender_id},  sender_name: ${sender_name}, receiverId: ${receiver_id}, receiverName: ${name}, reply: ${message}`);
            toast.dismiss(toastId);
        }
    }

    const viewNotification = async () => {
        const notification = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/notifications/view`, {
            id: hashids.encode(Number(id))
        });

        // console.log(sender_id, receiver_id);
        router.push(`/chat/${sender_id}/${receiver_id}`);
        toast.dismiss(toastId);
    }

    return (
        <div className="flex flex-col gap-2 w-full text-white">
            <span className='flex space-x-2'>
                <p className='pt-0.5'>
                    <Info size={18} />
                </p>
                <p> New Message - {message} | from - {name} </p>
            </span>

            <button className="p-1 px-3 bg-green-500 shadow-md rounded-md text-white cursor-pointer" onClick={viewNotification}>
                View
            </button>

            <div className="flex items-center gap-2">
                <input
                    type="text"
                    placeholder="Enter the message"
                    className="flex-1 p-2 bg-white outline-none rounded-md text-black min-w-0 shadow-sm"
                    ref={replyMessageRef}
                />

                <button
                    className="shrink-0 p-1 px-3 mt-1 bg-red-500 shadow-md rounded-md text-white cursor-pointer"
                    onClick={sendReply}
                >
                    Reply
                </button>
            </div>

        </div>
    )
}

export default Message
