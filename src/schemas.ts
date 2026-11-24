import { z } from "zod";

export const createTodoSchema = z.object({
  title: z.string().max(200).min(2).trim().nonempty("Title is required"),
});

export const updateTodoSchema = z
  .object({
    title: z
      .string()
      .max(200)
      .min(2)
      .trim()
      .nonempty("Title is required")
      .optional(),
    done: z.boolean().optional(),
  })
  .refine(
    (v) => Object.keys(v).length > 0,
    "At least one field must be provided for update",
  );
