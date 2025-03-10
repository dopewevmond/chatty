"use client";

import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback } from "@/components/ui/avatar";

type Props = {
  username: string;
  displayName: string;
  onClickBackButton: () => void;
};

export default function ChatView(props: Props) {
  const messages = [
    {
      id: "1",
      content: "here the first message",
      sender: "wevs1234",
      timestamp: "12:00",
    },
    { id: "2", content: "hey", sender: "you", timestamp: "12:01" },
    {
      id: "3",
      content: "this is a message",
      sender: "you",
      timestamp: "12:02",
    },
    { id: "1", content: "here", sender: "wevs1234", timestamp: "12:00" },
    { id: "2", content: "hey", sender: "you", timestamp: "12:01" },
    {
      id: "3",
      content: "this is a message",
      sender: "you",
      timestamp: "12:02",
    },
    { id: "1", content: "here", sender: "wevs1234", timestamp: "12:00" },
    { id: "2", content: "hey", sender: "you", timestamp: "12:01" },
    {
      id: "3",
      content: "this is a message",
      sender: "you",
      timestamp: "12:02",
    },
    { id: "1", content: "here", sender: "wevs1234", timestamp: "12:00" },
    { id: "2", content: "hey", sender: "you", timestamp: "12:01" },
    {
      id: "3",
      content: "this is a message",
      sender: "you",
      timestamp: "12:02",
    },
    { id: "1", content: "here", sender: "wevs1234", timestamp: "12:00" },
    { id: "2", content: "hey", sender: "you", timestamp: "12:01" },
    {
      id: "3",
      content: "this is a message",
      sender: "you",
      timestamp: "12:02",
    },
    { id: "1", content: "here", sender: "wevs1234", timestamp: "12:00" },
    { id: "2", content: "hey", sender: "you", timestamp: "12:01" },
    {
      id: "3",
      content: "this is a message",
      sender: "you",
      timestamp: "12:02",
    },
    { id: "1", content: "here", sender: "wevs1234", timestamp: "12:00" },
    { id: "2", content: "hey", sender: "you", timestamp: "12:01" },
    {
      id: "3",
      content: "this is the last message",
      sender: "you",
      timestamp: "12:02",
    },
  ];

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
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "you" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[70%] ${
                    message.sender === "you"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <form className="flex gap-2">
            <Input placeholder="Send a message..." className="flex-1" />
            <Button type="submit">Send</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
