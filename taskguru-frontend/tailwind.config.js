export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // ✅ ADDED: Design Tokens based on your specification
      colors: {
        'tg-primary': '#3B3BFF', // Warm Indigo (trust + focus)
        'tg-accent': '#FF6B61',  // Electric Coral (action accent)
        // Status colors
        'tg-success': '#10B981', 
        'tg-warning': '#F59E0B',  
        'tg-danger': '#EF4444', 
        // Neutrals
        'tg-text-primary': '#0F1724', // Charcoal
        'tg-text-muted': '#334155',    // Slate 700
        'tg-surface': '#FFFFFF',       // White (for cards/active elements)
        'tg-bg': '#E6E9EE',          // Muted Grey (for page background)
      },
      borderRadius: {
        '2xl': '12px', // Soft rounded corners
      },
      boxShadow: {
        // Subtle shadow: 0 6px 18px rgba(11, 14, 28, 0.06)
        'card': '0 6px 18px rgba(11, 14, 28, 0.06)', 
      },
      // You can add your spacing scale here, or rely on Tailwind's defaults
      // spacing: { 1: '4px', 2: '8px', 3: '12px', ... } 
    },
    // ✅ ADDED: Primary font is Inter (if you have it installed)
    fontFamily: {
        sans: ['Inter', 'sans-serif'], 
    },
  },
  plugins: [],
};