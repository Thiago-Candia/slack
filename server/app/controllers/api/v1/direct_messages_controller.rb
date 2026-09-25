class Api::V1::DirectMessagesController < Api::V1::BaseController
  include ChannelMessages

  before_action :set_channel

  private

  def set_channel
    workspace = current_user.workspaces.find(params[:workspace_id])
    other_user = workspace.members.find(params[:user_id])
    @channel = Channel.direct_between(workspace, current_user, other_user)
  end
end
