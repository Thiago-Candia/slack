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
