import React, { useState } from "react";
import CommentComponent from "./comment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import type { Comment } from "@/lib/types";
import { toast } from "sonner";

interface CommentListProps {
  comments: Comment[];
  imageId: string;
  onClose: () => void;
}

const CommentList: React.FC<CommentListProps> = ({
  comments: initialComments,
  onClose,
  imageId,
}) => {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const { user: currentUser } = useUser();
  const avatarUrl = currentUser?.imageUrl;

  // const handleCloseComment = (id: string) => {
  //   setVisibleComments(prev => prev.filter(commentId => commentId !== id));
  // };

  // const handleSubmitComment = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!newComment.trim()) return;

  //   const newCommentObj: CommentProps = {
  //     id: `comment-${Date.now()}`,
  //     user: {
  //       username: 'Current User',
  //       // avatar: '/placeholder.svg',
  //     },
  //     content: newComment,
  //   };

  //   setComments(prev => [newCommentObj, ...prev]);
  //   setVisibleComments(prev => [newCommentObj.id, ...prev]);
  //   setNewComment('');
  // };
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch("/api/images/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId: imageId, // pass this via props
          content: newComment,
        }),
      });

      const data = await res.json();

      const newCommentObj: Comment = {
        id: data.comment.id,
        content: data.comment.content,
        user: {
          username: data.comment.user.username,
          // avatar: data.comment.user.imageUrl,
        },
      };
      setComments((prev) => [newCommentObj, ...prev]);

      // setVisibleComments((prev) => [newCommentObj.id, ...prev]);
      setNewComment("");
      toast.success("Comment posted!");
    } catch (error) {
      console.error("Error posting comment", error);
    }
  };

  const handleCloseAll = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div
      className={cn(
        " dark:bg-gray-900 p-4 max-w-2xl mx-auto transition-all", //border rounded-lg
        isClosing && "animate-fade-out"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Comments</h3>
        <Button variant="ghost" size="sm" onClick={handleCloseAll}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Add comment form */}
      <form onSubmit={handleSubmitComment} className="flex gap-3 mb-6">
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarUrl} alt="Your avatar" />
          <AvatarFallback>~</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1"
          />
          <Button type="submit">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentComponent
            key={comment.id}
            id={comment.id}
            content={comment.content}
            user={comment.user}
          />
        ))}
        {comments.length === 0 && (
          <p className="text-center text-muted-foreground py-6">
            No comments to display
          </p>
        )}
      </div>
    </div>
  );
};

export default CommentList;