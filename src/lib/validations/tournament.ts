import { z } from "zod";

export const tournamentSchema = z.object({
  name: z.string().trim().min(2, "Tournament name is required."),
  city: z.string().trim().min(2, "City is required."),
  ground: z.string().trim().min(2, "Ground is required."),
  organizerName: z.string().trim().min(2, "Organizer name is required."),
  organizerPhone: z.string().trim().min(7, "Organizer phone is required."),
  organizerEmail: z.string().trim().email("Enter a valid organizer email."),
  startDate: z.string().min(1, "Start date is required."),
  endDate: z.string().min(1, "End date is required."),
  type: z.enum(["OPEN", "CORPORATE", "COMMUNITY", "COLLEGE", "UNIVERSITY", "SCHOOL", "SERIES", "OTHER"]),
  matchCategories: z.array(z.enum(["SINGLES", "DOUBLES", "MIXED_DOUBLES"])).min(1, "Select at least one match category."),
  shuttleType: z.enum(["PLASTIC", "FEATHER"]),
  bestOf: z.number().int().min(1).max(5),
  description: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return !data.startDate || !data.endDate || start <= end;
}, {
  path: ["endDate"],
  message: "End date must be the same or after the start date.",
});

export type TournamentFormValues = z.infer<typeof tournamentSchema>;
