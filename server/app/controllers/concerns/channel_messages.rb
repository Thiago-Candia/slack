module ChannelMessages
  extend ActiveSupport::Concern

  included do
    def index
      render json: @channel.messages.order(:created_at).map { |message| MessageSerializer.new(message).as_json }
    end

    def create
      message = @channel.messages.new(body: params[:body], user: current_user)

      if message.save
        render json: MessageSerializer.new(message).as_json, status: :created
      else
        render json: { errors: message.errors.full_messages }, status: :unprocessable_entity
      end
    end
  end
end
