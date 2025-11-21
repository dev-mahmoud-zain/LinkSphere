import { Request, Response } from "express";
import { successResponse } from "../../utils/response/success.response";
import { PostRepository, UserRepository } from "../../DataBase/repository";
import { PostModel, UserModel } from "../../DataBase/models";
import { postAvailability } from "../003-posts";

export class SearchService {
  private postModel = new PostRepository(PostModel);
  private userModel = new UserRepository(UserModel);

  constructor() {}

  search = async (req: Request, res: Response) => {
    let { page, limit, key } = req.query as unknown as {
      page: number;
      limit: number;
      key: string;
    };

    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 10;

    const words = key.trim().split(/\s+/);

    const nameQuery = words.map((word) => ({
      $or: [
        { firstName: { $regex: new RegExp(word, "i") } },
        { lastName: { $regex: new RegExp(word, "i") } },
      ],
    }));

    const [users, posts] = await Promise.all([
      await this.userModel.find({
        filter: {
          $and: nameQuery,
        },
        projection: {
          firstName: true,
          lastName: true,
          slug: true,
          picture: true,
          userName: true,
        },
        page: pageNum,
        limit: limitNum,
      }),

      this.postModel.find({
        filter: {
          $or: postAvailability(req),
          content: { $regex: new RegExp(key, "i") },
        },
        page: pageNum,
        limit: limitNum,
      }),
    ]);



    


    return successResponse({
      res,
      data: {
        users: {
          data: users.data,
          totalPages: users.pagination.totalPages,
          total: users.pagination.total,
        },
        posts: {
          data: posts.data,
          totalPages: posts.pagination.totalPages,
          total: posts.pagination.total,
        },
        page: pageNum,
        limit: limitNum,
      },
    });
  };
}
