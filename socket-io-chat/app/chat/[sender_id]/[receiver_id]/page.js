'use client';
import Message from '@/components/utils/message';
import socket from '@/lib/socket';
import axios from 'axios';
import Hashids from 'hashids';
import { PhoneCall } from 'lucide-react';
import { Video } from 'lucide-react';
import { Edit } from 'lucide-react';
import { LucideTrash2 } from 'lucide-react';
import { X } from 'lucide-react';
import { Copy } from 'lucide-react';
import { Trash } from 'lucide-react';
import { Plus } from 'lucide-react';
import { Send } from 'lucide-react';
import { EllipsisVertical } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { use, useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

function Chat({ params }) {

    const router = useRouter();

    let { sender_id, receiver_id } = use(params);
    const hashids = new Hashids(process.env.NEXT_PUBLIC_HASHIDS_SALT, 36);

    const messageRef = useRef("");
    const previousMessageIdRef = useRef(null);

    const [userDetails, setUserDetails] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [isOnline, setIsOnline] = useState("Offline");
    const [moreOptionsState, setMoreOptionsState] = useState(false);
    const [messageItems, setMessageItems] = useState([]);
    const [editMessageState, setEditMessageState] = useState(0);

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

    // Fetch messages
    useEffect(() => {
        const fetchChats = async () => {
            const messages = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/chats/`, {
                params: {
                    sender_id: sender_id,
                    receiver_id: receiver_id
                }
            })

            const lastMessageId = messages.data[messages.data.length - 1]?.id;
            if (sender_id !== receiver_id) {
                // console.log(Number(messages.data[messages.data.length - 1]?.sender_id), hashids.decode(receiver_id)[0]);
                if (Number(messages.data[messages.data.length - 1]?.sender_id) === hashids.decode(receiver_id)[0]) {
                    if (previousMessageIdRef.current !== null) {
                        if (previousMessageIdRef.current !== lastMessageId) {
                            const audio = new Audio('/sounds/receive.mp3');
                            audio.play();
                            // console.log(previousMessageIdRef.current)
                            // console.log('Message arrived');
                        }
                    }
                }
            }
            previousMessageIdRef.current = lastMessageId;

            if (Number(messages.data[0]?.sender_id) === hashids.decode(sender_id)[0] && Number(messages.data[0]?.receiver_id) === hashids.decode(receiver_id)[0] || Number(messages.data[0]?.sender_id) === hashids.decode(receiver_id)[0] && Number(messages.data[0]?.receiver_id) === hashids.decode(sender_id)[0]) {
                const notification = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/notifications/`, {
                    params: {
                        receiver_id: sender_id
                    }
                });

                const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/notifications/delete`, {
                    id: hashids.encode(Number(notification.data.message?.id))
                });
            }

            setChatMessages(prev => [
                ...prev, messages.data
            ]);
            // console.log(response.data);
            setChatMessages(messages.data);
        }

        // Notification function
        const fetchNotifications = async () => {
            const notification = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/notifications/`, {
                params: {
                    receiver_id: sender_id
                }
            });
            const id = notification.data?.message?.id;
            const receiverId = notification.data?.message?.sender_id;
            const name = notification.data?.message?.sender_name;
            const message = notification.data?.message?.message;
            // console.log(notification.data.message?.sender_id, notification.data.message?.receiver_id);
            // console.log(notification.data.message?.sender_id , notification.data.message?.receiver_id);
            if (notification.data.message?.sender_id && notification.data.message?.receiver_id) {
                if (Number(notification.data.message?.sender_id) !== hashids.decode(receiver_id)[0]) {
                    const audio = new Audio('/sounds/notify.mp3');
                    audio.play();
                    toast(
                        ({ toastId }) => (
                            <Message toast={toast} toastId={toastId} id={id} receiverId={receiverId} name={name} message={message} />
                        ),
                        {
                            autoClose: 10000,
                            style: {
                                backgroundColor: "#3b82f6"
                            },
                        },
                    );
                    const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/notifications/view`, {
                        id: hashids.encode(Number(notification.data.message?.id))
                    });
                    // console.log(response.data);
                }
            }
        }

        fetchChats();
        socket.on("chat-message", fetchChats);
        socket.on("notification", fetchNotifications);

        return () => {
            socket.off("chat-message", fetchChats);
            socket.off("notification", fetchNotifications);
        }
    }, []);

    // Fetch notifications
    useEffect(() => {

        const getUserData = async () => {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/account/user-info`, {
                params: {
                    id: receiver_id
                }
            });
            // console.log(response.data);
            setUserDetails(response.data);
        }
        getUserData();
    }, []);

    useEffect(() => {
        if (messageItems.length === 0) {
            setMoreOptionsState(false);
        }
    }, [messageItems]);

    // Scrolling the page
    useEffect(() => {
        const t = setTimeout(() => {
            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: "auto",
            });
        }, 1000);

        return () => clearTimeout(t);
    }, []);

    const backButton = () => {
        router.back();
    }

    // Sending the message
    const sendMessage = async () => {
        if (messageRef.current.value.trim() === "") {
            toast.warn("Please enter a message");
        } else {
            const sender_name = sessionStorage.getItem('user_name');
            try {
                const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/chats/chat`, {
                    sender_id: sender_id,
                    sender_name: sender_name,
                    receiver_id: receiver_id,
                    receiver_name: userDetails?.name,
                    message: messageRef.current.value
                });
                const audio = new Audio('/sounds/send.mp3');
                audio.play();
                toast.success("Message sent");

                setChatMessages(prev => [
                    ...prev, response.data
                ]);
            } catch (error) {
                toast.error("Failed to send message");
            }

            const notification = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/notifications/notification`, {
                sender_id: sender_id,
                sender_name: sender_name,
                receiver_id: receiver_id,
                receiver_name: userDetails?.name,
                message: messageRef.current.value
            });

            messageRef.current.value = "";
            setMoreOptionsState(false);
            setMessageItems([]);
        }
    }

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

    // Select the messages
    const selectMessages = (message) => {
        setMessageItems((prev) => {
            const exists = prev.some((obj) => obj.id === message.id);

            if (exists) {
                const updated = prev.filter((obj) => obj.id !== message.id);
                return updated;
            }

            setMoreOptionsState(true);
            return [...prev, message];
        });
    };

    // Set edit message
    const editMessage = async () => {
        if (messageItems.length === 0) {
            toast.warn("Please select a message");
        }
        else {
            const messageId = messageItems[0].id;
            setEditMessageState(messageId);
            const editMessage = messageItems[0].message;
            messageRef.current.value = editMessage;
            setMoreOptionsState(false);
            setMessageItems((prev) => {
                const exists = prev.some((item) => item.id === messageId);
                if (exists) {
                    const updated = prev.filter((item) => item.id !== messageId);
                    return updated;
                }
            });
        }
    }

    // Send edit the message
    const sendEditMessage = async () => {
        // console.log(messageRef.current.value);
        if (messageRef.current.value.trim() === "") {
            toast.warn("Please enter a message");
        }
        else {
            const id = editMessageState;
            const message = messageRef.current.value;
            const response = await axios.put(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/chats/update`, {
                id: id,
                senderId: sender_id,
                message: message
            });
            setChatMessages(prev => [
                ...prev, response.data
            ]);
            setEditMessageState(false);
            messageRef.current.value = "";
        }
    }

    const deleteMessage = async () => {
        // console.log(messageItems);
        if (messageItems.length === 0) {
            toast.warn("Please select a message");
        }
        else {
            const confirm = await Swal.fire({
                title: "Are you sure want to delete the message ?",
                text: "This action cannot be undone.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, delete it!",
            });

            if (confirm.isConfirmed) {
                try {
                    const response = await axios.delete(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/chats/delete`, {
                        data: {
                            messages: messageItems
                        }
                    });
                    toast.success("Message deleted sucessfully");
                    setMessageItems([]);
                    setMoreOptionsState(false);
                }
                catch (error) {
                    toast.error("Failed to delete the messages");
                }
            }
            // console.log(response.data);
        }
    }

    const clearChat = async () => {
        // console.log(chatMessages);
        const confirm = await Swal.fire({
            title: "Are you sure want to clear the chat ?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
        });

        if (confirm.isConfirmed) {
            try {
                const response = await axios.delete(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/chats/clear-chat`, {
                    data: {
                        senderId: sender_id,
                        messages: chatMessages
                    }
                });
                toast.success("Messages are deleted sucessfully");
                setMoreOptionsState(false);
                // console.log(response.data);
            }
            catch (error) {
                toast.error("Failed to delete the messages");
            }
        }
    }

    const copyMessage = () => {
        if (messageItems.length === 0) {
            toast.warn("Please select a message");
        }
        else {
            const messageId = messageItems[0].id;
            navigator.clipboard.writeText(messageItems[0].message);
            toast.success("Message copied to clipboard");
            setMessageItems((prev) => {
                const exists = prev.some((item) => item.id === messageId);
                if (exists) {
                    const updated = prev.filter((item) => item.id !== messageId);
                    return updated;
                }
            });
            setMoreOptionsState(false);
        }
    }

    const moreOptions = [
        {
            name: "Edit",
            icon: <Edit size={20} className='text-green-400' />,
            onClick: () => {
                editMessage();
            }
        },
        {
            name: "Copy",
            icon: <Copy size={20} className='text-yellow-400' />,
            onClick: () => {
                copyMessage();
            }
        },
        {
            name: "Delete",
            icon: <Trash size={20} className='text-[orangered]' />,
            onClick: () => {
                deleteMessage();
            }
        },
        {
            name: "Clear Chat",
            icon: <LucideTrash2 size={20} className='text-red-500' />,
            onClick: () => {
                clearChat();
            }
        }, {
            name: "Cancel",
            icon: <X size={20} />,
            onClick: () => {
                setMoreOptionsState(false);
            }
        }
    ];

    return (
        <div>
            <header className='border-0 p-2 shadow-md flex justify-between sticky top-0 z-10 bg-white dark:bg-[#131212]'>
                <div className='border-0 flex gap-2'>
                    <div className='flex space-x-2'>
                        <ArrowLeft size={20} onClick={backButton} className='relative top-3' />
                        <p className='rounded-full shadow-md w-10 h-10 flex items-center justify-center font-semibold bg-white dark:bg-[#1f1f1f]'>
                            {userDetails?.profile_image &&
                                <Image src={userDetails?.profile_image} width={35} height={35} alt={userDetails?.name} className='rounded-full object-cover' />
                            }
                        </p>
                    </div>
                    <div>
                        <p className='text-sm line-clamp-1'>
                            {userDetails?.name}
                        </p>
                        <p className={`text-xs ${isOnline === "Online" && 'text-green-600'}`}>
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
                </div>
                <div className='flex gap-2 items-center'>
                    <button className='rounded-full w-8 h-8 p-1 flex items-center justify-center shadow-sm bg-white dark:bg-[#212020]'>
                        <PhoneCall size={15} />
                    </button>
                    <button className='rounded-full w-8 h-8 p-1 flex items-center justify-center shadow-sm bg-white dark:bg-[#212020]'>
                        <Video size={18} />
                    </button>
                    {/* More options area */}
                    {moreOptionsState && (
                        <div className='border-0 absolute w-full h-14 top-0 left-0 bg-white dark:bg-[#272525] flex items-center justify-around gap-1.5 py-2'>
                            {
                                moreOptions.map((item, index) => {
                                    if (
                                        item.name === "Edit" &&
                                        (
                                            messageItems.length > 1 ||
                                            messageItems.some((msg) => msg.type === "receiver")
                                        )
                                    ) {
                                        return null;
                                    }
                                    if (item.name === "Copy" && (messageItems.length > 1)) {
                                        return null;
                                    }
                                    return (
                                        <div
                                            key={index}
                                            className="text-sm active:bg-white/60 dark:active:bg-[#2d2c2c]"
                                            onClick={item.onClick}
                                        >
                                            <p>{item.icon}</p>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    )}
                    <button className='rounded-full w-8 h-8 p-1 flex items-center justify-center shadow-sm bg-white dark:bg-[#212020]'>
                        <EllipsisVertical size={18} onClick={() => setMoreOptionsState(!moreOptionsState)} />
                    </button>
                </div>
            </header>

            <div className='border-0 p-2 shadow-sm bg-white dark:bg-[#1f1e1e]'>
                <p className='text-center p-1 rounded-md text-xs text-amber-300'>
                    Messages to yourself are end to end encrypted. No one else, even Socket IO Chat, cannot read, listen to, or share them.
                </p>
            </div>

            <div className='p-2.5 px-3 pb-20 flex flex-col gap-3'>
                {
                    chatMessages?.map((message, index) => {

                        const currentDate = message.time.split("T")[0];
                        const previousDate =
                            index > 0 ? chatMessages[index - 1].time.split("T")[0] : null;

                        const dateHeader = currentDate !== previousDate;

                        const headerText = getDateHeader(message.time);

                        return (
                            <div key={index}>
                                {dateHeader && (
                                    <p className='text-center text-sm w-fit mx-auto p-1 px-2 rounded-md bg-white dark:bg-[#232222]'>
                                        {headerText}
                                    </p>
                                )}
                                <div
                                    className={`border-0 rounded-md shadow-sm mt-3 w-full h-fit ${messageItems.some(
                                        item => item.id === message.id) && 'bg-red-400/30 dark:bg-blue-400/30'}`}
                                    onClick={() => selectMessages({
                                        id: message.id,
                                        user_id: sender_id,
                                        message: message.message,
                                        type: Number(message.sender_id) === hashids.decode(sender_id)[0] ? 'sender' : 'receiver'
                                    })}
                                >
                                    <div
                                        className={`relative w-fit max-w-1/2 flex space-x-1.5 p-2 rounded-md
                                            ${Number(message.sender_id) === hashids.decode(sender_id)[0] ? 'bg-red-400 dark:bg-blue-400 text-white ml-auto' : 'bg-white dark:bg-[#1d1c1c] mr-auto'}
                                         ${message.message.length > 10 && 'pb-4.5'} `}>
                                        <p >{message.message}</p>
                                        <div className={`border-0 mt-auto flex flex-1 items-center justify-center space-x-1
                                        ${message.message.length > 10 && 'absolute p-1 bottom-0 right-0'}
                                        `}>
                                            {message.updated && (
                                                <p className='font-thin text-xs'>edited</p>
                                            )}
                                            <p className={`text-xs font-thin`}>
                                                {new Date(message.time).toLocaleTimeString("en-IN", {
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                    hour12: true,
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
            </div>

            <div className='border-0 fixed bottom-0 w-full p-2 flex items-center justify-between gap-1 bg-gray-100 dark:bg-[#141313]'>
                <button className='rounded-full p-1.5 shadow-sm bg-white dark:bg-[#131212] absolute left-3'>
                    <Plus size={18} />
                </button>
                <textarea placeholder='Type a message....' ref={messageRef} className='outline-none w-full p-2.5 px-2 pl-11 h-11 resize-none rounded-md shadow-md bg-white dark:bg-[#222222]'></textarea>
                <button className='rounded-full p-2.5 shadow-sm bg-white dark:bg-[#252525]' onClick={() => {
                    editMessageState === 0 ? sendMessage() : sendEditMessage()
                }}>
                    <Send size={18} className='text-red-600 dark:text-blue-600' />
                </button>
            </div>
        </div >
    )
}

export default Chat
