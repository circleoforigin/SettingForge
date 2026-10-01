import { useState } from 'react';
import type { OverlayPlacement } from '../OverlayPlacement';
import { MessengerSurface } from './MessengerSurface';

export interface MessengerTabConfig 
{
  id: string;
  name: string;
  phoneNumber: string;
}

export function useMessengerOverlay() 
{
  const [
    settingsOpen,
    setSettingsOpen,
  ] = useState(false);

  const [
    tabs,
    setTabs,
  ] = useState<MessengerTabConfig[]>([
    {
      id:
        crypto.randomUUID(),
      name:
        'PLAYER ONE',
      phoneNumber:
        '',
    },
  ]);

  return {    
    settingsOpen,
    setSettingsOpen,
    tabs,
    setTabs,
  };
}

export type MessengerOverlayController =
  ReturnType<
    typeof useMessengerOverlay
  >;

interface MessengerOverlayProps
{
  controller: MessengerOverlayController;
  placement: OverlayPlacement;
}

export function MessengerOverlay({
  controller,
  placement,
}: MessengerOverlayProps) 
{
  const {
    settingsOpen,
    setSettingsOpen,
    tabs,
    setTabs,
  } = controller;

  return (
    <>
      <MessengerSurface
        placement={placement}
        tabs={tabs}
      />

      {settingsOpen && (
        <div className="dialog-backdrop">
          <div className="dialog messenger-settings-dialog">
            <h2>
              Messenger Settings
            </h2>            

            <div className="messenger-settings-section">
              <strong>
                Tabs
              </strong>

              {tabs.map(
                (tab) => (
                  <div
                    key={tab.id}
                    className="messenger-settings-tab-row"
                  >
                    <input
                      type="text"
                      placeholder="Name"
                      value={tab.name}
                      onChange={(event) => {
                        const name =
                          event.target.value;

                        setTabs(
                          (current) =>
                            current.map(
                              (item) =>
                                item.id ===
                                tab.id
                                  ? {
                                      ...item,
                                      name,
                                    }
                                  : item
                            )
                        );
                      }}
                    />

                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={
                        tab.phoneNumber
                      }
                      onChange={(event) => {
                        const phoneNumber =
                          event.target.value;

                        setTabs(
                          (current) =>
                            current.map(
                              (item) =>
                                item.id ===
                                tab.id
                                  ? {
                                      ...item,
                                      phoneNumber,
                                    }
                                  : item
                            )
                        );
                      }}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setTabs(
                          (current) =>
                            current.filter(
                              (item) =>
                                item.id !==
                                tab.id
                            )
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                )
              )}

              <button
                type="button"
                onClick={() =>
                  setTabs(
                    (current) => [
                      ...current,
                      {
                        id:
                          crypto.randomUUID(),
                        name:
                          '',
                        phoneNumber:
                          '',
                      },
                    ]
                  )
                }
              >
                + Add Tab
              </button>
            </div>

            <div className="dialog-buttons">
              <button
                type="button"
                onClick={() =>
                  setSettingsOpen(
                    false
                  )
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}