class Workspace < ApplicationRecord
  belongs_to :owner, class_name: "User"
  has_one_attached :image

  has_many :memberships, dependent: :destroy
  has_many :members, through: :memberships, source: :user

  has_many :channels, dependent: :destroy

  before_create { self.invite_token ||= SecureRandom.urlsafe_base64(16) }

  validates :name, presence: true

  def regenerate_invite_token!
    update!(invite_token: SecureRandom.urlsafe_base64(16))
  end
end
