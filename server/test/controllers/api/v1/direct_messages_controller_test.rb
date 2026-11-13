require "test_helper"

class Api::V1::DirectMessagesControllerTest < ActionDispatch::IntegrationTest
  include ActionCable::TestHelper

  test "emite un broadcast al crear un mensaje directo" do
    channel = Channel.direct_between(workspaces(:acme), users(:alice), users(:bob))

    assert_broadcasts(ConversationChannel.broadcasting_for(channel), 1) do
      post api_v1_workspace_direct_messages_path(workspaces(:acme), user_id: users(:bob).id),
        params: { body: "Hola Bob" },
        headers: auth_headers(users(:alice))
    end

    assert_response :created
  end
end
