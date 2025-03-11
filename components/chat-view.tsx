"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback } from "@/components/ui/avatar";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { FormEvent, useRef, useState } from "react";
import { handleNewMessage, sendMessage } from "@/redux/chatSlice";

type Props = {
  recipientUserId: string;
  username: string;
  displayName: string;
  onClickBackButton: () => void;
};

export default function ChatView(props: Props) {
  const currentlyLoggedInUserId = useAppSelector((state) => state.auth.id);
  const currentlyLoggedInUserUsername = useAppSelector(
    (state) => state.auth.username
  );
  const currentlyLoggedInDisplayName = useAppSelector(
    (state) => state.auth.displayName
  );
  const chatInputElementRef = useRef<HTMLInputElement | null>(null);
  const [pendingMessage, setPendingMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const dispatch = useAppDispatch();
  const chatsForUser = useAppSelector((state) => state.chat.chats)[
    props.recipientUserId
  ];

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      if (
        !chatInputElementRef.current ||
        chatInputElementRef.current.value.trim() === ""
      )
        return;
      const message = chatInputElementRef.current.value.trim();
      chatInputElementRef.current.value = "";

      setPendingMessage(message);
      setIsSending(true);

      await dispatch(
        sendMessage({
          recipientId: props.recipientUserId,
          message,
        })
      );

      dispatch(
        handleNewMessage({
          type: "send",
          message,
          senderId: currentlyLoggedInUserId!,
          senderUserName: currentlyLoggedInUserUsername!,
          senderDisplayName: currentlyLoggedInDisplayName!,
          recipientId: props.recipientUserId,
          timestamp: new Date().toISOString(),
          recipientDisplayName: props.displayName,
          recipientUserName: props.username,
        })
      );
    } catch (e) {
      console.log(e);
    } finally {
      setPendingMessage("");
      setIsSending(false);
    }
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
            {chatsForUser?.messages.map((chatMessage, idx) => (
              <div
                key={idx}
                className={`flex ${
                  chatMessage.senderId === props.recipientUserId
                    ? "justify-start"
                    : "justify-end"
                } `}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[70%] ${
                    chatMessage.senderId === props.recipientUserId
                      ? "bg-muted"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {chatMessage.message}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-end">
                <div className="rounded-lg px-4 py-2 max-w-[70%] bg-primary/80 text-primary-foreground flex items-center gap-2">
                  <span>{pendingMessage}</span>
                  <Loader2 className="animate-spin w-4" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <form className="flex gap-2" onSubmit={handleSubmit}>
            <Input
              ref={chatInputElementRef}
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
