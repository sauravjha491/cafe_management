# ☕ CafePro - Digital Menu & Order Management System

CafePro is a modern, full-stack digital menu and order management system designed for cafes and restaurants. It features real-time order tracking, administrative dashboards, and a beautiful mobile-first customer experience.

## ✨ Features

- **📱 Digital Menu**: Mobile-friendly, high-performance menu with categories and search.
- **🛒 Easy Ordering**: Simple cart system with options for special notes (e.g., "less sugar").
- **⚡ Real-time Tracking**: Customers can track their order status (Pending → Preparing → Ready → Served) in real-time.
- **🛡️ Admin Dashboard**:
  - **Live Orders**: Manage incoming orders with a real-time status feed.
  - **Menu Management**: Add, edit, or remove categories and products.
  - **Analytics**: Track revenue, order counts, and top-performing items.
  - **Staff Management**: Role-based access (Owner/Staff) with secure authentication.
  - **Table Management**: Generate and print QR codes for specific tables.
- **💰 Localized**: Fully configured for Nepalese currency (**NPR/Rs.**).

## 🚀 Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Database**: [Prisma](https://www.prisma.io/) with SQLite (Local) / Postgres (Production)
- **Real-time & Auth**: [Firebase](https://firebase.google.com/) (Firestore & Auth)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- A Firebase Project (for real-time updates and auth)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd cafe-menu
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root and add your credentials (see `.env.example` or your Firebase console):
   ```env
   DATABASE_URL="file:./dev.db"
   NEXT_PUBLIC_FIREBASE_API_KEY="..."
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
   # ... other firebase vars
   FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", ...}'
   ```

4. **Initialize Database**:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

## 🌐 Deployment

### Vercel

The project is pre-configured for Vercel.

1. Push your code to GitHub.
2. Import the project in Vercel.
3. Add your environment variables in the Vercel Dashboard.
4. **Note**: For production, it is recommended to switch the Prisma provider to **Postgres** in `prisma/schema.prisma` as SQLite is not persistent on Vercel.

## 📄 License

This project is private and intended for internal use.

---
Built with ❤️ for better dining experiences.
