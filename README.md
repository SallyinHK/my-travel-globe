# 🌍 MY TRAVEL GLOBE

A cinematic, Web3D-powered personal travel footprint tracker. Built with a premium dark aesthetic, it turns your flight and travel records into an interactive 3D globe and a procedural digital passport.

[👉 Live Demo](https://my-travel-globe.vercel.app/) 

✨ Key Features

* Cinematic 3D Globe: Powered by WebGL and `deck.gl`. Features smooth, calculated camera transitions between departure and arrival cities with custom arc rendering.
* My Travel Passport: A procedural digital stamp collection. Uses a deterministic HSL hashing algorithm to ensure every city in the world gets a unique, mathematically locked color.
* Panorama Poster Export: One-click high-resolution canvas merging to export your global footprint as a premium dark-theme poster.
* Responsive & Polished UI: Features a mobile-optimized "pill-shaped" navigation bar, floating glass-morphism drawers, and buttery-smooth animations.
* Bilingual Support: Seamless switching between English and Simplified Chinese without page reloads.

🛠 Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (App Router)
* **3D Rendering:** [deck.gl](https://deck.gl/) & Mapbox/MapLibre ecosystem
* **Database & Auth:** [Supabase](https://supabase.com/)
* **Styling & Animation:** Tailwind CSS, Framer Motion
* **Icons & Typography:** Lucide React, Google Fonts (Inter, Permanent Marker)

🚀 Getting Started

Prerequisites
You will need a Supabase project to handle authentication and data storage. Ensure you have a `trajectories` table set up with the corresponding schema.

Installation

1. Clone the repository and install dependencies:
```bash
npm install
# or yarn install / pnpm install / bun install
```

2. Create a `.env.local` file in the root directory and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:
```bash
npm run dev
# or yarn dev / pnpm dev / bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

💡 Built with Vibe Coding
This project was developed focusing on product intuition, high-end aesthetics, and user experience, while leveraging AI (Cursor) as the ultimate coding partner.