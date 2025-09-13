'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { searchQuery } from '@/lib/firebase'
import { useUser } from '../layout'

interface SearchResult {
  id: string;
  title: string;
  snippet?: string;
  updatedAt?: string;
}

const Search = () => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const router = useRouter()
  const user = useUser()

  useEffect(() => {
    const performSearch = async () => {
      const query = searchInput.trim()
      
      if (!query || !user) {
        setSearchResults([])
        setHasSearched(false)
        setLoading(false)
        return
      }

      if (query.length < 2) { //empty
        return
      }

      setLoading(true)
      setHasSearched(true)
      
      try {
        const results = await searchQuery(query)        
        const formattedResults = Array.isArray(results) ? results.map(result => ({
          id: result.id || result.chatId || '',
          title: result.title || result.name || 'Untitled Chat',
          snippet: result.snippet || result.content || '',
          updatedAt: result.updatedAt || result.lastModified || result.createdAt
        })) : []
        
        setSearchResults(formattedResults)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setLoading(false)
      }
    }

    const delay = searchInput.trim().length < 3 ? 500 : 300
    const timeoutId = setTimeout(performSearch, delay)
    
    return () => clearTimeout(timeoutId)
  }, [searchInput, user])

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || !text) return text
    
    const words = query.trim().split(/\s+/).filter(word => word.length > 0)
    if (words.length === 0) return text
    
    const escapedWords = words.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi')
    
    const parts = text.split(regex)
    
    return parts.map((part, index) => {
      const isMatch = words.some(word => 
        part.toLowerCase() === word.toLowerCase()
      )
      
      return isMatch ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded font-medium">
          {part}
        </mark>
      ) : part
    })
  }

  return (
    <div className='flex-1 flex flex-col h-screen'>
      <div className="p-6 ">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Image src="/Arrow_Right_LG.svg" alt="Back" width={20} height={20} className="rotate-180" />
          </button>
          <h1 className='text-2xl font-poppins font-semibold'>Search Chats</h1>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Image src="/search.svg" alt="Search" width={20} height={20} className="text-gray-400" />
          </div>
          <input 
            type="text" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchInput('')
              }
            }}
            placeholder='Search chats, messages, topics...'
            className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl  y focus:border-transparent font-poppins text-base bg-white shadow-sm transition-all duration-200"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 hover:text-gray-600">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {!hasSearched ? (
          <div className="text-center py-16 max-w-md mx-auto">
            <p className="text-gray-500 font-poppins mb-6">Find titles or messages</p>
          </div>
        ) : loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500 font-poppins">Searching...</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </div>
            <h2 className="text-xl font-poppins font-semibold text-gray-700 mb-2">No Results Found</h2>
            <p className="text-gray-500 font-poppins">No chats found for "{searchInput}". Try different keywords.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-600 font-poppins">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found for 
                  <span className="font-medium text-gray-800 ml-1">"{searchInput}"</span>
                </p>
                {searchResults.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Click any result to open the conversation
                  </p>
                )}
              </div>
              <button 
                onClick={() => setSearchInput('')}
                className="text-sm  font-poppins transition-colors"
              >
                Clear search
              </button>
            </div>
            
            {searchResults.map((chat) => (
              <Link 
                href={`/chat/${chat.id}`} 
                key={chat.id}
                className="block p-5 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-md group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-poppins text-lg font-medium text-gray-900 mb-2  transition-colors">
                      {highlightMatch(chat.title, searchInput)}
                    </h3>
                    {chat.snippet && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {highlightMatch(chat.snippet, searchInput)}
                      </p>
                    )}
                    {chat.updatedAt && (
                      <p className="text-xs text-gray-400">
                        Updated {new Date(chat.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Image 
                      src="/Arrow_Right_LG.svg" 
                      alt="Open" 
                      width={20} 
                      height={20} 
                      className="text-gray-400"
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Search
