class Api::V1::PasswordResetsController < Api::BaseController
  def create
    user = User.find_by(email: params[:email]&.downcase)
    user&.update!(reset_password_token: SecureRandom.urlsafe_base64, reset_password_sent_at: Time.current)
    render json: { message: "Si el email existe, se generó un enlace", reset_token: user&.reset_password_token }
  end

  def update
    user = User.find_by(reset_password_token: params[:token])

    if user.nil? || user.reset_password_sent_at < 2.hours.ago
      return render json: { errors: ["Enlace inválido o expirado"] }, status: :unprocessable_entity
    end

    if user.update(password: params[:password], reset_password_token: nil, reset_password_sent_at: nil)
      render json: { message: "Contraseña actualizada" }
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end
end