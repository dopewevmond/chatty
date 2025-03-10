"use client";

import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback } from "@/components/ui/avatar";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { FormEvent, useEffect, useState } from "react";
import { sendMessage } from "@/redux/chatSlice";

type Props = {
  recipientUserId: string;
  username: string;
  displayName: string;
  onClickBackButton: () => void;
};

export default function ChatView(props: Props) {
  // scenario 1 - user opening chat for first time
  // call endpoint for 100 most recent messages

  // scenario 2 - user has opened chat previously and messages are still stored in state
  // call endpoint to fetch all new messages since last message

  const [message, setMessage] = useState("");
  const dispatch = useAppDispatch();
  // const recentMessageWithUser = useAppSelector(state => state.chat.recents).get(props.recipientUserId);
  const chatsForUser = useAppSelector((state) => state.chat.chats)[
    props.recipientUserId
  ];

  // useEffect(() => {
  //   if (recentMessageWithUser == null) {
  //     // fetch 100 most recent messages
  //   }
  //   // fetch all messages since most recent message
  // }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log({ message });
    dispatch(sendMessage({ recipientId: props.recipientUserId, message }));
    setMessage('');
  };

  return (
    <div className="flex-1 h-full overflow-y-auto flex flex-col">
      <div className="flex-1 h-full overflow-y-auto flex flex-col md:border-l">
        <header className="border-b px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={props.onClickBackButton}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-white uppercase">
                {props.username
                  .split("_")
                  .map((r) => r[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold capitalize">
                {props.displayName}
              </span>
              <span className="text-xs text-muted-foreground">
                @{props.username}
              </span>
            </div>
          </div>
          <Button variant="ghost" className="hidden md:inline-flex">
            View profile
          </Button>
        </header>

        <ScrollArea className="flex-1 h-full overflow-y-auto p-4">
          <div className="space-y-4">
            {chatsForUser?.messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${
                  message.senderId === props.recipientUserId
                    ? "justify-start"
                    : "justify-end"
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[70%] ${
                    message.senderId === props.recipientUserId
                      ? "bg-muted"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {message.message}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <form className="flex gap-2" onSubmit={handleSubmit}>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send a message..."
              className="flex-1"
            />
            <Button type="submit">Send</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
