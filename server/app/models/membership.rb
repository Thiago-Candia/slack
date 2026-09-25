class Membership < ApplicationRecord
  ROLES = %w[owner admin member].freeze

  belongs_to :user
  belongs_to :workspace

  validates :role, presence: true, inclusion: { in: ROLES }
  validates :user_id, uniqueness: { scope: :workspace_id }
end
