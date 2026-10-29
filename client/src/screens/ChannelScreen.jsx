import { useOutletContext, useParams } from "react-router-dom";
import Conversation from "../components/Conversation";
import { EmptyState, ErrorState, LoadingState } from "../components/StatusView";
import { channelService } from "../services";
import { errorMessage } from "../utils/errors";
import { sameId } from "../utils/format";

const describeChannelError = (error) =>
  error?.status === 404 ? "No tenés acceso a los mensajes de este canal." : errorMessage(error);

const ChannelScreen = () => {
  const { channel_id: channelId } = useParams();
  const { channels } = useOutletContext();

  if (channels.status === "loading") return <LoadingState>Cargando canal...</LoadingState>;
  if (channels.status === "error") return <ErrorState error={channels.error} onRetry={channels.reload} />;

  const channel = channels.data.find((item) => sameId(item.id, channelId));

  if (!channel) {
    return (
      <EmptyState title="Canal no encontrado.">
        <p>Elegí otro canal en la barra lateral.</p>
      </EmptyState>
    );
  }

  return (
    <Conversation
      key={channel.id}
      title={`# ${channel.name}`}
      subtitle="Canal del espacio de trabajo"
      placeholder={`Escribe un mensaje en #${channel.name}`}
      loadMessages={() => channelService.getMessages(channel.id)}
      sendMessage={(body) => channelService.sendMessage(channel.id, body)}
      describeError={describeChannelError}
    />
  );
};

export default ChannelScreen;
