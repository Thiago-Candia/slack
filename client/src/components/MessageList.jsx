import { Fragment, useEffect, useRef } from "react";
import { useWorkspaces } from "../context/WorkspaceContext";
import { dayKey, dayLabel, formatMessageTime } from "../utils/format";
import Avatar from "./Avatar";
import FormattedMessage from "./FormattedMessage";
import { EmptyState, ErrorState, LoadingState } from "./StatusView";

const GROUP_WINDOW_MS = 5 * 60 * 1000;

const startsDay = (message, previous) => !previous || dayKey(message.created_at) !== dayKey(previous.created_at);

const startsGroup = (message, previous) => {
  if (startsDay(message, previous) || previous.sender?.id !== message.sender?.id) return true;

  return new Date(message.created_at) - new Date(previous.created_at) > GROUP_WINDOW_MS;
};

const MessageList = ({ status, messages, error, errorMessage, onRetry }) => {
  const endRef = useRef(null);
  const user = useWorkspaces()?.user;

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [messages.length]);

  if (status === "loading") {
    return (
      <div className="message-list message-list--centered">
        <LoadingState>Cargando mensajes...</LoadingState>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="message-list message-list--centered">
        <ErrorState error={error} message={errorMessage} onRetry={onRetry} />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="message-list message-list--centered">
        <div className="conversation-empty">
          <span className="conversation-empty__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" focusable="false">
              <path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2" />
            </svg>
          </span>
          <EmptyState title="Todavía no hay mensajes.">
            <p>Escribí el primero para empezar la conversación.</p>
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list" role="log" aria-label="Mensajes">
      <ol className="message-list__items">
        {messages.map((message, index) => {
          const previous = messages[index - 1];
          const sender = message.sender || {};
          const senderName = sender.name || sender.email || "Usuario";
          const isOwn = user?.id !== undefined && sender.id === user.id;
          const isGroupStart = startsGroup(message, previous);

          return (
            <Fragment key={message.id}>
              {startsDay(message, previous) && (
                <li className="message-day" role="presentation">
                  <time dateTime={message.created_at}>{dayLabel(message.created_at)}</time>
                </li>
              )}
              <li className={`message ${isGroupStart ? "message--group-start" : ""}`}>
                <div className="message__gutter">
                  {isGroupStart ? (
                    <Avatar name={senderName} src={sender.avatar_url} size="md" shape="round" />
                  ) : (
                    <time className="message__hover-time" dateTime={message.created_at}>
                      {formatMessageTime(message.created_at)}
                    </time>
                  )}
                </div>
                <div className="message__content">
                  {isGroupStart && (
                    <p className="message__meta">
                      <span className={`message__author ${isOwn ? "message__author--own" : ""}`}>
                        {isOwn ? "Vos" : senderName}
                      </span>
                      <time className="message__time" dateTime={message.created_at}>
                        {formatMessageTime(message.created_at)}
                      </time>
                    </p>
                  )}
                  <div className="message__body">
                    <FormattedMessage text={message.body} />
                  </div>
                </div>
              </li>
            </Fragment>
          );
        })}
      </ol>
      <div ref={endRef} />
    </div>
  );
};

export default MessageList;
