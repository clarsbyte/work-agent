import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut  } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
  deleteDoc
} from 'firebase/firestore'
import { use } from 'react';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: 'work-agent-3a7de',
}
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
const chats = collection(db, 'message_history')
const services = collection(db, 'services')

export const SignUp = async (email: string, password: string, name:string) => {
  const user = await createUserWithEmailAndPassword(auth, email, password)
  const setName = await setDoc(doc(db, 'services', auth.currentUser?.uid),{
    'username': name
  })
  return user
}

export const LogIn = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password) 
}

export const LogOut = async () =>{
  return await signOut(auth);
}

export const fetchAllUserChats = async () =>{
  if (!auth.currentUser) return [];
  try{
    const q = query(chats, where('user_id', '==', auth.currentUser.uid), limit(20))
    const querySnapshot = await getDocs(q)
    const userChats: any[] = []

    querySnapshot.forEach((doc) => {
      userChats.push({ id: doc.id, ...doc.data() })
    })
    return userChats;

  }catch(err){
    console.log(err);
    return [];
  }
}

export const fetchMessages = async (chatId: string) =>{
  if (!auth.currentUser) return [];
  try {
    const docRef = doc(db, "message_history", chatId)
    const docSnap = await getDoc(docRef)

    let data;
    if (docSnap.exists()) {
      data = docSnap.data();
      if (data.user_id !== auth.currentUser.uid) {
        throw new Error("Unauthorized access to chat")
      }
      return [JSON.parse(data.messages), data.title]
    }
    
  } catch (err) {
    console.log(err);
    return [];
  }
}

export const fetchServices = async () => {
  if (!auth.currentUser) return {};
  try{
    const docRef = doc(db, "services", auth.currentUser.uid)
    const docSnap = await getDoc(docRef)

    let data;
    const availableServices: any = {};

    if (docSnap.exists()) {
      data = docSnap.data();
      if (data.token_calendar){
        availableServices['calendar'] = true
      }
      if (data.token_gmail){
        availableServices['gmail'] = true
      }
    }

    return availableServices;
  }catch(err){
    console.log(err);
    return {};
  }
}

export const fetchUserInfo = async () => {
  if (!auth.currentUser) return {};
  try{
    const docRef = doc(db, "services", auth.currentUser.uid);
    const docSnap = await getDoc(docRef);

    let data;
    const userInfo: any = {};

    if (docSnap.exists()) {
      data = docSnap.data();
      userInfo['username'] = data.username || '';
    }

    return userInfo;
  }catch(err){
    console.log(err);
    return {};
  }
}

export const deleteChat = async (id:string) =>{
  try{
    const docRef = doc(db,'message_history', id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()){
      deleteDoc(docRef)
    }
  }catch(err){
    console.log(err)
  }
}

export const updateTitle = async (id:string, newTitle:string) =>{
  try{
    const docRef = doc(db,'message_history', id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()){
      updateDoc(docRef, {'title': newTitle })
    }
  }catch(err){
    console.log(err)
  }
}

export const searchQuery = async (input: string) => {
  if (!auth.currentUser) return [];
  
  try {
    const searchTerm = input.toLowerCase().trim();
    if (!searchTerm || searchTerm.length < 2) return [];

    const q = query(chats, where('user_id', '==', auth.currentUser.uid))
    const querySnapshot = await getDocs(q)

    const allChats: any[] = []
    querySnapshot.forEach((doc) => {
      allChats.push({ id: doc.id, ...doc.data() })
    });

    const searchResults = allChats
      .map(chat => {
        const title = (chat.title || '').toLowerCase()
        const messages = chat.messages ? JSON.parse(chat.messages) : []
        
        let score = 0
        let snippet = ''
        
        if (title.includes(searchTerm)) {
          score += 100
          if (title.startsWith(searchTerm)) {
            score += 50
          }
        }
        
        const contentMatches = [];
        for (const message of messages) {
          if (message.kind === 'request' && message.parts) {
            for (const part of message.parts) {
              if (part.part_kind === 'user-prompt' && part.content) {
                const content = part.content.toLowerCase()
                if (content.includes(searchTerm)) {
                  score += 10;
                  contentMatches.push(part.content)
                }
              }
            }
          } else if (message.kind === 'response' && message.parts) {
            for (const part of message.parts) {
              if (part.part_kind === 'text' && part.content) {
                const content = part.content.toLowerCase()
                if (content.includes(searchTerm)) {
                  score += 5
                  contentMatches.push(part.content)
                }
              }
            }
          }
        }

        if (contentMatches.length > 0) {
          const bestMatch = contentMatches[0]
          const index = bestMatch.toLowerCase().indexOf(searchTerm)
          const start = Math.max(0, index - 50)
          const end = Math.min(bestMatch.length, index + searchTerm.length + 50)
          snippet = (start > 0 ? '...' : '') + 
                   bestMatch.substring(start, end) + 
                   (end < bestMatch.length ? '...' : '')
        }

        const searchWords = searchTerm.split(/\s+/)
        if (searchWords.length > 1) {
          const titleWords = title.split(/\s+/)
          const matchingWords = searchWords.filter(word => {
            titleWords.some(titleWord => {
              titleWord.includes(word)})}
          )
          score += matchingWords.length * 20;
        }

        return {
          ...chat,
          score,
          snippet: snippet || (chat.title ? `Chat: ${chat.title}` : 'Untitled Chat'),
          updatedAt: chat.updated_at || chat.created_at,
        };
      })
      .filter(chat => chat.score > 0) 
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score
        }
        const dateA = new Date(a.updatedAt || 0).getTime()
        const dateB = new Date(b.updatedAt || 0).getTime()
        return dateB - dateA
      })
      .slice(0, 20)

    return searchResults
  } catch (err) {
    console.error('Search error:', err);
    return [];
  }
}