import { useState } from 'react';

interface MessengerConversation {
  id: string;
  name: string;
}

const testConversations: MessengerConversation[] = [
  {
    id: 'all',
    name: 'ALL',
  },
  {
    id: 'player-1',
    name: 'PLAYER ONE',
  },
];

export function MessengerSurface() {
  const [
    openConversationId,
    setOpenConversationId,
  ] = useState<string | null>(null);

  const openConversation =
    testConversations.find(
      (conversation) =>
        conversation.id === openConversationId
    ) ?? null;

  return (
    <div className="messenger-surface">
      {openConversation && (
        <div className="messenger-panel">
          <div className="messenger-chat-log">
            Conversation will appear here.
          </div>

          <div className="messenger-input-row">
            <button
              type="button"
              className="messenger-attach-button"
              title="Attach file"
            >
              +
            </button>

            <input
              className="messenger-message-input"
              placeholder="Type a message..."
            />

            <button
              type="button"
              className="messenger-send-button"
            >
              Send
            </button>
          </div>
        </div>
      )}

      <div className="messenger-tabs">
        {testConversations.map((conversation) => {
          const isOpen =
            conversation.id === openConversationId;

          return (
            <button
              key={conversation.id}
              type="button"
              className={
                isOpen
                  ? 'messenger-tab active'
                  : 'messenger-tab'
              }
              onClick={() =>
                setOpenConversationId(
                  isOpen
                    ? null
                    : conversation.id
                )
              }
            >
              {conversation.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}