import { Request, Response } from "express";
import { successResponse } from "../../utils/response/success.response";
import { PostRepository, UserRepository } from "../../DataBase/repository";
import { PostModel, UserModel } from "../../DataBase/models";
import { postAvailability } from "../003-posts";
import { SearchDto } from "./search.dto";
import { search } from "./search.validation";

export class SearchService {
  private postModel = new PostRepository(PostModel);
  private userModel = new UserRepository(UserModel);

  constructor() {}

  search = async (req: Request, res: Response) => {
    const { key, users_limit, users_page, posts_limit, posts_page } =
      search.query.parse(req.query);

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
        page: users_page,
        limit: users_limit,
      }),

      this.postModel.find({
        filter: {
          $or: postAvailability(req),
          content: { $regex: new RegExp(key, "i") },
        },
        page: posts_page,
        limit: posts_limit,
      }),
    ]);

    return successResponse({
      res,
      data: {
        users: {
          data: users.data,
          pagination: users.pagination,
        },
        posts: {
          data: posts.data,
          pagination: posts.pagination,
        },
      },
    });
  };
}
