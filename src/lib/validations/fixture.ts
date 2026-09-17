import { z } from "zod";

export const fixtureSchema = z.object({
  category: z.enum(["SINGLES", "DOUBLES", "MIXED_DOUBLES"]),
  bestOf: z.number().int().min(1).max(5),
  teamAId: z.string().optional().or(z.literal("")),
  teamBId: z.string().optional().or(z.literal("")),
  playerAId: z.string().optional().or(z.literal("")),
  playerBId: z.string().optional().or(z.literal("")),
  court: z.string().optional().or(z.literal("")),
  date: z.string().min(1, "Date is required."),
  time: z.string().min(1, "Time is required."),
  notes: z.string().optional(),
}).refine((data) => data.category === "SINGLES" ? Boolean(data.playerAId && data.playerBId && data.playerAId !== data.playerBId) : Boolean(data.teamAId && data.teamBId && data.teamAId !== data.teamBId), {
  message: "Team A and Team B must be different.",
  path: ["teamBId"],
});

export type FixtureFormValues = z.infer<typeof fixtureSchema>;
