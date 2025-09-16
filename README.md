# SecretBox 🔐

> Your secure space for managing and sharing your data safely and efficiently. Store, organize, and protect your information with top-notch security — all in one place.

## 🌟 Overview

SecretBox is a full-stack secure messaging and data management platform built with modern technologies. It provides end-to-end encrypted messaging, secure user authentication, and robust data protection features.

## 🏗️ Architecture

### Frontend (Client)

- **Framework**: Next.js 15.5.2 with React 19.1.0
- **Styling**: TailwindCSS 4 with shadcn/ui components
- **State Management**: Redux Toolkit with RTK Query
- **Authentication**: JWT with persistent sessions
- **UI Components**: Radix UI primitives with custom styling
- **Type Safety**: TypeScript with strict configuration
- **Themes**: Dark/Light mode support with next-themes

### Backend (Server)

- **Runtime**: Node.js 22.18.0
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh tokens
- **Security**: Helmet, CORS, Rate limiting, bcrypt hashing
- **File Upload**: Cloudinary integration with Multer
- **Email Service**: Brevo (SendinBlue) integration
- **Encryption**: CryptoJS for sensitive data
- **Scheduling**: Node-schedule for cleanup tasks

## 🚀 Features

### Authentication & Security

- ✅ **Multi-Provider Authentication**: Email/Password + Google OAuth
- ✅ **Email Verification**: OTP-based email confirmation with resend functionality
- ✅ **Password Security**: bcrypt hashing, password history tracking
- ✅ **Forgot Password**: Secure OTP-based password reset flow
- ✅ **Rate Limiting**: Protection against brute force attacks
- ✅ **Token Management**: JWT access/refresh tokens with revocation
- ✅ **Data Encryption**: Sensitive data encryption at rest
- ✅ **Security Headers**: Helmet.js implementation

### Messaging System

- ✅ **Secure Messaging**: End-to-end encrypted message sending
- ✅ **Rich Media**: Text and image message support
- ✅ **Message Management**: View inbox, sent messages, delete messages
- ✅ **Reply System**: Direct message replies
- ✅ **File Uploads**: Cloudinary-powered image storage

### User Management

- ✅ **User Profiles**: Complete profile management with avatars
- ✅ **Account Recovery**: Comprehensive password reset system
- ✅ **Session Management**: Multi-device logout capabilities
- ✅ **Account Deletion**: Soft delete with restoration options

### Frontend Features

- ✅ **Responsive Design**: Mobile-first responsive layout
- ✅ **Theme System**: Dark/Light mode with system preference
- ✅ **Form Validation**: Real-time validation with error handling
- ✅ **Loading States**: Comprehensive loading indicators
- ✅ **Error Boundaries**: Graceful error handling
- ✅ **Toast Notifications**: User feedback system

## 📁 Project Structure

```
secret-box/
├── client/                    # Next.js Frontend
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   │   ├── (auth)/       # Authentication pages
│   │   │   └── (dashboard)/  # Protected dashboard pages
│   │   ├── components/       # Reusable UI components
│   │   │   ├── auth/         # Authentication components
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   └── theme/        # Theme management
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility functions
│   │   ├── store/            # Redux store configuration
│   │   │   ├── api/          # RTK Query API definitions
│   │   │   └── slices/       # Redux slices
│   │   └── types/            # TypeScript type definitions
│   └── package.json
└── server/                   # Express.js Backend
    ├── src/
    │   ├── DB/               # Database configuration
    │   │   └── models/       # Mongoose schemas
    │   ├── modules/          # Feature modules
    │   │   ├── auth/         # Authentication logic
    │   │   ├── users/        # User management
    │   │   └── messages/     # Messaging system
    │   ├── middleware/       # Express middleware
    │   ├── utils/            # Utility functions
    │   │   ├── email/        # Email service
    │   │   ├── multer/       # File upload
    │   │   └── security/     # Security utilities
    │   └── app.controller.js # Main application setup
    └── package.json
```

## 🛠️ Tech Stack

### Frontend Dependencies

| Package       | Version   | Purpose                         |
| ------------- | --------- | ------------------------------- |
| Next.js       | 15.5.2    | React framework with App Router |
| React         | 19.1.0    | UI library                      |
| TypeScript    | ^5        | Type safety                     |
| TailwindCSS   | ^4        | Utility-first CSS               |
| shadcn/ui     | -         | Pre-built UI components         |
| Redux Toolkit | ^2.9.0    | State management                |
| Framer Motion | ^12.23.12 | Animations                      |
| Zod           | ^4.1.5    | Schema validation               |
| Lucide React  | ^0.543.0  | Icon library                    |

### Backend Dependencies

| Package      | Version | Purpose            |
| ------------ | ------- | ------------------ |
| Express      | ^5.1.0  | Web framework      |
| Mongoose     | ^8.16.3 | MongoDB ODM        |
| bcryptjs     | ^3.0.2  | Password hashing   |
| jsonwebtoken | ^9.0.2  | JWT authentication |
| Joi          | ^18.0.0 | Request validation |
| Cloudinary   | ^2.7.0  | Image storage      |
| Helmet       | ^8.1.0  | Security headers   |
| Morgan       | ^1.10.1 | HTTP logging       |
| crypto-js    | ^4.2.0  | Data encryption    |

## 🚀 Getting Started

### Prerequisites

- Node.js 22.18.0 or higher
- MongoDB database
- Cloudinary account (for file uploads)
- Brevo account (for email services)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/ahmedgamalalzatary/secret-box.git
cd secret-box
```

2. **Install backend dependencies**

```bash
cd server
npm install
```

3. **Install frontend dependencies**

```bash
cd ../client
npm install
```

### Environment Configuration

#### Server Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/secretbox

# JWT Secrets
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Email Service (Brevo)
BREVO_API_KEY=your_brevo_api_key
SENDER_EMAIL=your_sender_email

# Google OAuth
WEB_CLIENT_IDS=your_google_client_ids

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Security
ENCRYPTION_KEY=your_encryption_key

# Documentation
DOCUMENTATION_URL=https://your-docs-url

# CORS
ORIGINS=http://localhost:3000,https://your-frontend-domain
```

#### Client Environment Variables

Create a `.env.local` file in the `client/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### Running the Application

1. **Start the backend server**

```bash
cd server
npm run start:dev
```

Server will run on `http://localhost:3000`

2. **Start the frontend development server**

```bash
cd client
npm run dev
```

Frontend will run on `http://localhost:3001` (or next available port)

### Build for Production

#### Backend

```bash
cd server
npm start
```

#### Frontend

```bash
cd client
npm run build
npm start
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /auth/signup` - User registration
- `POST /auth/confirm-email` - Email verification
- `POST /auth/resend-confirm-otp` - Resend verification OTP
- `POST /auth/login` - User login
- `POST /auth/google-signin` - Google OAuth login
- `POST /auth/forget-password` - Request password reset
- `POST /auth/verify-forget-password` - Verify reset OTP
- `POST /auth/reset-password` - Reset password
- `POST /auth/change-password` - Change password
- `POST /auth/refresh-token` - Refresh access token
- `POST /auth/logout` - User logout

### Message Endpoints

- `POST /messages/:reciverId` - Send message
- `GET /messages/inbox` - Get received messages
- `GET /messages/sent` - Get sent messages
- `DELETE /messages/:messageId` - Delete message
- `POST /messages/reply/:messageId` - Reply to message

### User Endpoints

- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `DELETE /users/account` - Delete user account

## 🔐 Security Features

### Password Security

- **Hashing**: bcrypt with salt rounds
- **History**: Previous passwords tracking to prevent reuse
- **Strength**: Real-time password strength validation
- **Reset**: Secure OTP-based password reset

### Data Protection

- **Encryption**: Sensitive data encrypted with crypto-js
- **JWT**: Access and refresh token implementation
- **Rate Limiting**: Request rate limiting per endpoint
- **CORS**: Cross-origin resource sharing configuration
- **Headers**: Security headers with Helmet.js

### Authentication Flow

1. User registers with email verification
2. OTP sent to email for verification
3. Login with JWT token generation
4. Access token expires, refresh token used
5. Multi-device logout capability

## 🎨 UI/UX Features

### Design System

- **Components**: shadcn/ui component library
- **Icons**: Lucide React icon set
- **Typography**: System font stack with fallbacks
- **Colors**: Semantic color system with CSS variables
- **Spacing**: Consistent spacing scale
- **Animations**: Framer Motion for smooth interactions

### Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Breakpoints**: Standard Tailwind breakpoints
- **Touch Friendly**: Large touch targets for mobile
- **Performance**: Optimized images and lazy loading

## 🧪 Development

### Code Quality

- **TypeScript**: Strict type checking
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting (implied)
- **Git Hooks**: Pre-commit validation (recommended)

### Testing (Recommended Setup)

- **Frontend**: Jest + React Testing Library
- **Backend**: Jest + Supertest
- **E2E**: Playwright or Cypress

### Performance Monitoring

- **Backend**: Morgan HTTP logging
- **Frontend**: Next.js built-in analytics
- **Database**: MongoDB performance monitoring

## 📈 Roadmap

### Planned Features

- [ ] Real-time messaging with WebSockets
- [ ] File sharing and document management
- [ ] Group messaging and channels
- [ ] Two-factor authentication (2FA)
- [ ] Advanced search and filtering
- [ ] Message encryption at application level
- [ ] Mobile app development
- [ ] Admin dashboard
- [ ] Analytics and reporting
- [ ] API rate limiting per user
- [ ] Message scheduling
- [ ] Message reactions and threads

### Technical Improvements

- [ ] Comprehensive test coverage
- [ ] Docker containerization
- [ ] CI/CD pipeline setup
- [ ] Performance optimization
- [ ] Database indexing optimization
- [ ] Caching layer implementation
- [ ] Load balancing configuration
- [ ] Monitoring and logging setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Ahmed Gamal Alzatary** - _Initial work_ - [@ahmedgamalalzatary](https://github.com/ahmedgamalalzatary)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [MongoDB](https://www.mongodb.com/) - NoSQL database
- [Cloudinary](https://cloudinary.com/) - Image and video management
- [Brevo](https://www.brevo.com/) - Email delivery service

## 📞 Support

For support, email support@secretbox.com or join our Slack channel.

---

**SecretBox** - Built with ❤️ for secure communication and data management.
