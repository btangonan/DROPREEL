# DropReel 🎬

DropReel is a modern web application that transforms your Dropbox videos into professional, interactive video reels. With a sleek glassmorphism design and intuitive drag-and-drop interface, DropReel makes it easy to curate and share your video content.

## ✨ Features

- **Glassmorphism UI** - Beautiful frosted glass design with smooth animations
- **Drag-and-Drop Interface** - Intuitive video organization between panels
- **Popout Video Player** - Full-featured player with keyboard controls
- **Dropbox Integration** - Direct access to your Dropbox videos
- **Responsive Design** - Works on desktop and mobile devices
- **Type Safety** - Built with TypeScript for better developer experience
- **Accessible** - WCAG 2.1 AA compliant components

## 🛠 Tech Stack

- **Frontend**
  - Next.js 13+ with App Router
  - React 18+ with TypeScript
  - Tailwind CSS with custom glassmorphism theme
  - Framer Motion for animations

- **State Management**
  - React Context API
  - Custom hooks
  - SWR for data fetching

- **Drag & Drop**
  - @dnd-kit/core
  - @dnd-kit/sortable
  - @dnd-kit/modifiers

- **Cloud Integration**
  - Dropbox API v2 with OAuth 2.0
  - Server-side token management
  - Secure credential storage

- **Development Tools**
  - TypeScript
  - ESLint + Prettier
  - Husky Git hooks
  - Jest + React Testing Library

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- A Dropbox account with API access

### Setting Up a Dropbox App

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Click "Create App"
3. Select "Scoped access API"
4. Choose "Full Dropbox" access
5. Name your app (e.g., "DropReel")
6. Add the following redirect URIs to your app settings:
   - `http://localhost:3000/api/auth/dropbox/callback`
   - `http://localhost:3000/auth/dropbox/callback`
7. Note your App Key and App Secret

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/dropreel-mvp.git
   cd dropreel-mvp
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
4. Update `.env.local` with your Dropbox credentials:
   ```
   DROPBOX_CLIENT_ID=your_client_id_here
   DROPBOX_CLIENT_SECRET=your_client_secret_here
   DROPBOX_REDIRECT_URI=http://localhost:3000/api/auth/dropbox/callback
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_here
   ```
   
   Generate a secure random string for `NEXTAUTH_SECRET` using:
   ```bash
   openssl rand -base64 32
   ```

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🎥 Using DropReel

1. **Connect to Dropbox**
   - Click the "CONNECT" button to authenticate with your Dropbox account
   - Grant the necessary permissions to access your videos

2. **Browse Your Videos**
   - View all available videos from your connected Dropbox account
   - Use the search to quickly find specific videos

3. **Create Your Reel**
   - Drag videos from "YOUR VIDEOS" to the "SELECTS" panel
   - Reorder videos by dragging them within the panel
   - Add a title and description to your reel

4. **Preview & Share**
   - Click "PREVIEW REEL" to see how it looks
   - Share the unique URL with others
   - Anyone with the link can view your reel

## 🛠 Development

### Scripts

- `dev` - Start development server
- `build` - Build for production
- `start` - Start production server
- `lint` - Run ESLint
- `test` - Run tests
- `format` - Format code with Prettier

### Code Style

- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use TypeScript for type safety
- Write meaningful commit messages following [Conventional Commits](https://www.conventionalcommits.org/)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Dropbox API](https://www.dropbox.com/developers) - For file storage and management
- [dnd-kit](https://dndkit.com/) - Modern drag and drop toolkit for React
