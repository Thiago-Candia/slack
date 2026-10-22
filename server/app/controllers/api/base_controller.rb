class Api::BaseController < ActionController::API
  rescue_from ActiveRecord::RecordNotFound do
    render json: { errors: [ "Recurso no encontrado" ] }, status: :not_found
  end

  private

  def render_forbidden
    render json: { errors: [ "No tenés permisos para realizar esta acción" ] }, status: :forbidden
  end
end
