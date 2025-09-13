import React from 'react'
import Link from 'next/link'

const Navbar = () => {
  return (
    <nav className='text-black flex items-center justify-between'>
      <h2 className='font-coolvetica text-2xl'>Worme</h2>
      <div className="flex items-center gap-10">
        <Link className='font-coolvetica relative group' href='/'>
          Home
          <span className='absolute left-0 bottom-0 w-0 h-0.5 bg-black transition-all duration-300 group-hover:w-full'></span>
        </Link>
        <Link className='font-coolvetica relative group' href='/about'>
          About
          <span className='absolute left-0 bottom-0 w-0 h-0.5 bg-black transition-all duration-300 group-hover:w-full'></span>
        </Link>
      </div>
      <Link href='/log-in' className='bg-primary font-poppins px-5 py-1 rounded-2xl relative overflow-hidden hover:scale-105 transform transition-all duration-300 group'>
        <span className='relative z-100'>Get Started</span>
        <div className='absolute inset-0 bg-[#ABE22B] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-in-out'></div>
      </Link>
    </nav>
  )
}

export default Navbar
