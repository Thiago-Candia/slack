class UserSerializer
  include Rails.application.routes.url_helpers

  def initialize(user)
    @user = user
  end

  def as_json
    { id: @user.id, name: @user.name, email: @user.email, avatar_url: avatar_url }
  end

  private

  def avatar_url
    rails_blob_path(@user.avatar, only_path: true) if @user.avatar.attached?
  end
end
