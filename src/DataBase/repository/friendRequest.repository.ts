import { IFriendRequest } from "../models/friendRequest.model";
import { DataBaseRepository } from "./database.repository";
import { Model } from "mongoose";

export class FriendRequestRepository extends DataBaseRepository<IFriendRequest> {

    constructor(protected override readonly model: Model<IFriendRequest>) {
        super(model)
    }

}