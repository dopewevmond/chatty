"use client";

import { useEffect } from "react";
import { Search, MessageSquare, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback } from "@/components/ui/avatar";
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
  openChat,
  searchUser,
} from "@/redux/chatSlice";
import { cn } from "@/lib/utils";
import { useDebounceCallback } from "usehooks-ts";
import { UserDetailsDialogTrigger } from "./user-details-dialog";
import useSocket from "@/lib/useSocket";

export default function ChattyApp() {
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn);
  const isOnline = useAppSelector((state) => state.chat.isOnline);

  const searchFunction = (query: string) =>
    query && dispatch(searchUser(query));
  const debouncedSearchUser = useDebounceCallback(searchFunction, 500);
  const isSearching = useAppSelector((state) => state.chat.isLoadingSearch);
  const isLoadingChats = useAppSelector((state) => state.chat.isLoadingChats);
  const searchResults = useAppSelector((state) => state.chat.searchResults);
  const currentlyOpenedChat = useAppSelector((state) => state.chat.open);
  const recents = useAppSelector((state) => state.chat.recents);

  useEffect(() => {
    if (!isLoggedIn) {
      dispatch(anonymousLogin());
      return;
    }
  }, [dispatch, isLoggedIn]);
  useSocket(isLoggedIn);

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

          <UserDetailsDialogTrigger />
        </div>
      </header>
      <div className="flex-1 flex h-full overflow-y-auto">
        <aside
          className={`w-full h-full overflow-y-auto md:w-80 border-r flex flex-col ${
            currentlyOpenedChat != null ? "hidden md:flex" : "flex"
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
                      onClick={() => dispatch(openChat(searchResultUser))}
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
              {isLoadingChats && (
                <Loader2 className="animate-spin block mx-auto my-4" />
              ) }
              {Object.entries(recents)
                .toSorted(
                  (a, b) =>
                    new Date(b[1].timestamp).getTime() -
                    new Date(a[1].timestamp).getTime()
                )
                .map(([otherUserId, val]) => (
                  <button
                    key={otherUserId}
                    className="flex items-center gap-3 w-full p-4 hover:bg-muted text-left"
                    onClick={() =>
                      dispatch(
                        openChat({
                          _id: otherUserId,
                          displayName: val.otherUserDisplayName,
                          username: val.otherUserUserName,
                        })
                      )
                    }
                  >
                    <Avatar>
                      <AvatarFallback className="bg-primary text-white uppercase">
                        {val.otherUserDisplayName
                          .split(" ")
                          .map((r) => r[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="font-medium capitalize">
                        {val.otherUserDisplayName}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {val.senderId === otherUserId
                          ? val.message
                          : `You: ${val.message}`}
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
            recipientUserId={currentlyOpenedChat?._id}
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
