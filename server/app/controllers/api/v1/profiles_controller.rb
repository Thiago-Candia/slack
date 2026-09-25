class Api::V1::ProfilesController < Api::V1::BaseController
  def show
    render json: UserSerializer.new(current_user).as_json
  end

  def update
    if current_user.update({ name: params[:name], avatar: params[:avatar] }.compact)
      render json: UserSerializer.new(current_user).as_json
    else
      render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
    end
  end
end