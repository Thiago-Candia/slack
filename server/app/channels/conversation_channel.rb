class ConversationChannel < ApplicationCable::Channel
  def subscribed
    channel = params[:user_id] ? direct_channel : accessible_channel
    return reject unless channel

    stream_for channel
  end

  private

  # La misma regla de acceso que usa la API HTTP para leer y enviar mensajes.
  def accessible_channel
    Channel.accessible_by(current_user).find_by(id: params[:channel_id])
  end

  def direct_channel
    workspace = current_user.workspaces.find_by(id: params[:workspace_id])
    other_user = workspace.members.find_by(id: params[:user_id]) if workspace
    Channel.direct_between(workspace, current_user, other_user) if other_user
  end
end
