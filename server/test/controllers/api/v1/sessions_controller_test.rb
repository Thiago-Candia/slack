require "test_helper"

class Api::V1::SessionsControllerTest < ActionDispatch::IntegrationTest
  test "login con credenciales válidas devuelve un token" do
    post api_v1_login_path, params: { email: users(:alice).email, password: "password123" }

    assert_response :success
    assert response.parsed_body["token"].present?
  end

  test "login con contraseña incorrecta devuelve 401" do
    post api_v1_login_path, params: { email: users(:alice).email, password: "incorrecta" }

    assert_response :unauthorized
  end
end
