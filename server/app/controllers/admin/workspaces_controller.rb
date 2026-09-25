class Admin::WorkspacesController < Admin::BaseController
  before_action :set_workspace, only: %i[show edit update destroy]

  def index
    @workspaces = Workspace.order(:name)
  end

  def show
  end

  def new
    @workspace = Workspace.new
  end

  def create
    @workspace = Workspace.new(workspace_params.merge(owner: current_admin))

    if @workspace.save
      redirect_to admin_workspaces_path, notice: "Workspace creado"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @workspace.update(workspace_params)
      redirect_to admin_workspaces_path, notice: "Workspace actualizado"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @workspace.destroy
    redirect_to admin_workspaces_path, notice: "Workspace eliminado"
  end

  private

  def set_workspace
    @workspace = Workspace.find(params[:id])
  end

  def workspace_params
    params.require(:workspace).permit(:name)
  end
end
