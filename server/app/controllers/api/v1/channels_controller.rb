class Api::V1::ChannelsController < Api::V1::BaseController
  before_action :set_workspace, only: %i[index create]
  before_action :set_channel, only: %i[show update destroy]

  def index
    render json: @workspace.channels.where.not(kind: "direct").map { |c| ChannelSerializer.new(c).as_json }
  end

  def show
    render json: ChannelSerializer.new(@channel).as_json
  end

  def create
    channel = @workspace.channels.new(name: params[:name], kind: "public")

    if channel.save
      channel.channel_memberships.create!(user: current_user)
      render json: ChannelSerializer.new(channel).as_json, status: :created
    else
      render json: { errors: channel.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @channel.update({ name: params[:name] }.compact)
      render json: ChannelSerializer.new(@channel).as_json
    else
      render json: { errors: @channel.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @channel.destroy
    head :no_content
  end

  private

  def set_workspace
    @workspace = current_user.workspaces.find(params[:workspace_id])
  end

  def set_channel
    @channel = current_user.channels.find(params[:id])
  end
end