require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "es válido con nombre, email y contraseña" do
    user = User.new(name: "Nueva", email: "nueva@example.com", password: "password123")
    assert user.valid?
  end

  test "requiere un email único sin distinguir mayúsculas" do
    user = User.new(name: "Duplicado", email: users(:alice).email.upcase, password: "password123")
    assert_not user.valid?
  end

  test "normaliza el email a minúsculas al guardar" do
    user = User.create!(name: "Mayus", email: "MAYUS@Example.com", password: "password123")
    assert_equal "mayus@example.com", user.email
  end

  test "requiere una contraseña de al menos 8 caracteres" do
    user = User.new(name: "Corta", email: "corta@example.com", password: "1234567")
    assert_not user.valid?
  end
end
