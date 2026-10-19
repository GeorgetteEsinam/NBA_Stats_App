
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

function SiteLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

export default SiteLayout;
