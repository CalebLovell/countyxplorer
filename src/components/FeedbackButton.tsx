import { getRouteApi, useNavigate } from "@tanstack/react-router";

const route = getRouteApi("/$layer");

export const FeedbackButton = () => {
	const feedbackModal = true;
	const search = route.useSearch();
	const navigate = useNavigate();

	if (feedbackModal) return null;

	return (
		<button
			type="button"
			onClick={() =>
				navigate({
					from: "/$layer",
					search: { ...search, feedbackModal: true },
				})
			}
			className="-translate-y-1/2 fixed top-2/5 right-0 rounded-l-md border border-gray-300 border-r-0 bg-white px-1.5 py-3 text-gray-900 text-xs shadow transition-colors hover:bg-blue-50 hover:text-blue-700"
		>
			<span className="rotate-180 [writing-mode:vertical-rl]">Feedback</span>
		</button>
	);
};
