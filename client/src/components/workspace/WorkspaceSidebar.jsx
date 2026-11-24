import { NavLink } from "react-router-dom";
import Avatar from "../Avatar";
import { ErrorState, LoadingState } from "../StatusView";

const navClass = ({ isActive }) => `sidebar-link ${isActive ? "sidebar-link--active" : ""}`;

const normalize = (text) =>
  String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const WorkspaceSidebar = ({ id, workspace, channels, currentUser, isOpen, query = "", onCreateChannel, onInvite }) => {
  const term = normalize(query.trim());
  const matches = (text) => !term || normalize(text).includes(term);
  const members = [...(workspace.members ?? [])].sort((a, b) => (a.id === currentUser?.id ? -1 : b.id === currentUser?.id ? 1 : 0));
  const visibleChannels = channels.status === "ready" ? channels.data.filter((channel) => matches(channel.name)) : [];
  const visibleMembers = members.filter((member) => matches(member.name));

  return (
    <nav id={id} className={`sidebar ${isOpen ? "sidebar--open" : ""}`} aria-label={`Navegación de ${workspace.name}`}>
      <header className="sidebar__header">
        <p className="sidebar__title" title={workspace.name}>
          {workspace.name}
        </p>
        <button
          type="button"
          className="icon-button sidebar__invite"
          onClick={onInvite}
          aria-label="Invitar a este espacio"
          title="Invitar a este espacio"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M15 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8m-9 2V11H4v3H1v2h3v3h2v-3h3v-2zm9 1c-2.7 0-8 1.3-8 4v1h16v-1c0-2.7-5.3-4-8-4"
            />
          </svg>
        </button>
      </header>

      <section className="sidebar__section" aria-labelledby="sidebar-channels">
        <h2 id="sidebar-channels" className="sidebar__heading">
          Canales
        </h2>
        {channels.status === "loading" && <LoadingState>Cargando canales...</LoadingState>}
        {channels.status === "error" && <ErrorState error={channels.error} onRetry={channels.reload} />}
        {channels.status === "ready" && channels.data.length === 0 && <p className="sidebar__empty">No hay canales todavía.</p>}
        {channels.status === "ready" && channels.data.length > 0 && visibleChannels.length === 0 && (
          <p className="sidebar__empty">Ningún canal coincide con «{query.trim()}».</p>
        )}
        {visibleChannels.length > 0 && (
          <ul className="sidebar__list">
            {visibleChannels.map((channel) => (
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
        {visibleMembers.length === 0 && <p className="sidebar__empty">Nadie coincide con «{query.trim()}».</p>}
        {visibleMembers.length > 0 && (
          <ul className="sidebar__list">
            {visibleMembers.map((member) => (
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
        )}
        <button type="button" className="sidebar__action" onClick={onInvite}>
          + Invitar personas
        </button>
      </section>
    </nav>
  );
};

export default WorkspaceSidebar;
