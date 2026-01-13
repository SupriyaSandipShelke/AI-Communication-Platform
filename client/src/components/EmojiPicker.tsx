import { useState } from 'react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const emojiCategories = {
  'Smileys & People': [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬'
  ],
  'Animals & Nature': [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
    '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
    '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇'
  ],
  'Food & Drink': [
    '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒',
    '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬',
    '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🍞'
  ],
  'Activities': [
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
    '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳'
  ],
  'Objects': [
    '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️',
    '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥'
  ],
  'Symbols': [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️'
  ]
};

export default function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState('Smileys & People');

  return (
    <div style={{
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-medium)',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      width: '320px',
      height: '300px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Category Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-light)',
        padding: '8px'
      }}>
        {Object.keys(emojiCategories).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            style={{
              flex: 1,
              padding: '8px 4px',
              border: 'none',
              background: selectedCategory === category ? 'var(--accent-primary)' : 'transparent',
              color: selectedCategory === category ? 'white' : 'var(--text-secondary)',
              borderRadius: '6px',
              fontSize: '10px',
              cursor: 'pointer',
              margin: '0 2px'
            }}
          >
            {category.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div style={{
        flex: 1,
        padding: '12px',
        overflowY: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: '8px',
        alignContent: 'start'
      }}>
        {emojiCategories[selectedCategory as keyof typeof emojiCategories].map((emoji, index) => (
          <button
            key={index}
            onClick={() => onEmojiSelect(emoji)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              aspectRatio: '1',
              ':hover': {
                background: 'var(--bg-secondary)'
              }
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}