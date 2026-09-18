import { useState, useMemo } from 'react';
import type { OverlaySurfaceProps } from '../OverlayDefinition';

export function MessengerSurface({
  placement,
  tabs = [],
}: OverlaySurfaceProps) {
const [unreadConversationIds, setUnreadConversationIds] =
  useState<Set<string>>(
    () =>
      new Set(
        tabs.length > 0
          ? [tabs[0].id]
          : []
      )
  );

const conversations = useMemo(() => {
  const sortedTabs = [...tabs].sort((a, b) => {
    const aUnread =
      unreadConversationIds.has(a.id);
    const bUnread =
      unreadConversationIds.has(b.id);

    if (aUnread !== bUnread) {
      return aUnread ? -1 : 1;
    }

    return a.name.localeCompare(
      b.name,
      undefined,
      { sensitivity: 'base' }
    );
  });

  return [
    {
      id: 'group',
      name: 'GROUP',
      phoneNumber: '',
    },
    ...sortedTabs,
  ];
}, [tabs, unreadConversationIds]);

  const [
    openConversationId,
    setOpenConversationId,
  ] = useState<string | null>(null);

  const openConversation =
    conversations.find(
      (conversation) =>
        conversation.id === openConversationId
    ) ?? null;

    const VISIBLE_TAB_COUNT = 4;

const [firstVisibleTabIndex, setFirstVisibleTabIndex] =
  useState(0);

const maxFirstVisibleTabIndex = Math.max(
  0,
  conversations.length - VISIBLE_TAB_COUNT
);

const visibleConversations = conversations.slice(
  firstVisibleTabIndex,
  firstVisibleTabIndex + VISIBLE_TAB_COUNT
);

const showPreviousConversation = () => {
  setFirstVisibleTabIndex((current) =>
    Math.max(0, current - 1)
  );
};

const showNextConversation = () => {
  setFirstVisibleTabIndex((current) =>
    Math.min(
      maxFirstVisibleTabIndex,
      current + 1
    )
  );
};

  return (
    <div
        className="messenger-surface"
        data-edge={placement.edge}
        data-alignment={placement.alignment}
    >
      {openConversation && (
        <div className="messenger-panel">
            {openConversation.id === 'group' && (
                <button
                    type="button"
                    className="messenger-recipients-tab"
                >
                    RECIPIENTS
                </button>
            )}
          <div className="messenger-chat-log" />

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

      <div className="messenger-tab-navigation">
  <button
    type="button"
    className="messenger-tab-arrow"
    aria-label="Previous conversations"
    disabled={firstVisibleTabIndex === 0}
    onClick={showPreviousConversation}
    >
        ‹
    </button>

  <div className="messenger-tabs">
    {visibleConversations.map((conversation) => {
      const isOpen =
        conversation.id === openConversationId;

      return (
        <button
          key={conversation.id}
          type="button"
          className={[
            'messenger-tab',
            isOpen ? 'active' : '',
            unreadConversationIds.has(conversation.id)
                ? 'unread'
                : '',
            ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => {
  if (
    unreadConversationIds.has(
      conversation.id
    )
  ) {
    setUnreadConversationIds(
      (current) => {
        const next = new Set(current);
        next.delete(conversation.id);
        return next;
      }
    );
  }

  setOpenConversationId(
    isOpen
      ? null
      : conversation.id
  );
}}
        >
          {conversation.name}
        </button>
      );
    })}
  </div>

  <button
    type="button"
    className="messenger-tab-arrow"
    aria-label="Next conversations"
    disabled={
        firstVisibleTabIndex >=
        maxFirstVisibleTabIndex
    }
    onClick={showNextConversation}
    >
        ›
    </button>
</div>        
    </div>
  );
}