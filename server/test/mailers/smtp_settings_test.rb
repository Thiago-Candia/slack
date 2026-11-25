require "test_helper"
require Rails.root.join("config/smtp_settings")

class SmtpSettingsTest < ActiveSupport::TestCase
  test "sin variables no configura SMTP" do
    assert_nil SmtpSettings.call({})
  end

  test "con RESEND_API_KEY usa el SMTP de Resend" do
    settings = SmtpSettings.call("RESEND_API_KEY" => "re_test")

    assert_equal "smtp.resend.com", settings[:address]
    assert_equal 587, settings[:port]
    assert_equal "resend", settings[:user_name]
    assert_equal "re_test", settings[:password]
  end

  test "las variables SMTP_* tienen prioridad" do
    settings = SmtpSettings.call(
      "RESEND_API_KEY" => "re_test",
      "SMTP_ADDRESS" => "smtp.otro.com",
      "SMTP_PORT" => "2525",
      "SMTP_USERNAME" => "usuario",
      "SMTP_PASSWORD" => "clave"
    )

    assert_equal "smtp.otro.com", settings[:address]
    assert_equal 2525, settings[:port]
    assert_equal "usuario", settings[:user_name]
    assert_equal "clave", settings[:password]
  end

  test "remitente según las variables de entorno" do
    assert_equal "no-reply@slack-clone.test", ApplicationMailer.sender({})
    assert_equal "Slack Clone <onboarding@resend.dev>", ApplicationMailer.sender("RESEND_API_KEY" => "re_test")
    assert_equal "Chat <hola@midominio.com>",
      ApplicationMailer.sender("RESEND_API_KEY" => "re_test", "MAILER_FROM" => "Chat <hola@midominio.com>")
  end
end
