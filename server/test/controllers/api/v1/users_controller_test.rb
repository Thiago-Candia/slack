require "test_helper"

class Api::V1::UsersControllerTest < ActionDispatch::IntegrationTest
  test "registra un usuario nuevo y devuelve un token" do
    assert_difference "User.count", 1 do
      post api_v1_register_path, params: { name: "Nuevo", email: "nuevo@example.com", password: "password123" }
    end

    assert_response :created
    assert response.parsed_body["token"].present?
  end

  test "no registra un usuario con email repetido" do
    assert_no_difference "User.count" do
      post api_v1_register_path, params: { name: "Repetido", email: users(:alice).email, password: "password123" }
    end

    assert_response :unprocessable_entity
  end
end
