class ConversationChannel < ApplicationCable::Channel
  def subscribed
    channel = params[:user_id] ? direct_channel : member_channel
    return reject unless channel

    stream_for channel
  end

  private

  def member_channel
    current_user.channels.find_by(id: params[:channel_id])
  end

  def direct_channel
    workspace = current_user.workspaces.find_by(id: params[:workspace_id])
    other_user = workspace.members.find_by(id: params[:user_id]) if workspace
    Channel.direct_between(workspace, current_user, other_user) if other_user
  end
end
