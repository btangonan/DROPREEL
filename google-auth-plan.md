# Google Authentication Implementation Plan

## Overview

Implement Google OAuth 2.0 authentication to allow users to sign in with their Google accounts, providing secure access to DropReel functionality while maintaining user sessions and preferences.

## Current State Analysis

### Existing Authentication Infrastructure
- **Dropbox OAuth**: Already implemented OAuth flow for Dropbox
- **Session Management**: Basic session handling exists
- **Theme Persistence**: localStorage-based user preferences
- **API Routes**: `/api/auth/dropbox/*` structure established

### UI Components
- **Login Button**: Currently non-functional placeholder in header
- **Theme Toggle**: Working user preference system
- **State Management**: Authentication status tracking in place

## Implementation Plan

### Phase 1: Google OAuth Setup & Configuration

#### 1.1 Google Cloud Console Setup
```bash
# Required Google Cloud Console configuration
1. Create new project or use existing: "dropreel-mvp"
2. Enable Google Identity API
3. Configure OAuth consent screen:
   - Application name: "DropReel"
   - User support email: [your-email]
   - Application domain: [your-domain]
   - Authorized domains: localhost (dev), production domain
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: 
     - http://localhost:3000/api/auth/google/callback (dev)
     - https://yourdomain.com/api/auth/google/callback (prod)
```

#### 1.2 Environment Variables
```typescript
// .env.local
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000 (dev) / https://yourdomain.com (prod)
```

#### 1.3 Dependencies Installation
```bash
npm install next-auth
npm install @next-auth/prisma-adapter  # If using database sessions
npm install @types/next-auth           # TypeScript support
```

### Phase 2: NextAuth.js Integration

#### 2.1 NextAuth Configuration
```typescript
// src/pages/api/auth/[...nextauth].ts (or app/api/auth/[...nextauth]/route.ts for App Router)
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma' // If using database

export default NextAuth({
  adapter: PrismaAdapter(prisma), // Optional: for database sessions
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile'
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token, user }) {
      // Customize session object
      return {
        ...session,
        user: {
          ...session.user,
          id: user?.id || token.sub,
        }
      }
    },
    async jwt({ token, user, account }) {
      // Persist user data to JWT
      if (user) {
        token.id = user.id
      }
      return token
    },
    async signIn({ user, account, profile }) {
      // Custom sign-in logic
      console.log('Google sign-in:', { user, account, profile })
      return true
    }
  },
  pages: {
    signIn: '/auth/signin',     // Custom sign-in page (optional)
    error: '/auth/error',       // Custom error page (optional)
  },
  session: {
    strategy: 'jwt' // or 'database' if using adapter
  }
})
```

#### 2.2 Database Schema (Optional - for persistent sessions)
```sql
-- If using database sessions (Prisma schema)
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  
  // DropReel-specific fields
  dropboxConnected Boolean @default(false)
  dropboxTokens    Json?   // Store Dropbox tokens if needed
  preferences      Json?   // Theme, settings, etc.
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### Phase 3: Frontend Integration

#### 3.1 Session Provider Setup
```typescript
// src/app/layout.tsx (App Router) or pages/_app.tsx (Pages Router)
import { SessionProvider } from 'next-auth/react'

export default function RootLayout({
  children,
  session
}: {
  children: React.ReactNode
  session: any
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

#### 3.2 Authentication Hook
```typescript
// src/hooks/useAuth.ts
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const login = () => {
    signIn('google', { 
      callbackUrl: '/',
      redirect: true 
    })
  }

  const logout = async () => {
    await signOut({ 
      callbackUrl: '/',
      redirect: true 
    })
  }

  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    login,
    logout,
    session
  }
}
```

#### 3.3 Updated Header Component
```typescript
// src/components/ReelMaker/Header.tsx
import { useAuth } from '@/hooks/useAuth'
import { Sun, Moon, LogIn, LogOut, User } from 'lucide-react'

interface HeaderProps {
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

export function ReelMakerHeader({ isDarkMode, onThemeToggle }: HeaderProps) {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth()

  return (
    <div className="matrix-header pt-6 pr-6 pl-6 pb-0">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl text-terminal">REELDROP</h1>
          <div className="text-xs text-muted-foreground mt-1">
            DROP IT. SEND IT. BOOK IT.
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button 
            onClick={onThemeToggle}
            className="control-button flex items-center gap-2"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{isDarkMode ? 'LIGHT' : 'DARK'}</span>
          </button>
          
          {/* Authentication */}
          {isLoading ? (
            <div className="control-button flex items-center gap-2 opacity-50">
              <User className="w-4 h-4" />
              <span>LOADING...</span>
            </div>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* User Info */}
              <div className="text-xs text-muted-foreground">
                {user?.name || user?.email}
              </div>
              
              {/* Logout Button */}
              <button 
                onClick={logout}
                className="control-button flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>LOGOUT</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={login}
              className="control-button flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>LOGIN</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

### Phase 4: User Preferences & Data Management

#### 4.1 User Preferences Service
```typescript
// src/services/userPreferencesService.ts
import { User } from 'next-auth'

export interface UserPreferences {
  theme: 'light' | 'dark'
  dropboxConnected: boolean
  lastFolderPath?: string
  defaultVideoQuality?: string
  autoSaveReels?: boolean
}

export class UserPreferencesService {
  static async getUserPreferences(userId: string): Promise<UserPreferences> {
    // If using database
    const response = await fetch(`/api/user/preferences?userId=${userId}`)
    if (response.ok) {
      return response.json()
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem(`preferences_${userId}`)
    return stored ? JSON.parse(stored) : this.getDefaultPreferences()
  }

  static async saveUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
    // Save to database
    await fetch('/api/user/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, preferences })
    })
    
    // Backup to localStorage
    localStorage.setItem(`preferences_${userId}`, JSON.stringify(preferences))
  }

  private static getDefaultPreferences(): UserPreferences {
    return {
      theme: 'light',
      dropboxConnected: false,
      autoSaveReels: true
    }
  }
}
```

#### 4.2 Enhanced Theme Management
```typescript
// src/lib/theme.ts (enhanced)
export const initializeTheme = (userId?: string): boolean => {
  // First try user-specific preferences
  if (userId) {
    const userTheme = localStorage.getItem(`theme_${userId}`)
    if (userTheme !== null) {
      const isDark = JSON.parse(userTheme)
      applyTheme(isDark)
      return isDark
    }
  }
  
  // Fallback to general theme
  const savedTheme = getStoredTheme()
  applyTheme(savedTheme)
  return savedTheme
}

export const setUserTheme = (userId: string, isDark: boolean): void => {
  // Save user-specific theme
  localStorage.setItem(`theme_${userId}`, JSON.stringify(isDark))
  // Also update general theme
  setStoredTheme(isDark)
  applyTheme(isDark)
}
```

### Phase 5: Protected Routes & Authorization

#### 5.1 Route Protection HOC
```typescript
// src/components/auth/ProtectedRoute.tsx
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  fallback,
  redirectTo = '/auth/signin' 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return fallback || null
  }

  return <>{children}</>
}
```

#### 5.2 API Route Protection
```typescript
// src/lib/auth/apiAuth.ts
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { NextRequest } from 'next/server'

export async function getAuthenticatedUser(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    throw new Error('Unauthorized')
  }
  
  return session.user
}

// Usage in API routes
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    // Protected API logic here
    return Response.json({ user })
  } catch (error) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

### Phase 6: Integration with Existing Features

#### 6.1 Enhanced Reel Management
```typescript
// Update existing reel creation to include user ownership
const handleMakeReel = async () => {
  const { user } = useAuth()
  
  if (!user) {
    setError('Please sign in to create reels')
    return
  }

  const requestBody = {
    userId: user.id,  // Associate reel with user
    videos: videoState.selects,
    title: titles.length > 0 ? titles[0].text : `Reel ${new Date().toLocaleDateString()}`,
    editState: {
      // ... existing editState
    }
  }
  
  // ... rest of reel creation logic
}
```

#### 6.2 User-Specific Reel Lists
```typescript
// src/app/reels/page.tsx (enhanced)
export default function ReelsPage() {
  const { user, isAuthenticated } = useAuth()
  const [reels, setReels] = useState<VideoReel[]>([])

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserReels(user.id)
    }
  }, [isAuthenticated, user])

  const fetchUserReels = async (userId: string) => {
    const response = await fetch(`/api/reels?userId=${userId}`)
    const data = await response.json()
    setReels(data)
  }

  if (!isAuthenticated) {
    return <LoginPrompt />
  }

  // ... rest of component
}
```

### Phase 7: Migration Strategy

#### 7.1 Backward Compatibility
- **Anonymous Sessions**: Support for non-logged-in users (limited functionality)
- **Data Migration**: Migrate localStorage data to user accounts when they sign up
- **Gradual Rollout**: Feature flags for authentication requirements

#### 7.2 Migration Steps
1. **Deploy Authentication Infrastructure** (without requiring login)
2. **Add Optional Login** (users can choose to sign in)
3. **Migrate Anonymous Data** (when users first sign in)
4. **Enhanced Features** (cloud sync, sharing, etc.)
5. **Gradual Requirements** (eventually require login for creation)

## Security Considerations

### Data Protection
- **JWT Security**: Secure token handling and rotation
- **CSRF Protection**: Built-in NextAuth CSRF protection
- **Session Management**: Secure session storage and expiration
- **API Protection**: All protected routes require authentication

### Privacy Compliance
- **Minimal Data Collection**: Only collect necessary Google profile data
- **Data Retention**: Clear policies for user data storage
- **GDPR Compliance**: Right to deletion and data export
- **Terms of Service**: Updated terms for Google authentication

## Testing Strategy

### Unit Tests
- Authentication hook functionality
- User preference management
- Protected route behavior
- API authentication middleware

### Integration Tests
- Google OAuth flow end-to-end
- Session persistence across browser restarts
- User data migration from anonymous sessions
- Cross-device login consistency

### Security Testing
- Token validation and expiration
- Unauthorized access prevention
- CSRF attack prevention
- Session hijacking protection

## Deployment Considerations

### Environment Setup
- **Development**: localhost OAuth configuration
- **Staging**: Staging domain OAuth setup
- **Production**: Production domain with proper SSL

### Monitoring & Analytics
- **Authentication Success/Failure Rates**
- **User Session Duration**
- **Feature Adoption by Authenticated Users**
- **Error Tracking for Auth Flows**

### Performance
- **Session Loading Optimization**
- **Database Query Efficiency** (if using database sessions)
- **Client-Side Bundle Size** (NextAuth impact)
- **CDN Configuration** for static auth assets

## Benefits of This Implementation

✅ **User Experience**
- Single sign-on with Google accounts
- Persistent preferences across devices
- Secure session management
- Seamless integration with existing UI

✅ **Developer Experience**  
- Well-established NextAuth.js patterns
- TypeScript support throughout
- Comprehensive error handling
- Easy testing and debugging

✅ **Scalability**
- Database-backed user management
- Cloud-ready authentication
- Multi-device support
- Enhanced security features

✅ **Business Value**
- User retention through accounts
- Analytics and usage tracking
- Premium feature gating potential
- Data backup and sync capabilities

This plan provides a complete roadmap for implementing Google authentication while maintaining the existing DropReel functionality and user experience.