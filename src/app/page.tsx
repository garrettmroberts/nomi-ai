'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Chat, Message } from '@/types/chat';
import { getChats, getChat, saveChat } from '@/utils/storage';
import ChatMessage from '@/components/ChatMessage';
import ChatSidebar from '@/components/ChatSidebar';

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadedChats = getChats();
    setChats(loadedChats);
    if (loadedChats.length > 0) {
      setCurrentChat(loadedChats[0]);
    } else {
      createNewChat();
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages, streamingMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createNewChat = () => {
    const newChat: Chat = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
    };
    setCurrentChat(newChat);
    setChats((prev) => [newChat, ...prev]);
    saveChat(newChat);
  };

  const handleChatSelect = (chatId: string) => {
    const selectedChat = getChat(chatId);
    if (selectedChat) {
      setCurrentChat(selectedChat);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentChat) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    };

    const updatedMessages = [...currentChat.messages, userMessage];
    const updatedChat = {
      ...currentChat,
      messages: updatedMessages,
      title: currentChat.messages.length === 0 ? input.trim().slice(0, 30) : currentChat.title,
    };

    setCurrentChat(updatedChat);
    setChats((prev) =>
      prev.map((chat) => (chat.id === updatedChat.id ? updatedChat : chat))
    );
    saveChat(updatedChat);
    setInput('');
    setIsLoading(true);
    setStreamingMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      let fullMessage = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        fullMessage += text;
        setStreamingMessage(fullMessage);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: fullMessage,
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      const finalChat = {
        ...updatedChat,
        messages: finalMessages,
      };

      setCurrentChat(finalChat);
      setChats((prev) =>
        prev.map((chat) => (chat.id === finalChat.id ? finalChat : chat))
      );
      saveChat(finalChat);
      
      // Wait for the state updates to complete before clearing the streaming message
      await new Promise(resolve => setTimeout(resolve, 100));
      setStreamingMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex h-screen">
      <ChatSidebar
        chats={chats}
        currentChatId={currentChat?.id || null}
        onChatSelect={handleChatSelect}
        onNewChat={createNewChat}
      />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {currentChat?.messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
          {streamingMessage && (
            <div className="flex justify-start mb-4">
              <div className="max-w-[70%] rounded-lg px-4 py-2 bg-gray-200 text-gray-800">
                <p className="whitespace-pre-wrap">{streamingMessage}</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
