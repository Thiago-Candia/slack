Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  mount LetterOpenerWeb::Engine, at: "/letter_opener" if Rails.env.development?

  namespace :admin do
    root to: "dashboard#index"

    resource :session, only: %i[new create destroy]
    resources :users
    resources :workspaces do
      resources :channels, shallow: true
    end
    resources :memberships, only: %i[index new create destroy]
    resources :messages, only: %i[index show destroy]
  end

  namespace :api do
    namespace :v1 do
      post "register", to: "users#create"
      post "login", to: "sessions#create"
      delete "logout", to: "sessions#destroy"

      post "password-resets", to: "password_resets#create"
      patch "password-resets/:token", to: "password_resets#update"

      get "profile", to: "profiles#show"
      patch "profile", to: "profiles#update"

      post "join/:token", to: "workspaces#join"

      resources :workspaces, only: %i[index show create update destroy] do
        post "invite", on: :member

        resources :channels, only: %i[index show create update destroy], shallow: true do
          resources :messages, only: %i[index create destroy], shallow: true
        end

        resources :direct_messages, only: %i[index create], path: "direct_messages/:user_id"
        resources :memberships, only: %i[index create destroy]
      end
    end
  end
end
