class Message < ApplicationRecord
  MAX_FILES = 5
  MAX_FILE_SIZE = 10.megabytes
  ALLOWED_CONTENT_TYPES = %w[
    image/png
    image/jpeg
    image/gif
    image/webp
    application/pdf
    text/plain
    text/csv
    application/vnd.openxmlformats-officedocument.wordprocessingml.document
    application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
    application/vnd.openxmlformats-officedocument.presentationml.presentation
    application/zip
  ].freeze

  belongs_to :channel
  belongs_to :user

  # Al eliminar el mensaje, sus archivos se borran del storage en un job (purge_later).
  has_many_attached :files, dependent: :purge_later

  # La columna es NOT NULL: un mensaje solo con adjuntos guarda el texto vacío.
  normalizes :body, with: ->(body) { body.to_s }, apply_to_nil: true

  validates :body, presence: true, unless: -> { files.attached? }
  validate :files_within_limits

  private

  def files_within_limits
    return unless files.attached?

    errors.add(:files, :too_many, count: MAX_FILES) if files.size > MAX_FILES

    files.each do |file|
      filename = file.filename.to_s
      errors.add(:files, :too_large, filename: filename, max: MAX_FILE_SIZE / 1.megabyte) if file.byte_size > MAX_FILE_SIZE
      errors.add(:files, :content_type, filename: filename) unless ALLOWED_CONTENT_TYPES.include?(file.content_type)
    end
  end
end
