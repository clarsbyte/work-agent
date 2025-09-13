"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { fetchMessages } from '@/lib/firebase';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Image from 'next/image';
import { fetchServices } from '@/lib/firebase';
import { useUser } from '../layout';
import { sendMessage } from '@/lib/agent';

const ChatPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const chatId = params?.id as string;
  const user = useUser();
  const initialMessage = searchParams?.get('message');
  
  const [conversation, setConversation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableServices, setAvailableServices] = useState<any>({});
  const [inputMessage, setInputMessage] = useState('');
  const [title, setTitle] = useState('');
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [isTypingTitle, setIsTypingTitle] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [conversation]);

  useEffect(() => {
    if (!title || displayedTitle === title) return

    setIsTypingTitle(true)
    setDisplayedTitle('')

    let currentIndex = 0;
    const typeInterval = setInterval(() => {
      setDisplayedTitle(title.slice(0, currentIndex + 1))
      currentIndex++;

      if (currentIndex >= title.length) {
        clearInterval(typeInterval);
        setIsTypingTitle(false);
      }
    }, 50); 

    return () => clearInterval(typeInterval);
  }, [title]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = '32px';
    const maxHeight = window.innerHeight * 0.5;
    const newHeight = Math.min(e.target.scrollHeight, maxHeight)
    e.target.style.height = newHeight + 'px';
    e.target.style.overflow = e.target.scrollHeight > maxHeight ? 'auto' : 'hidden';
    setInputMessage(e.target.value)
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.altKey) {
      e.preventDefault();
      if (inputMessage.trim() && !isStreaming) {
        agentResponse(inputMessage);
      }
    }
  };

  const agentResponse = async (message: string) => {
    if (!user) return;

    setConversation((prev) => [...prev, {sender:'user', content: message}]);
    setInputMessage('')
    setStreamingContent('')

    const botMessageIndex = conversation.length + 1;
    setConversation((prev) => [...prev, {sender: 'bot', content: ''}])

    await sendMessage(message, chatId, user.uid, (data) => {
      if (data.type === 'status') {
        setIsStreaming(true);
        setStreamingContent(data.message);
      } else if (data.type === 'content') {
        setIsStreaming(true);
        setStreamingContent(data.content);
        setConversation((prev) => {
          const newConv = [...prev];
          if (newConv[botMessageIndex]) {
            newConv[botMessageIndex] = {
              sender: 'bot',
              content: data.content
            };
          }
          return newConv;
        });
      } else if (data.type === 'done') {
        setIsStreaming(false);
        setStreamingContent('');
      } else if (data.type === 'error') {
        setIsStreaming(false);
        setStreamingContent('');
        setConversation((prev) => {
          const newConv = [...prev];
          if (newConv[botMessageIndex]) {
            newConv[botMessageIndex] = {
              sender: 'bot',
              content: `Error: ${data.message}`
            };
          }
          return newConv;
        });
      }
    });
  };

  const refreshConversation = async () => {
    if (user && chatId && !isStreaming) {
      try {
        const [chatData, services] = await Promise.all([
          fetchMessages(chatId),
          fetchServices()
        ]);

        const conversationMsgs: any[] = []

        if (chatData && chatData[0]) {
          chatData[0].forEach((index: any) =>{
          if (index.kind == 'request'){
              const parts = index.parts;
              const userContent = parts
                .filter((part: any) => part.part_kind == 'user-prompt')
                .map((part: any) => part.content)
                .join('');
              if (userContent) {
                conversationMsgs.push({'sender':'user', 'content': userContent});
              }
          }else if (index.kind == 'response'){
              const parts = index.parts;
              const botContent = parts
                .filter((part: any) => part.part_kind == 'text')
                .map((part: any) => part.content)
                .join('\n\n');
              if (botContent) {
                conversationMsgs.push({'sender':'bot', 'content': botContent});
              }
          }
        });
        }

        const newTitle = (chatData && chatData[1]) ? chatData[1] : '';
        setTitle(newTitle);
        if (newTitle && !hasLoadedData) {
          setDisplayedTitle(newTitle);
        }
        setConversation(conversationMsgs);
        setAvailableServices(services);

      } catch (err) {
        console.error('Error refreshing conversation:', err);
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (user && chatId) {
        setLoading(true);
        try {
          await refreshConversation();
          setHasLoadedData(true);
        } catch (err) {
          console.error('Error loading data:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [user, chatId]);

  useEffect(() => {
    if (initialMessage && user && !loading && conversation.length === 0) {
      agentResponse(decodeURIComponent(initialMessage));
    }
  }, [initialMessage, user, loading, conversation.length]);


  useEffect(() => {
    const handleFocus = () => {
      if (hasLoadedData && !isStreaming) {
        refreshConversation();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [hasLoadedData, user, chatId, isStreaming]);

  useEffect(() => {
    if (!user || !chatId || !hasLoadedData || isStreaming) return;

    const interval = setInterval(() => {
      if (!isStreaming) {
        refreshConversation();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, chatId, hasLoadedData, isStreaming]);

  useEffect(() => {
    const handleTitleUpdate = (e: CustomEvent) => {
      if (e.detail.chatId === chatId) {
        if (e.detail.newTitle) {
          setTitle(e.detail.newTitle);
        }
        refreshConversation();
      }
    };

    const handleChatDeleted = (e: CustomEvent) => {
      if (e.detail.chatId === chatId) {
        router.push('/chat/new');
      }
    };

    window.addEventListener('chatTitleUpdated', handleTitleUpdate as EventListener);
    window.addEventListener('chatDeleted', handleChatDeleted as EventListener);
    
    return () => {
      window.removeEventListener('chatTitleUpdated', handleTitleUpdate as EventListener);
      window.removeEventListener('chatDeleted', handleChatDeleted as EventListener);
    };
  }, [chatId, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
      <div className="flex-1 flex flex-col relative h-screen">
          <div className="title sticky top-0 h-10 flex items-center -z-10 pl-5">
            <h1 className="text-lg font-poppins min-h-[1.5rem]">
              {displayedTitle}
            </h1>
          </div>
        <div ref={scrollContainerRef} className="flex-1 pt-4 px-4 overflow-y-auto pb-40 min-h-0">
          <div className="w-[70%] mx-auto">
          {
            conversation.map((convo, index) => {
              return convo.sender === 'user' ? (
              <div key={index} className="mb-4 flex justify-start">
                <div className="bg-gray-100 p-2  px-4 font-inter rounded-2xl w-fit max-w-sm">
                  {convo.content}
                </div>
              </div>
              ) : (
              <div key={index} className="mb-4 flex justify-start">
                <div className="py-2 font-inter rounded-xl w-[900px] min-h-[2rem] overflow-x-auto [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_pre]:overflow-x-auto [&_code]:break-words [&_*]:max-w-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-2 [&_h1]:my-2 [&_h2]:my-2 [&_h3]:my-2 [&_h4]:my-2 [&_h5]:my-2 [&_h6]:my-2">
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="min-h-[1.5rem]">
                        <ReactMarkdown rehypePlugins={[rehypeRaw] as any}>{typeof convo.content === 'string' ? convo.content : JSON.stringify(convo.content)}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              );
            })
          }
          <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="box absolute bottom-5 left-1/2 transform -translate-x-1/2 z-50 font-inter bg-white drop-shadow-xl rounded-3xl p-5 w-[70%] flex flex-col justify-end">
                    <textarea className="resize-none placeholder:text-gray-300 focus:outline-none" placeholder="Execute any work you have..." value={inputMessage} onChange={handleTextareaChange} onKeyDown={handleKeyDown} style={{height: '32px', overflow: 'hidden'}} />
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
                        onClick={()=> agentResponse(inputMessage)} disabled={isStreaming||!inputMessage.trim()}
                        className="bg-primary w-14 h-8 flex items-center justify-center rounded-md hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {isStreaming ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <Image alt="arrow" width={30} height={30} src='/Arrow_Right_LG.svg'/>
                        )}
                      </button>
                    </div>
                  </div>
        </div>
  );
};

export default ChatPage;
