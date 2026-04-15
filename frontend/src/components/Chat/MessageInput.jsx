import { useState } from 'react';

function MessageInput({ onSend, disabled = false }) {
  const [value, setValue] = useState('');

  function submit(e) {
    e.preventDefault();
    if (disabled) {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    onSend(trimmed);
    setValue('');
  }

  return (
    <form className="message-input" onSubmit={submit}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder="Send message"
      />
      <button type="submit" aria-label="Send message" disabled={disabled}>➤</button>
    </form>
  );
}

export default MessageInput;