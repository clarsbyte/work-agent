'use client'
import React, { useState, useEffect, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth';
import {auth, LogOut, fetchAllUserChats, fetchUserInfo, deleteChat, updateTitle} from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface User {
  email?: string;
  displayName?: string;
  uid: string;
}

interface BarProps {
  user?: User;
}

const Bar = ({ user }: BarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [hasFetchedChats, setHasFetchedChats] = useState(false);
  const [userInfo, setUserInfo] = useState<any>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [renameModal, setRenameModal] = useState<{ isOpen: boolean; chatId: string; currentTitle: string }>({
    isOpen: false,
    chatId: '',
    currentTitle: ''
  });
  const [newTitle, setNewTitle] = useState('');

  const refreshChats = async () => {
    if (user) {
      const userChats = await fetchAllUserChats()
      setChats(userChats)
    }
  };

  const handleLogOut = async ()=>{
    try{
      await LogOut();
      router.push('/log-in')
    }catch(err){
      console.log(err)
    }
  }

  const handleDotsClick = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenDropdown(openDropdown === chatId ? null : chatId)
  }

  const handleRename = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId)
    setRenameModal({
      isOpen: true,
      chatId: chatId,
      currentTitle: chat?.title || ''
    });
    setNewTitle(chat?.title || '')
    setOpenDropdown(null);
  }

  const handleRenameSubmit = async () => {
    if (newTitle.trim() && renameModal.chatId) {
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === renameModal.chatId 
            ? { ...chat, title: newTitle.trim() }
            : chat
        )
      );
      
      setRenameModal({ isOpen: false, chatId: '', currentTitle: '' })
      setNewTitle('');
      
      window.dispatchEvent(new CustomEvent('chatTitleUpdated', { 
        detail: { chatId: renameModal.chatId, newTitle: newTitle.trim() } 
      }));
      
      try {
        await updateTitle(renameModal.chatId, newTitle.trim())
        window.dispatchEvent(new CustomEvent('chatTitleUpdated', { 
          detail: { chatId: renameModal.chatId, newTitle: newTitle.trim() } 
        }));
      } catch (error) {
        console.error('failed to rename chat:', error);
        await refreshChats();
        window.dispatchEvent(new CustomEvent('chatTitleUpdated', { 
          detail: { chatId: renameModal.chatId } 
        }));
      }
    }
  }

  const handleRenameCancel = () => {
    setRenameModal({ isOpen: false, chatId: '', currentTitle: '' });
    setNewTitle('');
  }

  const handleDelete = async (chatId: string) => {
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    setOpenDropdown(null);
    
    window.dispatchEvent(new CustomEvent('chatDeleted', { 
      detail: { chatId } 
    }));
    
    try {
      await deleteChat(chatId);
      window.dispatchEvent(new CustomEvent('chatDeleted', { 
        detail: { chatId } 
      }));
    } catch (error) {
      console.error('Failed to delete chat:', error);
      await refreshChats();
    }
  }

  useEffect(()=>{
    const fetchChats = async () =>{
      if (user && !hasFetchedChats) {
        await refreshChats();
        setHasFetchedChats(true);
      }
    }
    fetchChats();
  }, [user, hasFetchedChats])

  useEffect(() => {
    const handleFocus = () => {
      refreshChats();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      refreshChats()
    }, 30000); 

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const fetchUserInformation = async () => {
      if (user) {
        const userinfo = await fetchUserInfo();
        setUserInfo(userinfo)
      }
    }
    fetchUserInformation();
  }, [user])

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null)
    };

    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown])

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-60'} outline-2 outline-gray-500 h-screen bg-white transition-all duration-300 ease-in-out relative`}>
      <div className={`upper ${isCollapsed ? 'px-2' : 'px-6'} py-7 flex flex-col gap-2`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} h-12`}>
          <h2 className={`font-coolvetica text-3xl transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'} ${isCollapsed ? 'absolute' : ''} whitespace-nowrap`}>
            Worme
          </h2>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hover:bg-gray-50 flex-shrink-0 z-10"
          >
            <Image 
              src='/sidebar.svg' 
              alt="toggle sidebar" 
              width={16} 
              height={16}
              className="text-gray-600"
            />
          </button>
        </div>
        
        
        <button onClick={async () => {
          router.push('/chat/new');
          setTimeout(refreshChats, 1000)}} 
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-5'} hover:bg-primary/10 rounded-lg px-2 py-1 transition-all duration-200 hover:scale-105`}>
          <div className='w-8 h-8 flex-shrink-0 transition-transform duration-200 hover:scale-110'>
            <Image className='bg-primary p-1 rounded-full w-full h-full' src='/add.svg' alt='add' width={30} height={30}/>
          </div>
          {!isCollapsed && <p className='font-poppins whitespace-nowrap'>New chat</p>}
        </button>
        
        <button onClick={async () => 
          router.push('/chat/search')} 
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-5'} hover:bg-gray-100 rounded-lg px-2 py-1 transition-all duration-200`}>
          <div className='w-8 h-8 flex-shrink-0'>
            <Image className='p-1 rounded-full w-full h-full' src='/search.svg' alt='search' width={30} height={30}/>
          </div>
          {!isCollapsed && <p className='font-poppins whitespace-nowrap'>Search chat</p>}
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="chats px-6">
          <h3 className='font font-poppins'>Chats</h3>
          {chats.length > 0 ? (
            chats.map((chat, index) => (
              <div key={chat.id} className='relative'>
                <Link href={`/chat/${chat.id}`} className='chat py-2 px-2 flex items-center justify-between hover:bg-gray-100 rounded cursor-pointer group' prefetch={false}>
                  <p className='font-poppins text-sm text-gray-700 truncate'>
                    {chat.title}
                  </p>
                  <button
                    onClick={(e) => handleDotsClick(e, chat.id)}
                    className='dots opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:text-gray-500 hover:bg-gray-200 rounded'
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="5" cy="12" r="2" fill="currentColor"/>
                      <circle cx="12" cy="12" r="2" fill="currentColor"/>
                      <circle cx="19" cy="12" r="2" fill="currentColor"/>
                    </svg>
                  </button>
                </Link>
                
                {openDropdown === chat.id && (
                  <div className='absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10'>
                    <button
                      onClick={() => handleRename(chat.id)}
                      className='w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2'
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="m18.5 2.5 3 3L12 15l-4 1 1-4z"/>
                      </svg>
                      Rename
                    </button>
                    <button
                      onClick={() => handleDelete(chat.id)}
                      className='w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2'
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className='font-poppins text-xs text-gray-500 py-2'>No chats yet</p>
          )}
        </div>        
      )}
      
      <div className={`absolute bottom-4 ${isCollapsed ? 'px-2' : 'px-6'} w-full`}>
        <div className="group relative">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} p-2 rounded cursor-pointer hover:bg-gray-50`}>
            <div className="w-8 h-8 bg-gray-600 rounded-full flex-shrink-0"></div>
            {!isCollapsed && (
              <div className="flex-1">
                <p className='font-poppins text-sm line-clamp-2 break-words'>{userInfo.username || 'No user'}</p>
              </div>
            )}
          </div>
          <div className="absolute bottom-full max-w-full mb-2 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-white shadow-lg  rounded-lg p-3 space-y-2 min-w-[20px]">
              <div className="border-b pb-2">
                <p className='font-poppins text-xs text-gray-600'>Email</p>
                <p className='font-poppins text-[10px] font-medium break-words'>{user?.email || 'No email'}</p>
              </div>
              <button 
                onClick={handleLogOut}
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} text-red-600 hover:bg-red-50 p-2 rounded w-full transition-colors duration-200`}
              >
                <div className='w-4 h-4 flex-shrink-0'>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                {!isCollapsed && <span className='font-poppins text-sm'>Log out</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {renameModal.isOpen && (
        <div className="fixed modal inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold font-poppins mb-4">Rename Chat</h3>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
              placeholder="Enter new chat name"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleRenameSubmit();
                }
                if (e.key === 'Escape') {
                  handleRenameCancel();
                }
              }}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={handleRenameCancel}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-poppins transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameSubmit}
                className="px-4 py-2 bg-primary text-black hover:bg-[#cee64a] rounded-md font-poppins transition-colors"
                disabled={!newTitle.trim()}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Bar
