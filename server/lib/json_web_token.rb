class JsonWebToken
  SECRET = Rails.application.credentials.secret_key_base

  def self.encode(payload, exp = 24.hours.from_now)
    JWT.encode(payload.merge(exp: exp.to_i), SECRET)
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET).first
    ActiveSupport::HashWithIndifferentAccess.new(decoded)
  rescue JWT::DecodeError, JWT::ExpiredSignature
    nil
  end
end
