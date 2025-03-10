"use client";

import { useEffect, useState } from "react";
import { Search, MessageSquare, Users, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ChatView from "./chat-view";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { anonymousLogin } from "@/redux/authSlice";
import {
  closeChat,
  closeSearch,
  connectError,
  connectSocketSuccessfully,
  initializeSocket,
  openChat,
  searchUser,
} from "@/redux/chatSlice";
import { io } from "socket.io-client";
import { cn } from "@/lib/utils";
import { useDebounceCallback } from "usehooks-ts";

interface ChatMessage {
  id: string;
  username: string;
  message: string;
}

export default function ChattyApp() {
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn);
  const hasInitializedSocket = useAppSelector(
    (state) => state.chat.initializedSocket
  );
  const socket = useAppSelector((state) => state.chat.socket);
  const isOnline = useAppSelector((state) => state.chat.isOnline);

  const searchFunction = (query: string) =>
    query && dispatch(searchUser(query));
  const debouncedSearchUser = useDebounceCallback(searchFunction, 500);
  const isSearching = useAppSelector((state) => state.chat.isLoadingSearch);
  const searchResults = useAppSelector((state) => state.chat.searchResults);
  const currentlyOpenedChat = useAppSelector((state) => state.chat.open);

  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  useEffect(() => {
    if (!isLoggedIn) {
      dispatch(anonymousLogin());
      return;
    }
    if (!hasInitializedSocket) {
      dispatch(initializeSocket(io()));
      return;
    }

    if (!socket) return;
    socket.on("connect", () => {
      console.log("socket connected successfully");
      dispatch(connectSocketSuccessfully());
    });

    socket.on("connect_error", (err) => {
      console.log("socket disconnected");
      dispatch(connectError(err.message));
    });

    socket.on("disconnect", () => {
      console.log("socket disconnected");
      dispatch(connectError("Socket disconnected"));
    });

    // socket.on("receiveMessage", (msg) => {
    //   console.log(msg);
    //   dispatch(receiveMessage(msg));
    // });

    return () => {
      console.log("removing event listeners");
      socket.removeAllListeners();
      console.log("finished removing event listeners");
    };
  }, [dispatch, isLoggedIn, hasInitializedSocket, socket]);

  const messages: ChatMessage[] = [
    { id: "1", username: "wevs1234", message: "here" },
    { id: "2", username: "storedwailing", message: "this is another message" },
    { id: "3", username: "wevmond", message: "another message" },
    { id: "4", username: "wevmond", message: "another message" },
    { id: "5", username: "wevmond", message: "another message" },
    { id: "6", username: "wevmond", message: "another message" },
    { id: "7", username: "wevmond", message: "another message" },
    { id: "8", username: "wevmond", message: "another message" },
    { id: "9", username: "wevmond", message: "another message" },
    { id: "10", username: "wevmond", message: "another message" },
    { id: "11", username: "wevmond", message: "another message" },
    { id: "12", username: "roller", message: "last message" },
  ];

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Chatty</h1>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      isOnline ? "bg-green-500" : "bg-red-500"
                    )}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isOnline ? "Online" : "Offline"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Users className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem>
                Log out
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="flex-1 flex h-full overflow-y-auto">
        <aside
          className={`w-full h-full overflow-y-auto md:w-80 border-r flex flex-col ${
            selectedChat ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search your chats"
                className="pl-8"
                onChange={(e) => debouncedSearchUser(e.target.value)}
                onBlur={(e) => {
                  e.target.value = "";
                  setTimeout(() => {
                    dispatch(closeSearch());
                  }, 500);
                }}
              />
            </div>
          </div>
          {isSearching || searchResults != null ? (
            <div className="p-4 text-sm">
              <div className="font-medium">Search results</div>
              {isSearching && <Loader2 className="animate-spin mx-auto" />}
              {searchResults != null && searchResults?.length > 0 ? (
                <div className="space-y-2">
                  {searchResults?.map((searchResultUser) => (
                    <button
                      key={searchResultUser._id}
                      className="flex rounded-md items-center gap-3 w-full p-4 hover:bg-muted text-left"
                      onClick={() =>
                        dispatch(openChat({ ...searchResultUser }))
                      }
                    >
                      <Avatar>
                        <AvatarFallback className="bg-primary text-white uppercase">
                          {searchResultUser.username
                            .split("_")
                            .map((r) => r[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-medium capitalize">
                          {searchResultUser.displayName}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchResults != null ? (
                <p className="mt-4">
                  No results found. Click anywhere to go back to chats
                </p>
              ) : null}
            </div>
          ) : (
            <ScrollArea className="flex-1 h-full overflow-y-auto">
              {messages.map((chat) => (
                <button
                  key={chat.id}
                  className="flex items-center gap-3 w-full p-4 hover:bg-muted text-left"
                  onClick={() => setSelectedChat(chat.id)}
                >
                  <Avatar>
                    <AvatarFallback className="bg-primary text-white uppercase">
                      {chat.username[0]
                        .split("_")
                        .map((r) => r[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-medium">{chat.username}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {chat.username === messages[0].username
                        ? chat.message
                        : `You: ${chat.message}`}
                    </div>
                  </div>
                </button>
              ))}
            </ScrollArea>
          )}
        </aside>
        {currentlyOpenedChat != null ? (
          <ChatView
            username={currentlyOpenedChat.username}
            displayName={currentlyOpenedChat.displayName}
            onClickBackButton={() => dispatch(closeChat())}
          />
        ) : (
          <main className="flex-1 items-center justify-center flex-col gap-4 text-center p-4 hidden md:flex">
            <div className="h-20 w-20 border rounded-lg flex items-center justify-center text-muted-foreground">
              <MessageSquare className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-medium">You have no open chats</h2>
            <p className="text-muted-foreground">
              Click on a chat in the left panel to get started.
            </p>
          </main>
        )}
      </div>
    </div>
  );
}
