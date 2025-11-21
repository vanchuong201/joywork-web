"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import PostCard, { type PostCardData } from "@/components/feed/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuth";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";

type PostResponse = { data: { post: PostCardData } };

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const postId = params?.id as string;
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { openPrompt } = useAuthPrompt();

  const query = useQuery<PostResponse>({
    queryKey: ["post", postId],
    enabled: Boolean(postId),
    queryFn: async () => {
      const res = await api.get(`/api/posts/${postId}`);
      return res.data as PostResponse;
    },
  });

  const like = useMutation({
    mutationFn: async (p: PostCardData) => {
      if (p.isLiked) await api.delete(`/api/posts/${p.id}/like`);
      else await api.post(`/api/posts/${p.id}/like`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post", postId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Thao tác thất bại"),
  });

  const handleLike = (p: PostCardData) => {
    if (!user) {
      openPrompt("like");
      return;
    }
    like.mutate(p);
  };

  if (query.isLoading || !query.data) {
    return <Skeleton className="h-40 rounded-lg" />;
  }

  const post = query.data.data.post;
  return (
    <div className="mx-auto max-w-2xl">
      <PostCard post={post} onLike={() => handleLike(post)} />
    </div>
  );
}


