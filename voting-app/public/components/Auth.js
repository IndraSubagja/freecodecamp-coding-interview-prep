const { useState } = React;
const { Link, useLocation, useHistory } = window.ReactRouterDOM;

export function Login({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const history = useHistory();
  const location = useLocation();

  const submitHandler = async (event) => {
    event.preventDefault();

    try {
      const { data } = await axios.post('/api/login', { username, password });
      const { from } = location.state || { from: { pathname: '/' } };

      setUser(data);
      history.replace(from);
    } catch (error) {
      alert(error.response && error.response.data ? error.response.data.message : error.message);
    } finally {
      event.target.reset();
    }
  };

  return (
    <form className="main-form" onSubmit={submitHandler}>
      <h1>Login to Your Account</h1>

      <div className="input-control">
        <label for="username">Username</label>
        <input
          type="text"
          name="username"
          id="username"
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Enter username"
          required
        />
      </div>
      <div className="input-control">
        <label for="password">Password</label>
        <input
          type="password"
          name="password"
          id="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter password"
          required
        />
      </div>

      <button type="submit" className="btn">
        Login
      </button>

      <p>
        New member? <Link to="/signup">Create account</Link>
      </p>
    </form>
  );
}

export function Signup({ setUser }) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const history = useHistory();
  const location = useLocation();

  const submitHandler = async (event) => {
    event.preventDefault();

    try {
      const { data } = await axios.post('/api/signup', { fullName, username, password });
      const { from } = location.state || { from: { pathname: '/' } };

      setUser(data);
      history.replace(from);
      event.target.reset();
    } catch (error) {
      alert(error.response && error.response.data ? error.response.data.message : error.message);
    }
  };

  return (
    <form className="main-form" onSubmit={submitHandler}>
      <h1>Create Account</h1>

      <div className="input-control">
        <label for="fullName">Full Name</label>
        <input
          type="text"
          name="fullName"
          id="fullName"
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Enter your name"
          required
        />
      </div>
      <div className="input-control">
        <label for="username">Username</label>
        <input
          type="text"
          name="username"
          id="username"
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Enter username"
          required
        />
      </div>
      <div className="input-control">
        <label for="password">Password</label>
        <input
          type="password"
          name="password"
          id="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter password"
          required
        />
      </div>

      <button type="submit" className="btn">
        Register
      </button>

      <p>
        Already have account? <Link to="/login">Login to your account</Link>
      </p>
    </form>
  );
}
