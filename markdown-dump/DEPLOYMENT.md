# CollabCanvas - Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- ✅ Node.js and npm installed
- ✅ Firebase project created
- ✅ Firebase CLI installed globally
- ✅ All environment variables configured in `.env`

## Step-by-Step Deployment Instructions

### Step 1: Install Firebase CLI (if not already installed)

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

This will open a browser window for you to authenticate with your Google account.

### Step 3: Initialize Firebase Project

Since we've already created the config files, you just need to link your Firebase project:

```bash
firebase use --add
```

Select your Firebase project from the list and set it as the default.

### Step 4: Update .firebaserc

Edit the `.firebaserc` file and replace `your-project-id` with your actual Firebase project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### Step 5: Build Production Bundle

```bash
npm run build
```

This will:
- Compile TypeScript
- Bundle all assets
- Optimize for production
- Output to `dist/` folder

### Step 6: Test Production Build Locally (Optional)

```bash
npm run preview
```

Open the URL shown to test the production build locally.

### Step 7: Deploy Security Rules First

Deploy Firestore and Realtime Database rules:

```bash
firebase deploy --only firestore:rules
firebase deploy --only database
```

### Step 8: Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

This will upload your `dist/` folder to Firebase Hosting.

### Step 9: Verify Deployment

After deployment completes, you'll see:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project-id/overview
Hosting URL: https://your-project-id.web.app
```

Open the Hosting URL to verify your deployment!

---

## Important Notes

### Environment Variables

⚠️ **Important**: Make sure your `.env` file has all the correct Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

### Security Rules

The deployed security rules:

**Firestore (`firestore.rules`):**
- Allows authenticated users to read/write to canvas collection
- Denies access to all other collections

**Realtime Database (`database.rules.json`):**
- Allows authenticated users to read all cursor/presence data
- Users can only write to their own cursor/presence data

### Build Optimization

The production build includes:
- ✅ Code minification
- ✅ Tree shaking (removes unused code)
- ✅ Asset optimization
- ✅ Cache headers (1 year for static assets)

---

## Troubleshooting

### Build Errors

If build fails:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Deployment Errors

If deployment fails:
```bash
# Check Firebase CLI version
firebase --version

# Update if needed
npm install -g firebase-tools@latest

# Try deploying again
firebase deploy
```

### Environment Variables Not Working

If environment variables aren't working in production:
1. Ensure all variables are prefixed with `VITE_`
2. Rebuild after changing `.env`: `npm run build`
3. Redeploy: `firebase deploy --only hosting`

### Security Rules Errors

If you get permission denied errors:
```bash
# Redeploy rules
firebase deploy --only firestore:rules
firebase deploy --only database
```

---

## Complete Deployment (All Services)

To deploy everything at once:

```bash
firebase deploy
```

This deploys:
- Hosting
- Firestore rules
- Realtime Database rules

---

## Post-Deployment Checklist

After deployment, verify:

- [ ] Can access the hosted URL
- [ ] Can sign up with email/password
- [ ] Can sign in with Google
- [ ] Can create shapes on canvas
- [ ] Shapes sync across multiple browsers
- [ ] Cursors appear for other users
- [ ] Presence list shows online users
- [ ] All features work as in local development

---

## Updating the Deployment

When you make changes:

```bash
# 1. Build new version
npm run build

# 2. Deploy
firebase deploy --only hosting

# If you changed security rules:
firebase deploy --only firestore:rules
firebase deploy --only database
```

---

## Custom Domain (Optional)

To add a custom domain:

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow the DNS configuration steps
4. Wait for SSL certificate provisioning (can take up to 24 hours)

---

## Monitoring

Monitor your deployment:
- **Firebase Console**: https://console.firebase.google.com
- **Usage**: Check Authentication, Firestore, and Realtime Database usage
- **Performance**: Use Firebase Performance Monitoring (optional)

---

## Support

If you encounter issues:
1. Check Firebase Console for errors
2. Check browser console for client-side errors
3. Verify security rules are deployed
4. Ensure environment variables are correct

