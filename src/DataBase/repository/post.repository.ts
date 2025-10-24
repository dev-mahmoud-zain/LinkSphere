import { FilterQuery, Model, PopulateOptions, ProjectionType, QueryOptions } from "mongoose";
import { HPostDocument, IPost } from "../models/post.model";
import { DataBaseRepository } from "./database.repository"
import { CommentFlagEnum, CommentModel, HCommentDocument } from "../models";
import { CommentRepository } from "./comment.repository";

export class PostRepository extends DataBaseRepository<IPost> {

    private commentModel = new CommentRepository(CommentModel);


    constructor(protected override readonly model: Model<IPost>) {
        super(model)
    }

    async getPosts({
        filter = {},
        projection = null,
        options = {},
    }: {
        filter?: FilterQuery<IPost>,
        projection?: ProjectionType<IPost> | null,
        options?: QueryOptions,
    }) {

        const cursor = this.model.find(filter || {})
            .select(projection || "")
            .populate(options?.populate as PopulateOptions[]).cursor();


        let result: { post: HPostDocument, comments: HCommentDocument[] }[] = [];

        for (let post = await cursor.next(); post !== null; post = await cursor.next()) {

            const comments = await this.commentModel.find({
                filter: {
                    postId: post._id,
                    flag: CommentFlagEnum.comment
                }
            });

            result.push({ post, comments: comments.data })
        }

        return result;

    }





}

