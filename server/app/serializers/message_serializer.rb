class MessageSerializer
  def initialize(message)
    @message = message
  end

  def as_json
    { id: @message.id, body: @message.body, created_at: @message.created_at, sender: UserSerializer.new(@message.user).as_json }
  end
end
