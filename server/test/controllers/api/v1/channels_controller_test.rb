require "test_helper"

class Api::V1::ChannelsControllerTest < ActionDispatch::IntegrationTest
  test "lista los canales del workspace" do
    get api_v1_workspace_channels_path(workspaces(:acme)), headers: auth_headers(users(:alice))

    assert_response :success
    names = response.parsed_body.map { |channel| channel["name"] }
    assert_includes names, channels(:general).name
  end

  test "crea un canal dentro del workspace" do
    assert_difference "Channel.count", 1 do
      post api_v1_workspace_channels_path(workspaces(:acme)),
        params: { name: "random" },
        headers: auth_headers(users(:alice))
    end

    assert_response :created
  end

  test "un usuario ajeno al workspace no puede crear canales" do
    otro = User.create!(name: "Ajeno", email: "ajeno@example.com", password: "password123")

    post api_v1_workspace_channels_path(workspaces(:acme)),
      params: { name: "intruso" },
      headers: auth_headers(otro)

    assert_response :not_found
  end
end
