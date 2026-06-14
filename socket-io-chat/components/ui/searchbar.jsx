'use client'
import { SearchIcon } from 'lucide-react'
import React, { useState } from 'react'

function SearchBar({ className, search }) {

    const handleSearch = (value) => {
        search(value);
    }

    return (
        <div className='relative'>
            <p className='absolute top-2.5 left-3'>
                <SearchIcon size={20} />
            </p>
            <input
                type="search"
                placeholder='Type something to search...'
                className={className}
                onChange={(e) => handleSearch(e.target.value.trim())}
            />
        </div>
    )
}

export default SearchBar
