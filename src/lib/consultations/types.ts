import { z } from "zod";

export const consultationStatusSchema = z.enum([
  "pending",
  "in_progress",
  "closed",
]);

export type ConsultationStatus = z.infer<typeof consultationStatusSchema>;

export const messageDeliverySchema = z.enum(["pending", "sent"]);

export type MessageDelivery = z.infer<typeof messageDeliverySchema>;

export const chatMessageSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(2000),
  sentAt: z.string().min(1),
  sender: z.enum(["patient", "doctor"]),
  delivery: messageDeliverySchema,
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const conversationSchema = z.object({
  id: z.string().min(1),
  patientId: z.string().min(1),
  patientName: z.string().min(1).max(40),
  title: z.string().min(1).max(80),
  status: consultationStatusSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  messages: z.array(chatMessageSchema),
});

export type Conversation = z.infer<typeof conversationSchema>;

export type ConversationWithSenders = Omit<Conversation, "messages"> & {
  messages: Array<ChatMessage & { sender: "patient" | "doctor" }>;
};

export const STATUS_LABEL: Record<ConsultationStatus, string> = {
  pending: "Așteaptă răspuns medic",
  in_progress: "Medic în conversație",
  closed: "Consultație închisă",
};

export const DELIVERY_LABEL: Record<MessageDelivery, string> = {
  pending: "Așteaptă medic",
  sent: "Trimis medicului",
};
