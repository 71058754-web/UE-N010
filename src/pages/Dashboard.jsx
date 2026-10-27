
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Dashboard from "../components/Dashboard";
import Footer from "../components/Footer";

function DashboardPage() {
  return (
    <>
      <Header />
      <Navbar />

      <main className="container py-4" id="dashboard">
        <Dashboard />
      </main>

      <Footer />
    </>
  );
}

export default DashboardPage;
