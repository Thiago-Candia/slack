class ApplicationMailer < ActionMailer::Base
  RESEND_TEST_SENDER = "Slack Clone <onboarding@resend.dev>".freeze
  DEFAULT_SENDER = "no-reply@slack-clone.test".freeze

  default from: -> { ApplicationMailer.sender }
  layout "mailer"

  def self.sender(env = ENV)
    env["MAILER_FROM"].presence || (env["RESEND_API_KEY"].present? ? RESEND_TEST_SENDER : DEFAULT_SENDER)
  end
end
