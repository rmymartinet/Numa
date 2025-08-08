import { forwardRef } from 'react';

interface InputFieldProps {
  value: string;
  onChange: (text: string) => void;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ value, onChange }, ref) => {
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
          placeholder="I Ask..."
          style={{
            width: '100%',
            padding: '8px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '25px',
            color: 'white',
            fontSize: '14px',
            outline: 'none',
            transition: 'all 0.2s ease',
          }}
          onKeyPress={e => {
            if (e.key === 'Enter' && value.trim()) {
              console.log('Prompt envoyé:', value);
              onChange('');
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
