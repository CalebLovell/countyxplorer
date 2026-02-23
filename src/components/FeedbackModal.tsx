import {
	Description,
	Dialog,
	DialogPanel,
	DialogTitle,
	Transition,
	TransitionChild,
} from "@headlessui/react";
import { useMutation } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { sendFeedback } from "~/data/sendFeedback";

const route = getRouteApi("/");

export const FeedbackModal = () => {
	const { feedbackModal } = route.useSearch();
	const navigate = useNavigate();
	const [message, setMessage] = useState("");

	const close = () => {
		navigate({
			from: "/",
			search: (prev) => ({ ...prev, feedbackModal: false }),
		});
		setMessage("");
	};

	const handleClose = () => {
		if (message.trim() && !window.confirm("Discard your feedback?")) return;
		close();
	};

	const mutation = useMutation({
		mutationFn: (msg: string) =>
			Promise.all([
				sendFeedback({ data: { message: msg } }),
				new Promise((r) => setTimeout(r, 1000)),
			]).then(([result]) => result),
		onSuccess: () => {
			close();
			toast.success("Thank you for your feedback!");
		},
		onError: () => {
			toast.error("Something went wrong. Please try again.");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		mutation.mutate(message.trim());
	};

	return (
		<Transition appear show={feedbackModal}>
			<Dialog
				onClose={handleClose}
				className="fixed top-0 left-0 z-40 h-full w-full overflow-y-auto overflow-x-hidden text-gray-800"
			>
				<TransitionChild
					as="div"
					enter="ease-out duration-300"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-200"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
					className="fixed inset-0 bg-black/75"
					aria-hidden="true"
				/>

				<TransitionChild
					as="div"
					enter="ease-out duration-300"
					enterFrom="opacity-0 scale-95"
					enterTo="opacity-100 scale-100"
					leave="ease-in duration-200"
					leaveFrom="opacity-100 scale-100"
					leaveTo="opacity-0 scale-95"
					className="relative mx-auto flex h-full w-full max-w-3xl items-center px-2 py-14"
				>
					<DialogPanel className="relative flex max-h-full w-full flex-col overflow-hidden rounded border-none bg-gray-100">
						<div className="flex shrink-0 items-center justify-between rounded-t border-gray-300 border-b p-4">
							<DialogTitle className="font-bold text-2xl">
								Send Feedback
							</DialogTitle>
						</div>
						<form onSubmit={handleSubmit}>
							<div className="relative flex-auto overflow-y-auto p-4">
								<Description className="mb-3 text-sm">
									Have a comment, suggestion, or found an error? Let me know!
								</Description>
								<textarea
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									placeholder="Type your feedback here..."
									rows={5}
									required
									disabled={mutation.isPending}
									className="w-full resize-none rounded border border-gray-300 bg-white p-3 text-sm placeholder:text-gray-400 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 disabled:opacity-50"
								/>
							</div>
							<div className="flex shrink-0 flex-wrap items-center justify-end gap-2 rounded-b border-gray-300 border-t p-4">
								<button
									type="button"
									onClick={handleClose}
									className="flex items-center rounded bg-gray-800 px-6 py-2.5 font-medium text-white text-xs uppercase leading-tight transition duration-150 ease-in-out hover:scale-105 hover:bg-gray-900 focus:border-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2 active:bg-gray-800"
								>
									Close
								</button>
								<button
									type="submit"
									disabled={mutation.isPending}
									className="flex items-center rounded bg-blue-800 px-6 py-2.5 font-medium text-white text-xs uppercase leading-tight transition duration-150 ease-in-out hover:scale-105 hover:bg-blue-700 focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2 active:bg-blue-600"
								>
									{mutation.isPending ? "Submitting..." : "Submit"}
									{mutation.isPending && <LoadingSpinner />}
								</button>
							</div>
						</form>
					</DialogPanel>
				</TransitionChild>
			</Dialog>
		</Transition>
	);
};
