'use client';
import ChatList from '@/components/layout/chatlist';
import Header from '@/components/layout/header';
import SearchBar from '@/components/ui/searchbar';
import UserData from '@/components/utils/userData';
import React, { useState } from 'react'

function Home() {

  const [searchQuery, setSearchQuery] = useState("");
  const [userDetails, setUserDetails] = useState([]);

  const handleSearch = (search) => {
    setSearchQuery(search);
    // console.log(search);
  }

  const handleUserDeatils = (details) => {
    setUserDetails(details);
    localStorage.setItem("profileImage", userDetails?.imageUrl);
  }

  return (
    <>
      <header className='sticky top-0 z-10 shadow-sm pb-2 flex flex-col bg-gray-100 dark:bg-[#212020]'>
        <Header />
        <div className='border-0 px-1'>
          <SearchBar className={'outline-none p-2 px-3 w-full mx-auto rounded-2xl shadow-md pl-10 bg-white dark:bg-[#3b3939]'} search={handleSearch} />
        </div>
        <UserData userDetails={handleUserDeatils} />
      </header>

      <div>
        <ChatList search={searchQuery} />
      </div>
    </>
  );
}

export default Home
