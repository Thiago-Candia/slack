class Api::V1::MembershipsController < Api::V1::BaseController
  before_action :set_workspace

  def index
    render json: @workspace.members.map { |member| UserSerializer.new(member).as_json }
  end

  def create
    user = User.find_by!(email: params[:email]&.downcase)
    membership = @workspace.memberships.find_or_create_by(user: user) { |new_membership| new_membership.role = "member" }

    if membership.persisted?
      render json: UserSerializer.new(user).as_json, status: :created
    else
      render json: { errors: membership.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @workspace.memberships.find(params[:id]).destroy
    head :no_content
  end

  private

  def set_workspace
    @workspace = current_user.workspaces.find(params[:workspace_id])
  end
end
