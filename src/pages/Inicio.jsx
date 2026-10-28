
import Header from "../components/header.jsx";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Dashboard from "../components/Dashboard";
import Footer from "../components/Footer";

function Inicio() {
  return (
    <>
      <Header />
      <Navbar />

      <main>
        <Hero />
        <Dashboard />
      </main>

      <Footer />
    </>
  );
}

export default Inicio;
