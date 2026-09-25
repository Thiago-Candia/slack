class WorkspaceSerializer
  include Rails.application.routes.url_helpers

  def initialize(workspace)
    @workspace = workspace
  end

  def as_json
    {
      id: @workspace.id,
      name: @workspace.name,
      image_url: image_url,
      members: @workspace.members.map { |member| UserSerializer.new(member).as_json }
    }
  end

  private

  def image_url
    rails_blob_path(@workspace.image, only_path: true) if @workspace.image.attached?
  end
end
