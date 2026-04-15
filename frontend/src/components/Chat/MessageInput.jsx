import { useState } from 'react';

function MessageInput({ onSend }) {
  const [value, setValue] = useState('');

  function submit(e) {
    e.preventDefault();
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
        placeholder="Type message"
      />
      <button type="submit">Send</button>
    </form>
  );
}

export default MessageInput;