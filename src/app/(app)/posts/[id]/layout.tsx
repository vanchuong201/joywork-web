import type { Metadata } from "next";
import React from "react";

type PostImage = { url: string; width?: number | null; height?: number | null; order?: number | null };
type Company = { name: string; slug: string; logoUrl?: string | null };
type Post = {
	id: string;
	title?: string | null;
	content?: string | null;
	publishedAt?: string | null;
	coverUrl?: string | null;
	images?: PostImage[] | null;
	company?: Company | null;
};
type PostResponse = { data: { post: Post } };

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
	const appBase = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

	let post: Post | null = null;
	try {
		const res = await fetch(`${apiBase}/api/posts/${id}`, {
			cache: "no-store",
			next: { revalidate: 0 },
		});
		if (res.ok) {
			const json = (await res.json()) as PostResponse;
			post = json?.data?.post ?? null;
		}
	} catch {
		// ignore — fallback metadata below
	}

	const baseTitle = post?.title?.trim();
	const siteName = "JoyWork";
	const title = baseTitle
		? `${baseTitle} - ${post?.company?.name ?? siteName}`
		: `Bài viết trên ${siteName}`;
	const rawDesc = (post?.content ?? "").replace(/\s+/g, " ").trim();
	const description = rawDesc.length > 0 ? rawDesc.slice(0, 160) : `${post?.company?.name ?? siteName} - Chia sẻ hoạt động mới`;
	const imageCandidate =
		post?.coverUrl ||
		(post?.images && post.images.length > 0 ? post.images[0]?.url : undefined) ||
		post?.company?.logoUrl ||
		undefined;
	// Fallback ảnh OG động (PNG) được sinh từ route /posts/[id]/opengraph-image
	const ogDynamicImage = `${appBase}/posts/${id}/opengraph-image`;
	const image = imageCandidate || ogDynamicImage;
	const publisher = process.env.NEXT_PUBLIC_FB_PUBLISHER;
	const url = `${appBase}/posts/${id}`;

	return {
		title,
		description,
		alternates: { canonical: url },
		openGraph: {
			title,
			description,
			url,
			siteName,
			type: "article",
			publishedTime: post?.publishedAt ?? undefined,
			images: image ? [{ url: image }] : undefined,
			locale: "vi_VN",
		},
		twitter: {
			card: image ? "summary_large_image" : "summary",
			title,
			description,
			images: image ? [image] : undefined,
		},
		other: {
			...(publisher ? { "article:publisher": publisher } : {}),
		},
	};
}

export default function PostLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}


