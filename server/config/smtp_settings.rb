# SMTP settings shared by the development and production environments.
#
# With RESEND_API_KEY, emails go through Resend (https://resend.com).
# Any other provider works with SMTP_ADDRESS, SMTP_PORT, SMTP_USERNAME and SMTP_PASSWORD.
# Without any of them, this returns nil and the environment keeps its default delivery method.
module SmtpSettings
  RESEND_ADDRESS = "smtp.resend.com".freeze
  RESEND_USERNAME = "resend".freeze

  def self.call(env = ENV)
    resend_key = env["RESEND_API_KEY"].presence
    address = env["SMTP_ADDRESS"].presence || (RESEND_ADDRESS if resend_key)
    return if address.nil?

    {
      address: address,
      port: env.fetch("SMTP_PORT", 587).to_i,
      user_name: env["SMTP_USERNAME"].presence || (RESEND_USERNAME if resend_key),
      password: env["SMTP_PASSWORD"].presence || resend_key,
      authentication: :plain,
      enable_starttls_auto: true
    }
  end
end
