import { useTheme } from './ThemeProvider';
import '../styles/themeSelector.css';

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'light' as const, name: 'Light', icon: '☀️' },
    { id: 'dark' as const, name: 'Dark', icon: '🌙' },
    { id: 'gradient' as const, name: 'Gradient', icon: '🎨' },
    { id: 'glassmorphism' as const, name: 'Glass', icon: '✨' },
    { id: 'modern' as const, name: 'Modern', icon: '🔷' },
    { id: 'minimal' as const, name: 'Minimal', icon: '🔲' },
  ];

  return (
    <div className="theme-selector">
      <div className="theme-selector-label">Theme</div>
      <div className="theme-options">
        {themes.map((t) => (
          <button
            key={t.id}
            className={`theme-option ${theme === t.id ? 'active' : ''}`}
            onClick={() => setTheme(t.id)}
            title={t.name}
          >
            <span className="theme-icon">{t.icon}</span>
            <span className="theme-name">{t.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
