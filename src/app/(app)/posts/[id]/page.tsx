"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import PostCard, { type PostCardData } from "@/components/feed/PostCard";
import { Skeleton } from "@/components/ui/skeleton";

type PostResponse = { data: { post: PostCardData } };

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const postId = params?.id as string;

  const query = useQuery<PostResponse>({
    queryKey: ["post", postId],
    enabled: Boolean(postId),
    queryFn: async () => {
      const res = await api.get(`/api/posts/${postId}`);
      return res.data as PostResponse;
    },
  });

  if (query.isLoading || !query.data) {
    return <Skeleton className="h-40 rounded-lg" />;
  }

  const post = query.data.data.post;
  return (
    <div className="mx-auto max-w-2xl">
      <PostCard post={post} />
    </div>
  );
}


