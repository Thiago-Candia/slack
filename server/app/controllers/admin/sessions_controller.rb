class Admin::SessionsController < ApplicationController
  def new
  end

  def create
    user = User.find_by(email: params[:email]&.downcase)

    if user&.authenticate(params[:password]) && user.admin?
      session[:admin_id] = user.id
      redirect_to admin_root_path
    else
      flash.now[:alert] = "Credenciales inválidas"
      render :new, status: :unprocessable_entity
    end
  end

  def destroy
    session[:admin_id] = nil
    redirect_to new_admin_session_path
  end
end
