import z from "zod";

export const search = {
  query: z.strictObject({
    key: z.string().nonempty({ message: "You must provide a search keyword" }),
    users_page: z.coerce.number().positive().min(1).max(10).optional().default(1),
    users_limit: z.coerce.number().positive().min(1).max(50).optional().default(10),
    posts_page: z.coerce.number().positive().min(1).max(10).optional().default(1),
    posts_limit: z.coerce.number().positive().min(1).max(50).optional().default(10),
  }),
};
