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
            const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/account`, {
                withCredentials: true
            });
            // console.log(response);
            setUsers(response.data);
            // console.log(users);

            const email = localStorage.getItem("email");
            setUserEmail(email);

            const sender_id = sessionStorage.getItem("user_id");
            setSenderId(sender_id);
        }

        socket.on("users", getUsers);

        return () => {
            socket.off("users", getUsers);
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

                    return (
                        <div key={index} className='border-0 relative p-3 shadow-md my-2 rounded-md bg-white dark:bg-[#1e1d1d]'>
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
                                        <p className='flex gap-1 text-sm font-thin'>
                                            <Mail size={15} className='relative top-0.5' />
                                            <span className='line-clamp-1 w-50 text-ellipsis'>
                                                {highlightText(user.email, search)}
                                            </span>
                                        </p>
                                    </Link>
                                </div>
                            </div>
                            <div className='absolute right-2 top-5'>
                                <Link href={`info/${senderId}/${hashids.encode(Number(user.id))}`}>
                                    <Info size={18} />
                                </Link>
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
