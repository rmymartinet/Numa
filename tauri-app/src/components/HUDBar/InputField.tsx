import { forwardRef } from 'react';

interface InputFieldProps {
  value: string;
  onChange: (text: string) => void;
  onChatSubmit?: (message: string) => void;
  placeholder?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ value, onChange, onChatSubmit, placeholder = 'I Ask...' }, ref) => {
    return (
      <div
        style={{
          flex: 1,
          position: 'relative',
        }}
      >
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="glass__btn"
          style={{
            width: '100%',
            maxWidth: '600px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '3px',
            color: 'white',
            padding: '3px 0px',
            fontSize: '14px',
            outline: 'none',
            transition: 'all 0.2s ease',
          }}
          onKeyDown={e => {
            // ✅ ENTER: Envoyer le message
            if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
              e.preventDefault();
              onChatSubmit?.(value.trim());
              onChange('');

              // 🎯 AUTO-FOCUS: Garder le focus après envoi
              setTimeout(() => {
                if (ref && 'current' in ref && ref.current) {
                  ref.current.focus();
                }
              }, 50);
            }
            // ✅ SHIFT+ENTER: Nouvelle ligne (préparé pour textarea)
            else if (e.key === 'Enter' && e.shiftKey) {
              // Laisse le comportement par défaut pour nouvelle ligne
              // (nécessaire si on passe à textarea plus tard)
            }
          }}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '4px',
            }}
          >
            ×
          </button>
        )}
      </div>
    );
  }
);

InputField.displayName = 'InputField';

export default InputField;
