"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.succsesResponse = void 0;
const succsesResponse = ({ res, statusCode = 200, message = "Done", info, data }) => {
    return res.status(statusCode).json({
        message,
        info,
        statusCode,
        data
    });
};
exports.succsesResponse = succsesResponse;
