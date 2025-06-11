import { Chat } from '@/types/chat';
import { TrashIcon } from '@heroicons/react/24/outline';
import { deleteChat, getChats } from '@/utils/storage';

interface ChatSidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onChatsUpdate: (chats: Chat[]) => void;
}

export default function ChatSidebar({
  chats,
  currentChatId,
  onChatSelect,
  onNewChat,
  onChatsUpdate,
}: ChatSidebarProps) {
  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    deleteChat(chatId);
    const updatedChats = getChats();
    onChatsUpdate(updatedChats);
    
    if (currentChatId === chatId) {
      onNewChat();
    }
  };

  return (
    <div className="w-64 h-screen bg-gray-100 p-4 flex flex-col">
      <button
        onClick={onNewChat}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg mb-4 hover:bg-blue-600 transition-colors"
      >
        New Chat
      </button>
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onChatSelect(chat.id)}
            className={`p-3 rounded-lg mb-2 cursor-pointer flex justify-between items-center ${
              currentChatId === chat.id
                ? 'bg-blue-100 border border-blue-300'
                : 'hover:bg-gray-200'
            }`}
          >
            <span className="truncate flex-1 text-gray-500">{chat.title}</span>
            <button
              onClick={(e) => handleDeleteChat(e, chat.id)}
              className="ml-2 text-gray-500 hover:text-red-500"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 