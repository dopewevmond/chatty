"use client";

import { useState } from "react";
import { Copy, Check, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/redux/store";

export function UserDetailsDialogTrigger() {
  const username = useAppSelector((state) => state.auth.username);
  const displayName = useAppSelector((state) => state.auth.displayName);

  const [copiedDisplayName, setCopiedDisplayName] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);

  const copyToClipboard = async (
    text: string,
    type: "displayName" | "username"
  ) => {
    await navigator.clipboard.writeText(text);

    if (type === "displayName") {
      setCopiedDisplayName(true);
      setTimeout(() => setCopiedDisplayName(false), 2000);
    } else {
      setCopiedUsername(true);
      setTimeout(() => setCopiedUsername(false), 2000);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Users className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chat With Others</DialogTitle>
          <DialogDescription>
            Share your user details with friends to start chatting.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="displayName" className="w-fit">
              Display Name
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="displayName"
                value={displayName!}
                readOnly
                className="flex-1 capitalize"
              />
              <Button
                type="button"
                size="sm"
                className="px-3"
                onClick={() => copyToClipboard(displayName ?? '', "displayName")}
              >
                {copiedDisplayName ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {copiedDisplayName ? "Copied" : "Copy display name"}
                </span>
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="username" className="w-fit">
              Username
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="username"
                value={username!}
                readOnly
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                className="px-3"
                onClick={() => copyToClipboard(username ?? '', "username")}
              >
                {copiedUsername ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {copiedUsername ? "Copied" : "Copy username"}
                </span>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
