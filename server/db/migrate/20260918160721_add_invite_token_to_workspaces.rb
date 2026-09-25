class AddInviteTokenToWorkspaces < ActiveRecord::Migration[8.1]
  def change
    add_column :workspaces, :invite_token, :string
    add_index :workspaces, :invite_token, unique: true
  end
end
