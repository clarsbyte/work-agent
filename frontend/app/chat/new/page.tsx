"use client";
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { fetchServices } from '@/lib/firebase';
import { useUser } from '../layout';
import { fetchUserInfo } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { sendMessage, sendMessageStream } from '@/lib/agent';

const Chat = () => {
  const user = useUser();
  const router = useRouter();
  const [availableServices, setAvailableServices] = useState<any>({});
  const [userInfo, setUserInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setLoading(true)
        try {
          const [services, userinfo] = await Promise.all([
            fetchServices(),
            fetchUserInfo()
          ]);
          setAvailableServices(services);
          setUserInfo(userinfo);
        } catch (error) {
          console.error('Error fetching data:', error)
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [user]);

  const handleSendMessage = async () => {
    if (!user || !inputMessage.trim()) return;
    
    setIsCreating(true);
    
    const newChatId = Date.now().toString()
    
    try {
      const encodedMessage = encodeURIComponent(inputMessage)
      router.push(`/chat/${newChatId}?message=${encodedMessage}`)
    } catch (error) {
      console.error('Error creating chat:', error)
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
      <div className="flex-1 p-5 flex flex-col gap-5 items-center justify-center h-screen">
        <div className="text-center">
          <h1 className='font-poppins text-3xl'>Good Morning, {userInfo.username || 'User'}. <br />
          How can I help you today?</h1>
        </div>
        <div className="box z-100 font-inter font-medium bg-white drop-shadow-xl rounded-3xl p-5 max-w-2xl w-full flex flex-col justify-end">
          <textarea
            className="h-20 resize-none placeholder:text-gray-300 focus:outline-none"
            placeholder="Send an email to bobby@example.com that we're going to have a meeting tomorrow at 9AM.&#10;Schedule the meeting too, add him as an attendee."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.altKey) {
                e.preventDefault();
                if (inputMessage.trim() && !isCreating) {
                  handleSendMessage();
                }
              }
            }}
          />
          <div className="icons flex justify-between items-center mt-6">
            <div className="google flex gap-4 items-center">
                <div className="relative group flex items-center">
                  <Image alt="gmail" width={25} height={25} className={`${availableServices.gmail ? '' : 'grayscale '}`} src='https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg'/>
                  {!availableServices.gmail && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Send an email through chatbot to activate services
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </div>
                <div className="relative group flex items-center">
                  <Image alt="calendar" width={25} height={25} className={`${availableServices.calendar ? '' : 'grayscale '}`} src='https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg'/>
                  {!availableServices.calendar && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Create event through chatbot to activate services
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </div>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isCreating}
              className="bg-primary w-14 h-8 flex items-center justify-center rounded-md hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isCreating ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
              ) : (
                <Image alt="arrow" width={30} height={30} src='/Arrow_Right_LG.svg'/>
              )}
            </button>
          </div>
        </div>
      </div>
  )
}

export default Chat
