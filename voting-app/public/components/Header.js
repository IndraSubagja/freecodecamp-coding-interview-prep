const { Link, useLocation, useHistory } = window.ReactRouterDOM;

export default function Header({ user, setUser }) {
  const location = useLocation();
  const history = useHistory();

  const logoutHandler = async () => {
    const { data } = await axios.get('/api/logout');
    const { from } = location.state || { from: { pathname: '/' } };

    setUser(null);
    alert(data.message);
    history.push(from);
  };

  return (
    <header>
      <nav>
        <Link to="/">Voting App</Link>

        {user && user !== 'Public' ? (
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/my-polls">My Polls</Link>
            </li>
            <li>
              <Link to="/new-poll">New Poll</Link>
            </li>
            <li>
              <button type="button" onClick={logoutHandler}>
                Log out
              </button>
            </li>
          </ul>
        ) : (
          <ul>
            <li>
              <Link to="/login">Log in</Link>
            </li>
            <li>
              <Link to="/signup">Sign up</Link>
            </li>
          </ul>
        )}
      </nav>
    </header>
  );
}
