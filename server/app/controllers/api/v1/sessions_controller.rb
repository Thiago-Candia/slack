class Api::V1::SessionsController < Api::BaseController
  def create
    user = User.find_by(email: params[:email]&.downcase)

    if user&.authenticate(params[:password])
      render json: { token: JsonWebToken.encode(user_id: user.id), user: UserSerializer.new(user).as_json }
    else
      render json: { errors: ["Email o contraseña inválidos"] }, status: :unauthorized
    end
  end

  def destroy
    head :no_content
  end
end