// All transactional email functions. Keep email logic here, not scattered in server actions.
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function sendJobPostedNotification(adminEmail: string, jobId: string) {
  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: "New job posted -- action required",
    html: `<p>A new job has been posted. <a href="${APP_URL}/admin/jobs/${jobId}">Review and assign a cleaner.</a></p>`,
  });
}

export async function sendJobMatchedClient(clientEmail: string, jobId: string) {
  await resend.emails.send({
    from: FROM,
    to: clientEmail,
    subject: "Your cleaner has been matched",
    html: `<p>Great news -- a cleaner has been matched to your job. <a href="${APP_URL}/client/jobs/${jobId}">View your booking.</a></p>`,
  });
}

export async function sendJobMatchedCleaner(cleanerEmail: string, jobId: string) {
  await resend.emails.send({
    from: FROM,
    to: cleanerEmail,
    subject: "You have been assigned a new job",
    html: `<p>You have been assigned a new cleaning job. <a href="${APP_URL}/cleaner/jobs/${jobId}">View the details.</a></p>`,
  });
}

export async function sendReviewRequest(clientEmail: string, jobId: string) {
  await resend.emails.send({
    from: FROM,
    to: clientEmail,
    subject: "How did your clean go?",
    html: `<p>Your cleaning job is complete. <a href="${APP_URL}/client/jobs/${jobId}">Leave a review.</a></p>`,
  });
}
