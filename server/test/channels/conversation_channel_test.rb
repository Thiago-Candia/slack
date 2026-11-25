require "test_helper"

class ConversationChannelTest < ActionCable::Channel::TestCase
  test "suscribe a un canal publico del que es miembro" do
    stub_connection current_user: users(:bob)

    subscribe channel_id: channels(:general).id

    assert subscription.confirmed?
    assert_has_stream_for channels(:general)
  end

  test "rechaza un canal inexistente o ajeno" do
    stub_connection current_user: users(:bob)

    subscribe channel_id: 0

    assert subscription.rejected?
  end

  test "suscribe a la conversacion directa" do
    stub_connection current_user: users(:alice)

    subscribe workspace_id: workspaces(:acme).id, user_id: users(:bob).id

    assert subscription.confirmed?
  end

  test "rechaza sin parametros" do
    stub_connection current_user: users(:alice)

    subscribe

    assert subscription.rejected?
  end
end
