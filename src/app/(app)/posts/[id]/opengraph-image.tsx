import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
	width: 1200,
	height: 630,
};

type Company = { name?: string | null; logoUrl?: string | null };
type Post = { title?: string | null; company?: Company | null };
type PostResponse = { data: { post: Post } };

export default async function Image({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
	const siteName = "JoyWork";

	let title = "Bài viết trên JoyWork";
	let companyName: string | undefined;
	let logoUrl: string | undefined;

	try {
		const res = await fetch(`${apiBase}/api/posts/${id}`, { cache: "no-store", next: { revalidate: 0 } });
		if (res.ok) {
			const json = (await res.json()) as PostResponse;
			const post = json?.data?.post;
			if (post?.title) title = post.title;
			if (post?.company?.name) companyName = post.company.name;
			if (post?.company?.logoUrl) logoUrl = post.company.logoUrl;
		}
	} catch {
		// fallback keep defaults
	}

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					background:
						"linear-gradient(135deg, #0ea5e9 0%, #22c55e 35%, #7c3aed 70%, #18181b 100%)",
					padding: 48,
				}}
			>
				<div style={{ display: "flex", gap: 24, alignItems: "center" }}>
					{logoUrl ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={logoUrl}
							alt={companyName || siteName}
							width={96}
							height={96}
							style={{
								borderRadius: 16,
								background: "#ffffff",
								objectFit: "cover",
								border: "2px solid rgba(255,255,255,0.3)",
							}}
						/>
					) : (
						<div
							style={{
								width: 96,
								height: 96,
								borderRadius: 16,
								background: "rgba(255,255,255,0.2)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: "#fff",
								fontSize: 40,
								fontWeight: 700,
							}}
						>
							J
						</div>
					)}
					<div style={{ display: "flex", flexDirection: "column" }}>
						<div
							style={{
								fontSize: 40,
								color: "#e4e4e7",
								fontWeight: 500,
							}}
						>
							{companyName || siteName}
						</div>
						<div
							style={{
								fontSize: 24,
								color: "#c7c7cc",
								marginTop: 6,
							}}
						>
							Chia sẻ hoạt động mới
						</div>
					</div>
				</div>

				<div
					style={{
						fontSize: 72,
						color: "#ffffff",
						fontWeight: 800,
						lineHeight: 1.15,
						textShadow: "0 8px 24px rgba(0,0,0,0.35)",
						whiteSpace: "pre-wrap",
					}}
				>
					{title}
				</div>

				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<div
						style={{
							color: "#e4e4e7",
							fontSize: 28,
							fontWeight: 600,
						}}
					>
						{siteName}
					</div>
					<div
						style={{
							color: "#d4d4d8",
							fontSize: 20,
							fontWeight: 500,
						}}
					>
						www.joywork.vn
					</div>
				</div>
			</div>
		),
		{
			...size,
		},
	);
}


