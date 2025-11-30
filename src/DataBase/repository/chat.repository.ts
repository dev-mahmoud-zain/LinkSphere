import { HydratedDocument, Model, ProjectionType } from "mongoose";
import { DataBaseRepository } from "./database.repository";
import { IChat } from "../models";
import { RootFilterQuery } from "mongoose";
import { QueryOptions } from "mongoose";

export class ChatRepository extends DataBaseRepository<IChat> {
  constructor(protected override readonly model: Model<IChat>) {
    super(model);
  }

  async findOneChat({
    filter,
    select,
    options,
    page = 1,
    size = 5,
  }: {
    filter?: RootFilterQuery<IChat>;
    select?: ProjectionType<IChat> | null;
    options?: (QueryOptions<IChat> & { populate?: any }) | null;
    page?: number;
    size?: number;
  }): Promise<{
    chat: HydratedDocument<IChat> | null;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    page = !page || page < 1 ? 1 : Math.floor(page);
    size = !size || size < 1 ? 5 : Math.floor(size);

    // ----- 1) Total messages -----
    const total = await this.model
      .aggregate([
        { $match: filter || {} },
        { $project: { count: { $size: "$messages" } } },
      ])
      .then((r) => r[0]?.count || 0);

const projection: any = {
    messages: { $slice: [-(page * size), size] }
};

if (select && typeof select === "object") {
    Object.assign(projection, select);
}

const doc = this.model.findOne(filter, projection);


    if (options?.lean) doc.lean(options.lean);
    if (options?.populate) doc.populate(options.populate);

    const chat = await doc.exec();

    return {
      chat,
      pagination: {
        page,
        limit: size,
        total,
        totalPages: Math.ceil(total / size),
      },
    };
  }
}
