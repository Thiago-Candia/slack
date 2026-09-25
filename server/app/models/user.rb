class User < ApplicationRecord
  has_secure_password
  has_one_attached :avatar

  has_many :owned_workspaces, class_name: "Workspace", foreign_key: :owner_id, inverse_of: :owner, dependent: :destroy
  has_many :memberships, dependent: :destroy
  has_many :workspaces, through: :memberships

  has_many :channel_memberships, dependent: :destroy
  has_many :channels, through: :channel_memberships

  has_many :messages, dependent: :destroy

  before_save { email.downcase! }

  validates :name, presence: true
  validates :email, presence: true, uniqueness: { case_sensitive: false },
  format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 8 }, allow_nil: true
end
