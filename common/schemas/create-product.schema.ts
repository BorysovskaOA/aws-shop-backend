import z from "zod";

export const CreateProductSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  price: z.coerce.number().int().positive(),
  count: z.coerce.number().int().nonnegative().default(0),
});
