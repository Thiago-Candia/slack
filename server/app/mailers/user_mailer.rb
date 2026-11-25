class UserMailer < ApplicationMailer
  def password_reset_email(user)
    @user = user
    @reset_url = "#{frontend_url}/rewrite-password?reset_token=#{CGI.escape(@user.reset_password_token)}"
    @expires_in_hours = User::RESET_PASSWORD_TTL.in_hours.to_i

    mail(to: @user.email, subject: "Restablecimiento de contraseña")
  end

  private

  def frontend_url
    ENV.fetch("FRONTEND_URL", "http://localhost:5173").chomp("/")
  end
end
