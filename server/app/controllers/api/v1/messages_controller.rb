class Api::V1::MessagesController < Api::V1::BaseController
  include ChannelMessages

  before_action :set_channel, only: %i[index create]
  before_action :set_message, only: :destroy

  def destroy
    @message.destroy
    head :no_content
  end

  private

  def set_channel
    @channel = current_user.channels.find(params[:channel_id])
  end

  def set_message
    @message = current_user.messages.find(params[:id])
  end
end
