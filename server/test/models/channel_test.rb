require "test_helper"

class ChannelTest < ActiveSupport::TestCase
  test "no permite dos canales con el mismo nombre en un workspace" do
    duplicado = Channel.new(workspace: workspaces(:acme), name: channels(:general).name, kind: "public")
    assert_not duplicado.valid?
  end

  test "direct_between reutiliza el canal directo existente entre dos usuarios" do
    workspace = workspaces(:acme)

    primero = Channel.direct_between(workspace, users(:alice), users(:bob))
    segundo = Channel.direct_between(workspace, users(:alice), users(:bob))

    assert_equal primero, segundo
  end
end
