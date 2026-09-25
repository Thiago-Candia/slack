class Admin::MessagesController < Admin::BaseController
  before_action :set_message, only: %i[show destroy]

  def index
    @messages = Message.includes(:user, :channel).order(created_at: :desc)
  end

  def show
  end

  def destroy
    @message.destroy
    redirect_to admin_messages_path, notice: "Mensaje eliminado"
  end

  private

  def set_message
    @message = Message.find(params[:id])
  end
end
