import { UpdateOptions } from "mongodb";
import {
    CreateOptions,
    FilterQuery,
    FlattenMaps,
    HydratedDocument,
    Model,
    ProjectionType,
    QueryOptions,
    RootFilterQuery,
    UpdateQuery
} from "mongoose";
import { NotFoundException } from "../../utils/response/error.response";

export abstract class DataBaseRepository<TDocument> {
    constructor(protected readonly model: Model<TDocument>) { }

    async create({ data, options }: {
        data: Partial<TDocument>[];
        options?: CreateOptions | undefined;
    }): Promise<HydratedDocument<TDocument>[] | undefined> {
        return await this.model.create(data, options)
    }

    async findOne({
        filter,
        select,
        options
    }: {
        filter?: RootFilterQuery<TDocument>,
        select?: ProjectionType<TDocument> | null,
        options?: QueryOptions<TDocument> | null
    }): Promise<
        HydratedDocument<FlattenMaps<TDocument>>
        | HydratedDocument<TDocument>
        | null> {

        const doc = this.model.findOne(filter).select(select || "");
        if (options?.lean) {
            doc.lean(options.lean)
        }

        return await doc.exec();
    }

    async find({
        filter = {},
        projection = null,
        options = {},
        page = 1,
        limit = 10,
        sort = {}
    }: {
        filter?: FilterQuery<TDocument>,
        projection?: ProjectionType<TDocument> | null,
        options?: QueryOptions,
        page?: number,
        limit?: number,
        sort?: Record<string, 1 | -1>
    }) {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.model.find(filter, projection, {
                ...options,
                skip,
                limit,
                sort
            }).exec(),
            this.model.countDocuments(filter).exec()
        ]);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async updateOne(
        filter: FilterQuery<TDocument>,
        updateData: UpdateQuery<TDocument>,
        options: QueryOptions = { new: true }
    ): Promise<HydratedDocument<TDocument>> {
        
        const updatedDoc = await this.model.findOneAndUpdate(
            filter,
            {
                ...updateData,
                $inc: { __v: 1 }
            },
            options
        ).exec();

        if (!updatedDoc) {
            throw new NotFoundException("Document not found");
        }

        return updatedDoc;
    }

    async updateMany(
        filter: FilterQuery<TDocument>,
        updateData: UpdateQuery<TDocument>,
        options: UpdateOptions = {} // مخصوص لـ updateMany
    ) {
        return this.model.updateMany(filter, updateData, options).exec();
    }

    async deleteOne(
         filter: FilterQuery<TDocument>
    ){
        return this.model.deleteOne(filter)
    }

}