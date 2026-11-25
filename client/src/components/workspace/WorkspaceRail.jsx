import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Avatar from "../Avatar";
import ProfileModal from "../ProfileModal";

const railClass = ({ isActive }) => `rail__item ${isActive ? "rail__item--active" : ""}`;

const WorkspaceRail = ({ workspaces, user }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <nav className="rail" aria-label="Espacios de trabajo">
      <ul className="rail__list">
        {workspaces.map((workspace) => (
          <li key={workspace.id}>
            <NavLink to={`/workspace/${workspace.id}`} className={railClass} aria-label={workspace.name} title={workspace.name}>
              <Avatar name={workspace.name} src={workspace.image_url} size="sm" shape="square" />
            </NavLink>
          </li>
        ))}
      </ul>

      <Link to="/home" className="rail__item rail__item--labeled">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
          <path fill="currentColor" d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3z" />
        </svg>
        <span className="rail__label">Inicio</span>
      </Link>

      <div className="rail__footer">
        <Link to="/new-workspace" className="rail__item rail__item--dashed" aria-label="Crear espacio de trabajo" title="Crear espacio de trabajo">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
          </svg>
        </Link>
        {user && (
          <button
            type="button"
            className="rail__avatar"
            aria-haspopup="dialog"
            aria-label={`Abrir perfil de ${user.name}`}
            title={user.name}
            onClick={() => setIsProfileOpen(true)}
          >
            <Avatar name={user.name} src={user.avatar_url} size="md" />
          </button>
        )}
      </div>

      {isProfileOpen && <ProfileModal onClose={() => setIsProfileOpen(false)} />}
    </nav>
  );
};

export default WorkspaceRail;
