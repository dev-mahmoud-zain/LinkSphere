import { FlattenMaps, HydratedDocument, Model, ProjectionType } from "mongoose";
import { DataBaseRepository } from "./database.repository";
import { IChat } from "../models";
import { RootFilterQuery } from "mongoose";
import { QueryOptions } from "mongoose";

export class ChatRepository extends DataBaseRepository<IChat> {
    constructor(protected override readonly model: Model<IChat>) {
        super(model)
    }


    async findOneChat({
        filter,
        select,
        options,
        page = 1,
        size = 5
    }: {
        filter?: RootFilterQuery<IChat>,
        select?: ProjectionType<IChat> | null,
        options?: QueryOptions<IChat> & { populate?: any } | null,
        page?: number | undefined,
        size?: number | undefined
    }): Promise<
        HydratedDocument<FlattenMaps<IChat>>
        | HydratedDocument<IChat>
        | null> {

        page = Math.floor(!page || page < 1 ? 1 : page);
        size = Math.floor(size < 1 || !size ? 5 : size);


        const doc = this.model.findOne(filter, {
            messages: { $slice: [-(page * size), size] }
        });


        if (options?.lean) {
            doc.lean(options.lean)
        }

        if (options?.populate) {
            doc.populate(options.populate);
        }
        return await doc.exec();
    }
}