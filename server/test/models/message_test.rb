require "test_helper"

class MessageTest < ActiveSupport::TestCase
  include ActiveJob::TestHelper

  test "requiere contenido" do
    message = Message.new(channel: channels(:general), user: users(:alice))
    assert_not message.valid?
  end

  test "es válido solo con texto" do
    assert build_message(body: "Hola").valid?
  end

  test "es válido solo con un adjunto y guarda el texto vacío" do
    message = build_message(body: nil, files: [ text_file ])

    assert message.save
    assert_equal "", message.reload.body
    assert_equal 1, message.files.count
  end

  test "no es válido sin texto ni adjuntos" do
    message = build_message(body: "")

    assert_not message.valid?
    assert_includes message.errors.full_messages, "Mensaje no puede estar en blanco"
  end

  test "admite hasta cinco archivos" do
    assert build_message(files: Array.new(Message::MAX_FILES) { |i| text_file("nota#{i}.txt") }).valid?

    message = build_message(files: Array.new(Message::MAX_FILES + 1) { |i| text_file("nota#{i}.txt") })

    assert_not message.valid?
    assert_includes message.errors.full_messages, "Archivos adjuntos no pueden ser más de 5 por mensaje"
  end

  test "rechaza un archivo de más de 10 MB" do
    big = { io: StringIO.new("a" * (Message::MAX_FILE_SIZE + 1)), filename: "grande.txt" }
    message = build_message(files: [ big ])

    assert_not message.valid?
    assert_includes message.errors.full_messages, "Archivos adjuntos no pueden superar los 10 MB (grande.txt)"
  end

  test "acepta un archivo de exactamente 10 MB" do
    exact = { io: StringIO.new("a" * Message::MAX_FILE_SIZE), filename: "justo.txt" }

    assert build_message(files: [ exact ]).valid?
  end

  test "rechaza un tipo de archivo no permitido" do
    svg = { io: StringIO.new("<svg xmlns='http://www.w3.org/2000/svg'></svg>"), filename: "dibujo.svg" }
    message = build_message(files: [ svg ])

    assert_not message.valid?
    assert message.errors.full_messages.any? { |error| error.start_with?("Archivos adjuntos solo pueden ser") && error.include?("dibujo.svg") }
  end

  test "detecta el tipo por el contenido y no por la extensión" do
    disguised = { io: StringIO.new("<svg xmlns='http://www.w3.org/2000/svg'></svg>"), filename: "foto.png" }

    assert_not build_message(files: [ disguised ]).valid?
  end

  test "al eliminarse borra sus archivos del storage" do
    message = build_message(files: [ text_file ])
    message.save!

    assert_enqueued_with(job: ActiveStorage::PurgeJob) do
      message.destroy
    end
    assert_equal 0, ActiveStorage::Attachment.where(record: message).count
  end

  private

  def build_message(body: "", files: [])
    message = Message.new(channel: channels(:general), user: users(:alice), body: body)
    message.files.attach(files) if files.any?
    message
  end

  def text_file(filename = "notas.txt")
    { io: StringIO.new("hola"), filename: filename }
  end
end
