class MessageSerializer
  include Rails.application.routes.url_helpers

  # Las URLs de los adjuntos son firmadas: no piden sesión y dejan de funcionar al vencer.
  ATTACHMENT_URL_TTL = 24.hours

  def initialize(message)
    @message = message
  end

  def as_json
    {
      id: @message.id,
      body: @message.body,
      created_at: @message.created_at,
      sender: UserSerializer.new(@message.user).as_json,
      attachments: @message.files.map { |file| attachment_json(file) }
    }
  end

  private

  def attachment_json(file)
    blob = file.blob

    {
      id: file.id,
      filename: blob.filename.to_s,
      content_type: blob.content_type,
      byte_size: blob.byte_size,
      url: rails_blob_path(blob, only_path: true, expires_in: ATTACHMENT_URL_TTL),
      download_url: rails_blob_path(blob, only_path: true, expires_in: ATTACHMENT_URL_TTL, disposition: "attachment")
    }
  end
end
