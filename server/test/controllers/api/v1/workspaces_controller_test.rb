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

  test "invite devuelve el token de invitación del workspace" do
    post invite_api_v1_workspace_path(workspaces(:acme)), headers: auth_headers(users(:alice))

    assert_response :success
    assert_equal workspaces(:acme).invite_token, response.parsed_body["invite_token"]
  end

  test "un usuario ajeno al workspace no puede obtener su invitación" do
    ajeno = User.create!(name: "Ajeno", email: "ajeno@example.com", password: "password123")

    post invite_api_v1_workspace_path(workspaces(:acme)), headers: auth_headers(ajeno)

    assert_response :not_found
  end

  test "join con un token válido suma al usuario como member" do
    nuevo = User.create!(name: "Nuevo", email: "nuevo@example.com", password: "password123")

    assert_difference "Membership.count", 1 do
      post "/api/v1/join/#{workspaces(:acme).invite_token}", headers: auth_headers(nuevo)
    end

    assert_response :success
    assert_equal "member", workspaces(:acme).memberships.find_by(user: nuevo).role
  end

  test "join no duplica la membresía si el usuario ya es miembro" do
    assert_no_difference "Membership.count" do
      post "/api/v1/join/#{workspaces(:acme).invite_token}", headers: auth_headers(users(:bob))
    end

    assert_response :success
  end

  test "join con un token inexistente devuelve 404" do
    post "/api/v1/join/token-inexistente", headers: auth_headers(users(:bob))

    assert_response :not_found
  end

  test "join sin autenticación devuelve 401" do
    post "/api/v1/join/#{workspaces(:acme).invite_token}"

    assert_response :unauthorized
  end
end
