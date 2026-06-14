'use client';
import Message from '@/components/utils/message';
import React, { useState } from 'react'
import { toast } from 'react-toastify'

function MessageToast() {

    const [replyMessage, setReplyMessage] = useState("");

    let toastId = null;

    const handleReplyMessage = (message) => {
        setReplyMessage(message);
    }

    const showToast = () => {
        toast(
            <Message toast={toast} toastId={toastId} message={handleReplyMessage} />
            , {
                autoClose: true,
                style: {
                    backgroundColor: "#3b82f6"
                }
            }
        );
    }

    return (
        <div>
            <p>{replyMessage}</p>
            <button className='p-1.5 rounded-md bg-red-600 cursor-pointer' onClick={showToast}>Show Toast</button>
        </div>
    )
}

export default MessageToast
