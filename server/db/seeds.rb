admin = User.find_or_create_by!(email: "admin@example.com") do |user|
  user.name = "Admin"
  user.password = "password123"
  user.admin = true
end

member = User.find_or_create_by!(email: "ana@example.com") do |user|
  user.name = "Ana Pérez"
  user.password = "password123"
end

workspace = Workspace.find_or_create_by!(name: "Cátedra Programación IV") { |w| w.owner = admin }
workspace.memberships.find_or_create_by!(user: admin) { |m| m.role = "owner" }
workspace.memberships.find_or_create_by!(user: member) { |m| m.role = "member" }

general = workspace.channels.find_or_create_by!(name: "general") { |c| c.kind = "public" }
general.channel_memberships.find_or_create_by!(user: admin)
general.channel_memberships.find_or_create_by!(user: member)

general.messages.find_or_create_by!(user: admin, body: "Bienvenidos al workspace")
general.messages.find_or_create_by!(user: member, body: "Hola equipo")
