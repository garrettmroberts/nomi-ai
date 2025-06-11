import { Chat } from "@/types/chat";

const CHATS_STORAGE_KEY = "chat-history";

export const saveChat = (chat: Chat) => {
  const chats = getChats();
  const existingChatIndex = chats.findIndex((c) => c.id === chat.id);

  if (existingChatIndex >= 0) {
    chats[existingChatIndex] = chat;
  } else {
    chats.push(chat);
  }

  localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
};

export const getChats = (): Chat[] => {
  if (typeof window === "undefined") return [];

  const chats = localStorage.getItem(CHATS_STORAGE_KEY);
  if (!chats) return [];

  return JSON.parse(chats).map(
    (chat: Omit<Chat, "createdAt"> & { createdAt: string }) => ({
      ...chat,
      createdAt: new Date(chat.createdAt),
    })
  );
};

export const getChat = (id: string): Chat | null => {
  const chats = getChats();
  return chats.find((chat) => chat.id === id) || null;
};

export const deleteChat = (id: string) => {
  const chats = getChats();
  const filteredChats = chats.filter((chat) => chat.id !== id);
  localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(filteredChats));
};
