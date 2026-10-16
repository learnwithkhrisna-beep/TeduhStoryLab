# DESIGN.md — TeduhCeritaAI Design Direction

## 1. Product Identity & Purpose
- **Name:** TeduhCeritaAI
- **Tagline:** Generative Islamic Storyboard Studio
- **Essence:** Platform pembuatan papan cerita (storyboard), prompt visual cinematik dua sudut (Shot A & Shot B), dan pengisian suara (voiceover) bernuansa Islami yang tenang, teduh, dan profesional.
- **Tone:** *Teduh* (tenang, bermakna, khusyuk), elegan, fungsional, dan setara dengan standar studio film profesional.

## 2. Color Palette & Lighting
- **Canvas / Root Background:** Deep Midnight Slate (`#020617` / Tailwind `bg-slate-950`).
- **Surfaces & Cards:** Dark Navy Slate (`#0f172a` / Tailwind `bg-slate-900`) dengan border halus (`#1e293b` / Tailwind `border-slate-800`).
- **Primary Brand Accents:** 
  - Teal & Emerald (`#14b8a6` / `teal-500` dan `#10b981` / `emerald-500`): melambangkan keteduhan dan kedamaian spiritual.
- **Secondary Accent:** 
  - Subtle Warm Gold / Amber (`#f59e0b`): kilau hangat bintang dan ilmu pengetahuan.
- **Slop Filters:** 
  - DILARANG menggunakan gradien ungu-pink (purple-pink slop), orb ungu berputar tanpa makna, atau saturasi neon yang menyilaukan mata.

## 3. Typography & Hierarchy
- **Font Stack:** Clean geometric sans-serif (Inter, system-ui).
- **Labels:** Uppercase tracking-wider dengan kontras jelas (`text-xs font-bold text-slate-400`).
- **Hierarchy:**
  - H1: Judul Studio & Proyek (bold, tracking-tight).
  - H2/H3: Panel Kontrol & Nomor Adegan (semibold, terstruktur rapi).
  - Body: Teks naskah dan prompt dengan leading yang lapang (`leading-relaxed`) untuk kemudahan membaca.

## 4. Components & Surface Treatment
- **Border Radius:** Gunakan `rounded-xl` (12px) untuk kartu adegan dan container, serta `rounded-lg` (8px) untuk tombol dan input kontrol. HINDARI bentuk kapsul/pill seragam di semua elemen.
- **Shadows:** Bayangan halus bertingkat (`shadow-xl` dengan tint teal gelap pada fokus aktif). Hindari shadow putih berlebihan atau efek kaca buram (glassmorphism) yang ditumpuk di seluruh layar.
- **Glassmorphism Limit:** Maksimal 1 surface (misal: sticky header dengan `backdrop-blur-md bg-slate-900/80`). Konten lainnya menggunakan solid surface agar hierarki tetap tajam.

## 5. Copywriting Principles (Anti-Slop Copy)
- Gunakan bahasa yang jujur, ringkas, dan jelas.
- HINDARI kata-kata klise AI: "Revolutionize your workflow", "Unlock next-gen synergy", "100x faster magical content".
- Gunakan istilah sinematik nyata: *Adegan, Naskah Narasi, Prompt Visual (Shot A & B), Gerakan Kamera (Motion Prompt), Durasi Audio, Ekspor ZIP*.

## 6. Functional Liveliness Dials
- **Energy:** 2 (Fokus pada ketenangan kerja studio, tidak ada animasi berisik).
- **Rhythm:** 2 (Grid adegan yang terukur, transisi status `pending` -> `generating` -> `complete` yang informatif).
- **Motion:** 1 (Animasi mikro halus pada interaksi tombol, pulse indikator status yang halus, transisi accordion yang presisi).
