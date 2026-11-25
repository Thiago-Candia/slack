require "test_helper"

class UserMailerTest < ActionMailer::TestCase
  setup do
    @user = users(:alice)
    @user.update!(reset_password_token: "abc-123_XYZ", reset_password_sent_at: Time.current)
  end

  test "el mail de restablecimiento incluye el link completo al frontend" do
    mail = UserMailer.password_reset_email(@user)

    assert_equal [ @user.email ], mail.to
    assert_equal "Restablecimiento de contraseña", mail.subject

    url = "http://localhost:5173/rewrite-password?reset_token=abc-123_XYZ"
    assert_includes mail.html_part.decoded, url
    assert_includes mail.text_part.decoded, url
    assert_includes mail.text_part.decoded, "vence en 2 horas"
  end

  test "usa FRONTEND_URL sin barra final" do
    previous = ENV["FRONTEND_URL"]
    ENV["FRONTEND_URL"] = "https://chat.example.com/"

    mail = UserMailer.password_reset_email(@user)

    assert_includes mail.text_part.decoded, "https://chat.example.com/rewrite-password?reset_token=abc-123_XYZ"
  ensure
    ENV["FRONTEND_URL"] = previous
  end
end
