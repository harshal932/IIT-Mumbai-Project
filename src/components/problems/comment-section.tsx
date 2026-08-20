"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { formatDistanceToNow } from "date-fns";
import type { CommentPublic } from "@/lib/types";
import { Send, ThumbsUp, ShieldAlert } from "lucide-react";

interface CommentSectionProps {
  problemId: string;
  comments: CommentPublic[];
  currentUser?: { id: string; name?: string | null; image?: string | null } | null;
  isClosed?: boolean;
  onCommentAdded?: () => void;
}

export function CommentSection({
  problemId,
  comments: initialComments,
  currentUser,
  isClosed = false,
  onCommentAdded,
}: CommentSectionProps) {
  const [commentList, setCommentList] = useState<CommentPublic[]>(initialComments);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/problems/${problemId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to post comment");
      }

      toast.success("Comment posted successfully");
      setContent("");

      // Optimistically insert into list
      const newComment: CommentPublic = {
        id: json.data?.id || crypto.randomUUID(),
        problemId,
        authorId: currentUser?.id || "",
        authorDisplayName: currentUser?.name || "You",
        authorImage: currentUser?.image || null,
        content: content.trim(),
        isHelpful: false,
        editedAt: null,
        createdAt: new Date().toISOString(),
      };
      setCommentList([newComment, ...commentList]);
      onCommentAdded?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to post comment";
      toast.error("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <span>Comments & Discussion</span>
        <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
          {commentList.length}
        </span>
      </h3>

      {/* Add comment form */}
      {!isClosed && currentUser ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3 items-start">
            <Avatar src={currentUser.image} name={currentUser.name} size="sm" />
            <div className="flex-1">
              <Textarea
                placeholder="Share information, offer insights, or give updates..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={2000}
                showCount
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              loading={submitting}
              disabled={!content.trim()}
            >
              <Send className="h-4 w-4 mr-1.5" />
              Post Comment
            </Button>
          </div>
        </form>
      ) : isClosed ? (
        <p className="text-sm text-gray-500 italic bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border">
          This problem is resolved or closed. Further comments are disabled.
        </p>
      ) : (
        <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-xl text-center">
          <p className="text-sm text-indigo-900 dark:text-indigo-200 mb-2">
            Log in to participate in the discussion and help solve this problem.
          </p>
          <a
            href="/login"
            className="inline-block bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Sign in to Comment
          </a>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 pt-2">
        {commentList.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            No comments yet. Be the first to share information!
          </p>
        ) : (
          commentList.map((c) => (
            <div
              key={c.id}
              className="flex gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-sm"
            >
              <Avatar src={c.authorImage} name={c.authorDisplayName} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {c.authorDisplayName}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line break-words">
                  {c.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
