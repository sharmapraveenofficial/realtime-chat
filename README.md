# Realtime Chat Application

A modern, secure, and feature-rich real-time chat application built with Next.js, MongoDB, and WebSockets.

![Application Overview]

## Features

### User Authentication
- Email and password-based registration and login
- Facial recognition for enhanced security
- JWT-based authentication system with refresh tokens
- Password hashing and secure storage

![Authentication Demo]

### Real-time Messaging
- Instant message delivery
- Read receipts
- Typing indicators
- Message history
- Emoji support

![Chat Interface]

### Chat Rooms
- Create public or private chat rooms
- Customize room settings
- View active participants
- Member management

![Room Management]

### Invitation System
- Invite users by email
- Accept/reject invitations
- Email notifications for new invitations
- Pending invitation management

![Invitation Flow]

### UI/UX
- Modern, responsive design
- Dark mode interface
- Intuitive navigation
- Real-time updates

## Technology Stack
- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Real-time Communication**: WebSockets
- **Authentication**: JWT, bcrypt
- **Face Recognition**: TensorFlow.js
- **Email**: Nodemailer

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your environment variables:
```bash
NEXT_PUBLIC_API_URL=<your-api-url>
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
EMAIL_USER=<your-email>
EMAIL_PASS=<your-email-password>
```

4. Start the development server:
```bash
npm run dev
```

## Usage

### Sign Up
1. Navigate to the signup page
2. Enter your email, username, and password
3. Set up facial recognition (optional)
4. Verify your email

<!-- Option 1: Use a GIF instead (recommended) -->
![Chat Demo](https://raw.githubusercontent.com/sharmapraveenofficial/realtime-chat/main/app/screenshots/chat-demo.gif)

<!-- Option 2: Image thumbnail that links to the video file -->
<div align="center">
  <a href="https://github.com/sharmapraveenofficial/realtime-chat/blob/main/app/screenshots/chat-demo.gif">
    <img src="https://github.com/sharmapraveenofficial/realtime-chat/blob/main/app/screenshots/chat-demo.gif" alt="Click to watch demo video" width="600">
    <br>
    Click to watch demo video
  </a>
</div>

<!-- Option 3: Link to the video -->
[Watch Chat Demo Video](https://github.com/sharmapraveenofficial/realtime-chat/blob/main/app/screenshots/chat-demo.mp4)

### Creating a Chat Room
1. Click on the "+" button in the sidebar
2. Enter a name for your new chat room
3. Invite participants via email or username
4. Click "Create Room"

![Create Room]

### Inviting Users
1. Open the room settings by clicking the gear icon
2. Navigate to the "Invites" tab
3. Enter the email address of the person you want to invite
4. Click "Send Invite"

![Send Invite]

### Sending Messages
1. Select a chat room from the sidebar
2. Type your message in the input field
3. Use the emoji picker to add emojis
4. Press "Send" or hit Enter

![Messaging]

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Chat Room Endpoints
- `GET /api/chatrooms` - Get all rooms for the current user
- `POST /api/chatrooms` - Create a new chat room
- `GET /api/chatrooms/:id` - Get details of a specific room
- `PUT /api/chatrooms/:id` - Update a chat room
- `DELETE /api/chatrooms/:id` - Delete a chat room

### Invitation Endpoints
- `POST /api/invitations` - Create and send a new invitation
- `GET /api/invitations/verify/:token` - Verify an invitation token
- `POST /api/invitations/accept` - Accept an invitation

### Messages Endpoints
- `GET /api/chatrooms/:id/messages` - Get all messages for a room
- `POST /api/chatrooms/:id/messages` - Send a new message

## Security Features
- **Password Hashing**: All passwords are hashed using bcrypt
- **JWT Authentication**: Secure JSON Web Tokens with expiration
- **Face Recognition**: Optional biometric authentication
- **HTTPS**: Recommended for production deployment
- **XSS Protection**: Input sanitization and output encoding
- **Rate Limiting**: Protection against brute force attacks

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

