class Api::V1::UsersController < Api::BaseController
  def create
    user = User.new(name: params[:name] || params[:username], email: params[:email], password: params[:password])

    if user.save
      render json: { token: JsonWebToken.encode(user_id: user.id), user: UserSerializer.new(user).as_json }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end
end