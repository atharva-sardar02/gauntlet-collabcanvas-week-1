# Quick Deployment Steps

## What I've Already Done ✅

1. ✅ Created `firebase.json` - Firebase Hosting configuration
2. ✅ Created `.firebaserc` - Firebase project configuration
3. ✅ Created `firestore.rules` - Firestore security rules
4. ✅ Created `database.rules.json` - Realtime Database security rules
5. ✅ Created `firestore.indexes.json` - Firestore indexes
6. ✅ Created `DEPLOYMENT.md` - Comprehensive deployment guide
7. ✅ Updated `tasks.md` - Marked tasks 9.1-9.6 as complete

## What You Need to Do 🚀

### Step 1: Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```bash
firebase login
```

### Step 3: Link Your Firebase Project
```bash
firebase use --add
```
- Select your Firebase project from the list
- This will update `.firebaserc` automatically

### Step 4: Build Production Bundle
```bash
npm run build
```

### Step 5: Deploy Security Rules
```bash
firebase deploy --only firestore:rules
firebase deploy --only database
```

### Step 6: Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

### Step 7: Test Your Deployment
- Open the Hosting URL provided after deployment
- Test authentication (signup/login)
- Test canvas features (create shapes, pan, zoom)
- Test multiplayer features (open in 2+ browsers)

## ⚠️ Important Notes

1. **`.firebaserc` Update**: After running `firebase use --add`, the `.firebaserc` file will be automatically updated with your project ID.

2. **Environment Variables**: Ensure your `.env` file has all correct Firebase credentials. The build process will embed these into the production bundle.

3. **Security Rules**: The rules I created:
   - Allow authenticated users to read/write canvas data
   - Users can only write to their own cursor/presence data
   - All other access is denied

4. **Build Output**: The `dist/` folder will be created with your production-ready app.

## Quick Command Summary

```bash
# One-time setup
npm install -g firebase-tools
firebase login
firebase use --add

# Every deployment
npm run build
firebase deploy

# Or deploy specific services
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only database
```

## Need Help?

See `DEPLOYMENT.md` for detailed instructions and troubleshooting.

