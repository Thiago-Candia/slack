import { useCallback, useId } from "react";
import { useResource } from "../hooks/useResource";
import MessageComposer from "./MessageComposer";
import MessageList from "./MessageList";


const Conversation = ({ title, subtitle, placeholder, loadMessages, sendMessage, describeError }) => {
  const titleId = useId();
  const { status, data, error, reload, setData } = useResource(loadMessages);
  const messages = Array.isArray(data) ? data : [];

  const addMessage = useCallback(
    (message) => {
      if (!message?.id) return;
      setData((previous) => {
        const list = previous ?? [];
        return list.some((item) => item.id === message.id) ? list : [...list, message];
      });
    },
    [setData]
  );

  const handleSend = async (body) => {
    const message = await sendMessage(body);
    addMessage(message);
  };

  return (
    <section className="conversation" aria-labelledby={titleId}>
      <header className="conversation__header">
        <h1 id={titleId} className="conversation__title">
          {title}
        </h1>
        {subtitle && <p className="conversation__subtitle">{subtitle}</p>}
      </header>
      <MessageList
        status={status}
        messages={messages}
        errorMessage={status === "error" ? describeError?.(error) : null}
        error={error}
        onRetry={reload}
      />
      <MessageComposer placeholder={placeholder} onSend={handleSend} disabled={status !== "ready"} />
    </section>
  );
};

export default Conversation;
