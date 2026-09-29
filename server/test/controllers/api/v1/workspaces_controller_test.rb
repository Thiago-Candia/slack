require "test_helper"

class Api::V1::WorkspacesControllerTest < ActionDispatch::IntegrationTest
  test "sin token devuelve 401" do
    get api_v1_workspaces_path

    assert_response :unauthorized
  end

  test "lista solo los workspaces del usuario autenticado" do
    get api_v1_workspaces_path, headers: auth_headers(users(:alice))

    assert_response :success
    ids = response.parsed_body.map { |workspace| workspace["id"] }
    assert_includes ids, workspaces(:acme).id
  end

  test "crea un workspace y lo asigna como owner" do
    assert_difference "Workspace.count", 1 do
      post api_v1_workspaces_path, params: { name: "Nuevo workspace" }, headers: auth_headers(users(:alice))
    end

    assert_response :created
    assert_equal "Nuevo workspace", response.parsed_body["name"]
  end
end
