import { Link } from "react-router-dom";

const Brand = ({ to = "/home" }) => (
  <Link to={to} className="brand" aria-label="Slack Clone, ir al inicio">
    <span className="brand__mark" aria-hidden="true">
      #
    </span>
    <span className="brand__name">slack</span>
  </Link>
);

export default Brand;
