import React from 'react'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import Footer from '@/components/Footer'

const page = () => {
  return (
    <div className='background bg-background mx-10 mt-9 relative min-h-screen'>
      <Navbar/>
      <div className="hero h-screen flex justify-between -mt-7 items-center gap-16">
        <div className="left-content flex-1">
          <h1 className='font-zt-formom text-5xl leading-tight'>Made for you to focus on the <br /><span className='italic'>important</span> things.</h1>
          <p className='font-inter mt-6 text-lg text-gray-700 leading-relaxed'>Integrated with Gmail and Google Calendar, Worme can help you send emails and schedule meetings all in under a minute, helping you focus on important work that you have.</p>

          <div className="features mt-12 space-y-6">
            <div className="feature flex items-center gap-4">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <span className="font-inter text-gray-600">AI-powered email composition</span>
            </div>
            <div className="feature flex items-center gap-4">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <span className="font-inter text-gray-600">Automatic meeting scheduling</span>
            </div>
            <div className="feature flex items-center gap-4">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <span className="font-inter text-gray-600">Seamless Google integration</span>
            </div>
            <div className="feature flex items-center gap-4">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <span className="font-inter text-gray-600">Chatbot for general usage</span>
            </div>
          </div>
        </div>

        <div className="right-content flex-1">
          <div className="video-container bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
            <h2 className="font-zt-formom text-2xl mb-6 text-center">See it in action</h2>

            <video
              className="w-full rounded-2xl shadow-md"
              controls
              muted
              preload="metadata"
            >
              <source src="/walkthrough-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            <div className="video-caption mt-4 text-center">
              <p className="text-sm font-inter text-gray-600">Watch how Worme simplifies your workflow</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default page
