module ChannelMessages
  extend ActiveSupport::Concern

  included do
    def index
      messages = @channel.messages
        .includes(user: { avatar_attachment: :blob })
        .with_attached_files
        .order(:created_at)

      render json: messages.map { |message| MessageSerializer.new(message).as_json }
    end

    def create
      uploads = Array(params[:files])

      # Solo se aceptan archivos subidos en el request. Un texto en files[] se tomaría como el
      # signed_id de un blob existente y permitiría adjuntar un archivo ajeno.
      unless uploads.all?(ActionDispatch::Http::UploadedFile)
        return render json: { errors: [ "Los archivos adjuntos no son válidos" ] }, status: :unprocessable_entity
      end

      message = @channel.messages.new(body: params[:body].to_s, user: current_user)
      message.files.attach(uploads.map { |upload| attachable_for(upload) }) if uploads.any?

      if message.save
        payload = MessageSerializer.new(message).as_json
        ConversationChannel.broadcast_to(@channel, { type: "message.created", message: payload })
        render json: payload, status: :created
      else
        render json: { errors: message.errors.full_messages }, status: :unprocessable_entity
      end
    end
  end

  private

  # Se descarta el content type que declara el navegador: Active Storage lo detecta con el
  # contenido y el nombre del archivo. Así un CSV que Windows declara como
  # application/vnd.ms-excel se reconoce como text/csv, y un archivo no puede hacerse pasar
  # por otro tipo cambiando solo la cabecera.
  def attachable_for(upload)
    { io: upload.tempfile, filename: upload.original_filename, content_type: nil }
  end
end
