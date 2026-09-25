class Admin::DashboardController < Admin::BaseController
  def index
    @users_count = User.count
    @workspaces_count = Workspace.count
    @messages_count = Message.count
  end
end
