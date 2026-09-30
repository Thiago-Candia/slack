require "test_helper"

class MessageTest < ActiveSupport::TestCase
  test "requiere contenido" do
    message = Message.new(channel: channels(:general), user: users(:alice))
    assert_not message.valid?
  end
end
