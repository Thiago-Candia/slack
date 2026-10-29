import { useEffect, useRef } from "react";
import { formatMessageTime } from "../utils/format";
import Avatar from "./Avatar";
import { EmptyState, ErrorState, LoadingState } from "./StatusView";

const GROUP_WINDOW_MS = 5 * 60 * 1000;

const startsGroup = (message, previous) => {
  if (!previous || previous.sender?.id !== message.sender?.id) return true;

  return new Date(message.created_at) - new Date(previous.created_at) > GROUP_WINDOW_MS;
};

const MessageList = ({ status, messages, error, errorMessage, onRetry }) => {
  const endRef = useRef(null);

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
        <EmptyState title="Todavía no hay mensajes.">
          <p>Escribí el primero para empezar la conversación.</p>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="message-list" role="log" aria-label="Mensajes">
      <ol className="message-list__items">
        {messages.map((message, index) => {
          const sender = message.sender || {};
          const senderName = sender.name || sender.email || "Usuario";
          const isGroupStart = startsGroup(message, messages[index - 1]);

          return (
            <li key={message.id} className={`message ${isGroupStart ? "message--group-start" : ""}`}>
              <div className="message__gutter">
                {isGroupStart ? (
                  <Avatar name={senderName} src={sender.avatar_url} size="md" shape="square" />
                ) : (
                  <time className="message__hover-time" dateTime={message.created_at}>
                    {formatMessageTime(message.created_at)}
                  </time>
                )}
              </div>
              <div className="message__content">
                {isGroupStart && (
                  <p className="message__meta">
                    <span className="message__author">{senderName}</span>
                    <time className="message__time" dateTime={message.created_at}>
                      {formatMessageTime(message.created_at)}
                    </time>
                  </p>
                )}
                <p className="message__body">{message.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <div ref={endRef} />
    </div>
  );
};

export default MessageList;
