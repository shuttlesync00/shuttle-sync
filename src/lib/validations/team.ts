import { z } from "zod";

export const teamSchema = z.object({
  name: z.string().trim().min(2, "Team name is required."),
  logoUrl: z.string().url().optional().or(z.literal("")),
  category: z.enum(["SINGLES", "DOUBLES", "MIXED_DOUBLES"]),
  // `playerIds` will be populated from the entered player name(s) before submit.
  // Make optional so client-side zod resolver does not block while the user
  // fills the name inputs; we validate counts in the submit handler.
  playerIds: z.array(z.string()).optional(),
});

export type TeamFormValues = z.infer<typeof teamSchema>;
