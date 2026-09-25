class CreateChannels < ActiveRecord::Migration[8.1]
  def change
    create_table :channels do |t|
      t.references :workspace, null: false, foreign_key: true
      t.string :name
      t.string :kind, null: false, default: "public"

      t.timestamps
    end
  end
end
