# AI Study Mentor

An intelligent study companion with reading assessments, note generation, and speed reading tools.

## Project info

**URL**: https://lovable.dev/projects/b93e2ae5-f700-4854-8902-1bbd8de0d71c

## 📁 Project Structure

This project follows a **feature-based modular architecture** for scalability:

```
src/
├── core/              # App setup (App.tsx, router.tsx, main.tsx)
├── features/          # Feature modules (auth, notes, assessments, etc.)
│   ├── auth/
│   ├── notes/
│   ├── reading-assessment/
│   ├── speed-assessment/
│   ├── payment/
│   ├── profile/
│   └── home/
├── shared/            # Shared code (UI, hooks, utils)
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── utils/
├── config/            # Configuration & constants
└── styles/            # Global styles
```

### 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get started quickly with common tasks
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed architecture documentation
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Migration from old structure

## ✨ Features

- 🔐 **Authentication** - Secure login/signup with Supabase
- 📝 **Notes Generation** - AI-powered study notes from documents
- 📺 **YouTube Transcripts** - Extract and analyze video transcripts
- 📖 **Reading Assessment** - Comprehensive reading tests with metrics
- ⚡ **Speed Assessment** - Timed reading with WPM tracking
- 💳 **Payment Integration** - Razorpay & Stripe subscriptions
- 📊 **Progress Dashboard** - Track learning progress

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/b93e2ae5-f700-4854-8902-1bbd8de0d71c) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/b93e2ae5-f700-4854-8902-1bbd8de0d71c) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
