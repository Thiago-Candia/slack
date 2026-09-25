class Admin::BaseController < ApplicationController
  before_action :require_admin

  private

  def require_admin
    redirect_to new_admin_session_path, alert: "Iniciá sesión para continuar" unless current_admin&.admin?
  end
end
