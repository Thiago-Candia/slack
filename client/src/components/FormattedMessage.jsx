import { parseMessage } from "../utils/messageFormat";

const renderInline = (nodes) =>
  nodes.map((node, index) => {
    switch (node.type) {
      case "bold":
        return <strong key={index}>{renderInline(node.children)}</strong>;
      case "italic":
        return <em key={index}>{renderInline(node.children)}</em>;
      case "code":
        return <code key={index}>{node.value}</code>;
      case "link":
        return (
          <a key={index} href={node.href} target="_blank" rel="noopener noreferrer">
            {node.label}
          </a>
        );
      default:
        return node.value;
    }
  });

const FormattedMessage = ({ text }) =>
  parseMessage(text).map((block, index) =>
    block.type === "list" ? (
      <ul key={index} className="message__list">
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex}>{renderInline(item)}</li>
        ))}
      </ul>
    ) : (
      <p key={index} className="message__paragraph">
        {renderInline(block.children)}
      </p>
    )
  );

export default FormattedMessage;
