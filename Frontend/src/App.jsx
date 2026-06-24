import { useAuth } from "./context/AuthContext";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./components/Dashboard";

export default function App() {
  const { token } = useAuth();
  return token ? <Dashboard token={token} /> : <LoginScreen />;
}
