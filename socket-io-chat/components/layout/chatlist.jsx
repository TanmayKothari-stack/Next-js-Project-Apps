'use client';
import { Info } from 'lucide-react';
import Link from 'next/link';
import Hashids from 'hashids';
import React, { useEffect, useState } from 'react'
import { chatList } from '@/utils/db';
import { Mail } from 'lucide-react';
import axios from 'axios';
import socket from '@/lib/socket';
import Image from 'next/image';

function ChatList({ search }) {

    const [users, setUsers] = useState([]);
    const [userEmail, setUserEmail] = useState("");
    const [senderId, setSenderId] = useState(0);

    useEffect(() => {

        const getUsers = async () => {

            const id = sessionStorage.getItem('user_id');

            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/account/get-users`, {
                id: id,
                withCredentials: true
            });

            // console.log(response.data);

            setUsers(response.data);
            // console.log(users);

            const email = localStorage.getItem("email");
            setUserEmail(email);

            const sender_id = sessionStorage.getItem("user_id");
            setSenderId(sender_id);
        }

        socket.on("users", getUsers);
        socket.on("chat-message", getUsers);

        return () => {
            socket.off("users", getUsers);
            socket.off("chat-message", getUsers);
        }

    }, []);


    const filteredSearchList = users.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );

    const highlightText = (text, search) => {
        if (!search) return text;

        const regex = new RegExp(`(${search})`, "gi");
        const parts = text.split(regex);

        return parts.map((part, index) =>
            part.toLowerCase() === search.toLowerCase() ? (
                <mark key={index}>{part}</mark>
            ) : (
                part
            )
        );
    };

    const hashids = new Hashids(process.env.NEXT_PUBLIC_HASHIDS_SALT, 36);

    // Get the date
    const getDateHeader = (dateString) => {
        const date = new Date(dateString);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor(
            (today - targetDate) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";

        if (diffDays < 7) {
            return date.toLocaleDateString("en-IN", {
                weekday: "long",
            });
        }

        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <div className='p-2'>

            {search &&
                filteredSearchList.length > 1 ? (
                <p className='text-center'>
                    Found {filteredSearchList.length} results
                </p>
            ) : search && chatList.length > 0 && (
                <p className='text-center'>
                    Found {filteredSearchList.length} result
                </p>
            )}

            {users.length > 0
                ? filteredSearchList.map((user, index) => {

                    const is_me = user.email === userEmail ? '(You)' : '';

                    // Logic for displaying date
                    const currentDate = user.chats[0]?.time.split("T")[1];

                    const previousDate = index > 0 ? user.chats[index - 1]?.time.split("T")[0] : null;

                    const dateHeader = currentDate !== previousDate;

                    const headerText = getDateHeader(user.chats[0]?.time);

                    // Code for displaying the draft message
                    const draft = JSON.parse(localStorage.getItem("draft_chat"));
                    const userDraft = draft?.find(item => item.receiver_id === Number(user.id));

                    return (
                        <div key={index} className='border-0 relative p-3 flex justify-between shadow-md my-2 rounded-md bg-white dark:bg-[#1e1d1d]'>
                            <div className='border-0 flex gap-2 items-center'>
                                <Link href={`/chat/${senderId}/${hashids.encode(Number(user.id))}`}>
                                    <p className='line-clamp-1'>
                                        {user?.profile_image &&
                                            <Image src={user?.profile_image} width={35} height={35} alt={user?.name} className='rounded-full object-cover' />
                                        }
                                    </p>
                                </Link>
                                <div className='flex flex-col gap-1'>
                                    <Link href={`/chat/${senderId}/${hashids.encode(Number(user.id))}`}>
                                        {highlightText(`${user.name} ${is_me}`, search)}
                                        <div className='flex gap-1 text-sm font-thin'>
                                            {/* <Mail size={15} className='relative top-0.5' /> */}
                                            <span className='line-clamp-1 w-50 text-ellipsis'>
                                                {userDraft ? (
                                                    <p className='text-xs text-green-400'>Draft: {userDraft.message}</p>
                                                )
                                                    :
                                                    user.chats[0]?.message
                                                }
                                            </span>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                            <div className=' flex flex-col items-center'>
                                <Link href={`info/${senderId}/${hashids.encode(Number(user.id))}`}>
                                    <Info size={18} className='absolute right-2 top-2.5' />
                                </Link>
                                <div className='text-xs mt-auto'>
                                    {userDraft ? (
                                        <p className='pt-5'>{getDateHeader(userDraft?.time)}</p>
                                    ) : (
                                        dateHeader && headerText !== "Invalid Date" &&
                                        headerText
                                    )
                                    }
                                </div>
                            </div>
                        </div>
                    )
                }) : (
                    <div className='text-center'>
                        <p>No users are found</p>
                    </div>
                )
            }
        </div>
    )
}

export default ChatList
