class ApplicationMailer < ActionMailer::Base
  default from: "no-reply@slack-clone.test"
  layout "mailer"
end
