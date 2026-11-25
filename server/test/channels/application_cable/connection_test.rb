require "test_helper"

class ApplicationCable::ConnectionTest < ActionCable::Connection::TestCase
  test "conecta con un token valido" do
    connect params: { token: JsonWebToken.encode(user_id: users(:alice).id) }

    assert_equal users(:alice), connection.current_user
  end

  test "rechaza un token invalido" do
    assert_reject_connection { connect params: { token: "invalido" } }
  end

  test "rechaza una conexion sin token" do
    assert_reject_connection { connect }
  end
end
