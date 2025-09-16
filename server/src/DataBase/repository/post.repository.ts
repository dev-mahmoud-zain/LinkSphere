import { Model } from "mongoose";
import { IPost } from "../models/post.model";
import { DataBaseRepository } from "./database.repository"

export class PostRepository extends DataBaseRepository<IPost> {
    constructor(protected override readonly model: Model<IPost>) {
        super(model)
    }
}