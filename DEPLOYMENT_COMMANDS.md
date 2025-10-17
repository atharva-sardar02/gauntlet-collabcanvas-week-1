# 🚀 Deployment Commands

Quick reference guide for deploying CollabCanvas enhancements.

---

## 📦 Frontend Deployment (Most Common)

For UI/UX changes, theme updates, and frontend enhancements:

```bash
# 1. Build the production bundle
npm run build

# 2. Deploy to Firebase Hosting
firebase deploy --only hosting
```

---

## ⚡ AWS Lambda Backend Deployment

For AI agent or backend logic changes:

```bash
# 1. Navigate to Lambda directory
cd aws-lambda

# 2. Install dependencies (if package.json changed)
npm install

# 3. Build TypeScript
npm run build

# 4. Create deployment package (Windows PowerShell)
Compress-Archive -Path dist\*, node_modules -DestinationPath lambda-deployment.zip -Force

# 5. Deploy to AWS Lambda
aws lambda update-function-code --function-name collabcanvas-ai-agent --zip-file fileb://lambda-deployment.zip

# 6. Return to project root
cd ..
```

**Alternative (Linux/Mac):**
```bash
cd aws-lambda
npm install
npm run build
zip -r lambda-deployment.zip dist/ node_modules/
aws lambda update-function-code --function-name collabcanvas-ai-agent --zip-file fileb://lambda-deployment.zip
cd ..
```

---

## 🔄 Full Stack Deployment

Deploy both frontend and backend:

```bash
# 1. Build and deploy frontend
npm run build
firebase deploy --only hosting

# 2. Build and deploy Lambda
cd aws-lambda
npm run build
Compress-Archive -Path dist\*, node_modules -DestinationPath lambda-deployment.zip -Force
aws lambda update-function-code --function-name collabcanvas-ai-agent --zip-file fileb://lambda-deployment.zip
cd ..
```

---

## 🗄️ Firestore Rules Deployment

For database security rule changes:

```bash
firebase deploy --only firestore:rules
```

---

## 🔐 Firestore Indexes Deployment

For database index changes:

```bash
firebase deploy --only firestore:indexes
```

---

## 📊 Complete Firebase Deployment

Deploy all Firebase services:

```bash
firebase deploy
```

---

## ✅ Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All changes are committed to git
- [ ] `npm run build` completes without errors
- [ ] No TypeScript errors (`tsc` passes)
- [ ] No linter errors
- [ ] Tested locally with `npm run dev`
- [ ] AWS credentials are configured (for Lambda)
- [ ] Firebase project is selected (`firebase use`)

---

## 🔍 Post-Deployment Verification

After deployment, test:

1. **Frontend Features:**
   - ✨ Compact draggable toolbox
   - 🎨 Solid colors (no gradients)
   - 👁️ Full-width navbar layout
   - 🎯 Cursor color contrast
   - 🌙 Dark-themed AI command bar
   - 🔧 Tools toggle button
   - 👥 Online users dropdown
   - 🔑 Change password (for email auth)

2. **Backend Features:**
   - 🤖 AI agent command execution
   - 📦 Bulk shape creation (500+ shapes)
   - 🎨 Complex layout generation
   - ⚡ Response time < 2 seconds

3. **Check Firebase Console:**
   - Visit: https://console.firebase.google.com
   - Verify hosting deployment timestamp
   - Check error logs

4. **Check AWS Console:**
   - Visit: https://console.aws.amazon.com/lambda
   - Verify Lambda function version
   - Check CloudWatch logs for errors

---

## 🆘 Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Firebase Deploy Fails
```bash
# Check Firebase project
firebase projects:list
firebase use <project-id>

# Re-authenticate if needed
firebase login
```

### AWS Lambda Deploy Fails
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check Lambda function exists
aws lambda get-function --function-name collabcanvas-ai-agent

# View recent logs
aws logs tail /aws/lambda/collabcanvas-ai-agent --follow
```

---

## 📝 Quick Commands Reference

| Task | Command |
|------|---------|
| Build frontend | `npm run build` |
| Deploy frontend | `firebase deploy --only hosting` |
| Deploy Lambda | `cd aws-lambda && npm run build && aws lambda update-function-code --function-name collabcanvas-ai-agent --zip-file fileb://lambda-deployment.zip` |
| View Firebase logs | `firebase hosting:channel:list` |
| View Lambda logs | `aws logs tail /aws/lambda/collabcanvas-ai-agent` |
| Rollback hosting | `firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live` |

---

## 🌐 Live URLs

- **Production:** https://collabcanvas-f7ee2.web.app
- **Firebase Console:** https://console.firebase.google.com/project/collabcanvas-f7ee2
- **AWS Lambda Console:** https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/collabcanvas-ai-agent

---

**Last Updated:** 2025-01-17

