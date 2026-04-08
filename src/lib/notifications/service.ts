import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";

type NotificationType =
  | "TICKET_ASSIGNED"
  | "TICKET_UPDATED"
  | "NEW_MESSAGE"
  | "TICKET_MENTIONED"
  | "SLA_AT_RISK"
  | "SLA_BREACHED"
  | "TICKET_RESOLVED"
  | "TICKET_TRANSFERRED";

interface NotifyInput {
  type: NotificationType;
  ticketId: string;
  actorId?: string;
  title: string;
  body?: string;
}

/**
 * Creates in-app notifications and queues email notifications.
 * Determines who to notify based on the event type.
 */
export async function notify(input: NotifyInput): Promise<void> {
  const supabase = getSupabase();

  // Get ticket to determine who to notify
  const { data: ticket } = await supabase
    .from("Ticket")
    .select("requesterId, assigneeId, assignedTeamId")
    .eq("id", input.ticketId)
    .single();

  if (!ticket) return;

  const recipients = new Set<string>();

  switch (input.type) {
    case "TICKET_ASSIGNED":
      if (ticket.assigneeId) recipients.add(ticket.assigneeId);
      break;

    case "TICKET_UPDATED":
    case "TICKET_RESOLVED":
      recipients.add(ticket.requesterId);
      if (ticket.assigneeId) recipients.add(ticket.assigneeId);
      break;

    case "NEW_MESSAGE":
      recipients.add(ticket.requesterId);
      if (ticket.assigneeId) recipients.add(ticket.assigneeId);
      break;

    case "SLA_AT_RISK":
    case "SLA_BREACHED":
      // Notify assignee + team leads
      if (ticket.assigneeId) recipients.add(ticket.assigneeId);
      if (ticket.assignedTeamId) {
        const { data: leads } = await supabase
          .from("TeamMember")
          .select("userId")
          .eq("teamId", ticket.assignedTeamId)
          .in("role", ["LEAD", "ADMIN"]);
        for (const l of leads ?? []) recipients.add(l.userId);
      }
      break;

    case "TICKET_TRANSFERRED":
      if (ticket.assigneeId) recipients.add(ticket.assigneeId);
      recipients.add(ticket.requesterId);
      break;
  }

  // Don't notify the actor
  if (input.actorId) recipients.delete(input.actorId);

  // Create in-app notifications
  for (const userId of recipients) {
    await supabase.from("Notification").insert({
      id: randomUUID(),
      userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      ticketId: input.ticketId,
      actorId: input.actorId ?? null,
    });
  }

  // Queue email notifications
  for (const userId of recipients) {
    const { data: user } = await supabase
      .from("User")
      .select("email")
      .eq("id", userId)
      .single();

    if (user?.email) {
      // Build email threading headers
      const messageId = `<${randomUUID()}@ticketmaster.local>`;
      const threadRef = `<ticket-${input.ticketId}@ticketmaster.local>`;

      await supabase.from("NotificationOutbox").insert({
        id: randomUUID(),
        channel: "EMAIL",
        status: "PENDING",
        eventType: input.type,
        toEmail: user.email,
        toUserId: userId,
        ticketId: input.ticketId,
        subject: input.title,
        body: input.body ?? input.title,
        payload: { messageId, inReplyTo: threadRef, references: threadRef },
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

/**
 * Processes pending email notifications from the outbox.
 * In production, this would use nodemailer/SMTP.
 * For now, it marks them as SENT (placeholder).
 */
export async function processEmailOutbox(): Promise<{ processed: number; failed: number }> {
  const supabase = getSupabase();

  const { data: pending } = await supabase
    .from("NotificationOutbox")
    .select("*")
    .eq("status", "PENDING")
    .order("createdAt", { ascending: true })
    .limit(50);

  if (!pending || pending.length === 0) {
    return { processed: 0, failed: 0 };
  }

  let processed = 0;
  let failed = 0;

  for (const email of pending) {
    try {
      // TODO: Replace with actual SMTP sending via nodemailer
      // For now, mark as SENT
      console.log(`[Email] To: ${email.toEmail} | Subject: ${email.subject}`);

      await supabase
        .from("NotificationOutbox")
        .update({
          status: "SENT",
          sentAt: new Date().toISOString(),
          attempts: (email.attempts ?? 0) + 1,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", email.id);

      processed++;
    } catch (error) {
      await supabase
        .from("NotificationOutbox")
        .update({
          status: "FAILED",
          lastError: error instanceof Error ? error.message : "Unknown error",
          attempts: (email.attempts ?? 0) + 1,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", email.id);

      failed++;
    }
  }

  return { processed, failed };
}
