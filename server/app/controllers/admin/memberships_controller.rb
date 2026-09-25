class Admin::MembershipsController < Admin::BaseController
  def index
    @memberships = Membership.includes(:user, :workspace)
  end

  def new
    @membership = Membership.new
  end

  def create
    @membership = Membership.new(membership_params)

    if @membership.save
      redirect_to admin_memberships_path, notice: "Membership creado"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def destroy
    Membership.find(params[:id]).destroy
    redirect_to admin_memberships_path, notice: "Membership eliminado"
  end

  private

  def membership_params
    params.require(:membership).permit(:user_id, :workspace_id, :role)
  end
end
