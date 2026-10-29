import { NavLink } from "react-router-dom";
import Avatar from "../Avatar";
import { ErrorState, LoadingState } from "../StatusView";

const navClass = ({ isActive }) => `sidebar-link ${isActive ? "sidebar-link--active" : ""}`;

const WorkspaceSidebar = ({ id, workspace, channels, currentUser, isOpen, onCreateChannel, onInvite }) => {
  const members = [...(workspace.members ?? [])].sort((a, b) => (a.id === currentUser?.id ? -1 : b.id === currentUser?.id ? 1 : 0));

  return (
    <nav id={id} className={`sidebar ${isOpen ? "sidebar--open" : ""}`} aria-label={`Navegación de ${workspace.name}`}>
      <section className="sidebar__section" aria-labelledby="sidebar-channels">
        <h2 id="sidebar-channels" className="sidebar__heading">
          Canales
        </h2>
        {channels.status === "loading" && <LoadingState>Cargando canales...</LoadingState>}
        {channels.status === "error" && <ErrorState error={channels.error} onRetry={channels.reload} />}
        {channels.status === "ready" && channels.data.length === 0 && <p className="sidebar__empty">No hay canales todavía.</p>}
        {channels.status === "ready" && channels.data.length > 0 && (
          <ul className="sidebar__list">
            {channels.data.map((channel) => (
              <li key={channel.id}>
                <NavLink to={`channel/${channel.id}`} className={navClass}>
                  <span className="sidebar-link__icon" aria-hidden="true">
                    #
                  </span>
                  <span className="sidebar-link__label">{channel.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="sidebar__action" onClick={onCreateChannel}>
          + Agregar canal
        </button>
      </section>

      <section className="sidebar__section" aria-labelledby="sidebar-dms">
        <h2 id="sidebar-dms" className="sidebar__heading">
          Mensajes directos
        </h2>
        <ul className="sidebar__list">
          {members.map((member) => (
            <li key={member.id}>
              <NavLink to={`dm/${member.id}`} className={navClass}>
                <Avatar name={member.name} src={member.avatar_url} size="xs" />
                <span className="sidebar-link__label">
                  {member.name}
                  {member.id === currentUser?.id && <span className="muted"> (vos)</span>}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
        <button type="button" className="sidebar__action" onClick={onInvite}>
          + Invitar personas
        </button>
      </section>
    </nav>
  );
};

export default WorkspaceSidebar;
