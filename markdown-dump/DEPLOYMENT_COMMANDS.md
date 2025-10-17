# CollabCanvas Deployment Commands

## Quick Deployment

### Full Deployment (All Changes)
```bash
# 1. Build the application
npm run build

# 2. Deploy to Firebase Hosting
firebase deploy --only hosting
```

### Deployment URL
**Live Application**: https://collabcanvas-f7ee2.web.app

---

## Step-by-Step Deployment

### 1. Build the Frontend
```bash
npm run build
```
This will:
- Run TypeScript compilation (`tsc -b`)
- Build production bundle with Vite
- Output to `dist/` folder

### 2. Deploy to Firebase
```bash
firebase deploy --only hosting
```
This will:
- Upload files from `dist/` folder
- Deploy to Firebase Hosting
- Make changes live immediately

---

## Other Deployment Options

### Deploy Everything (Hosting + Firestore Rules)
```bash
firebase deploy
```

### Deploy Only Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Deploy Only Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

---

## Troubleshooting

### Build Errors
If build fails:
1. Check TypeScript errors: `npm run build`
2. Fix linter errors: `npm run lint`
3. Clear cache: `rm -rf node_modules dist && npm install`

### Deployment Errors
If deployment fails:
1. Login again: `firebase login`
2. Check project: `firebase use`
3. Verify files: `ls dist/`

### Rollback
To rollback to previous version:
```bash
# View hosting history
firebase hosting:channel:list

# Rollback in Firebase Console
https://console.firebase.google.com/project/collabcanvas-f7ee2/hosting
```

---

## Production Checklist

Before deploying:
- [ ] Run `npm run build` successfully
- [ ] Test locally with `npm run dev`
- [ ] Check for console errors
- [ ] Test on mobile viewport
- [ ] Verify Firebase connection
- [ ] Test authentication flow
- [ ] Test real-time collaboration
- [ ] Test AI agent commands
- [ ] Verify export functionality

---

## Project URLs

- **Live App**: https://collabcanvas-f7ee2.web.app
- **Firebase Console**: https://console.firebase.google.com/project/collabcanvas-f7ee2/overview
- **Firestore Database**: https://console.firebase.google.com/project/collabcanvas-f7ee2/firestore
- **Authentication**: https://console.firebase.google.com/project/collabcanvas-f7ee2/authentication

---

## Environment

- **Framework**: React + TypeScript + Vite
- **Hosting**: Firebase Hosting
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Build Output**: `dist/` folder
- **Node Version**: 18+ recommended

---

## Last Deployment

**Date**: October 17, 2025
**Features**:
- ✅ Infinite canvas implementation
- ✅ Multi-selection enhancements
- ✅ Distribution fix (one-click)
- ✅ Dynamic grid rendering
- ✅ Smart export with bounding box
- ✅ Last edited marker improvements
- ✅ UI/UX improvements (navbar, toolbox, AI agent)
- ✅ Change password feature
- ✅ Online users dropdown

---

## Quick Commands Reference

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Deployment
firebase deploy --only hosting    # Deploy frontend
firebase deploy                   # Deploy everything

# Firebase
firebase login       # Login to Firebase
firebase use         # Show current project
firebase projects:list  # List all projects
```
