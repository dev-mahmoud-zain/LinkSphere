
import z from "zod";
import *  as  validators from "../posts.validation";


export type I_CreatePostInputs = z.infer<typeof validators.createPost.body>
