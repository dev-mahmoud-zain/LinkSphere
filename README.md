# LinkSphere

LinkSphere – A scalable backend social network platform inspired by Facebook. Features include user authentication, profile management, posts, nested comments, likes, real-time interactions via Socket.io, and admin controls. Built with Node.js, Express, MongoDB, and AWS S3 for media storage. Chat module and notifications are under development.

---

## 📖 Project Overview

LinkSphere is a backend social network platform that provides core features similar to Facebook.
It enables users to register, authenticate, create posts, comment, and interact with each other in real time.

### ✨ Current Features

* 🔐 **Authentication & Authorization** – Secure user signup/login with JWT.
* 👥 **User Management** – Profiles, roles (User, Admin, Super-Admin), and account freezee/unfreezee.
* 📝 **Posts System** – Create, update, and manage posts with media & tags.
* 💬 **Comments & Replies** – Nested comment system with likes/unlikes.
* 📡 **Real-time Gateway** – Socket.io integration for live features.
* 💌 **Email Notifications** – Nodemailer for account-related emails.
* ☁️ **Cloud Storage** – AWS S3 integration for media files.

### 🚧 Work in Progress

* 💬 **Chat Module** – Currently under development to enable real-time messaging.
* 👥 **Groups & Pages** – Planned future features.
* 🔔 **Notifications** – Planned for post & comment interactions.
* ⚙️ **User Settings & Privacy Controls** – Upcoming enhancements.


---

## 🚀 Tech Stack

**Core**

* Node.js – Runtime environment
* Express.js – Web framework
* MongoDB + Mongoose – Database & ORM
* JWT (jsonwebtoken) – Authentication & authorization

**Security & Middleware**

* Helmet – Secure HTTP headers
* CORS – Cross-origin resource sharing
* express-rate-limit – Rate limiting for APIs
* bcryptjs – Password hashing

**File Handling & Cloud**

* Multer – File uploads
* AWS SDK (S3) – Cloud storage integration

**Utilities**

* uuid – Unique IDs
* zod – Data validation
* dotenv – Environment configuration
* nodemailer – Email sending

---

## 🏗 Project Structure

```
.
├── config/               # Application configuration files
├── dist/                 # Compiled JavaScript output (build)
├── FrontEnd/             # Frontend implementation (if included)
├── node_modules/         # Installed dependencies
├── src/                  # Main source code
│   ├── DataBase/         # Database connection and models
│   ├── middlewares/      # Express middlewares (auth, validation, etc.)
│   ├── modules/          # Feature-based modules
│   │   ├── 001-auth/     # Authentication & authorization
│   │   ├── 002-users/    # User management
│   │   ├── 003-posts/    # Posts creation & management
│   │   ├── 004-comments/ # Comments & replies system
│   │   ├── 005-gateway/  # Gateway (WebSocket / real-time features)
│   │   └── 006-chat/     # Chat & messaging module
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions & helpers
│   ├── app.controller.ts # Root controller / entry endpoints
│   └── index.ts          # Application entry point
├── .gitignore            # Git ignored files
├── package-lock.json     # Lock file for npm dependencies
├── package.json          # Project metadata and dependencies
└── tsconfig.json         # TypeScript configuration
```

---

## ⚙️ Installation & Run

Clone the repository and install dependencies:

```bash
git clone <repo_url>
cd LinkSphere
npm install
```

Run the development server:

```bash
npm run start:dev
```

---

## 🔑 Environment Variables

Create a `.env` file with the following variables:

```
MOOD
PORT=3000
APPLCATION_NAME="LinkSphere"
DB_CONNECTION_URL
ENCRYPTKEY
SALTROUND
APP_EMAIL
APP_PASSWORD
ACCESS_USER_TOKEN_SIGNATURE
REFRESH_USER_TOKEN_SIGNATURE
ACCESS_SYSTEM_TOKEN_SIGNATURE
REFRESH_SYSTEM_TOKEN_SIGNATURE
WEB_CLIENT_ID
S3_BUCKET_NAME
S3_ROOT_USER_NAME
S3_ACCESS_KEY_Id
S3_SECRET_K
S3_REGION
BASE_URL
```

---

# 📌 API Documentation

## 🔑 Auth Module


### 🔹 Account Registration & Email Verification
- `POST /auth/signup` → Register a new account  
- `PATCH /auth/confirm-email` → Confirm email using OTP  
- `POST /auth/re-send-confirm-email-otp` → Resend OTP for email confirmation  
- `POST /auth/signup-with-gmail` → Sign up / Log in using Gmail  

---

### 🔹 Login & Session Management
- `POST /auth/login` → Log in with email & password  
- `POST /auth/login/verify-otp-code` → Verify OTP if Two-Step Verification is enabled  
- `POST /auth/logout` → Log out (from current device or all devices)  
- `GET /auth/refresh-token` → Refresh Access & Refresh tokens  

---

### 🔹 Password Reset (Forget Password Flow)
- `POST /auth/forget-password` → Request OTP to reset password  
- `POST /auth/resend-forget-password-otp` → Resend OTP (limited attempts)  
- `POST /auth/change-forget-password` → Change password after verifying OTP  

---

### 🔹 Two-Step Verification (2FA)
- `PATCH /auth/change-two-setup-verification` → Enable/disable 2FA (OTP sent to email)  
- `PATCH /auth/verify-enable-two-setup-verification` → Confirm enable/disable 2FA with OTP  
---

## 👤 Users Module

### 🔹 Profile Management
- `GET /users/profile` → Get user profile  
- `PATCH /users/profile-picture` → Upload/update profile picture  
- `DELETE /users/profile-picture` → Delete profile picture  
- `PATCH /users/profile-cover-images` → Upload/update cover images  
- `DELETE /users/profile-cover-images` → Delete cover images  

### 🔹 Friendship Management
- `POST /users/friend-request/:userId` → Send friend request  
- `PATCH /users/accept-friend-request/:requestId` → Accept request  
- `DELETE /users/cancel-friend-request/:requestId` → Cancel request  
- `DELETE /users/remove-friend/:friendId` → Unfriend  

### 🔹 User Information Updates
- `PATCH /users/update-basic-info` → Update basic info  
- `PATCH /users/update-email` → Request email change (OTP sent)  
- `PATCH /users/confirm-update-email` → Confirm email change  
- `PATCH /users/change-password` → Change password  

### 🔹 Account Control
- `DELETE /users/freezee/:userId?` → freezee account  
- `PATCH /users/un-freezee/me` → Unfreezee own account  

---

## 📝 Posts Module

### 🔹 Post Management
- `POST /posts/create-post` → Create a new post with text, media, or both  
- `PATCH /posts/update-post/{postId}` → Update an existing post’s content, media, or tags  
- `DELETE /posts/{postId}` → Permanently delete a post  

### 🔹 Post Retrieval
- `GET /posts/?page=1&limit=3` → Get a paginated list of posts  
- `GET /posts/{postId}` → Get detailed info of a specific post  

### 🔹 Post Actions
- `POST /posts/like/{postId}` → Like or unlike a post  
- `DELETE /posts/freezee/{postId}` → Temporarily hide a post  
- `PATCH /posts/unfreezee/{postId}` → Re-enable a previously frozen post  

---

## 💬 Comments Module

### 🔹 Comment Management
- `POST /posts/{postId}/comment` → Add a new comment to a post  
- `POST /posts/{postId}/{commentId}/reply` → Reply to a specific comment or reply  
- `PATCH /posts/{postId}/{commentId}` → Update an existing comment or reply  
- `DELETE /posts/{postId}/{commentId}` → Permanently delete a comment or reply  

### 🔹 Comment Retrieval
- `GET /posts/{postId}/{commentId}` → Get detailed info of a specific comment or reply  

### 🔹 Comment Actions
- `POST /posts/{postId}/{commentId}/like` → Like or unlike a comment or reply  
- `DELETE /posts/{postId}/{commentId}/freezee` → Temporarily hide a comment or reply  
- `PATCH /posts/{postId}/{commentId}/unfreezee` → Re-enable a previously frozen comment or reply  

---

## 🛠 Admin Actions

- `PATCH /users/un-freezee/{userId}/admin` → Re-enable a previously frozen user account  
- `DELETE /users/delete/{userId}` → Permanently delete a user account  
- `PATCH /users/change-role/{userId}` → Change the role of a specific user  

---

> 🔹 **Note:** All endpoints that require authentication should include the respective `Authorization` token header.  
> 🔹 Optional parameters are denoted with `?` and arrays are indexed as `[0], [1], ...` when needed.



## 🧪 Testing

* API can be tested via **Postman**
* documentation url : **https://documenter.getpostman.com/view/40056651/2sB3HqGdFW**


## 📝 Contribution Guidelines

1. Fork the repository
2. Create a new branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Create a Pull Request

---

## 📦 Dependencies Versions

* Node.js: 20.x
* Express.js: 4.x
* MongoDB: 7.x
* Mongoose: 7.x
* Socket.io: 4.x

---

## 👤 Author

**Adhem Zen** – Developer & Maintainer
