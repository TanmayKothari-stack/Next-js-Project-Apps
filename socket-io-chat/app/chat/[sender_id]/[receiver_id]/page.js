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
import { Reply } from 'lucide-react';
import { ArrowDown } from 'lucide-react';
import { Eye } from 'lucide-react';
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
    const [replyMessageId, setReplyMessageId] = useState(0);
    const [viewReplyMessageState, setViewReplyMessageState] = useState(null);
    const [scroll, setScroll] = useState(false);
    const [inputMessage, setInputMessage] = useState("");

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

    // Set draft message
    useEffect(() => {
        const draftChat = JSON.parse(localStorage.getItem("draft_chat"));
        if (draftChat) {
            draftChat.map((draft, index) => {
                if (draft.receiver_id === hashids.decode(receiver_id)[0]) {
                    // console.log(draft.message);
                    setInputMessage(draft.message);
                }
            });
        }
    }, [receiver_id])

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
            // console.log(messages.data);
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
    const scrollPage = () => {
        setScroll(!scroll)
    }
    useEffect(() => {
        const t = setTimeout(() => {
            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: "auto",
            });
        }, 1000);

        return () => clearTimeout(t);
    }, [scroll]);

    const backButton = () => {
        router.back();
    }

    // Typing the message
    const handleTypeMessage = (value) => {

        if (value.trim() === "") {
            deleteDraft();
        }

        else {
            setInputMessage(value);

            const receiverId = hashids.decode(receiver_id)[0];

            const drafts = JSON.parse(localStorage.getItem("draft_chat")) || [];

            const existingIndex = drafts.findIndex(
                item => item.receiver_id === receiverId
            );

            if (existingIndex !== -1) {
                // Update existing draft
                drafts[existingIndex] = {
                    ...drafts[existingIndex],
                    message: value,
                    time: new Date().toISOString("en-IN")
                };
            } else {
                // Add new draft
                drafts.push({
                    receiver_id: receiverId,
                    message: value,
                    time: new Date().toISOString("en-IN")
                });
            }

            localStorage.setItem("draft_chat", JSON.stringify(drafts));
        }
    };

    // Deleting the draft
    const deleteDraft = () => {
        const receiverId = hashids.decode(receiver_id)[0];

        const drafts = JSON.parse(localStorage.getItem("draft_chat")) || [];

        const updatedDrafts = drafts.filter(
            draft => draft.receiver_id !== receiverId
        );

        if (updatedDrafts.length > 0) {
            localStorage.setItem(
                "draft_chat",
                JSON.stringify(updatedDrafts)
            );
        } else {
            localStorage.removeItem("draft_chat");
        }

        setInputMessage("");
    };

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

                deleteDraft();
                scrollPage();

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
                setEditMessageState(0);
                setReplyMessageId(0);
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
            setInputMessage(editMessage);
            setMoreOptionsState(false);
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
            try {
                const response = await axios.put(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/chats/update`, {
                    id: id,
                    senderId: sender_id,
                    message: message
                });
                setChatMessages(prev => [
                    ...prev, response.data
                ]);

                deleteDraft();
                scrollPage();
                setMessageItems([]);
                setEditMessageState(0);
                messageRef.current.value = "";

            } catch (error) {
                toast.error("Failed to edit message");
            }
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
                    scrollPage();
                    previousMessageIdRef.current = null;
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

    // Clear the chats
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
                scrollPage();
                setMoreOptionsState(false);
                // console.log(response.data);
            }
            catch (error) {
                toast.error("Failed to delete the messages");
            }
        }
    }

    // Copying the message
    const copyMessage = () => {
        if (messageItems.length === 0) {
            toast.warn("Please select a message");
        }
        else {
            const messageId = messageItems[0].id;
            navigator.clipboard.writeText(messageItems[0].message);
            toast.success("Message copied to clipboard");
            setMessageItems([]);
            setMoreOptionsState(false);
        }
    }

    // To view the messages
    const viewMessage = () => {
        if (messageItems.length === 0) {
            toast.warn("Please select a message");
        }
        else {
            const replyMessageId = messageItems[0].replyMessageId;
            const replyMessageOffset = messageItems[0].replyMessageOffset;
            const replyMessageDelete = messageItems[0].replyMessageDelete;
            if (Number(replyMessageDelete) === hashids.decode(sender_id)[0]) {
                toast.error("This message was deleted");
            }
            else {
                setViewReplyMessageState(replyMessageId);
                window.scrollTo({
                    top: replyMessageOffset - 200,
                    behavior: "smooth"
                });

                setTimeout(() => {
                    setViewReplyMessageState(0);
                }, 3000)
            }
            setMessageItems([]);
            setMoreOptionsState(false);

        }
    }

    // sending the reply of a message
    const replyMessage = () => {
        if (messageItems.length === 0) {
            toast.warn("Please select a message");
        }
        else {
            const messageId = messageItems[0].id;
            setReplyMessageId(messageId);
            setMoreOptionsState(false);
        }
    }

    const sendReplyMessage = async () => {
        if (messageRef.current.value.trim() === "") {
            toast.warn("Please enter a message");
        }
        else {
            try {
                const sender_name = sessionStorage.getItem('user_name');
                const id = replyMessageId;
                const message = messageRef.current.value;
                const replyMessage = messageItems[0].message;
                const replyMessageOffset = messageItems[0].replyMessageOffset;
                const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/chats/reply`, {
                    sender_id: sender_id,
                    sender_name: sender_name,
                    receiver_id: receiver_id,
                    receiver_name: userDetails?.name,
                    message: message,
                    replyMessageId: id,
                    replyMessage: replyMessage,
                    replyMessageOffset: replyMessageOffset
                });

                const audio = new Audio('/sounds/send.mp3');
                audio.play();
                toast.success("Reply sent");
                scrollPage();

                setChatMessages(prev => [
                    ...prev, response.data
                ]);

                deleteDraft();
                setInputMessage("");
                setMessageItems([]);
                setReplyMessageId(0);
                messageRef.current.value = "";
            }
            catch (error) {
                toast.error("Failed to send reply");
            }
        }
    }

    // Message operation function
    const messageOperation = () => {
        if (editMessageState !== 0) {
            sendEditMessage();
        } else if (replyMessageId !== 0) {
            sendReplyMessage();
        } else {
            sendMessage();
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
            name: "Reply",
            icon: <Reply size={20} className='text-green-400' />,
            onClick: () => {
                replyMessage();
            }
        },
        {
            name: "View",
            icon: <Eye size={20} className='text-blue-400' />,
            onClick: () => {
                viewMessage();
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
                setMessageItems([]);
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

                                    const time = new Date(chatMessages.find((message) => message.id === messageItems[0]?.id)?.time).toLocaleDateString("en-IN");
                                    const isToday = new Date().toLocaleDateString("en-IN");
                                    if (
                                        item.name === "Edit" &&
                                        (
                                            messageItems.length > 1 ||
                                            messageItems.some((msg) => msg.type === "receiver") ||
                                            time !== isToday
                                        )
                                    ) {
                                        return null;
                                    }
                                    if ((item.name === "Copy" || item.name === "Reply") && (messageItems.length > 1)) {
                                        return null;
                                    }
                                    if (
                                        item.name === "View" &&
                                        (
                                            messageItems.length > 1 ||
                                            messageItems.some((msg) => msg.replyMessageId === null)
                                        )
                                    ) {
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
                                    className={`border-0 rounded-md shadow-sm mt-3 w-full h-fit 
                                        ${messageItems.some(item => item.id === message.id) && 'bg-red-400/30 dark:bg-blue-400/30'}
                                        ${message.id === viewReplyMessageState && 'bg-green-400/30 transition-all delay-1000'}
                                        `}
                                    onClick={(e) => selectMessages({
                                        id: message.id,
                                        sender_id: sender_id,
                                        receiver_id: receiver_id,
                                        message: message.message,
                                        type: Number(message.sender_id) === hashids.decode(sender_id)[0] ? 'sender' : 'receiver',
                                        replyMessageId: message.replyed_message_id,
                                        replyMessageOffset: message.replyed_message_offset !== null ? message.replyed_message_offset : e.currentTarget.offsetTop,
                                        replyMessageDelete: message.replyed_message_deleted
                                    })}
                                >
                                    <div
                                        className={`relative w-fit max-w-1/2 flex space-x-1.5 p-2 rounded-md
                                            ${Number(message.sender_id) === hashids.decode(sender_id)[0] ? 'bg-red-400 dark:bg-blue-400 text-white ml-auto' : 'bg-white dark:bg-[#1d1c1c] mr-auto'}
                                         ${message.message.length > 10 && 'pb-4.5'} `}>
                                        <div>
                                            {message.replyed_message_id && (
                                                <p className='text-xs'>Reply of: {message.replyed_message}</p>
                                            )
                                            }
                                            <p >{message.message}</p>
                                        </div>
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
                <button className='w-fit p-1 fixed bottom-18 right-3 z-10 bg-white dark:bg-[#191919] shadow-sm rounded-full' onClick={scrollPage}>
                    <ArrowDown size={18} />
                </button>
            </div>

            <div className='border-0 fixed bottom-0 w-full p-2 flex items-center justify-between gap-1 bg-gray-100 dark:bg-[#141313]'>
                <button className='rounded-full p-1.5 shadow-sm bg-white dark:bg-[#131212] absolute left-3'>
                    <Plus size={18} />
                </button>
                <textarea placeholder='Type a message....' value={inputMessage} ref={messageRef} onChange={(e) => handleTypeMessage(e.target.value)} className='outline-none w-full p-2.5 px-2 pl-11 h-11 resize-none rounded-md shadow-md bg-white dark:bg-[#222222]'></textarea>
                <button className='rounded-full p-2.5 shadow-sm bg-white dark:bg-[#252525]' onClick={messageOperation}>
                    <Send size={18} className='text-red-600 dark:text-blue-600' />
                </button>
            </div>
        </div >
    )
}

export default Chat
