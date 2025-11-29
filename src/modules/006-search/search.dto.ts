import z from "zod";
import { search } from "./search.validation";

export type SearchDto = z.infer<typeof search.query>;
