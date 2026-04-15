import { useChat } from '../../context/ChatContext';
import CreateGroup from './CreateGroup';

function GroupList() {
  const { groups, currentGroupId, selectGroup } = useChat();

  return (
    <aside className="group-list">
      <CreateGroup />
      {groups.map((group) => (
        <button
          key={group.id}
          className={`group-item ${currentGroupId === group.id ? 'active' : ''}`}
          onClick={() => selectGroup(group.id)}
        >
          {group.name}
        </button>
      ))}
    </aside>
  );
}

export default GroupList;