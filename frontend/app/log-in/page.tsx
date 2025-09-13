"use client";
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogIn } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const Page = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  useEffect(()=>{
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        router.push('/chat/new');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async ()=>{
    setErrorMessage('');

    // Validation
    if (!email.trim()) {
      setErrorMessage('Email is required');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    try{
      const user = await LogIn(email, password);
      setUser(user);
      router.push('/chat/new');
    } catch(err){
      console.log(err);
      setErrorMessage('Incorrect information');
    }
  }

  return (
    <div className='mx-10 bg-background h-screen flex flex-col'>
      <nav className='pt-9 pb-4'>
        <Link href='/' className='font-coolvetica text-2xl'>Worme</Link>
      </nav>
      <div className="flex flex-col items-center justify-center flex-1 gap-4 -mt-8">
        <h2 className='font-zt-formom text-5xl'>Welcome back</h2>
        <h3 className='font-inter font-medium'>Email</h3>
        <input onChange={(event)=> setEmail(event.target.value)} type="text" className='bg-[#F4F4F4] w-70 h-8 rounded-md px-2 py-1 focus:outline-none' />
        <h3 className='font-inter font-medium'>Password</h3>
        <input onChange={(event)=> setPassword(event.target.value)} type="password" className='bg-[#F4F4F4] w-70 h-8 rounded-md px-2 py-1 focus:outline-none' />
        {errorMessage && (
          <p className='font-inter text-sm text-red-600'>{errorMessage}</p>
        )}
        <p className='font-inter text-sm'>Don't have an account? <Link className='hover:text-gray-500' href='/sign-up'>Sign up</Link></p>
        <button onClick={()=> handleLogin()} href='/chat/new' className='bg-primary font-poppins w-70 text-center px-5 py-1 rounded-2xl hover:cursor-pointer'>
            Continue
        </button>
      </div>
    </div>
  )
}

export default Page
