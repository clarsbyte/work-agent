"use client";
import React, { useState } from 'react'
import Link from 'next/link'
import { SignUp, LogOut } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

const Page = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const router = useRouter();

  const handleSignUp = async () => {
    try {
      const user = await SignUp(email, password, name);
      console.log('User created:', user);
      // Log out the user immediately after account creation for security
      await LogOut();
      router.push('/log-in');
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <div className='mx-10 bg-background h-screen flex flex-col'>
      <nav className='pt-9 pb-4'>
        <Link href='/' className='font-coolvetica text-2xl'>Worme</Link>
      </nav>
      <div className="flex flex-col items-center justify-center flex-1 gap-3 -mt-8">
        <h2 className='font-zt-formom text-5xl'>Create your account</h2>
        <h3 className='font-inter font-medium'>Name</h3>
        <input onChange={(event) => setName(event.target.value)} type="text" className='bg-[#F4F4F4] w-70 h-8 rounded-md px-2 py-1 focus:outline-none' />
        <h3 className='font-inter font-medium'>Email</h3>
        <input onChange={(event) => setEmail(event.target.value)} type="email" className='bg-[#F4F4F4] w-70 h-8 rounded-md px-2 py-1 focus:outline-none' />
        <h3 className='font-inter font-medium'>Password</h3>
        <input onChange={(event) => setPassword(event.target.value)} type="password" className='bg-[#F4F4F4] w-70 h-8 rounded-md px-2 py-1 focus:outline-none' />
        <p className='font-inter text-sm'>Already have an account? <Link className='hover:text-gray-500' href='/log-in'>Log in</Link></p>
        <button onClick={() => handleSignUp()} className='bg-primary font-poppins w-70 text-center px-5 py-1 rounded-2xl hover:cursor-pointer'>
            Continue
        </button>
      </div>
    </div>
  )
}

export default Page
