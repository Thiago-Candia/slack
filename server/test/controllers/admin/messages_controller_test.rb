require "test_helper"

class Admin::MessagesControllerTest < ActionDispatch::IntegrationTest
  setup do
    admin = User.create!(name: "Admin", email: "admin@example.com", password: "password123", admin: true)
    post admin_session_path, params: { email: admin.email, password: "password123" }

    @message = Message.new(channel: channels(:general), user: users(:alice))
    @message.files.attach(io: StringIO.new("hola"), filename: "notas.txt")
    @message.save!
  end

  test "el detalle lista los adjuntos con su enlace de descarga" do
    get admin_message_path(@message)

    assert_response :success
    assert_select "a[href*='/rails/active_storage/blobs/'][href*='disposition=attachment']", text: "notas.txt"
  end

  test "el listado muestra los mensajes que solo tienen adjuntos" do
    get admin_messages_path

    assert_response :success
    assert_select "a[href='#{admin_message_path(@message)}']", text: "(sin texto)"
    assert_match "1 adjunto", response.body
  end
end
