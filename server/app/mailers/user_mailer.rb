class UserMailer < ApplicationMailer
  def password_reset_email(user)
    @user = user
    @reset_url = "#{ENV.fetch('FRONTEND_URL', 'http://localhost:5173')}/rewrite-password?reset_token=#{@user.reset_password_token}"

    mail(to: @user.email, subject: "Restablecimiento de contraseña")
  end
end
