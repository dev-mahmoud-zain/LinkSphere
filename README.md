# 🌐 LinkSphere

LinkSphere is a high-performance, scalable backend for a modern social network platform. Designed for seamless connectivity, it features secure authentication, real-time messaging, content sharing, and advanced search capabilities.

---

## 📖 Project Overview

LinkSphere provides a robust foundation for social interactions, enabling users to connect, share, and communicate in a secure environment.

### ✨ Core Features

*   🔐 **Secure Auth** – JWT-based login/signup with **Two-Step Verification (2FA)** and Gmail OAuth integration.
*   👥 **User Profiles** – Full profile management, including profile/cover pictures (AWS S3) and bio updates.
*   🤝 **Social Graph** – Sophisticated friend request system (send, accept, cancel, unfriend).
*   📝 **Content Sharing** – Rich media posts with attachments, tags, and a nested comment/reply system.
*   💬 **Real-time Chat** – 1-on-1 and Group messaging with typing indicators and delivery/seen status.
*   🔍 **Power Search** – Advanced search for users and content across the platform.
*   📡 **Live Interactions** – Real-time updates for likes, comments, and online status via Socket.io.
*   🛡️ **Admin Suite** – Dedicated controls for account moderation, role management, and content freezing.


---

## 🚀 Technical Stack

| Category | Technologies |
| :--- | :--- |
| **Runtime** | Node.js (v20+) |
| **Framework** | Express.js |
| **Database** | MongoDB with Mongoose |
| **Real-time** | Socket.io |
| **Auth** | JWT / Passport (Google OAuth) / Bcrypt |
| **Storage** | AWS S3 (via SDK v3) |
| **Validation** | Zod |
| **Utilities** | Nodemailer, Multer, Morgan, Helmet |

---

## 🏗 Project Structure

```text
.
├── config/               # Environment-specific configuration
├── src/                  # Main source code
│   ├── DataBase/         # Database connection, schemas, and repositories
│   ├── middlewares/      # Auth, Validation, and Rate-limiting middlewares
│   ├── modules/          # Feature-based architecture
│   │   ├── 001-auth/     # Signup, 2FA, OTP, OAuth
│   │   ├── 002-users/    # Profile & Friendship management
│   │   ├── 003-posts/    # Feed and post CRUD
│   │   ├── 004-comments/ # Nested interactions
│   │   ├── 006-search/   # Discovery engine
│   │   ├── 007-gateway/  # Socket.io core logic
│   │   └── 008-chat/     # Private & Group messaging
│   ├── utils/            # Shared helpers (S3, Email, Security)
│   └── app.controller.ts # Main application bootstrap
└── package.json          # Dependency management
```

---

## ⚙️ Setup & Installation

1.  **Clone & Install**
    ```bash
    git clone <repo_url>
    cd LinkSphere
    npm install
    ```

2.  **Environment Configuration**
    Create `config/.env.development` (or production) with the following:
    ```env
    PORT=3000
    DB_CONNECTION_URL=mongodb://...
    ENCRYPTKEY=...
    SALTROUND=10
    
    # Mailer
    APP_EMAIL=...
    APP_PASSWORD=...
    
    # JWT Signatures
    ACCESS_USER_TOKEN_SIGNATURE=...
    REFRESH_USER_TOKEN_SIGNATURE=...
    
    # AWS S3 Storage
    S3_BUCKET_NAME=...
    S3_ACCESS_KEY_Id=...
    S3_SECRET_ACCESS_KEY=...
    S3_REGION=...
    
    # OAuth
    WEB_CLIENT_ID=...
    ```

3.  **Run Application**
    ```bash
    npm run start:dev
    ```

---

# 📌 API Reference

## 🔐 Authentication
**Account & Verification**
- `POST /auth/signup` – Register a new account.
- `PATCH /auth/confirm-email` – Verify email via OTP.
- `POST /auth/re-send-confirm-email-otp` – Resend verification OTP.
- `POST /auth/signup-with-gmail` – OAuth signup/login.

**Sessions & Security**
- `POST /auth/login` – Login (Support 2FA).
- `POST /auth/login/verify-otp-code` – Verify 2FA OTP.
- `POST /auth/logout` – Terminate session.
- `GET /auth/refresh-token` – Rotate JWT tokens.

**Password Reset**
- `POST /auth/forget-password` – Request reset OTP.
- `POST /auth/resend-forget-password-otp` – Resend reset OTP.
- `POST /auth/change-forget-password` – Reset password with OTP.

**2FA Settings**
- `PATCH /auth/change-two-setup-verification` – Toggle 2FA.
- `PATCH /auth/verify-enable-two-setup-verification` – Confirm 2FA change.

## 👤 Users Module
**Profile Management**
- `GET /users/profile` – Current user profile.
- `GET /users/user/:userId` – Get specific user profile.
- `PATCH /users/profile-picture` – Update profile picture (AWS S3).
- `PATCH /users/profile-cover` – Update cover image (AWS S3).
- `DELETE /users/profile-picture` – Remove profile picture.
- `DELETE /users/profile-cover-image` – Remove cover image.

**Friendship System**
- `GET /users/friends-list` – List all friends.
- `POST /users/friend-request/:userId` – Send a request.
- `PATCH /users/accept-friend-request/:requestId` – Accept request.
- `DELETE /users/cancel-friend-request/:requestId` – Cancel/Reject request.
- `DELETE /users/remove-friend/:userId` – Unfriend a user.
- `GET /users/received-friend-requests/` – Incoming requests.
- `GET /users/sent-friend-requests/` – Outgoing requests.

**Account Settings**
- `PATCH /users/update-basic-info` – Update bio, name, etc.
- `PATCH /users/update-email` – Request email change.
- `PATCH /users/confirm-update-email` – Confirm new email.
- `PATCH /users/change-password` – Identity-safe password change.

**Admin & Moderation**
- `DELETE /users/freeze/:userId` – Suspend an account (Admin/Author).
- `PATCH /users/un-freeze/:userId/admin` – Admin unfreeze.
- `PATCH /users/un-freeze/me` – Author self-unfreeze (via OTP).
- `DELETE /users/delete/:userId` – Permanent account deletion.
- `GET /users/change-role/:id` – Modify user permissions.

## 📝 Posts Module
**Creation & Updates**
- `POST /posts/create-post` – New post with media.
- `PATCH /posts/update-content/:postId` – Update text.
- `PATCH /posts/update-attachments/:postId` – Modify media files.

**Retrieval & Discovery**
- `GET /posts/` – Global feed (Paginated).
- `GET /posts/:postId` – Full post details.
- `GET /posts/search` – Search content.
- `GET /posts/me` – Current user's posts.
- `GET /posts/user/:userId` – Other users' posts.

**Interactions & Moderation**
- `POST /posts/like/:postId` – Like/Unlike toggle.
- `GET /posts/:postId/liked-users` – See who liked a post.
- `GET /posts/freezed` – List suspended posts.
- `DELETE /posts/freeze/:postId` – Suspend post visibility.
- `PATCH /posts/unfreeze/:postId` – Restore suspended post.
- `DELETE /posts/:postId` – Permanent deletion.

## 💬 Comments Module
(Nested under `/posts/:postId`)
- `POST /posts/:postId/create-comment` – New comment.
- `GET /posts/:postId/comment/:commentId` – Specific comment info.
- `GET /posts/:postId/comments/` – All comments for a post.
- `GET /posts/:postId/:commentId/replies` – Get threaded replies.
- `PATCH /posts/:postId/update/:commentId` – Edit comment.
- `POST /posts/:postId/:commentId/create-reply` – Reply to a comment.
- `POST /posts/:postId/:commentId/like` – Like/Unlike comment.
- `GET /posts/:postId/:commentId/liked-users` – List comment likes.
- `DELETE /posts/:postId/delete/:commentId` – Remove comment.

## � Search Module
- `GET /search/` – Unified search across the platform.

## 💬 Chat Module
- `GET /chat/:userId` – Direct 1-on-1 history.
- `GET /chat/group/:chatId` – Group chat history.
- `POST /chat/group` – Create a new group.

---

## 📡 Socket.IO Real-time Events

| Event | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| **`send-message`** | Emit | `{ content, sendTo }` | Send a DM or Group message. |
| **`success-message`** | Listen | `{ content, messageId }` | Confirmation sent to the sender. |
| **`new-message`** | Listen | `{ content, from, chatId }` | Received by message recipients. |
| **`message-seen`** | Emit | `{ chatId, messageId }` | Mark a specific message as read. |
| **`message-seen`** | Listen | `{ chatId, messageId, seenAt }` | Notifies participants when a message is seen. |
| **`writing-start`** | Emit | `{ receiverId }` | Notify someone you are typing. |
| **`writing-start`** | Listen | `{ senderId }` | Indicates a friend is typing. |
| **`writing-stop`** | Emit | `{ receiverId }` | Notify you stopped typing. |
| **`writing-stop`** | Listen | `{ senderId }` | Indicates a friend stopped typing. |
| **`online-user`** | Listen | `userId` (string) | Broadcasted when a friend comes online. |
| **`offline-user`** | Listen | `userId` (string) | Broadcasted when a friend goes offline. |
| **`custom_error`** | Listen | `{ ...errorDetails }` | Error notifications from the server. |

---

## 👤 Author
**Adhem Zen** – *Lead Developer*
- GitHub: [Adhem Zayn](https://github.com/mahmoud-zain)
- Project: [LinkSphere](https://github.com/mahmoud-zain/LinkSphere)

**Adhem Zen** – Developer & Maintainer
