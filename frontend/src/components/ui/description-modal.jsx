import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DescriptionModal({ text, maxLength = 20 }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!text) return <span>N/A</span>;

  // If text is short, just display it normally
  if (text.length <= maxLength) {
    return <span className="whitespace-normal break-words">{text}</span>;
  }

  // For long text, show truncated version with a link to open modal
  const truncatedText = `${text.substring(0, maxLength)}...`;

  return (
    <div className="flex flex-col">
      <span className="whitespace-normal break-words">{truncatedText}</span>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="link"
            className="p-0 h-auto text-blue-600 hover:text-blue-800 mt-1 w-fit"
            onClick={() => setIsOpen(true)}
          >
            View Full Description
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Description</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto py-4">
            <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {text}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}