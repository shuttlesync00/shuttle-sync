import { z } from "zod";

export const playerSchema = z.object({
  photoUrl: z.string().url().optional().or(z.literal("")),
  fullName: z.string().trim().min(2, "Full name is required."),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  dateOfBirth: z.string().min(1, "Date of birth is required."),
  phoneNumber: z.string().trim().min(7, "Mobile number is required."),
  email: z.string().trim().email("Please enter a valid email address.").optional().or(z.literal("")),
  preferredHand: z.enum(["RIGHT", "LEFT"]),
  playingLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"]),
  city: z.string().trim().min(1, "City is required."),
  state: z.string().trim().min(1, "State is required."),
  country: z.string().trim().min(1, "Country is required."),
});

export type PlayerFormValues = z.infer<typeof playerSchema>;
