require "test_helper"

class Api::V1::MessagesControllerTest < ActionDispatch::IntegrationTest
  test "lista los mensajes del canal" do
    get api_v1_channel_messages_path(channels(:general)), headers: auth_headers(users(:alice))

    assert_response :success
    bodies = response.parsed_body.map { |message| message["body"] }
    assert_includes bodies, messages(:welcome).body
  end

  test "crea un mensaje asociado al usuario autenticado" do
    assert_difference "Message.count", 1 do
      post api_v1_channel_messages_path(channels(:general)),
        params: { body: "Hola a todos" },
        headers: auth_headers(users(:bob))
    end

    assert_response :created
    assert_equal users(:bob).id, Message.last.user_id
  end

  test "no crea un mensaje sin contenido" do
    assert_no_difference "Message.count" do
      post api_v1_channel_messages_path(channels(:general)),
        params: { body: "" },
        headers: auth_headers(users(:alice))
    end

    assert_response :unprocessable_entity
  end
end
