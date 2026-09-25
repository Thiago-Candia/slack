class Admin::ChannelsController < Admin::BaseController
  before_action :set_workspace, only: %i[index new create]
  before_action :set_channel, only: %i[show edit update destroy]

  def index
    @channels = @workspace.channels
  end

  def show
  end

  def new
    @channel = @workspace.channels.new
  end

  def create
    @channel = @workspace.channels.new(channel_params)

    if @channel.save
      redirect_to admin_workspace_path(@workspace), notice: "Canal creado"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @channel.update(channel_params)
      redirect_to admin_channel_path(@channel), notice: "Canal actualizado"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    workspace = @channel.workspace
    @channel.destroy
    redirect_to admin_workspace_path(workspace), notice: "Canal eliminado"
  end

  private

  def set_workspace
    @workspace = Workspace.find(params[:workspace_id])
  end

  def set_channel
    @channel = Channel.find(params[:id])
  end

  def channel_params
    params.require(:channel).permit(:name, :kind)
  end
end
