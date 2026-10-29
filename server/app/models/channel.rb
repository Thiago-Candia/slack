class Channel < ApplicationRecord
  KINDS = %w[public private direct].freeze

  belongs_to :workspace

  has_many :channel_memberships, dependent: :destroy
  has_many :members, through: :channel_memberships, source: :user

  has_many :messages, dependent: :destroy

  scope :direct, -> { where(kind: "direct") }

  # Los canales públicos se abren a todo miembro del workspace; los privados y
  # los directos, solo a quienes figuran en channel_memberships.
  scope :accessible_by, lambda { |user|
    in_user_workspaces = where(workspace: user.workspaces)
    in_user_workspaces.where(kind: "public")
      .or(in_user_workspaces.where(id: user.channel_memberships.select(:channel_id)))
  }

  validates :kind, presence: true, inclusion: { in: KINDS }
  validates :name, presence: true, uniqueness: { scope: :workspace_id, case_sensitive: false }, unless: :direct?

  def direct?
    kind == "direct"
  end

  def self.direct_between(workspace, user_a, user_b)
    existing = workspace.channels.direct
      .joins(:channel_memberships)
      .where(channel_memberships: { user_id: [ user_a.id, user_b.id ] })
      .group("channels.id")
      .having("COUNT(DISTINCT channel_memberships.user_id) = 2")
      .first
    return existing if existing

    channel = workspace.channels.create!(kind: "direct")
    channel.channel_memberships.create!(user: user_a)
    channel.channel_memberships.create!(user: user_b) unless user_a == user_b
    channel
  end
end
