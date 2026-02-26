import { toast } from "sonner";

export const ShareButton = () => {
	const handleShare = () => {
		navigator.clipboard
			.writeText(window.location.href)
			.then(() => toast.success("Link copied to clipboard!"))
			.catch(() => toast.error("Failed to copy link"));
	};

	return (
		<button
			type="button"
			onClick={handleShare}
			className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/90 px-3 py-1.5 text-gray-600 text-xs shadow-sm backdrop-blur-sm transition-all hover:border-indigo-300 hover:text-indigo-700"
		>
			<svg
				className="h-3.5 w-3.5"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
				/>
			</svg>
			Share
		</button>
	);
};
