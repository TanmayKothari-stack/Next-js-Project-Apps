'use client';
import socket from '@/lib/socket';
import { useUser } from '@clerk/nextjs';
import axios from 'axios';
import Hashids from 'hashids';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function UserData({ userDetails }) {

    const { user, isLoaded } = useUser();
    const [location, setLocation] = useState({
        lat: null, lon: null, accuracy: null
    });

    const hashids = new Hashids(process.env.NEXT_PUBLIC_HASHIDS_SALT, 36);

    useEffect(() => {

        const loginUser = async () => {
            if (!navigator.geolocation) {
                setError('Geolocation not supported')
                return
            }

            let id = user?.id;
            let name = user?.fullName;
            let email = user?.primaryEmailAddress.emailAddress;
            let locationType;
            let phoneNumber;
            let registerDate = new Date(user?.createdAt).toLocaleString("en-GB");
            let profileImage = user?.imageUrl;

            if (!user.primaryPhoneNumber) {
                phoneNumber = 0;
            }

            if (location.accuracy <= 50) {
                locationType = "Exact";
            } else {
                locationType = "Approximate";
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    // console.log("Got position:", position);

                    setLocation({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                    });

                    const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/account/login/`, {
                        name: name,
                        email: email,
                        phone: phoneNumber,
                        lat: location?.lat,
                        lon: location?.lon,
                        location_type: locationType,
                        register_date: registerDate,
                        clerk_id: id,
                        profile_image: profileImage
                    });

                    // console.log(response.data.message);
                    localStorage.setItem("email", email);
                    const userId = hashids.encode(Number(response.data.message.id));
                    sessionStorage.setItem('user_id', userId);
                    sessionStorage.setItem('user_name', response.data.message.name);
                    userDetails(user);
                    socket.emit("user-connected", userId);
                },
                (err) => {
                    // console.error("Geolocation error:", err.code, err.message);
                    toast.error("Please allow your location Recommended - Allow while using");
                },
                {
                    enableHighAccuracy: false,
                    timeout: 30000,
                    maximumAge: 0,
                }
            );
        }

        if (isLoaded && user) {
            loginUser();
        }
    }, [isLoaded, user, userDetails]);

    return null;
}