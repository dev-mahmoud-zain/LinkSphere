"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailEvent = void 0;
const node_events_1 = __importDefault(require("node:events"));
const sendEmail_js_1 = require("./sendEmail.js");
const email_template_js_1 = require("./email.template.js");
const error_response_js_1 = require("../response/error.response.js");
exports.emailEvent = new node_events_1.default();
exports.emailEvent.on("confirmEmail", async (data) => {
    try {
        data.html = await (0, email_template_js_1.confirmEmailTemplate)({ OTPCode: data.OTPCode });
        data.subject = "Confirm Your Email Address";
        await (0, sendEmail_js_1.sendEmail)(data);
    }
    catch (error) {
        console.log("Fail To Send Email", error);
        throw new error_response_js_1.ApplicationException("Something Went Wrong");
    }
});
exports.emailEvent.on("confirmUpdatedEmail", async (data) => {
    try {
        data.html = await (0, email_template_js_1.updateEmailTemplate)({ OTPCode: data.OTPCode });
        data.subject = "Confirm Your Updated Email Address";
        await (0, sendEmail_js_1.sendEmail)(data);
    }
    catch (error) {
        console.log("Fail To Send Email", error);
        throw new error_response_js_1.ApplicationException("Something Went Wrong");
    }
});
exports.emailEvent.on("enableTwoStepVerification", async (data) => {
    try {
        data.html = await (0, email_template_js_1.enableTwoStepVerificationTemplate)({ OTPCode: data.OTPCode });
        data.subject = "Enable Two-Step Verification – Action Required";
        await (0, sendEmail_js_1.sendEmail)(data);
    }
    catch (error) {
        console.log("Fail To Send Email", error);
        throw new error_response_js_1.ApplicationException("Something Went Wrong");
    }
});
exports.emailEvent.on("disableTwoStepVerification", async (data) => {
    try {
        data.html = await (0, email_template_js_1.disableTwoStepVerificationTemplate)({ OTPCode: data.OTPCode });
        data.subject = "Disable Two-Step Verification – Confirmation Needed";
        await (0, sendEmail_js_1.sendEmail)(data);
    }
    catch (error) {
        console.log("Fail To Send Email", error);
        throw new error_response_js_1.ApplicationException("Something Went Wrong");
    }
});
exports.emailEvent.on("loginTwoStepVerification", async (data) => {
    try {
        data.html = await (0, email_template_js_1.loginTwoStepVerificationTemplate)({ OTPCode: data.OTPCode });
        data.subject = "LinkSphere | Login Verification Code";
        await (0, sendEmail_js_1.sendEmail)(data);
    }
    catch (error) {
        console.log("Fail To Send Email", error);
        throw new error_response_js_1.ApplicationException("Something Went Wrong");
    }
});
exports.emailEvent.on("forgetPassword", async (data) => {
    try {
        data.html = await (0, email_template_js_1.forgetPasswordTemplate)({ OTPCode: data.OTPCode });
        data.subject = "Forget Your Password?";
        await (0, sendEmail_js_1.sendEmail)(data);
    }
    catch (error) {
        console.log("Fail To Send Email", error);
        throw new error_response_js_1.ApplicationException("Something Went Wrong");
    }
});
exports.emailEvent.on("changePassword", async (data) => {
    try {
        data.html = await (0, email_template_js_1.passwordChangedTemplate)();
        data.subject = "Forget Your Password?";
        await (0, sendEmail_js_1.sendEmail)(data);
    }
    catch (error) {
        console.log("Fail To Send Email", error);
        throw new error_response_js_1.ApplicationException("Something Went Wrong");
    }
});
exports.emailEvent.on("mentionedInPost", async (data) => {
    try {
        data.html = await (0, email_template_js_1.mentionNotificationTemplate)(data.postLink, data.mentionedBy);
        data.subject = `${data.mentionedBy} Mentioned You In Post`;
        await (0, sendEmail_js_1.sendEmail)(data);
    }
    catch (error) {
        console.log("Fail To Send Email", error);
        throw new error_response_js_1.ApplicationException("Something Went Wrong");
    }
});
