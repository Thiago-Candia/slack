class ChannelSerializer
  def initialize(channel)
    @channel = channel
  end

  def as_json
    { id: @channel.id, name: @channel.name, kind: @channel.kind, workspace_id: @channel.workspace_id }
  end
end
