class ApplicationController < ActionController::Base
  def current_admin
    @current_admin ||= User.find_by(id: session[:admin_id])
  end
  helper_method :current_admin
end
