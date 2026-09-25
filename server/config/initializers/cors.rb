# server/config/initializers/cors.rb

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*[ "http://localhost:5173", ENV["FRONTEND_URL"] ].compact)

    resource "/api/*",
      headers: :any,
      methods: %i[get post put patch delete options head]
  end
end