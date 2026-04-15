import { useState } from 'react';
import { useChat } from '../../context/ChatContext';

function CreateGroup() {
  const [name, setName] = useState('');
  const { createGroup } = useChat();

  async function onSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    await createGroup(trimmed);
    setName('');
  }

  return (
    <form className="create-group" onSubmit={onSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New group"
      />
      <button type="submit">Create</button>
    </form>
  );
}

export default CreateGroup;