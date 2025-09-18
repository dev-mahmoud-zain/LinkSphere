"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataBaseRepository = void 0;
const error_response_1 = require("../../utils/response/error.response");
class DataBaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create({ data, options }) {
        return await this.model.create(data, options);
    }
    async findOne({ filter, select, options }) {
        const doc = this.model.findOne(filter).select(select || "");
        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }
    async find({ filter = {}, projection = null, options = {}, page = 1, limit = 10, sort = {} }) {
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
                page,
                totalPages: Math.ceil(total / limit),
                limit,
                totalPosts: total
            }
        };
    }
    async updateOne(filter, updateData, options) {
        if (Array.isArray(updateData)) {
            updateData.push({
                $set: {
                    __v: { $add: ["$__v", 1] }
                },
            });
            return await this.model.updateOne(filter || {}, updateData, options);
        }
        return await this.model.updateOne(filter || {}, {
            ...updateData,
            $inc: { __v: 1 }
        }, options);
    }
    async findOneAndUpdate({ filter, updateData, options }) {
        const updatedDoc = await this.model.findOneAndUpdate(filter, {
            ...updateData,
            $inc: { __v: 1 }
        }, options).exec();
        if (!updatedDoc) {
            throw new error_response_1.NotFoundException("Document not found");
        }
        return updatedDoc;
    }
    async updateMany(filter, updateData, options = {}) {
        return this.model.updateMany(filter, updateData, options).exec();
    }
    async deleteOne(filter) {
        return this.model.deleteOne(filter);
    }
}
exports.DataBaseRepository = DataBaseRepository;
