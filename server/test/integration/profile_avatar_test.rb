require "test_helper"

class ProfileAvatarTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(name: "Ana", email: "ana@example.com", password: "password123")
    token = JsonWebToken.encode(user_id: @user.id)
    @headers = { "Authorization" => "Bearer #{token}" }
  end

  test "sube un avatar real y lo devuelve en el serializer" do
    file = fixture_file_upload("avatar.png", "image/png")

    patch "/api/v1/profile", params: { avatar: file }, headers: @headers

    assert_response :success
    assert @user.reload.avatar.attached?
    assert_match %r{/rails/active_storage/blobs/}, JSON.parse(response.body)["avatar_url"]
  end
end
