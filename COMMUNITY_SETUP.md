# Community Feature Setup Instructions

## Database Setup

1. **Run the SQL script** to create the community tables:
   ```sql
   -- Execute the contents of create-community-tables.sql in your Supabase SQL editor
   ```

2. **Tables created:**
   - `posts` - Stores community discussion posts (uses `user_id` for author)
   - `replies` - Stores replies to posts (uses `user_id` for author)
   - `votes` - Stores upvote/downvote data (uses `user_id` for voter)
   - `user_points` - Tracks user points for gamification (uses `user_id`)

## Features Implemented

### ✅ Community Pages
- **CommunityPage.tsx** - Main community listing with search, filters, and sorting
- **NewPostPage.tsx** - Form to create new posts with subject categorization
- **PostDetailPage.tsx** - Individual post view with replies and voting

### ✅ Authentication Integration
- All community features require user authentication
- User display names are automatically used from auth metadata
- Google OAuth users get their names from Google profile
- All database operations use `user_id` consistently for user identification

### ✅ Voting System
- Upvote/downvote posts
- Vote counts are calculated and displayed
- Users can change their votes
- Vote scores are calculated as (upvotes - downvotes)

### ✅ Points System
- **+10 points** for creating a new post
- **+5 points** for replying to a post
- **+2 points** for each upvote received on your posts
- Points are displayed in the Dashboard
- Automatic point tracking via database triggers

### ✅ UI/UX Features
- Responsive design for mobile and desktop
- Dark/light theme compatible
- Toast notifications for user feedback
- Smooth animations with Framer Motion
- Search and filter functionality
- Subject-based categorization

### ✅ Navigation Integration
- Community button added to Dashboard navigation
- All routes are properly configured in App.tsx
- Protected routes require authentication

## Usage

1. **Access Community:** Click "Community" button in Dashboard or navigate to `/community`
2. **Create Post:** Click "New Post" button (requires login)
3. **Reply to Posts:** Click on any post to view and reply
4. **Vote:** Use thumbs up/down buttons on posts
5. **Track Points:** View your forum points in the Dashboard

## Technical Details

### Database Triggers
- Automatic point calculation when posts, replies, or votes are created
- Points are stored in `user_points` table
- Triggers ensure data consistency

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only edit their own posts and replies (using `user_id`)
- Proper authentication checks throughout
- Consistent user identification across all operations

### Performance
- Indexed database columns for fast queries
- Efficient vote counting with aggregation
- Optimized queries for post listing

## Files Modified/Created

### New Files:
- `src/pages/community/CommunityPage.tsx`
- `src/pages/community/NewPostPage.tsx`
- `src/pages/community/PostDetailPage.tsx`
- `create-community-tables.sql`
- `COMMUNITY_SETUP.md`

### Modified Files:
- `src/App.tsx` - Added community routes
- `src/pages/Dashboard.tsx` - Added community navigation and points display
- `src/integrations/supabase/types.ts` - Added new table types

## Next Steps

1. Run the SQL script in your Supabase dashboard
2. Test the community features
3. Customize the UI as needed
4. Add any additional features or modifications

The community system is now fully integrated and ready to use!
