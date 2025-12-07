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
		// Trong môi trường server-side của Next.js (đặc biệt là khi chạy local trong Docker container),
		// việc gọi đến 'http://localhost:4000' có thể thất bại nếu container không phân giải được 'localhost'.
		// Tuy nhiên, nếu chạy npm run dev ở máy host thì ok.
		// Để chắc chắn, in ra URL đang fetch để debug.
		const fetchUrl = `${apiBase}/api/posts/${id}`;
		console.log("Fetching metadata from:", fetchUrl);

		const res = await fetch(fetchUrl, {
			cache: "no-store",
			next: { revalidate: 0 },
		});
		
		if (res.ok) {
			const json = (await res.json()) as PostResponse;
			// Quan trọng: cần kiểm tra kỹ cấu trúc trả về.
			// API: { data: { post: { ... } } }
			post = json?.data?.post ?? null;
			// Debug: in ra ảnh lấy được
			console.log("Metadata fetch success. Images count:", post?.images?.length, "Cover:", post?.coverUrl);
		} else {
			console.error("Metadata fetch failed:", res.status, res.statusText);
		}
	} catch (e) {
		console.error("Metadata fetch error:", e);
	}

	const baseTitle = post?.title?.trim();
	const siteName = "JoyWork";
	const title = baseTitle
		? `${baseTitle} - ${post?.company?.name ?? siteName}`
		: `Bài viết trên ${siteName}`;
	const rawDesc = (post?.content ?? "").replace(/\s+/g, " ").trim();
	const description = rawDesc.length > 0 ? rawDesc.slice(0, 160) : `${post?.company?.name ?? siteName} - Chia sẻ hoạt động mới`;
	
	// Ưu tiên ảnh từ post -> cover -> logo
	let imageObj: { url: string; width?: number | null; height?: number | null } | undefined = undefined;
	
	if (post?.images && Array.isArray(post.images) && post.images.length > 0) {
		const img = post.images[0];
		if (img && img.url) {
			imageObj = { url: img.url, width: img.width, height: img.height };
		}
	} 
	
	if (!imageObj && post?.coverUrl) {
		imageObj = { url: post.coverUrl, width: 1200, height: 630 };
	} 
	
	if (!imageObj && post?.company?.logoUrl) {
		imageObj = { url: post.company.logoUrl, width: 200, height: 200 };
	}

	// Fallback ảnh OG động (PNG) được sinh từ route /posts/[id]/opengraph-image
	const ogDynamicImage = `${appBase}/posts/${id}/opengraph-image`;
	
	// Logic chọn URL: nếu imageObj tồn tại -> dùng URL của nó. Nếu không -> dùng ảnh động.
	// Quan trọng: cần đảm bảo imageUrl nhận đúng giá trị từ imageObj.url nếu có.
	let imageUrl = ogDynamicImage;
	if (imageObj && imageObj.url) {
		imageUrl = imageObj.url;
	}

	// Nếu dùng ảnh thật, ưu tiên thông số thật. Nếu không, fallback về 1200x630
	const imageWidth = imageObj?.width || 1200;
	const imageHeight = imageObj?.height || 630;

	console.log("Final OG Image URL:", imageUrl);

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
			images: imageUrl
				? [
						{
							url: imageUrl,
							width: imageWidth,
							height: imageHeight,
							alt: title,
						},
				  ]
				: undefined,
			locale: "vi_VN",
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: imageUrl ? [imageUrl] : undefined,
		},
		other: {
			...(publisher ? { "article:publisher": publisher } : {}),
		},
	};
}

export default function PostLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}


