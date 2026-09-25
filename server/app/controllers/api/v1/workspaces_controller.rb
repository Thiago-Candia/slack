class Api::V1::WorkspacesController < Api::V1::BaseController
  before_action :set_workspace, only: %i[show update destroy invite]

  def index
    render json: current_user.workspaces.map { |w| WorkspaceSerializer.new(w).as_json }
  end

  def show
    render json: WorkspaceSerializer.new(@workspace).as_json
  end

  def create
    workspace = Workspace.new({ name: params[:name], image: params[:image] }.compact.merge(owner: current_user))

    if workspace.save
      workspace.memberships.create!(user: current_user, role: "owner")
      workspace.channels.create!(name: "general", kind: "public")
      render json: WorkspaceSerializer.new(workspace).as_json, status: :created
    else
      render json: { errors: workspace.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @workspace.update({ name: params[:name], image: params[:image] }.compact)
      render json: WorkspaceSerializer.new(@workspace).as_json
    else
      render json: { errors: @workspace.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @workspace.destroy
    head :no_content
  end

  def invite
    render json: { invite_token: @workspace.invite_token }
  end

  def join
    workspace = Workspace.find_by!(invite_token: params[:token])
    membership = workspace.memberships.find_or_create_by(user: current_user) { |m| m.role = "member" }

    if membership.persisted?
      render json: WorkspaceSerializer.new(workspace).as_json
    else
      render json: { errors: membership.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_workspace
    @workspace = current_user.workspaces.find(params[:id])
  end
end