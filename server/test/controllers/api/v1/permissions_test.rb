require "test_helper"

class Api::V1::PermissionsTest < ActionDispatch::IntegrationTest
  test "un miembro que no es dueño no puede eliminar el workspace" do
    assert_no_difference "Workspace.count" do
      delete api_v1_workspace_path(workspaces(:acme)), headers: auth_headers(users(:bob))
    end

    assert_response :forbidden
    assert_equal [ "No tenés permisos para realizar esta acción" ], response.parsed_body["errors"]
  end

  test "el dueño puede editar el workspace" do
    patch api_v1_workspace_path(workspaces(:acme)),
      params: { name: "Renombrado" },
      headers: auth_headers(users(:alice))

    assert_response :success
    assert_equal "Renombrado", workspaces(:acme).reload.name
  end

  test "un miembro no puede agregar otros miembros" do
    nuevo = User.create!(name: "Nuevo", email: "nuevo@example.com", password: "password123")

    assert_no_difference "Membership.count" do
      post api_v1_workspace_memberships_path(workspaces(:acme)),
        params: { email: nuevo.email },
        headers: auth_headers(users(:bob))
    end

    assert_response :forbidden
  end

  test "un miembro no puede eliminar canales" do
    assert_no_difference "Channel.count" do
      delete api_v1_channel_path(channels(:general)), headers: auth_headers(users(:bob))
    end

    assert_response :forbidden
  end

  test "un recurso inexistente devuelve 404 con cuerpo JSON" do
    get api_v1_workspace_path(0), headers: auth_headers(users(:alice))

    assert_response :not_found
    assert_equal [ "Recurso no encontrado" ], response.parsed_body["errors"]
  end
end
