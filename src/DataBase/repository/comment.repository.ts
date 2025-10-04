import { Model } from "mongoose";
import { IComment } from "../models";
import { DataBaseRepository } from "./database.repository";

export class CommentRepository extends DataBaseRepository<IComment> {
    constructor(protected override readonly model: Model<IComment>) {
        super(model)
    }
}
