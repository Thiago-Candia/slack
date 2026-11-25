require "test_helper"

class Api::V1::PasswordResetsControllerTest < ActionDispatch::IntegrationTest
  include ActionMailer::TestHelper

  test "genera el token y encola el mail para un email registrado" do
    assert_enqueued_email_with UserMailer, :password_reset_email, args: [ users(:alice) ] do
      post api_v1_password_resets_path, params: { email: " ALICE@example.com " }
    end

    assert_response :success
    assert users(:alice).reload.reset_password_token.present?
  end

  test "responde igual y no envía nada para un email inexistente" do
    assert_no_enqueued_emails do
      post api_v1_password_resets_path, params: { email: "nadie@example.com" }
    end

    assert_response :success
    assert_equal "Si el email existe, se generó un enlace", response.parsed_body["message"]
  end

  test "cambia la contraseña con un token válido" do
    users(:alice).update!(reset_password_token: "valido", reset_password_sent_at: 10.minutes.ago)

    patch api_v1_path_for("valido"), params: { password: "nueva-clave-123" }

    assert_response :success
    alice = users(:alice).reload
    assert alice.authenticate("nueva-clave-123")
    assert_nil alice.reset_password_token
  end

  test "rechaza un token inválido" do
    patch api_v1_path_for("no-existe"), params: { password: "nueva-clave-123" }

    assert_response :unprocessable_entity
    assert_equal [ "Enlace inválido o expirado" ], response.parsed_body["errors"]
  end

  test "rechaza un token vencido" do
    users(:alice).update!(reset_password_token: "viejo", reset_password_sent_at: 3.hours.ago)

    patch api_v1_path_for("viejo"), params: { password: "nueva-clave-123" }

    assert_response :unprocessable_entity
    assert users(:alice).reload.authenticate("password123")
  end

  test "rechaza una contraseña vacía sin consumir el token" do
    users(:alice).update!(reset_password_token: "valido", reset_password_sent_at: 10.minutes.ago)

    patch api_v1_path_for("valido"), params: { password: "" }

    assert_response :unprocessable_entity
    assert_equal "valido", users(:alice).reload.reset_password_token
  end

  private

  def api_v1_path_for(token)
    "/api/v1/password-resets/#{token}"
  end
end
