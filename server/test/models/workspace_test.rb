require "test_helper"

class WorkspaceTest < ActiveSupport::TestCase
  test "requiere un nombre" do
    workspace = Workspace.new(owner: users(:alice))
    assert_not workspace.valid?
  end

  test "genera un invite_token al crearse si no tiene uno" do
    workspace = Workspace.create!(name: "Nuevo", owner: users(:alice))
    assert_not_nil workspace.invite_token
  end

  test "regenerate_invite_token! cambia el token existente" do
    workspace = workspaces(:acme)
    original_token = workspace.invite_token

    workspace.regenerate_invite_token!

    assert_not_equal original_token, workspace.invite_token
  end
end
