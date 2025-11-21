import z from "zod";

export const search = {
  query: z
    .strictObject({
      key: z.string().nonempty({message:"You must provide a search keyword"}),
      page: z.coerce.number().positive().min(1).max(10).optional(),
      limit: z.coerce.number().positive().min(1).max(50).optional(),
    })
};