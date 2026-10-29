require "test_helper"

class Api::V1::ChannelAccessTest < ActionDispatch::IntegrationTest
  test "la dueña de un workspace nuevo puede leer y escribir en #general" do
    owner = User.create!(name: "Dueña", email: "duena@example.com", password: "password123")
    post api_v1_workspaces_path, params: { name: "Nuevo" }, headers: auth_headers(owner)
    general = Workspace.find(response.parsed_body["id"]).channels.find_by!(name: "general")

    assert_can_read_and_write general, owner
  end

  test "la dueña de un workspace nuevo puede ver y renombrar #general" do
    owner = User.create!(name: "Dueña", email: "duena@example.com", password: "password123")
    post api_v1_workspaces_path, params: { name: "Nuevo" }, headers: auth_headers(owner)
    general = Workspace.find(response.parsed_body["id"]).channels.find_by!(name: "general")

    get api_v1_channel_path(general), headers: auth_headers(owner)
    assert_response :success

    patch api_v1_channel_path(general), params: { name: "anuncios" }, headers: auth_headers(owner)
    assert_response :success
    assert_equal "anuncios", general.reload.name
  end

  test "quien se une con la invitación puede leer y escribir en los canales públicos" do
    post api_v1_workspace_channels_path(workspaces(:acme)), params: { name: "random" }, headers: auth_headers(users(:alice))
    random = Channel.find(response.parsed_body["id"])
    nuevo = User.create!(name: "Nuevo", email: "nuevo@example.com", password: "password123")

    post "/api/v1/join/#{workspaces(:acme).invite_token}", headers: auth_headers(nuevo)
    assert_response :success

    assert_can_read_and_write channels(:general), nuevo
    assert_can_read_and_write random, nuevo
  end

  test "alguien ajeno al workspace no puede leer ni escribir en sus canales públicos" do
    assert_cannot_read_or_write channels(:general), outsider
  end

  test "quien sale del workspace pierde el acceso a sus canales" do
    workspaces(:acme).memberships.find_by!(user: users(:bob)).destroy

    assert_cannot_read_or_write channels(:general), users(:bob)
  end

  test "un mensaje directo sigue restringido a sus dos participantes" do
    carol = workspace_member("carol@example.com")
    direct = Channel.direct_between(workspaces(:acme), users(:alice), users(:bob))

    assert_can_read_and_write direct, users(:bob)
    assert_cannot_read_or_write direct, carol

    get api_v1_channel_path(direct), headers: auth_headers(carol)
    assert_response :not_found
  end

  test "un canal privado solo es accesible para sus miembros" do
    carol = workspace_member("carol@example.com")
    privado = workspaces(:acme).channels.create!(name: "privado", kind: "private")
    privado.channel_memberships.create!(user: users(:alice))

    assert_can_read_and_write privado, users(:alice)
    assert_cannot_read_or_write privado, carol
  end

  private

  def outsider
    User.create!(name: "Ajeno", email: "ajeno@example.com", password: "password123")
  end

  def workspace_member(email)
    user = User.create!(name: email, email: email, password: "password123")
    workspaces(:acme).memberships.create!(user: user, role: "member")
    user
  end

  def assert_can_read_and_write(channel, user)
    get api_v1_channel_messages_path(channel), headers: auth_headers(user)
    assert_response :success

    assert_difference -> { channel.messages.count }, 1 do
      post api_v1_channel_messages_path(channel), params: { body: "Hola" }, headers: auth_headers(user)
    end
    assert_response :created
  end

  def assert_cannot_read_or_write(channel, user)
    get api_v1_channel_messages_path(channel), headers: auth_headers(user)
    assert_response :not_found

    assert_no_difference -> { channel.messages.count } do
      post api_v1_channel_messages_path(channel), params: { body: "Hola" }, headers: auth_headers(user)
    end
    assert_response :not_found
  end
end
