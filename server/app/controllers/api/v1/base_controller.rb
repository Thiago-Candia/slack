class Api::V1::BaseController < Api::BaseController
  before_action :authenticate_user!

  private

  def authenticate_user!
    token = request.headers["Authorization"]&.split(" ")&.last
    payload = token && JsonWebToken.decode(token)
    @current_user = payload && User.find_by(id: payload[:user_id])

    render json: { errors: ["No autorizado"] }, status: :unauthorized unless @current_user
  end

  def current_user
    @current_user
  end
end