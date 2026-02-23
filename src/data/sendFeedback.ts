import { createServerFn } from "@tanstack/react-start";
import { Resend } from "resend";
import { z } from "zod";
import { env } from "~/env";

const feedbackSchema = z.object({
	message: z.string().min(1).max(5000),
});

export const sendFeedback = createServerFn({
	method: "POST",
})
	.inputValidator(feedbackSchema)
	.handler(async ({ data }) => {
		const resend = new Resend(env.RESEND_API_KEY);

		const { error } = await resend.emails.send({
			from: "Latamap Feedback <noreply@feedback.latamap.com>",
			to: "caleblovell1@gmail.com",
			subject: "Latamap Feedback",
			text: data.message,
		});

		if (error) {
			throw new Error("Failed to send feedback");
		}

		return { success: true };
	});
