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

  test "suscribe a quien se sumo al workspace a un canal publico sin alta en el canal" do
    stub_connection current_user: workspace_member("carol@example.com")

    subscribe channel_id: channels(:general).id

    assert subscription.confirmed?
    assert_has_stream_for channels(:general)
  end

  test "suscribe al canal publico creado por otra persona" do
    random = workspaces(:acme).channels.create!(name: "random", kind: "public")
    random.channel_memberships.create!(user: users(:alice))
    stub_connection current_user: users(:bob)

    subscribe channel_id: random.id

    assert subscription.confirmed?
    assert_has_stream_for random
  end

  test "rechaza un canal publico de un workspace ajeno" do
    stub_connection current_user: create_user("ajeno@example.com")

    subscribe channel_id: channels(:general).id

    assert subscription.rejected?
  end

  test "rechaza a quien salio del workspace" do
    workspaces(:acme).memberships.find_by!(user: users(:bob)).destroy
    stub_connection current_user: users(:bob)

    subscribe channel_id: channels(:general).id

    assert subscription.rejected?
  end

  test "rechaza un canal privado a quien no es miembro del canal" do
    privado = workspaces(:acme).channels.create!(name: "privado", kind: "private")
    stub_connection current_user: users(:bob)

    subscribe channel_id: privado.id

    assert subscription.rejected?
  end

  private

  def create_user(email)
    User.create!(name: email, email: email, password: "password123")
  end

  def workspace_member(email)
    create_user(email).tap { |user| workspaces(:acme).memberships.create!(user: user, role: "member") }
  end
end
