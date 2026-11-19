import { z } from 'zod';

export const BotActionCallbackSchema = z.object({
  token: z.string().min(1),
  action: z.enum(['taken', 'snooze']),
});
export type BotActionCallback = z.infer<typeof BotActionCallbackSchema>;

export const BotWebhookPayloadSchema = z.object({
  updateId: z.number().int().optional(),
  callbackQuery: z
    .object({
      id: z.string(),
      data: z.string(),
      from: z.object({
        id: z.number().int(),
        username: z.string().optional(),
        firstName: z.string().optional(),
      }),
    })
    .optional(),
  message: z
    .object({
      messageId: z.number().int(),
      text: z.string().optional(),
      chat: z.object({
        id: z.number().int(),
      }),
    })
    .optional(),
});
export type BotWebhookPayload = z.infer<typeof BotWebhookPayloadSchema>;
