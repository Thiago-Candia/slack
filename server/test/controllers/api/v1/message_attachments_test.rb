require "test_helper"

class Api::V1::MessageAttachmentsTest < ActionDispatch::IntegrationTest
  include ActionCable::TestHelper

  test "envía un mensaje con un adjunto en un canal" do
    assert_difference [ "Message.count", "ActiveStorage::Attachment.count" ], 1 do
      post api_v1_channel_messages_path(channels(:general)),
        params: { body: "Te paso la foto", files: [ fixture_file_upload("avatar.png", "image/png") ] },
        headers: auth_headers(users(:bob))
    end

    assert_response :created
    attachment = response.parsed_body["attachments"].sole
    assert_equal "avatar.png", attachment["filename"]
    assert_equal "image/png", attachment["content_type"]
    assert_equal file_fixture("avatar.png").size, attachment["byte_size"]
    assert_match %r{\A/rails/active_storage/blobs/redirect/}, attachment["url"]
    assert_match(/disposition=attachment/, attachment["download_url"])
  end

  test "envía un mensaje solo con adjuntos" do
    post api_v1_channel_messages_path(channels(:general)),
      params: { files: [ upload("hola", "notas.txt", "text/plain") ] },
      headers: auth_headers(users(:bob))

    assert_response :created
    assert_equal "", response.parsed_body["body"]
    assert_equal 1, response.parsed_body["attachments"].size
  end

  test "envía un adjunto en un mensaje directo" do
    channel = Channel.direct_between(workspaces(:acme), users(:alice), users(:bob))

    assert_broadcasts(ConversationChannel.broadcasting_for(channel), 1) do
      post api_v1_workspace_direct_messages_path(workspaces(:acme), user_id: users(:bob).id),
        params: { files: [ upload("%PDF-1.4\n%%EOF", "informe.pdf", "application/pdf") ] },
        headers: auth_headers(users(:alice))
    end

    assert_response :created
    assert_equal "application/pdf", response.parsed_body["attachments"].sole["content_type"]
    assert channel.messages.last.files.attached?
  end

  test "el broadcast incluye los adjuntos" do
    broadcasts = capture_broadcasts(ConversationChannel.broadcasting_for(channels(:general))) do
      post api_v1_channel_messages_path(channels(:general)),
        params: { body: "Mirá", files: [ upload("hola", "notas.txt", "text/plain") ] },
        headers: auth_headers(users(:bob))
    end

    event = broadcasts.sole
    assert_equal "message.created", event["type"]
    assert_equal "notas.txt", event["message"]["attachments"].sole["filename"]
  end

  test "detecta el tipo real e ignora el que declara el navegador" do
    # Windows declara los CSV como application/vnd.ms-excel.
    post api_v1_channel_messages_path(channels(:general)),
      params: { files: [ upload("a,b\n1,2\n", "datos.csv", "application/vnd.ms-excel") ] },
      headers: auth_headers(users(:bob))

    assert_response :created
    assert_equal "text/csv", response.parsed_body["attachments"].sole["content_type"]
  end

  test "rechaza un archivo que se hace pasar por otro tipo" do
    html = upload("<!DOCTYPE html><html><script>alert(1)</script></html>", "notas.txt", "text/plain")

    assert_no_difference [ "Message.count", "ActiveStorage::Blob.count" ] do
      post api_v1_channel_messages_path(channels(:general)), params: { files: [ html ] }, headers: auth_headers(users(:bob))
    end

    assert_response :unprocessable_entity
    assert response.parsed_body["errors"].any? { |error| error.include?("notas.txt") }
  end

  test "rechaza más de cinco archivos" do
    files = Array.new(Message::MAX_FILES + 1) { |i| upload("hola", "nota#{i}.txt", "text/plain") }

    assert_no_difference "Message.count" do
      post api_v1_channel_messages_path(channels(:general)), params: { files: files }, headers: auth_headers(users(:bob))
    end

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"], "Archivos adjuntos no pueden ser más de 5 por mensaje"
  end

  test "rechaza un signed_id en lugar de un archivo" do
    other = Message.new(channel: channels(:general), user: users(:alice), body: "privado")
    other.files.attach(io: StringIO.new("secreto"), filename: "secreto.txt")
    other.save!
    signed_id = other.files.first.blob.signed_id

    assert_no_difference [ "Message.count", "ActiveStorage::Attachment.count" ] do
      post api_v1_channel_messages_path(channels(:general)),
        params: { body: "mirá", files: [ signed_id ] },
        headers: auth_headers(users(:bob))
    end

    assert_response :unprocessable_entity
    assert_equal [ "Los archivos adjuntos no son válidos" ], response.parsed_body["errors"]
  end

  test "rechaza un signed_id enviado por JSON" do
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("secreto"), filename: "secreto.txt")

    assert_no_difference "Message.count" do
      post api_v1_channel_messages_path(channels(:general)),
        params: { body: "mirá", files: blob.signed_id }.to_json,
        headers: auth_headers(users(:bob)).merge("Content-Type" => "application/json")
    end

    assert_response :unprocessable_entity
  end

  test "quien no tiene acceso al canal no puede enviar adjuntos" do
    outsider = User.create!(name: "Eve", email: "eve@example.com", password: "password123")

    assert_no_difference [ "Message.count", "ActiveStorage::Blob.count" ] do
      post api_v1_channel_messages_path(channels(:general)),
        params: { files: [ upload("hola", "notas.txt", "text/plain") ] },
        headers: auth_headers(outsider)
    end

    assert_response :not_found
  end

  test "quien no tiene acceso al canal no puede listar sus adjuntos" do
    create_message_with_file
    outsider = User.create!(name: "Eve", email: "eve@example.com", password: "password123")

    get api_v1_channel_messages_path(channels(:general)), headers: auth_headers(outsider)

    assert_response :not_found
  end

  test "el listado incluye los adjuntos y los mensajes viejos tienen la lista vacía" do
    create_message_with_file

    get api_v1_channel_messages_path(channels(:general)), headers: auth_headers(users(:bob))

    assert_response :success
    by_body = response.parsed_body.index_by { |message| message["body"] }
    assert_equal [], by_body[messages(:welcome).body]["attachments"]
    assert_equal "notas.txt", by_body["con archivo"]["attachments"].sole["filename"]
  end

  test "el listado no hace una consulta por mensaje" do
    create_message_with_file
    few = count_queries { get api_v1_channel_messages_path(channels(:general)), headers: auth_headers(users(:bob)) }

    3.times { create_message_with_file }
    many = count_queries { get api_v1_channel_messages_path(channels(:general)), headers: auth_headers(users(:bob)) }

    assert_equal few, many
  end

  test "las URLs de los adjuntos vencen a las 24 horas" do
    create_message_with_file
    get api_v1_channel_messages_path(channels(:general)), headers: auth_headers(users(:bob))
    attachment = response.parsed_body.flat_map { |message| message["attachments"] }.sole

    get attachment["url"]
    assert_response :redirect

    travel 25.hours do
      get attachment["url"]
      assert_response :not_found

      get attachment["download_url"]
      assert_response :not_found
    end
  end

  test "eliminar el mensaje borra sus archivos" do
    message = create_message_with_file(user: users(:bob))

    assert_enqueued_with(job: ActiveStorage::PurgeJob) do
      delete api_v1_message_path(message), headers: auth_headers(users(:bob))
    end

    assert_response :no_content
  end

  private

  def upload(content, filename, content_type)
    Rack::Test::UploadedFile.new(StringIO.new(content), content_type, original_filename: filename)
  end

  def create_message_with_file(user: users(:alice))
    message = Message.new(channel: channels(:general), user: user, body: "con archivo")
    message.files.attach(io: StringIO.new("hola"), filename: "notas.txt")
    message.save!
    message
  end

  def count_queries(&block)
    count = 0
    counter = lambda do |*, payload|
      count += 1 unless payload[:name].in?([ "SCHEMA", "TRANSACTION" ]) || payload[:cached]
    end
    ActiveSupport::Notifications.subscribed(counter, "sql.active_record", &block)
    count
  end
end
