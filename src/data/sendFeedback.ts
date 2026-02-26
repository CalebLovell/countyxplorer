import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const feedbackSchema = z.object({
	message: z.string().min(1).max(5000),
});

export const sendFeedback = createServerFn({
	method: "POST",
})
	.inputValidator(feedbackSchema)
	.handler(async ({ data: _data }) => {
		// Feedback collection is currently disabled
		return { success: true };
	});

