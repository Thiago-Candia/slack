class ApplicationMailer < ActionMailer::Base
  # Resend's shared sender works without a verified domain, but only delivers to the
  # email of the Resend account owner. Verify a domain and set MAILER_FROM to reach anyone.
  RESEND_TEST_SENDER = "Slack Clone <onboarding@resend.dev>".freeze
  DEFAULT_SENDER = "no-reply@slack-clone.test".freeze

  default from: -> { ApplicationMailer.sender }
  layout "mailer"

  def self.sender(env = ENV)
    env["MAILER_FROM"].presence || (env["RESEND_API_KEY"].present? ? RESEND_TEST_SENDER : DEFAULT_SENDER)
  end
end
